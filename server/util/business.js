const fs = require(`fs`)
const lib = require(`./lib.js`)
const { print } = require(`./log.js`)
const tool = require(`./tool.js`)
const http = require(`./http.js`)
const fileList = require(`../lib/file-list.js`)
const jsonServer = require(`@wll8/json-server`)
const {lib: { express }} = jsonServer

function business() { // 与业务相关性的函数
  function Side(arg) {
    return new Side.prototype.init(arg)
  }
  Side.prototype = {
    init: function (arg) {
      const res = Object.assign(this, arg)
      return res
    },
  }
  Side.prototype.init.prototype = Side.prototype

  /**
   * 运行每个插件的监听函数
   * @param {*} key 插件的函数
   * @param  {...any} arg 函数的参数
   */
  async function pluginRun(key, ...arg) {
    const plugin = global.config.plugin
    for (let index = 0; index < plugin.length; index++) {
      const [item] = plugin[index]
      item._mainReturn[key] && await item._mainReturn[key](...arg)
    }
  }

  /**
   * 根据一个 app 来创建以及 https 配置来生成 httpServer 并添加端口监听功能
   * @param {*} param0 
   * @returns {httpServer, onlyHttpServer} 当额外配置 https 端口时才会存在 onlyHttpServer
   */
  function getHttpServer({app, name}) {
    let httpServer
    let onlyHttpServer
    const https = global.config.https
    const httpProt = global.config[name]
    let httpsProt = https[name]
    httpsProt = Number(httpsProt) === Number(httpProt) ? undefined : httpsProt

    /**
     * 如果没有配置 https 的端口时, 使用 httpolyglot 实现同一个端口支持 http 和 https
     */
    if(https.key === undefined) {
      httpServer = require(`http`).createServer(app)
    }
    
    /**
     * 如果没有配置 https 的端口时, 使用 httpolyglot 实现同一个端口支持 http 和 https
     */
    if(https.key && httpsProt === undefined) {
      app.use((req, res, next) => {
        const protocol = tool.httpClient.getProtocol(req)
        if(protocol === `http` && https.redirect) {
          const hostName = require(`url`).parse(`ws://${req.headers.host}`).hostname
          res.redirect(301, `https://${hostName}:${httpProt}${req.url}`)
        } else {
          next()
        }
      })
      httpServer = require(`@httptoolkit/httpolyglot`).createServer({
        key: fs.readFileSync(https.key),
        cert: fs.readFileSync(https.cert),
      }, app)
    }
    
    /**
     * 如果配置了 https 的端口时, 那么不使用 httpolyglot 而使用原生 http/https, 实现 http => 301 => https
     */
    if(https.key && httpsProt) {
      onlyHttpServer = require(`http`).createServer(https.redirect ? (req, res) => {
        const hostName = require(`url`).parse(`ws://${req.headers.host}`).hostname
        res.writeHead(301, { Location: `https://${hostName}:${httpsProt}${req.url}` })
        res.end()
      } : undefined, app).listen(httpProt, `0.0.0.0`, async () => {
        await pluginRun(`serverCreated`, { onlyHttpServer, httpProt })
      })
      httpServer = require(`https`).createServer({
        key: fs.readFileSync(https.key),
        cert: fs.readFileSync(https.cert),
      }, app)
    }

    httpServer.listen(httpsProt || httpProt, `0.0.0.0`, async () => {
      await pluginRun(`serverCreated`, {httpServer, httpsProt, httpProt})
    })
    const server = {
      httpServer,
      onlyHttpServer,
    }
    app._server = server
    return server
  }

  function midResJson({res, proxyRes, key, val, cb = body => body}) {
    const modifyResponse = require(`node-http-proxy-json`)
    modifyResponse(res, proxyRes, body => {
      if([`array`, `object`].includes(tool.type.isType(body))) {
        key && tool.obj.deepSet(body, key, val)
      }
      return cb(body)
    })
  }

  function url() { // url 处理程序
    function prepareProxy (proxy = {}) { // 解析 proxy 参数, proxy: string, object
      const pathToRegexp = require(`path-to-regexp`)
      const isType = tool.type.isType
      const proxyType = isType(proxy)
      let resProxy = []
      if(proxyType === `string`) { // 任何路径都转发到 proxy
        proxy = {
          '/': proxy,
        }
      }
      function setIndexOfEnd(proxy) { // 需要排序 key:/ 到最后, 否则它生成的拦截器会被其他 key 覆盖
        const indexVal = proxy[`/`]
        delete proxy[`/`]
        proxy[`/`] = indexVal
        return proxy
      }
      proxy = setIndexOfEnd(proxy)
      resProxy = Object.keys(proxy).map(context => {
        let options = proxy[context]
        const optionsType = isType(options)
        if(optionsType === `string`) { // 转换字符串的 value 为对象
          const rootOptions = proxy[`/`]
          options = {
            pathRewrite: { [`^${context}`]: options }, // 原样代理 /a 到 /a
            target: options.includes(`://`) // 如果要代理的目录地址已有主域
              ? new URL(options).origin // 那么就代理到该主域上
              : { // 否则就代理到 / 设定的域上
                string: rootOptions,
                object: rootOptions.target, // 当主域是对象时则取其 target
              }[isType(rootOptions)],
          }
        }
        if(optionsType === `array`) { // 是数组时, 视为设计 res body 的值, 语法为: [k, v]
          const [item1, item2] = options
          const item1Type = isType(item1)
          const item2Type = isType(item2)
          const deepMergeObject = tool.obj.deepMergeObject

          if((item1Type !== `function`) && (options.length <= 1)) { // 只有0个或一个项, 直接替换 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: () => item1})
              },
            }
          }
          if((item1Type === `function`) && (options.length <= 1)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => item1({req, json})})
              },
            }
          }
          if((item1Type === `function`) && (item2Type === `function`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => {
                  return item2({req, json: item1({req, json})})
                }})
              },
            }
          }
          if((item1Type === `string`) && (item2Type === `function`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => {
                  return item2({req, json: tool.obj.deepGet(json, item1)})
                }})
              },
            }
          }
          if((item1Type === `function`) && (item2Type === `string`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: json => {
                  return tool.obj.deepGet(item1({req, json}), item2)
                }})
              },
            }
          }
          if((item1Type === `string`) && (options.length === 2)) { // 以 item1 作为 key, item2 作为 val, 修改原 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, key: item1, val: item2})
              },
            }
          }
          if((item1Type === `object`) && (options.length === 2)) { // 根据 item2 的类型, 合并 item1
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: body => {
                  return ({
                    'deep': deepMergeObject(body, item1), // 父级【不会】被替换
                    '...': {...body, ...item1}, // 父级【会】被替换, 类似于js扩展运行符
                  })[item2 || `deep`]
                }})
              },
            }
          }
        }
        const re = pathToRegexp(context)
        return {
          re,
          context,
          options,
        }
      })
      return resProxy
    }

    function parseProxyTarget (proxy) { // 解析 proxy 为 {pathname, origin}
      let origin = ``
      try {
        if(typeof(proxy) === `string`) {
          origin = proxy
        }
        if(typeof(proxy) === `object`) {
          origin = proxy[`/`].target || proxy[`/`]
        }
        const parentUrl = new URL(origin)
        const res = {
          host: parentUrl.host,
          port: parentUrl.port || 80,
          hostname: parentUrl.hostname,
          pathname: parentUrl.pathname.replace(/\/$/, ``) + `/`,
          origin: parentUrl.origin,
          isIp: (parentUrl.host.match(/\./g) || []).length === 3,
        }
        return res
      } catch (error) {
        console.error(`请正确填写 proxy 参数`, error)
        process.exit()
      }
    }

    function parseRegPath(rePath, url) { // 使用 path-to-regexp 转换 express 的 router, 并解析参数为对象
      // 注: path-to-regexp 1.x 自带 match 方法可处理此方法, 但是当前的 json-server 依赖的 express 的路由语法仅支持 path-to-regexp@0.1.7
      // 所以只能手动转换, 参考: https://github.com/ForbesLindesay/express-route-tester/blob/f39c57fa660490e74b387ed67bf8f2b50ee3c27f/index.js#L96
      const pathToRegexp = require(`path-to-regexp`)
      const keys = []
      const re = pathToRegexp(rePath, keys)
      // 去除 url 中的 origin
      const pathUrl = url.match(/^\//) ? url : url.replace((new URL(url)).origin, ``)
      const result = re.exec(pathUrl)
      const obj = keys.reduce((acc, cur, index) => {
        acc[cur.name] = result[index + 1]
        return acc
      }, {})
      return obj
    }

    return {
      prepareProxy,
      parseProxyTarget,
      parseRegPath,
    }
  }
  function middleware() { // express 中间件
    const compression = require(`compression`) // 压缩 http 响应
  
    function httpLog() { // 设置 http 请求日志中间件
      const morgan = require(`morgan`)
      const colors = tool.cli.colors
      return morgan( (tokens, req, res) => {
        const testApi = res.getHeader(global.config.apiInHeader)
        // 当保存了历史记录时, 才在控制台的 http log 显示它
        if(Boolean(testApi) === false) {
          return undefined
        }
        const colorTable = {
          1: `gray`,
          2: `green`,
          3: `yellowBright`,
          4: `yellow`,
          5: `red`,
        }
        const statusCode = String(res.statusCode)
        const len = res.getHeader(`Content-Length`)
        const str = [
          tool.time.dateFormat(`YYYY-MM-DD hh:mm:ss`, new Date),
          tool.httpClient.getClientIp(req),
          testApi,
          `${statusCode} ${res.statusMessage}`,
          `${tokens[`response-time`](req, res)} ms`,
          len ? `${len} byte` : ``,
        ].join(` `)
        // 使用原生 nodejs 打印日志
        print(colors[colorTable[statusCode[0]]](str)) // 根据状态码的第一位获取颜色函数
        return [] // return list.join(' ')
      })
    }
  
    function getJsonServerMiddlewares() { // 获取 jsonServer 中的中间件
      // 利用 jsonServer 已有的中间件, 而不用额外的安装
      // 注意: 可能根据 jsonServer 版本的不同, 存在的中间件不同
  
      const jsonServer = require(`@wll8/json-server`)
      const middlewares = jsonServer.defaults({bodyParser: global.config._bodyParserMid, logger: false}) // 可以直接使用的所有中间件数组
      middlewares.push(httpLog())
      const middlewaresObj = middlewares.flat().reduce((res, item) => {
        // 使用 jsonServer 里面的中间件, 以保持一致:
        // compression, corsMiddleware, serveStatic, logger, jsonParser, urlencodedParser
        return ({
          ...res,
          [item.name]: item,
        })
      }, {})
      return {middlewares, middlewaresObj}
    }
  
    function reWriteRouter({app, routes = {}}) { // 根据 routes 对象, 重写路由
      const rewrite = require(`express-urlrewrite`)
      Object.keys(routes).forEach(key => {
        app.use(rewrite(key, routes[key]))
      })
    }
  
    function replayHistoryMiddleware ({
      id,
      business,
    } = {}) {
      const {
        clientInjection,
        historyHandle,
      } = business
      const {
        allowCors,
        setHeader,
        reSetApiInHeader,
      } = clientInjection()
      const {
        getHistory,
      } = historyHandle()
      return (req, res, next) => { // 修改分页参数, 符合项目中的参数
        const method = req.method.toLowerCase()
        const fullApi = id ? undefined :`${method} ${req.originalUrl}`
        const history = getHistory({id, fullApi, find: list => {
          const getSize = (path) => {
            const bodyPathCwd = require(`path`).join(process.cwd(), path)
            return require(`fs`).readFileSync(bodyPathCwd).length
          }
          const getStatus = (item) => {
            try {
              return item.data.res.lineHeaders.line.statusCode
            } catch (err) {
              console.log(`err`, err)
            }
          }
          list.sort((item, item1) => {
            try {
              const size = getSize(item.data.res.bodyPath)
              const size1 = getSize(item1.data.res.bodyPath)
              return size1 - size
            } catch (error) {
              console.log(`error`, error)
              return 0
            }
          })
          const getStatusCodeItem = list => list.find(item => getStatus(item) === 200) // 查找 http 状态码为 200 的条目
          let getItemRes = undefined
          if(global.config.replayProxyFind) { // 先使用配置的 replayProxyFind 函数, 如果没有打到则使用普通状态码
            try {
              getItemRes = list.find((...arg) => global.config.replayProxyFind(...arg))
            } catch (error) {
              console.log(error)
            }
          }
          getItemRes = getItemRes || getStatusCodeItem(list) || list[0] || {} // 如果也没有找到状态码为 200 的, 则直接取第一条
          return getItemRes
        }}).data
        try {
          const lineHeaders = history.res.lineHeaders
          const headers = lineHeaders.headers || require(require(`path`).resolve(lineHeaders.headPath))
          setHeader(res, {
            ...headers, // 还原 headers
            ...reSetApiInHeader({headers}), // 更新 testApi
          })
          allowCors({res, req})
          const bodyPath = history.res.bodyPath
          if(bodyPath) {
            const path = require(`path`)
            const newPath = path.resolve(bodyPath) // 发送 body
            // 由于 newPath 是由程序生成的, 而不是用户输入的, 所以不用担心路径遍历
            res.sendFile(newPath)
          } else {
            const {statusCode, statusMessage} = lineHeaders.line
            res.statusCode = statusCode
            res.statusMessage = statusMessage
            res.send()
          }
        } catch (err) {
          console.log(`err`, err)
          res.json(global.config.resHandleReplay({req, res}))
        }
      }
    }
  
    return {
      reWriteRouter,
      compression,
      getJsonServerMiddlewares,
      replayHistoryMiddleware,
    }
  
  }
  
  /**
   * 保存日志
   */
  function saveLog({logStr = ``, logPath, code = `-`}) {
    const fs = require(`fs`)
    const os = require(`os`)
    const packageJson = require(`../package.json`)
    fs.existsSync(logPath) && fs.writeFileSync(
      logPath,
      [
        [
          tool.time.dateFormat(`YYYY-MM-DD hh:mm:ss`, new Date()), // 当前时间
          `mockm:${packageJson.version}`, // mockm 版本号
          `node:${process.version}`, // node 版本号
          `os:${os.type()} ${os.release()}`, // 操作系统和版本号
          `code:${code}`, // 退出码
          `arg:${process.argv.splice(2)}`, // 命令行参数
          `lang:${process.env.LANG}`, // 终端语言环境
        ].join(`, `), // 附件信息
        `\n`,
        logStr.trim(), // 调用栈
        `\n\n`,
        fs.readFileSync(logPath, `utf8`), // 旧 log
      ].join(``),
    )
  }

  /**
   * 通过重新保存文件的方式触发 nodemon 的文件监听, 然后让服务重启
   */
  function reStartServer(filePath) {
    const fs = require(`fs`)
    const str = fs.readFileSync(filePath, `utf8`)
    fs.writeFileSync(filePath, str)
  }

  function wrapApiData({data, code = 200}) { // 包裹 api 的返回值
    code = String(code)
    return {
      code,
      success: Boolean(code.match(/^[2]/)), // 如果状态码以2开头则为 true
      data,
    }
  }

  /**
  * 把类似 schema 的列表转换为数据
  * @param {array} list 列表
  * @param {object} options 规则
  */
  function listToData(list, options = {}){
    const Mock = require(`@wll8/better-mock`)
    const mockMethods = Object.keys(Mock.Random).map(key => `@${key}`)

    function listToDataRef (list) {
      // 注: 通过此函数转换出的结果并不是可以生成随机值的模板, 而是已生成固定值模板, 因为需要使用值转换为对应的类型

      let res = {}
      list.forEach(item => {
        let example = item.example ? String(item.example) : ``
        if(item.type === `eval`) { // 使用代码执行结果
          try {
            const { NodeVM } = require(`vm2`)
            const vm = new NodeVM({
              sandbox: { // 给 vm 使用的变量
                Mock,
              },
            })
            example = vm.run(`module.exports = ${example}`, `vm.js`) || ``
          } catch (err) {
            console.log(`err`, err)
          }
          // 处理含有 @mock 方法或为正则的 example
        } else if(mockMethods.some(item => example.includes(item)) === false) { // 如果不包含 @mock 方法则进行类型转换
          // todo 不应该直接使用 includes 判断, 例如可以是 `@inc` 或 `@inc c` 但不能是 `@incc`
          // 根据 type 转换 example 值的类型
          if(strReMatch(example)) { // 猜测为正则
            example = strReMatch(example)
          } else if(item.type === `number`) { // 数字
            example = Number(example)
          } else if(item.type === `boolean`) { // 布尔
            example = [`false`, `0`, `假`, `T`, `t`].includes(example) ? false : Boolean(example)
          }
        }

        // 如果是对象或数里进行递归调用
        if([`object`, `array`].includes(item.type) && Array.isArray(item.children)) {
          switch(item.type) {
            case `object`:
              res[item.name] = listToDataRef(item.children)
              break
            case `array`:
              res[item.name] = res[item.name] || []
              res[item.name].push(listToDataRef(item.children))
              break
            default:
              console.log(`no type`, item.type)
          }
        } else { // 如果不是引用类型, 则应用最后转换后的值 example
          res[`${item.name}#${item.type || `string`}`] = example
        }
      })
      return res
    }
    let res = listToDataRef(list)
    res = {
      [`data${options.rule ? `|${options.rule}` : ``}`]: {object: res, array: [res]}[options.type],
    }
    const data = Mock.mock(res)
    return data
  }

  /**
  * 如果字符串是正则就返回正则, 否则返回 false
  * @param {string} str 前后有 / 号的字符串
  */
  function strReMatch (str) {
    let reStr = (str.match(/^\/(.*)\/$/) || [])[1]
    let re = undefined
    if(reStr) {
      try {
        re = new RegExp(reStr)
      } catch (error) { // 正则转换失败
        return false
      }
    } else {
      return false
    }
    return re
  }

  async function customApi() {
    // 所有 api, 例如 db 解析后的中间件信息
    const serverRouterItem = {
      alias: [], // String[], 路由别名
      route: undefined, // String, 路由地址
      re: undefined, // RegExp, 由 route 转换的正则
      method: undefined, // String, 请求方式, 例如 use get post
      type: undefined, // Enum, 指定接口来源, 例如 db api
      description: undefined, // String, 接口描述
      disable: undefined, // Boolean, 是否禁用
      action: undefined, // Function, 指定接口要运行的方法
      occupied: { // Object, 被谁占用, 如果是被占用的状态, 则不会被使用
        type: undefined, // Enum
        route: undefined, // String
      },
      info: {}, // Object, 根据 type 可能不同结构的附加信息
    }
    
    const pathToRegexp = require(`path-to-regexp`)
    /**
    * 自定义 api 处理程序, 包括配置中的用户自定义路由(config.api), 以及mock数据生成的路由(config.db)
    */

    async function parseApi() { // 解析自定义 api
      const { setHeader, allowCors } = clientInjection()
      const run = {
        async curl({req, res, cmd}) { // cmd: curl/bash
          const options = await tool.cli.getOptions(cmd)
          return new Promise(async (resolve, reject) => {
            const request = await tool.generate.initPackge(`request`)
            request(options, (err, curlRes = {}, body) => {
              setHeader(res, curlRes.headers) // 复制远程的 header
              allowCors({req, res}) // 设置 header 为允许跨域模式
              const mergeRes = curlRes
              err ? reject(err) : resolve(mergeRes)
            })
          })
        },
        fetch({req, res, fetchRes}) { // node-fetch
          return new Promise((resolve, reject) => {
            fetchRes.then(fetchThenRes => {
              const headers = [...fetchThenRes.headers].reduce((acc, cur) => ({...acc, [cur[0]]: cur[1]}), {})
              const contentEncoding = headers[`content-encoding`]
              if(contentEncoding && contentEncoding.includes(`gzip`)) {
                // 由于返回的内容其实已经被解码过了, 所以不能再告诉客户端 content-encoding 是压缩的 `gzip`, 否则会导致客户端无法解压缩
                // - 例如导致浏览器无法解码: net::ERR_CONTENT_DECODING_FAILED 200 (OK)
                delete headers[`content-encoding`]
              }
              setHeader(res, headers)
              allowCors({req, res})
              const mergeRes = fetchThenRes
              resolve(mergeRes)
            }).catch(err => {
              console.log(`err`, err)
              reject(err)
            })
          })
        },
      }
      const apiUtil = { // 向 config.api 暴露一些工具库
        run,
      }
      let api = global.config.api(apiUtil)
      await pluginRun(`apiParsed`, api, apiUtil)
      const side = {}
      //  从 side 函数中扩展 api
      api = Object.entries(api).reduce((acc, [key, val]) => {
        if(val instanceof Side) {
          const sideObj = {
            alias: [], // 路由别名
          }
          val = {
            ...sideObj,
            ...val,
          }
          val.alias.forEach(alias => {
            acc[alias] = val.action
          })
          side[key] = val
          val = val.action
        }
        acc[key] = val
        return acc
      }, {})
      const serverRouterList = [] // server 可使用的路由列表
      Object.keys(api).forEach(key => {
        let {method, url} = tool.url.fullApi2Obj(key)
        method = method.toLowerCase()
        let val = api[key]
        if(method === `use`) { // 自定义中间件时不使用自动返回 json 的规则
          if([`function`, `array`, `asyncfunction`].includes(tool.type.isType(val)) === false) { // use 支持单个和多个(数组)中间件
            print(tool.cli.colors.red(`Data other than function|array type is not allowed in the use mode in config.api: ${val}`))
            val = (req, res, next) => next()
          }
        } else if([
          `string`,
          `number`,
          `object`,
          `array`,
          `boolean`,
          `null`,
        ].includes(tool.type.isType(val))) { // 如果配置的值是 json 支持的数据类型, 则直接作为返回值, 注意, 读取一个文件也是对象
          const backVal = val
          if(method === `ws`) {
            val = (ws, req) => {
              const strData = JSON.stringify(backVal)
              ws.send(strData)
              ws.on(`message`, (msg) => ws.send(strData))
            }
          } else {
            val = (req, res, next) => res.json(backVal)
          }
        }
        serverRouterList.push({
          ...serverRouterItem,
          ...side[key],
          route: url,
          re: pathToRegexp(url),
          method,
          type: `api`,
          action: val,
          occupied: {},
        })
      })
      await pluginRun(`apiListParsed`, serverRouterList)
      return serverRouterList
    }

    /**
     * 测试给定的 method 和 pathname 是否匹配当前存在的 route
     * @param {*} param0 
     * @returns 
     */
    function allRouteTest({allRoute, upgrade, method, pathname}) {
      // return true 时不走真实服务器, 而是走自定义 api
      return allRoute.find(item => {
        if (((item.method === `ws` ) && (method === `get` ))) { // ws 连接时, 实际上得到的 method 是 get, 并且 pathname + .websocket
          return (
            item.re.exec(pathname)
            && upgrade.match(/websocket/i)
            && Boolean(item.disable) === false
          )
        }
        if(item.method === `use`) {  // 当为中间件模式时, 匹配其后的任意路径
          if(item.type === `db`) { // 如果是 db 模式下, 需要匹配 db 下的存在的接口
            return item.info.apiList.find(dbItem => (
              dbItem.re.exec(pathname)
              && dbItem.method === method
              && Boolean(dbItem.disable) === false
            ))
          } else {
            return (
              pathname.startsWith(item.route)
              && Boolean(item.disable) === false
            )
          }
        }
        // 当方法相同时才去匹配 url
        if(((item.method === `all`) || (item.method === method))) {
          return (
            item.re.exec(pathname) // 如果匹配到自定义的 api 则走自定义 api
            && Boolean(item.disable) === false // 如果自定义 api 为禁用状态, 则走真实服务器
          )
        } else {
          return false
        }
      })
    }
    
    /**
     * 展开 db 中的 api
     */
    function unzipDbApi() {
      const db = JSON.parse(require(`fs`).readFileSync(global.config.dbJsonPath))
      const keys = Object.keys(db)
      const isType = tool.type.isType
      let apiList = []
      keys.forEach(key => {
        const val = db[key]
        if (isType(val, `object`)) {
          `get post put patch`.split(` `).forEach(method => {
            apiList.push({
              method,
              route: `/${key}`,
            })
          })
        }
        if (isType(val, `array`)) {
          `get post`.split(` `).forEach(method => {
            apiList.push({
              method,
              route: `/${key}`,
            })
          })
          ;`get put patch delete`.split(` `).forEach(method => {
            apiList.push({
              method,
              route: `/${key}/:id`,
            })
          })
        }
      })
      apiList = apiList.map(item => {
        return {
          route: item.route,
          re: pathToRegexp(item.route),
          method: item.method,
          type: `db`,
          action: undefined,
          occupied: {},
        }
      })
      return {
        keys,
        apiList,
      }
    }

    function parseDbApi() {
      const router = jsonServer.router(global.config.dbJsonPath, {
        _noRemoveDependents: true,
        _noDataNext: true,
        _noDbRoute: true,
      })
      global.config._set(`_db`, router.db)
      router.render = async (req, res) => { // 修改输出的数据, 符合项目格式
        // 在 render 方法中, req.query 会被删除
        // https://github.com/typicode/json-server/issues/311
        // https://github.com/typicode/json-server/issues/314

        const querystring = require(`querystring`)
        if(req._parsedUrl) {
          const query = querystring.parse(req._parsedUrl.query)
          req.query = query
        }
        let returnData = res.locals.data // 前面的数据返回的 data 结构
        const xTotalCount = res.get(`X-Total-Count`)
        if(xTotalCount) {
          returnData = {
            count: xTotalCount,
            results: res.locals.data,
          }
        }
        const data = await res.mm.resHandleJsonApi({
          req,
          res,
          data: returnData,
          resHandleJsonApi: global.config.resHandleJsonApi,
        })
        res.json(data)
      }
      const {keys, apiList} = unzipDbApi()
      const list = [
        {
          route: `/`,
          re: pathToRegexp(`/`),
          method: `use`,
          type: `db`,
          action: router,
          info: {
            keys,
            apiList,
          },
          occupied: {},
        },
      ]
      return list
    }

    function apiWebHandle() { // 处理 webApi 为 api
      const apiWebStore = tool.file.fileStore(global.config.apiWeb)
      const paths = apiWebStore.get(`paths`)
      const disableApiList = apiWebStore.get(`disable`)
      const pathList = Object.keys(paths).map(path => {
        return Object.keys(paths[path]).map(method => ({
          key: `${method} ${path}`,
          path,
          method,
          ...paths[path][method],
        }))
      }).flat()
      const apiList = pathList.reduce((acc, cur, curIndex) => {
        let fn = (req, res, next) => {
          const {example = {}, table = []} = cur.responses[`200`]
          const {headers = {}, useDataType = `table`, custom, history, rule, type} = example
          if(useDataType === `table`) { // 使用表格中的数据
            try {
              const { setHeader } = clientInjection()
              setHeader(res, headers) // 设置自定义 header
              let data
              const listToDataRes = listToData(table, {rule, type})
              data = listToDataRes.data
              // 根据 apiWebWrap 处理数据
              if(global.config.apiWebWrap === true) {
                data = wrapApiData({data, code: 200})
              } else if(typeof(global.config.apiWebWrap) === `function`) {
                data = global.config.apiWebWrap({data, code: 200})
              }
              res.json(data)
            } catch (err) {
              print(err)
              res.status(500).json({msg: String(err)})
            }
          }
          if (useDataType === `custom`) { // 自定义逻辑
            try {
              const { NodeVM } = require(`vm2`)
              const vm = new NodeVM({
                sandbox: { // 给 vm 使用的变量
                  tool: {
                    libObj: lib,
                    wrapApiData,
                    listToData,
                    cur,
                  },
                },
              })
              const code = vm.run(`module.exports = ${custom}`, `vm.js`) || ``
              const codeType = typeof(code)
              if([`function`].includes(codeType)) { // 如果是函数则运行函数
                code(req, res, next)
              } else { // 函数之外的类型则当作 json 返回
                res.json(code)
              }
            } catch (err) {
              console.log(`err`, err)
              // 处理客户端代码出现问题, 代码错误或出现不允许的权限
              res.status(403).json({
                msg: err.message,
              })
            }
          }
          if (useDataType === `history`) { // 使用历史记录
            middleware().replayHistoryMiddleware({
              id: history,
              business: business(),
            })(req, res, next)
          }
        }
        if(cur.method === `ws`) { // 如果是 websocket 方法则更换函数模版
          fn = (ws, req) => {
            const sendData = (data) => {
              const strData = JSON.stringify(data)
              ws.send(strData)
              ws.on(`message`, (msg) => {
                ws.send(strData)
              })
            }
            const {example = {}, table = []} = cur.responses[`200`]
            const {headers = {}, useDataType = `table`, custom, history, rule, type} = example
            if(useDataType === `table`) { // 使用表格中的数据
              try {
                let data
                const listToDataRes = listToData(table, {rule, type})
                data = listToDataRes.data
                sendData(data)
              } catch (err) {
                print(err)
                sendData({msg: String(err)})
              }
            }
            if (useDataType === `custom`) { // 自定义逻辑
              try {
                const { NodeVM } = require(`vm2`)
                const vm = new NodeVM({
                  sandbox: { // 给 vm 使用的变量
                    tool: {
                      libObj: lib,
                      wrapApiData,
                      listToData,
                      cur,
                    },
                  },
                })
                const code = vm.run(`module.exports = ${custom}`, `vm.js`) || ``
                const codeType = typeof(code)
                if([`function`].includes(codeType)) { // 如果是函数则运行函数
                  code(ws, req)
                } else { // 函数之外的类型则当作 json 返回
                  sendData(code)
                }
              } catch (err) {
                console.log(`err`, err)
                // 处理客户端代码出现问题, 代码错误或出现不允许的权限
                sendData({msg: err.message})
              }
            }
          }
        }
        const disable = disableApiList.includes(`/`)  // 如果含有根结点, 则表示全部禁用
          ? true
          : disableApiList.includes(cur.key)
        acc.push({
          route: cur.path,
          re: pathToRegexp(cur.path),
          method: cur.method,
          type: `apiWeb`,
          description: cur.description,
          disable,
          action: fn,
          occupied: {},
        })
        return acc
      }, [])
      return apiList
    }

    function prepareProxy (proxy = {}) { // 解析 proxy 参数, proxy: string, object
      const isType = tool.type.isType
      const proxyType = isType(proxy)
      let resProxy = []
      if(proxyType === `string`) { // 任何路径都转发到 proxy
        proxy = {
          '/': proxy,
        }
      }
      function setIndexOfEnd(proxy) { // 需要排序 key:/ 到最后, 否则它生成的拦截器会被其他 key 覆盖
        const indexVal = proxy[`/`]
        delete proxy[`/`]
        proxy[`/`] = indexVal
        return proxy
      }
      proxy = setIndexOfEnd(proxy)
      resProxy = Object.keys(proxy).map(context => {
        let options = proxy[context]
        const optionsType = isType(options)
        if(optionsType === `string`) { // 转换字符串的 value 为对象
          const rootOptions = proxy[`/`]
          options = {
            pathRewrite: { [`^${context}`]: options }, // 原样代理 /a 到 /a
            target: options.includes(`://`) // 如果要代理的目录地址已有主域
              ? new URL(options).origin // 那么就代理到该主域上
              : { // 否则就代理到 / 设定的域上
                string: rootOptions,
                object: rootOptions.target, // 当主域是对象时则取其 target
              }[isType(rootOptions)],
          }
        }
        if(optionsType === `array`) { // 是数组时, 视为设计 res body 的值, 语法为: [k, v]
          const [item1, item2] = options
          const item1Type = isType(item1)
          const item2Type = isType(item2)
          const deepMergeObject = tool.obj.deepMergeObject

          if((item1Type !== `function`) && (options.length <= 1)) { // 只有0个或一个项, 直接替换 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: () => item1})
              },
            }
          }
          if((item1Type === `function`) && (options.length <= 1)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => item1({req, json})})
              },
            }
          }
          if((item1Type === `function`) && (item2Type === `function`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => {
                  return item2({req, json: item1({req, json})})
                }})
              },
            }
          }
          if((item1Type === `string`) && (item2Type === `function`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: (json) => {
                  return item2({req, json: tool.obj.deepGet(json, item1)})
                }})
              },
            }
          }
          if((item1Type === `function`) && (item2Type === `string`)) {
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: json => {
                  return tool.obj.deepGet(item1({req, json}), item2)
                }})
              },
            }
          }
          if((item1Type === `string`) && (options.length === 2)) { // 以 item1 作为 key, item2 作为 val, 修改原 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, key: item1, val: item2})
              },
            }
          }
          if((item1Type === `object`) && (options.length === 2)) { // 根据 item2 的类型, 合并 item1
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: body => {
                  return ({
                    'deep': deepMergeObject(body, item1), // 父级【不会】被替换
                    '...': {...body, ...item1}, // 父级【会】被替换, 类似于js扩展运行符
                  })[item2 || `deep`]
                }})
              },
            }
          }
        }
        return {
          route: context,
          re: pathToRegexp(context),
          method: undefined,
          type: `proxy`,
          action: undefined,
          occupied: {},
          info: options,
        }
      })
      return resProxy
    }

    function staticHandle() { // 处理 static 为 api, 实际上是转换为 use 中间件的形式
      let list = []
      global.config.static.map(item => {
        list.push({
          route: item.path,
          re: pathToRegexp(item.path),
          method: `use`,
          type: `static`,
          action: [
            async (req, res, next) => { // 开启列表显示时
              if(item.list && item.mode !== `history`) {
                fileList({
                  root: item.fileDir,
                })(req, res, next)
              } else {
                next()
              }
            },
            async (req, res, next) => { // mode history
              if(item.mode === `history`) {
                ;(await tool.generate.initPackge(`connect-history-api-fallback`))(item.option)(req, res, next)
              } else {
                next()
              }
            },
            express.static(item.fileDir),
          ],
          occupied: {},
        })
      })
      return list
    }
    
    function resetUrl() { // 重置 req.url
      /**
       某些中间件例如 json-server 会改变 req.url, 导致后续的 app.use 逻辑不符合预期
       @see https://github.com/typicode/json-server/blob/5df482bdd6e864258d6e7180342a30bf7b923cbc/src/server/router/nested.js#L13
       */
      return [
        {
          route: `/`,
          re: pathToRegexp(`/`),
          method: `use`,
          type: `resetUrl`,
          action: (req, res, next) => {
            req.url = req.originalUrl
            next()
          },
          info: {},
          occupied: {},
        },
      ]
    }
    
    // 处理为统一的列表, 注意列表中的顺序对应 use 注册的顺序
    const obj = {
      api: await parseApi(),
      db: parseDbApi(),
      resetUrl: resetUrl(),
      static: staticHandle(),
      apiWeb: apiWebHandle(),
      proxy: prepareProxy(global.config.proxy),
    }
    const allRoute = [
      ...obj.api,
      ...obj.db,
      ...obj.resetUrl,
      ...obj.static,
      ...obj.apiWeb,
      ...obj.proxy,
    ]
    allRoute.obj = obj

    return {
      allRouteTest,
      allRoute,
    }

  }

  /**
   * 过时的 API 提示
   * @param {*} param0 
   * @param {*} param0.type api 类型: cli 命令行 option 选项
   * @param {*} param0.no 旧API
   * @param {*} param0.yew 新API
   * @param {*} param0.v 被删除的版本
   */
  function oldAPI({type, no, yes, v}) {
    type === `cli` && print(tool.cli.colors.red(`API更新: 请将命令行参数 ${no} 替换为 ${yes}, 在 v${v} 版本之后 ${no} 将停止使用!`))
  }

  function initHandle() { // 初始化处理程序
    /**
     * 检查运行环境是否兼容
     */
    function checkEnv () {
      return lib.compareVersions.compare(process.version, `10.12.0`, `>=`)
    }

    function templateFn({cliArg, version}) {
      if(cliArg[`--template`]) {
        const path = require(`path`)
        const cwd = process.cwd()
        if(tool.file.hasFile(cwd) === false) {
          require(`fs`).mkdirSync(cwd, { recursive: true })
        }
        const copyPath = path.normalize(`${cwd}/mm/`)
        tool.file.copyFolderSync(path.normalize(`${__dirname}/../example/template/`), copyPath)

        { // 创建 package.json 中的 scripts 和 devDependencies
          const fs = require(`fs`)
          const jsonPath = `${process.cwd()}/package.json`
          const hasJson = tool.file.hasFile(jsonPath)
          const scripts = `npx mockm --cwd=mm`
          const devDependencies = version
          
          if(
            hasJson 
            && (require(jsonPath).scripts || {}).mm 
            && (require(jsonPath).devDependencies || {}).mockm
          ) {
            // console.log(`无需修改`)
          } else {
            hasJson === false && fs.writeFileSync(jsonPath, tool.string.removeLeft(`
            {
              "scripts": {
                "mm": "${scripts}"
              },
              "devDependencies": {
                "mockm": "${devDependencies}"
              }
            }
            `).trim())
            let packageText = fs.readFileSync(jsonPath, `utf8`)
            const packageJson = JSON.parse(packageText)
        
            packageJson.scripts = packageJson.scripts || {}
            packageJson.devDependencies = packageJson.devDependencies || {}
            packageJson.scripts.mm = packageJson.scripts.mm || scripts
            packageJson.devDependencies.mockm = packageJson.devDependencies.mockm || devDependencies
        
            const split = (packageText.match(/[\t ]+/) || [`  `])[0] // 获取缩进风格
            packageText = JSON.stringify(packageJson, null, split)
            fs.writeFileSync(jsonPath, packageText)
          }
      
        }
        
        process.chdir(copyPath)

        print(`模板 ${copyPath} 已创建成功!`)
        print(`使用命令 npm run mm`)
      }
    }

    function configFileFn({cliArg}) {
      const path = require(`path`)
      const fs = require(`fs`)
      const cwdConfigPath = `${process.cwd()}/mm.config.js`
      const hasCwdConfig = tool.file.hasFile(cwdConfigPath)
      let res = `${__dirname}/../config.js` // 默认配置文件

      cliArg[`config`] && (cliArg[`--config`] = cliArg[`config`]) && oldAPI({
        type: `cli`,
        no: `config`,
        yes: `--config`,
        v: `1.1.26`,
      })
      
      
      const example = fs.readFileSync( `${__dirname}/../example/simple.mm.config.js`, `utf8`)
      if((cliArg[`--config`] === true) && (hasCwdConfig === false)) { // 如果 config=true 并且当前目录没有配置时, 则生成示例配置并使用
        tool.file.createFile({filePath: cwdConfigPath, str: example}) && print(tool.cli.colors.yellow(`已从示例配置自动创建 => ${cwdConfigPath}`))
        res = cwdConfigPath
      } else if((cliArg[`--config`] === true) && (hasCwdConfig === true)) { // 使用生成的示例配置
        res = cwdConfigPath
      } else if(typeof(cliArg[`--config`]) === `string`) { // 命令行上指定的 config 文件
        res = cliArg[`--config`]
        tool.file.createFile({filePath: res, str: example}) && print(tool.cli.colors.yellow(`已从示例配置自动创建 => ${res}`))
      } else if(tool.file.hasFile(cwdConfigPath)) { // 命令运行位置下的配置
        res = cwdConfigPath
      }
      res = path.normalize(res)
      cliArg[`--config`] = res
      return res
    }

    function getOpenApi({openApi}) { // 使用服务器获取远程 openApi , 避免跨域
      const [, tag = ``, username, password] = openApi.match(/:\/\/((.+):(.+)@)/) || []
      openApi = openApi.replace(tag, ``)
      return new Promise((resolve, reject) => {
        http.get(openApi, {
          auth: username ? {username, password} : {},
        }).then(res => {
          resolve(res)
        }).catch(err => {
          print(`err`, `Failed to get openApi`)
          reject(err.message)
        })
      })
    }

    function init() { // 初始化, 例如创建所需文件, 以及格式化配置文件
      const fs = require(`fs`)
      const fileStore = tool.file.fileStore
      if(tool.file.hasFile(global.config.dataDir) === false) { // 初始化 dataDir
        fs.mkdirSync(global.config.dataDir, {recursive: true})
      }
      fileStore(global.config._httpHistory) // 初始化 _httpHistory
      fileStore(global.config.apiWeb, { // 初始化 apiWeb
        paths: {},
        disable: [],
      })
      fileStore(global.config._share, {config: global.config}).set(`config`, global.config)

      { // 初始化 config.db, 或者更新它
        const fs = require(`fs`)
        const newDb = global.config.db()
        const o2s = tool.obj.o2s
        if(tool.file.isFileEmpty(global.config.dbJsonPath) || global.config.dbCover) { // 如果 db 文件为空或声明总是覆盖, 都重写整个文件
          fs.writeFileSync(global.config.dbJsonPath, o2s(newDb))
        } else { // 否则只进行浅覆盖
          const oldDb = JSON.parse(fs.readFileSync(global.config.dbJsonPath))
          const resDb = {...newDb, ...oldDb}
          fs.writeFileSync(global.config.dbJsonPath, o2s(resDb)) // 更新 db 文件, 因为 jsonServer.router 需要用它来生成路由
        }
      }
      
      { // 监听自定义目录更改后重启服务
        const nodemon = require(`nodemon`)
        tool.type.isEmpty(global.config.watch) === false && nodemon({
          exec: `node -e 0`, // 由于必须存在 exec 参数, 所以放置一条啥也不干的命令
          watch: global.config.watch,
        }).on(`restart`, () => {
          reStartServer(global.config.config)
        })
      }

      { // 配置 httpData 目录中的 gitignore
        tool.file.isFileEmpty(global.config._gitIgnore.file)
        && fs.writeFile(
          global.config._gitIgnore.file,
          tool.string.removeLeft(global.config._gitIgnore.content).trim(),
          () => {},
        )
      }

      { // 初始化错误日志保存文件
        tool.file.isFileEmpty(global.config._errLog)
        && fs.writeFile(
          global.config._errLog,
          tool.string.removeLeft(`
          readme:
            - 本文件用于存储 mockm 运行过程中捕获到的一些错误.
          `).trim(),
          () => {},
        )
      }

      { // 初始化 store 中的内容
        const osIp = global.config.osIp
        const store = fileStore(global.config._store, {
          apiCount: 0,
          note: {
            remote: {},
          },
          updateToken: {},
        })
        // 需要每次根据 osIp 更新调试地址
        store.set(`note.local`, {
          port: `http://${osIp}:${global.config.port}`,
          replayPort: `http://${osIp}:${global.config.replayPort}`,
          testPort: `http://${osIp}:${global.config.testPort}`,
        })
      }

      { // 清理 history
        global.config.clearHistory && business().historyHandle().clearHistory(global.config)
      }

      { // 定时备份 openApi
        const openApiList = Boolean(global.config.openApi && global.config.backOpenApi) === false ? [] : {
          string: () => [global.config.openApi],
          array: () => global.config.openApi,
          object: () => Object.values(global.config.openApi),
        }[tool.type.isType(global.config.openApi)]()
        const backFn = () => {
          openApiList.forEach(item => {
            tool.file.backUrl(global.config._openApiHistoryDir, item, data => { // 格式化 openApi 后再保存, 避免压缩的内容不易比较变更
              return JSON.stringify(tool.obj.sortObj(JSON.parse(data)), null, 2) // 排序 obj, 因为 openApi 中的顺序不确定会导致变更过多
            })
          })
        }
        backFn()
        setInterval(backFn, global.config.backOpenApi * 60 * 1000)
      }

    }

    return {
      templateFn,
      checkEnv,
      wrapApiData,
      configFileFn,
      init,
      getOpenApi,
    }

  }

  function historyHandle() {
    /**
    * 历史记录处理
    */

    /**
     * 获取原始 history
     * @param {object} param0 参数
     */
    function getRawHistory() {
      const history = global.HTTPHISTORY
      let list = []
      list = Object.keys(history).reduce((acc, cur) => {
        return acc.concat(history[cur])
      }, [])
      return list
    }

    /**
     * 获取简要信息的 history 列表
     * @param {object} param0 参数对象
     * @param {string} param0.method 方法 - 可选
     * @param {id} param0.method 方法 - 可选
     * @param {string} param0.api api - 可选
     * @return {array} 数组
     */
    function getHistoryList({md5 = false, method: methodRef, api: apiRef} = {}) {
      const fs = require(`fs`)
      let list = getRawHistory({})
      list = list.filter(item => item.data).map(({path, fullApi, id, data: {req, res}}) => {
        const {method, url} = tool.url.fullApi2Obj(fullApi)
        if(methodRef && apiRef) {
          if(((method === methodRef) && (url === apiRef)) === false) { // 如果没有找到就返回, 找到才进入数据处理
            return false
          }
        }
        const reqBodyPath = req.bodyPath
        const resBodyPath = res.bodyPath
        const resBodySize = resBodyPath && tool.file.hasFile(resBodyPath) ? fs.statSync(resBodyPath).size : 0
        const resBodyMd5 = resBodyPath && md5 && tool.file.hasFile(resBodyPath) ? tool.file.getMd5Sync(resBodyPath) : undefined
        const reqBodySize = reqBodyPath && tool.file.hasFile(reqBodyPath) ? fs.statSync(reqBodyPath).size : 0
        const reqBodyMd5 = reqBodyPath && md5 && tool.file.hasFile(reqBodyPath) ? tool.file.getMd5Sync(reqBodyPath) : undefined
        const headers = res.lineHeaders.headers || require(require(`path`).resolve(res.lineHeaders.headPath))
        return {
          id,
          method,
          path,
          api: url,
          fullApi,
          statusCode: res.lineHeaders.line.statusCode,
          contentType: headers[`content-type`],
          extensionName: (resBodyPath || ``).replace(/(.*)(\.)/, ``),
          resBodySize,
          resBodyMd5,
          resBodyPath,
          reqBodySize,
          reqBodyMd5,
          reqBodyPath,
          date: headers.date,
        }
      }).filter(item => item)
      return list
    }

    /**
     * 获取单条记录的 history
     * @param {object} param0 参数对象
     * @param {string} param0.fullApi `method api` 可选
     * @param {function} param0.find 自定义筛选逻辑
     * @return {object} 为空时返回空对象
     */
    function getHistory({fullApi, id, status, find}) { // 获取指定 fullApi/id 中的历史记录
      const history = global.HTTPHISTORY
      if(fullApi === undefined && id) {
        return getRawHistory({history}).find(item => item.id === id) || {}
      }
      const { path } = tool.url.fullApi2Obj(fullApi)
      const list = [...(history[path] || [])].reverse().filter(item => ( // 传入 id 时比较 id
        (id === undefined ? true : (item.id === id))
        && (item.fullApi === fullApi)
      ))
      const res = find ? find(list) : list[0] || {}
      return res
    }

    function ignoreHttpHistory({req}) { // 是否应该记录 req
      const {method, originalUrl: url} = req
      function disableRecord() {
        const disableRecord = global.config.disableRecord
        if(tool.type.isType(disableRecord, `boolean`)) {
          return disableRecord
        } else {
          return global.config.disableRecord.some(item => {
            const match = url.match(new RegExp(item.path)) && (item.method ? method.match(new RegExp(`^${item.method}$`, `i`)) : true)
            if(match && item.num) { // todo 删除超过规定条数的记录
              // ...
            }
            return match
          })
        }
      }
      return Boolean(
        method.match(/OPTIONS/i)
        || (
          method.match(/GET/i) && url.match(new RegExp(`//${global.config._proxyTargetInfo.pathname}//`))
        )
        || disableRecord(),
      )
    }

    function createBodyPath({req, headersObj, reqOrRes, apiId, isHeader = false}) { // 根据 url 生成文件路径, reqOrRes: req, res
      const filenamify = require(`filenamify`)
      const fs = require(`fs`)
      const mime = require(`mime`)
      const headers = headersObj[reqOrRes]
      const contentType = isHeader ? `application/json;charset=utf-8` : headers[`content-type`]
      const extensionName = mime.getExtension(contentType) || ``
      const {url, path} = tool.httpClient.getClientUrlAndPath(req.originalUrl)
      let {
        method,
      } = req
      method = method.toLowerCase()

      const newPath = () => {
        const osPath = require(`path`)
        const basePath = osPath.relative(process.cwd(), global.config._requestDir) // 获取相对路径下的 dataDir 目录
        const apiDir =  osPath.normalize(`./${basePath}/${path}`).replace(/\\/g, `/`) // 以 path 创建目录, 生成相对路径以避免移动 dataDir 后无法使用
        if(tool.file.hasFile(apiDir) === false) { // 如果不存在此目录则进行创建
          fs.mkdirSync(apiDir, { recursive: true })
        }
        let shortUrl = url.indexOf(path) === 0 ? url.replace(path, ``) : url // 为了节约目录长度删除 url 中的 path 部分, 因为 pathDir 已经是 path 的表示
        shortUrl = shortUrl.slice(1, 100)
        const filePath = `${apiDir}/${
          filenamify(
            `${shortUrl}_${method}_${apiId}_${reqOrRes}${isHeader ? `_h` : ``}.${extensionName}`,
            {maxLength: 255, replacement: `_`},
          )
        }`
        // 如果 filePath 已存在于记录中, 则使用新的
        return filePath
      }

      // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
      let bodyPath = newPath()
      return bodyPath
    }

    function createHttpHistory({dataDir, buffer, req, res}) {
      const fs = require(`fs`)
      let {
        method,
      } = req
      method = method.toLowerCase()
      const {url, path} = tool.httpClient.getClientUrlAndPath(req.originalUrl)
      const headersObj = {req: req.headers || req.getHeaders(), res: res.headers || res.getHeaders()}
      headersObj.res.date = headersObj.res.date || (new Date()).toGMTString() // 居然没有 date ?
      const {statusCode, statusMessage, headers} = res
      const fullApi = `${method} ${url}`
      const reqBody = req.body

      // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

      const apiCount = tool.file.fileStore(global.config._store).updateApiCount()
      const apiId = tool.hex.string10to62(apiCount)
      function getBodyPath() {
        const arg = {req, headersObj, dataDir, apiId}
        return {
          headersPathReq: createBodyPath({...arg ,reqOrRes: `req`, isHeader: true}),
          headersPathRes: createBodyPath({...arg ,reqOrRes: `res`, isHeader: true}),
          bodyPathReq: tool.type.isEmpty(reqBody) === false ? createBodyPath({...arg ,reqOrRes: `req`}) : undefined,
          bodyPathRes: tool.type.isEmpty(buffer) === false ? createBodyPath({...arg ,reqOrRes: `res`}) : undefined,
        }
      }
      const {headersPathReq, headersPathRes, bodyPathReq, bodyPathRes} = getBodyPath()
      fs.writeFileSync(headersPathReq, JSON.stringify(headersObj.req), {encoding: `utf8`})
      fs.writeFileSync(headersPathRes, JSON.stringify(headersObj.res), {encoding: `utf8`})
      bodyPathReq && fs.writeFileSync(bodyPathReq, JSON.stringify(reqBody), {encoding: `utf8`})
      bodyPathRes && fs.writeFileSync(bodyPathRes, buffer, {encoding: `buffer`})
      const resDataObj = {
        req: {
          lineHeaders: {
            line: tool.obj.removeEmpty({
              method,
              url,
              path,
              query: req.query,
              params: req.params,
              version: req.httpVersion,
            }),
            // headers: headersObj.req,
            headPath: headersPathReq,
            // _header: proxyRes.req._header,
          },
          // body: null,
          bodyPath: bodyPathReq,
        },
        res: {
          lineHeaders: {
            line: {
              statusCode,
              statusMessage,
              version: res.httpVersion,
            },
            // headers: headersObj.res,
            headPath: headersPathRes,
            // _header: res._header,
          },
          // body: null,
          bodyPath: bodyPathRes,
        },
      }
      setHttpHistory({
        data: {path, fullApi, id: apiId, data: resDataObj},
      })
    }

    function setHttpHistory({data}) {
      const history = global.HTTPHISTORY
      const fs = require(`fs`)
      const {path} = data
      history[path] = (history[path] || []).concat(data)
      fs.writeFileSync(global.config._httpHistory, tool.obj.o2s(history))
    }

    function setHttpHistoryWrap({req, res, mock = false, buffer}) { // 从 req, res 记录 history
      if(ignoreHttpHistory({req}) === false) {
        const data = []
        const arg = {
          buffer,
          req,
          res,
        }
        clientInjection().setApiInHeader({req, res})
        if(mock === true) {
          createHttpHistory(arg)
          return false
        } else {
          let isSave = false
          // eslint-disable-next-line no-inner-declarations
          function saveHistory(ev) {
            if(isSave === false) { // 没有保存过才进行保存
              const buffer = Buffer.concat(data)
              createHttpHistory({...arg, buffer})
              isSave = true
            }
          }
          res.on(`data`, function(chunk) {
            data.push(chunk)
          })
          req.on(`close`, () => saveHistory(`req close`))
          res.on(`close`, () => saveHistory(`res close`))
        }
      }
    }

    function clearHistory() {
      function getDelIdList(list, options = {}) {
        options = {
          retentionTime: 0.01,
          num: 1,
          ...options,
        }

        list = list.filter(item => { // 获取多少分钟之前的请求
          return Date.now() - new Date(item.date).getTime() > options.retentionTime * 60 * 1000
        } )
        let obj = {} // 合并相同内容为对象
        list = tool.array.sort(list, {key: `id`})
        list.forEach(({id, resBodyMd5, reqBodyMd5, fullApi, statusCode}) => {
          const tag = [fullApi, statusCode, resBodyMd5, reqBodyMd5].join(` | `)
          obj[tag] = [id, ...obj[tag] || []]
          if(options.num < 0) {
            obj[tag] = obj[tag].reverse()
          }
        })

        let delIdList = [] // 获取要删除的 ID 列表
        Object.keys(obj).forEach(key => {
          delIdList = delIdList.concat(obj[key].slice(Math.abs(options.num)))
        })
        return delIdList
      }

      global.HTTPHISTORY = require(global.config._httpHistory) // 请求历史
      const HTTPHISTORY = global.HTTPHISTORY
      let list = business().historyHandle().getHistoryList({md5: true})
      const delIdList = {
        function: global.config.clearHistory,
        object: list => getDelIdList(list, global.config.clearHistory),
        boolean: list => global.config.clearHistory ? getDelIdList(list) : [],
        undefined: () => [],
      }[tool.type.isType(global.config.clearHistory)](list)

      // 删除文件
      const fs = require(`fs`)
      delIdList.forEach(id => {
        let {reqBodyPath, resBodyPath, path} = list.find(item => item.id === id) || {}
        const apiList = HTTPHISTORY[path] || []
        const findIndex = id => apiList.findIndex(item => item.id === id)
        // 删除 json 中的记录
        apiList.splice(findIndex(id), 1)
        if(findIndex(id) === -1) { // 如果删除成功则删除对应的文件
          reqBodyPath && tool.file.hasFile(reqBodyPath) && fs.unlinkSync(reqBodyPath)
          resBodyPath && tool.file.hasFile(resBodyPath) && fs.unlinkSync(resBodyPath)
        }
      })
      fs.writeFileSync(global.config._httpHistory, tool.obj.o2s(HTTPHISTORY))
      delIdList.length && print(`Record cleared`, delIdList)
    }

    return {
      clearHistory,
      setHttpHistoryWrap,
      createHttpHistory,
      createBodyPath,
      getHistory,
      getHistoryList,
      ignoreHttpHistory,
    }

  }

  function clientInjection() { // 到客户端前的数据注入, 例如 添加测试 api, 统一处理数据格式
    function setHeader(reqOrRes, headerObj = {}) {
      reqOrRes.setHeader = reqOrRes.setHeader || reqOrRes.set || function (key, val) {reqOrRes.headers[key] = val}
      Object.keys(headerObj).forEach(key => {
        const val = headerObj[key]
        val && reqOrRes.setHeader(key, val)
      })
    }

    function allowCors({res, req, proxyConfig = {}, next}) { // 设置为允许跨域
      const target = proxyConfig.target || global.config._proxyTargetInfo.origin // 自定义代理时应使用 proxyConfig.target 中的 host
      if(global.config.cors === false) { // config.cors 为 false 时, 则不允许跨域
        return false
      }
      /**
       * 这可能是服务器需要的信息
       * 因为一些服务器会校验 req 中的 referer referrer origin host
       */
      if(req) {
        setHeader(req, {
          'referer': target, // referer 实际上是 "referrer" 误拼写
          'referrer': target,
          'origin': target, // 不应包含任何路径信息
          'host': (new URL(target)).host,
        })
      }
      /**
       * 这是浏览器需要的跨域信息
       */
      if(res && (res.headersSent === false)) {
        const rawHeadersObj = req.rawHeaders.reduce((acc, cur, index) => {
         /**
          * req.rawHeaders: [key, val, key, val, ...]
          * 当遍历到奇数时, 也就是当前是 value 时, value 前面的值则是 key
          */
         if(index % 2) {
           const key = req.rawHeaders[index - 1].toLowerCase()
           const val = req.rawHeaders[index]
           acc[key] = val
         }
         return acc
       }, req.headers)
        setHeader(res, {
          'access-control-allow-headers': rawHeadersObj[`access-control-request-headers`],
          'access-control-allow-methods': rawHeadersObj[`access-control-request-method`],
          'access-control-allow-credentials': `true`, // 当为 true 时 origin 不能为 *, 不过我们并没有优先使用 *
          'access-control-allow-origin': rawHeadersObj[`origin`] || `*`,
          // 'access-control-max-age': undefined,
          // 'access-control-expose-headers': undefined,
        })
        if(req.method.toLowerCase() === `options`) {
          res.sendStatus(200)
        } else {
          next && next()
        }
      }
    }

    function reSetApiInHeader({headers}) { // 根据当前配置刷新 testApi
      // 更新 x-test-api, 因为如果 httpData 移动到其他设备时, ip 会改变, 所以应更新为当前 ip
      const store = tool.file.fileStore(global.config._store)
      const note = store.get(`note`)
      const apiInHeader = global.config.apiInHeader
      const testUrl = (headers[apiInHeader] || ``).replace(/(.+?)(\/#\/.*)/, `${note.local.testPort}$2`)
      const testUrlRemote = global.config.remote
        ? (headers[apiInHeader + `-remote`] || ``).replace(/(.+?)(\/#\/.*)/, `${note.remote.testPort}$2`)
        : undefined
      const obj = tool.obj.removeEmpty({
        [apiInHeader]: testUrl,
        [apiInHeader + `-remote`]: testUrlRemote,
      })
      obj[`Access-Control-Expose-Headers`] = Object.keys(obj).join(`,`)
      return obj
    }

    function setApiInHeader({req, res}) { // 设置 testApi 页面到 headers 中
      const store = tool.file.fileStore(global.config._store)
      const note = store.get(`note`)
      const apiCount = store.get(`apiCount`) + 1
      const apiId = tool.hex.string10to62(apiCount)
      const testPath = `/#/history,${apiId}/${req.method.toLowerCase()}${req.originalUrl}`
      const testApi = `${note.local.testPort}${testPath}`
      const testApiRemote = (global.config.remote && note.remote) ? `${note.remote.testPort}${testPath}` : undefined
      setHeader(res, {
        [global.config.apiInHeader]: testApi,
        [global.config.apiInHeader + `-remote`]: testApiRemote,
      })
    }

    return {
      setHeader,
      allowCors,
      setApiInHeader,
      reSetApiInHeader,
    }
  }

  function reqHandle() { // 请求处理程序
    function sendReq({getHistory, api, res, apiId}) { // 发送请求
      const fs = require(`fs`)

      // api httpHistory 中的 api
      // console.log(`httpHistory[api]`, httpHistory[api])
      const getHistoryData = getHistory({fullApi: api, id: apiId}).data
      if(getHistoryData === undefined) {
        res.status(404).send({
          success: false,
          msg: `不存在记录 ${api}`,
        })
        return false
      }
      const httpDataReq = getHistoryData.req
      let {line: {path, query, params}, headers} = httpDataReq.lineHeaders
      headers = headers || require(require(`path`).resolve(httpDataReq.lineHeaders.headPath))
      const [, method, url] = api.match(/(\w+)\s+(.*)/)
      reqHandle().injectionReq({req: { headers }, res, type: `set`})
      const pathOrUrl = path || url
      http({
        baseURL: `http://localhost:${global.config.port}`,
        method,
        url: pathOrUrl, // 注意不要 url 和 params 上都同时存在 query
        params: query,
        headers,
        data: method.toLowerCase() === `get`
          ? undefined 
          : (httpDataReq.bodyPath ? fs.readFileSync(httpDataReq.bodyPath) : {}),
        responseType: `arraybuffer`,
        _getRaw: true,
      }).then(aRes => {
        const {status, statusText } = aRes
        res.send({
          success: true,
          msg: `${status} ${statusText}`,
          config: aRes.config,
        })
      }).catch(err => {
        print(`err`, `Internal request failed`, pathOrUrl)
        let msg = ``
        if(err.response) {
          const {status, statusText} = err.response
          msg = `${status} ${statusText}`
        } else {
          msg = err.toString()
        }
        res.send({
          success: false,
          msg,
          config: err.config,
        })
      })
    }

    /**
     * 从上一次请求中获取指定数据放入到测试请求中
     * @param {*} param0 
     */
    function injectionReq(arg) {
      if(Boolean(global.config.updateToken) === false) {
        return undefined
      }
      const {req, res, type} = arg
      if(type === `get`) {
        new Promise(() => {
          const updateToken = global.STORE.get(`updateToken`)
          Object.entries(global.config.updateToken).forEach(([formKey, toKey]) => {
            const fn = {
              string: () => {
                const prev = tool.obj.deepGet(arg, formKey)
                ;(prev !== undefined) && (updateToken[toKey] = prev)
              },
              function: () => {
                const prev = tool.obj.deepGet(arg, formKey)
                const [key, value] = toKey({req, value: prev}) || []
                ;(value !== undefined) && (updateToken[key] = value)
              },
            }[tool.type.isType(toKey)]
            fn && fn()
          })
          global.STORE.set(`updateToken`, updateToken)
        })
      }
      if(type === `set`) {
        Object.entries(global.STORE.get(`updateToken`)).forEach(([key, value]) => {
          tool.obj.deepSet(arg, key, value)
        })
      }
    }

    return {
      injectionReq,
      sendReq,
    }

  }

  function plugin() {
    /**
     * 运行多个 nginx 实例并获取他们的 url
     * @param {*} param0.serverList 服务列表, 例 {name: `web`, config: {addr: 8080}}
     */
    async function runNgrok({serverList, shareConfig}) {
      // 不再使用 NGROK_CDN_URL, 因为它不稳定
      await tool.generate.initPackge(`ngrok`, {getRequire: false})
      const path = require(`path`)
      const mainPath = path.join(__dirname, `../`) // 主程序目录
      const yaml = await tool.generate.initPackge(`yaml`)
      const getPort = await tool.generate.initPackge(`get-port`)
      const spawn = tool.cli.spawn
      const fs = require(`fs`)

      // ngrok 要求强制要求未注册用户使用最新版本
      await spawn(
        `npx`, `ngrok update`.split(/\s+/),
        {
          // stdio: [0, `pipe`, 2],
          cwd: mainPath,
        },
      )

      // 获取未占用的 tcp 端口, 用于 ngrok 的 web_addr, 会生成一个 api 供我们调用
      const portList = await Promise.all([4040, 4041, 4042].map(item => getPort(item) )).catch(err => console.log(`err`, err))

      // 使用这些端口以及用户配置生成 ngrok yaml 格式的配置文件
      portList.forEach((freePort, index) => {
        const {name, config} = serverList[index]
        const authtoken = shareConfig.remoteToken[{
          port: 0,
          testPort: 1,
          replayPort: 2,
        }[name]]
        const json = {
          authtoken,
          web_addr: `localhost:${freePort}`,
          tunnels: {
            [name]: { // 服务名称
              proto: `http`,
              ...config,
            },
          },
        }

        // 存储 nginx 配置文件, 然后让 ngrok 读取它们
        const yamlStr = yaml.stringify(json)
        // todo 注意 configPath 路径中暂不支持空格
        // fix: configPath 添加引号在 mac 上会出现 configPath=mainPath+configPath 拼接的现象
        const configPath = require(`path`).normalize(`${require(`os`).tmpdir()}/ngrok_${freePort}.yaml`)
        fs.writeFileSync(configPath, yamlStr)
        spawn( // 使用配置文件运行 ngrok
          `npx`, `ngrok start --config ${configPath} ${name}`.split(/\s+/),
          {
            stdio: [0, `pipe`, 2],
            cwd: mainPath,
          },
        )
      })

      // 收集启动 nginx 之后的公网 url
      const urlList = []
      await Promise.all(portList.map((item, index) => {
        return tool.control.awaitTrue({
          timeout: 30e3,
          condition: () => { // 等待 /api/tunnels 接口返回所需的 url
            return new Promise(async resolve => {
              const res = await http.get(`http://localhost:${item}/api/tunnels`).catch((err = {}) => {
                tool.cli.onlyLine(err.message)
                resolve(false)
              })
              if(res && res.tunnels) {
                const tunnels = res.tunnels
                const hasUrl = tunnels.length > 0
                if(hasUrl) {
                  urlList[index] = tunnels[0].public_url
                }
                resolve(hasUrl)
              }
            })
          },
        })
      })).catch(err => console.log(`err`, err))
      return urlList
    }

    /**
     * 显示本地服务信息
     * @param {*} param0
     */
    function showLocalInfo({store, shareConfig}) {
      const msg = tool.string.removeLeft(`
        Current configuration file:
        ${shareConfig.config}
      
        Local service information:
        Interface forwarding: ${`http://${shareConfig.osIp}:${shareConfig.port}/ => ${shareConfig._proxyTargetInfo.origin}`}
        Interface list:       ${`http://${shareConfig.osIp}:${shareConfig.testPort}/#/apiStudio/`}
      `)
      print(tool.cli.colors.green(msg))
    }

    /**
     * 启动和显示远程服务信息
     * @param {*} param0
     */
    async function remoteServer({store, shareConfig}) {
      print(`Remote service loading...`)
      /**
       * 当存在 https 端口时, 直接使用它来进行外网映射
       * 假设使用原 http 来映射的话, 我们并不知道转发到什么 https 上, 因为 https 没有映射, 所以干脆直接使用 https 来映射
       * 另外, ngrok 无 token 时不允许响应 content-type/html, 但默认 301 响应返回的就是 html, 这虽然可以使用 content-type/json 来绕过, 但可能并不规范
       */
      const serverList = [
        `port`,
        `replayPort`,
        `testPort`,
      ].map(name => ({
        name,
        config: {
          proto: `http`,
          addr: shareConfig.https[name] || shareConfig[name],
          ...shareConfig.remote[name],
        },
      }))
      const urlList = await runNgrok({serverList, shareConfig}).catch(err => console.log(`err`, err))
      print(`The remote service is loaded.`)
      serverList.forEach((item, index) => {
        store.set(`note.remote.${item.name}`, urlList[index])
        const msg = [
          `Interface forwarding: ${store.get(`note.remote.${item.name}`) || ``} => http://${shareConfig.osIp}:${shareConfig.port}/`,
          ``,
          `Interface list:       ${store.get(`note.remote.${item.name}`) || ``}/#/apiStudio/ => http://${shareConfig.osIp}:${shareConfig.testPort}/#/apiStudio/`,
        ][index]
        msg && print(tool.cli.colors.green(msg))
      })
      
    }

    return {
      runNgrok,
      showLocalInfo,
      remoteServer,
    }

  }

  function getProxyConfig (userConfig = {}) {
    const allowCors = clientInjection().allowCors
    const setHttpHistoryWrap = historyHandle().setHttpHistoryWrap
    const rootTarget = global.config._proxyTargetInfo.origin
    const defaultConfig = {
      ws: true,
      target: rootTarget,
      secure: false,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        allowCors({req: proxyReq, proxyConfig: userConfig})
        // middlewaresObj.logger(req, res, () => {})
        // middlewaresObj.jsonParser(req, res, () => {
        //   // if(ignoreHttpHistory({config, req}) === false) {
        //   //   // setHttpHistory(`${method} ${url}`, {req})
        //   // }
        // })
        reqHandle().injectionReq({req, res, type: `get`})

        // https://github.com/chimurai/http-proxy-middleware/pull/492
        require(`http-proxy-middleware`).fixRequestBody(proxyReq, req)
      },
      onProxyRes: (proxyRes, req, res) => {
        allowCors({res: proxyRes, req, proxyConfig: userConfig})
        setHttpHistoryWrap({
          req,
          res: proxyRes,
        })
      },
      logLevel: `silent`,
      // proxyTimeout: 60 * 1000,
      // timeout: 60 * 1000,
    }
    // 为了默认注入一些功能, 例如历史记录功能, 需要把用户添加的函数与程序中的函数合并
    Object.keys(defaultConfig).forEach(key => {
      const defaultVal = defaultConfig[key]
      if(typeof(defaultVal) === `function`) {
        const userVal = userConfig[key] || (() => undefined)
        userConfig[key] = (...arg) => {
          defaultVal(...arg)
          return userVal(...arg)
        }
      }
    })
    return {
      ...defaultConfig,
      ...userConfig,
    }
  }

  function build() {
    function getBuildStr(packageJson) {
      const buildInfo = packageJson.buildInfo
      if(buildInfo && buildInfo.hash) {
        return `${packageJson.version} => ${buildInfo.branch}/${buildInfo.hash.slice(0, 7)}`
      } else {
        return packageJson.version
      }
    }
    return {
      getBuildStr
    }
  }

  return {
    pluginRun,
    Side,
    getHttpServer,
    getProxyConfig,
    midResJson,
    url: url(),
    build: build(),
    middleware: middleware(),
    saveLog,
    listToData,
    reStartServer,
    wrapApiData,
    plugin,
    initHandle,
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
  }
}

module.exports = business()
