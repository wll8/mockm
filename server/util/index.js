const libObj = {
  fetch: require('node-fetch'),
  axios: require('axios'),
  mockjs: require('better-mock'),
  mime: require('mime'),
}

function tool() { // 与业务没有相关性, 可以脱离业务使用的工具函数
  function npm() { // npm 相关
    /**
    * 从 npmjs 检查依赖版本
    * @param {*} name 要检查更新的依赖名称
    * @param {object} param1 参数
    * @param {string} param1.version 指定版本
    * @param {array} param1.packagePath 指定路径
    */
    async function checkUpdate(name, {version, packagePath} = {}) {
      const hasFile = toolObj.file.hasFile
      function getLocalVersion(name) { // 从本地获取版本号
        packagePath = packagePath || require.main.paths.concat(`${require(`path`).parse(process.execPath).dir}/node_modules`) // 全局安装目录
          .find(path => hasFile(`${path}/${name}/package.json`))
        if(packagePath) {
          return require(`${packagePath}/${name}/package.json`).version // 从 package 中获取版本
        }
      }
      function getServerVersion(name) { // 从 npmjs 中获取版本号
        return new Promise((resolve, reject) => {
          const https = require('https');
          https.get(`https://registry.npmjs.org/${name}`, res => {
              let data = ''
              res.on('data', chunk => {
                data += chunk
              })
              res.on('end', () => {
                const latest = (JSON.parse(data)[`dist-tags`] || {}).latest // 获取最新版本
                resolve(latest)
              })
          }).on(`error`, (err) => {
            throw new Error(err.message)
          })
        })
      }
      const getLocalVersionRes = version || getLocalVersion(name)
      const getServerVersionRes = await getServerVersion(name)
      return {
        local: getLocalVersionRes,
        server: getServerVersionRes,
      }
    }

    return {
      checkUpdate,
    }
  }

  function control() { // 流程控制
    /**
    * 以 Promise 方式等待条件成立
    * @param {*} condition 条件函数, 返回 true 时才陈立
    * @param {*} ms 检测条件的实时间隔毫秒
    * @param {*} timeout 超时
    */
    function awaitTrue({
      condition,
      ms = 250,
      timeout = 5e3,
    }) {
      return new Promise(async (resolve, reject) => {
        let timeStart = Date.now()
        let res = await condition()
        while (res !== true) {
          res = await condition()
          if(((Date.now() - timeStart) > timeout)) { // 超时
            reject(false)
          }
          await sleep(ms)
        }
        resolve(res)
      })
    }

    /**
     * 异步等待 sleep
     * @param {*} ms 毫秒
     */
    function sleep(ms = 1e3) { // 异步 sleep
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    return {
      awaitTrue,
      sleep,
    }

  }

  function cache() { // 缓存处理程序
    function delRequireCache(filePath) {
      delete require.cache[require.resolve(filePath)]
    }
    return {
      delRequireCache,
    }
  }

  function generate() { // 生成器
    /**
     * 如果某个依赖不存在, 则安装它
     * @param {*} packge 依赖名称
     * @param {*} version 版本, 如果不填则从 packageJson.pluginDependencies 中获取
     */
    async function initPackge(packge, {version, getRequire = true} = {}) {
      try {
        const path = require(`path`)
        const mainPath = path.join(__dirname, '../') // 主程序目录
        const packageJson =  require(`${mainPath}/package.json`)
        version = version || packageJson.pluginDependencies[packge]
        const packgePath =  `${mainPath}/node_modules/${packge}`
        const hasPackge = toolObj.file.hasFile(packgePath)
        if(hasPackge === false) { // 如果 ngrok 不存在, 则安装它
          await cli().spawn(
            `npx`, `cnpm i ${packge}@${version} --no-save`.split(/\s+/),
            {cwd: mainPath}
          )
        }
        return getRequire ? require(packge) : undefined
      } catch (err) {
        console.log(`err`, err)
      }
    }

    function nextId() { // 获取全局自增 id
      global.id = (global.id || 0) + Date.now() + 1
      return global.id
    }
    return {
      initPackge,
      nextId,
    }
  }

  function hex() { // 进制转换
    function string10to62(number) { // 10 进制转 62 进制, 用来压缩数字长度
      const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('')
      const radix = chars.length
      const arr = []
      let qutient = +number
      do {
        const mod = qutient % radix;
        qutient = (qutient - mod) / radix;
        arr.unshift(chars[mod]);
      } while (qutient);
      return arr.join('');
    }

    function string62to10(str) { // 62 进制转 10 进制
      str = String(str)
      const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'
      const radix = chars.length
      const len = str.length
      let origin_number = 0
      let i = 0
      while (i < len) {
        origin_number += Math.pow(radix, i++) * chars.indexOf(str.charAt(len - i) || 0);
      }
      return origin_number;
    }

    return {
      string10to62,
      string62to10,
    }

  }

  function cli() { // 命令行相关处理程序
    /**
    * 自定义控制台颜色
    * https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    * nodejs 内置颜色: https://nodejs.org/api/util.html#util_foreground_colors
    */
    function colors () {
      const util = require('util')

      function colorize (color, text) {
        const codes = util.inspect.colors[color]
        return `\x1b[${codes[0]}m${text}\x1b[${codes[1]}m`
      }

      let returnValue = {}
      Object.keys(util.inspect.colors).forEach((color) => {
        returnValue[color] = (text) => colorize(color, text)
      })
      // 取消下行注释, 查看所有的颜色和名字:
      // Object.keys(returnValue).forEach((color) => console.log(returnValue[color](color)))
      return returnValue
    }

    /**
     * 以 Promise 方式运行 spawn
     * @param {*} cmd 主程序
     * @param {*} args 程序参数数组
     * @param {*} opts spawn 选项
     */
    function spawn (cmd, args, opts) {
      opts = { stdio: `inherit`, ...opts }
      opts.shell = opts.shell || process.platform === 'win32'
      return new Promise((resolve, reject) => {
        const cp = require('child_process')
        const child = cp.spawn(cmd, args, opts)
        let stdout = ''
        let stderr = ''
        child.stdout && child.stdout.on('data', d => { stdout += d })
        child.stderr && child.stderr.on('data', d => { stderr += d })
        child.on('error', reject)
        child.on('close', code => {
          resolve({code, stdout, stderr})
        })
      })
    }

    function parseArgv(arr) { // 解析命令行参数
      return (arr || process.argv.slice(2)).reduce((acc, arg) => {
        let [k, ...v] = arg.split('=')
        v = v.join(`=`) // 把带有 = 的值合并为字符串
        acc[k] = v === '' // 没有值时, 则表示为 true
          ? true
          : (
            /^(true|false)$/.test(v) // 转换指明的 true/false
            ? v === 'true'
            : (
              /[\d|\.]+/.test(v)
              ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
              : v
            )
          )
        return acc
      }, {})
    }

    /**
     * 从 curl 命令中解析 request 库的 options 参数
     * @param {string} cmd // curl/bash 命令
     */
    async function getOptions(cmd) {
      var options = {} // 注意: options 的内容从 eval(optionStr) 中得到
      const curlconverter = await toolObj.generate.initPackge(`curlconverter`)
      const requestStr = curlconverter.toNode(cmd)
      const optionStr = requestStr.match(/^var request = require[\s\S].*;([\s\S]*)^function callback([\s\S]*)/m)[1] // 只取出 options 相关的代码
      eval(optionStr)
      return options
    }
    return {
      spawn,
      parseArgv,
      getOptions,
      colors: colors(),
    }
  }

  function url() { // url 处理程序
    /**
     * 根据 pathname 返回最匹配的 url
     * @param {*} param0.urlList url 列表
     * @param {*} param0.pathname pathname
     */
    function findLikeUrl({
      urlList,
      pathname
    }) {
      const apiSplitList = new URL(`http://127.0.0.1${pathname}`).pathname.split(`/`)
      const lvList = urlList.map((openApiItem) => {
        const openApiSplitList = new URL(openApiItem).pathname.split(`/`)
        const lv = apiSplitList.reduce((acc, apiSplitListItem, apiSplitListItemIndex) => {
          return acc + (apiSplitListItem === openApiSplitList[apiSplitListItemIndex] ? 1 : 0)
        }, 0)
        return lv
      })

      function findMaxIndex(arr) { // 查找数组中最大的数的索引
        const sortRes = [...arr].sort((a, b) => a - b)
        return arr.findIndex((item) => item === sortRes[arr.length - 1])
      }
      const maxIndex = findMaxIndex(lvList)
      return urlList[maxIndex]
    }

    function prepareProxy (proxy = {}) { // 解析 proxy 参数, proxy: string, object
      const pathToRegexp = require('path-to-regexp')
      const isType = type().isType
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
          options = {
            pathRewrite: { [`^${context}`]: options }, // 原样代理 /a 到 /a
            target: proxy[`/`],
          }
        }
        if(optionsType === `array`) { // 是数组时, 视为设计 res body 的值, 语法为: [k, v]
          const [item1, item2] = options
          const item1Type = isType(item1)
          const midResJson = httpClient().midResJson
          const deepMergeObject = obj().deepMergeObject

          if(options.length <= 1) { // 只有0个或一个项, 直接替换 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: () => item1})
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
          pathname: parentUrl.pathname.replace(/\/$/, '') + '/',
          origin: parentUrl.origin,
          isIp: parentUrl.host.match(/\./g).length === 3,
        }
        return res
      } catch (error) {
        console.error(`请正确填写 proxy 参数`, error)
        process.exit()
      }
    }

    function fullApi2Obj(api) {
      let [, method, url] = api.match(/(\S+)\s+(.*)/) || [, `*`, api.trim()]
      if(method === `*`) {
        method = `all`
      }
      if((url === undefined) || (url === `/`)) {
        url = `*`
      }
      const {path} = toolObj.httpClient.getClientUrlAndPath(url)
      return {path, method, url}
    }

    /**
     * 处理命令行上传入的路径参数, 如果是相对路径, 则相对于运行命令的目录, 而不是相对于书写 require() 方法文件的目录
     * @param {*} pathStr 路径
     */
    function handlePathArg(pathStr) {
      const path = require(`path`)
      let newPathStr = path.isAbsolute(pathStr) ? pathStr : `${process.cwd()}/${pathStr}` // 如果是相对路径, 则相对于运行命令的位置
      newPathStr = path.normalize(newPathStr) // 转换为跨平台的路径
      return newPathStr
    }

    function parseRegPath(rePath, url) { // 使用 path-to-regexp 转换 express 的 router, 并解析参数为对象
      // 注: path-to-regexp 1.x 自带 match 方法可处理此方法, 但是当前的 json-server 依赖的 express 的路由语法仅支持 path-to-regexp@0.1.7
      // 所以只能手动转换, 参考: https://github.com/ForbesLindesay/express-route-tester/blob/f39c57fa660490e74b387ed67bf8f2b50ee3c27f/index.js#L96
      const pathToRegexp = require('path-to-regexp')
      const keys = []
      const re = pathToRegexp(rePath, keys)
      const pathUrl = url
      const result = re.exec(pathUrl)
      const obj = keys.reduce((acc, cur, index) => {
        acc[cur.name] = result[index + 1]
        return acc
      }, {})
      return obj
    }

    function parseUrlArgToObjList(urlArg){ // 转换 url 参数为对象数组
      const querystring = require(`querystring`)
      const obj = querystring.parse(urlArg) // <= urlArg
      const res = []
      if(typeof(obj.action) === `string`) {
        res.push(obj)
      } else {
        obj.action.forEach((item, index) => {
          res.push({action: obj.action[index], arg: obj.arg[index]})
        })
      }
      return res
    }

    return {
      findLikeUrl,
      prepareProxy,
      parseProxyTarget,
      fullApi2Obj,
      handlePathArg,
      parseRegPath,
      parseUrlArgToObjList,
    }
  }

  function file() { // 文件相关
    function fileStore(storePath, initValue = {}) { // 存取需要持久化存储的数据
      const fs = require(`fs`)
      const {
        o2s,
        deepSet,
        deepGet,
      } = obj()
      if(isFileEmpty(storePath)) {
        fs.writeFileSync(storePath, o2s(initValue))
      }
      let store = () => JSON.parse(fs.readFileSync(storePath, `utf-8`))
      return {
        set(key, val) {
          const newStore = store()
          deepSet(newStore, key, val)
          fs.writeFileSync(storePath, o2s(newStore))
          return store
        },
        get(key) {
          const newStore = store()
          return deepGet(newStore, key)
        },
        updateApiCount() {
          const apiCountOld =  this.get(`apiCount`) || 0
          this.set(`apiCount`, apiCountOld + 1)
          return this.get(`apiCount`)
        },
      }
    }

    function hasFile(filePath) { // 判断文件或目录是否存在
      const fs = require(`fs`)
      return fs.existsSync(filePath)
    }

    function isFileEmpty(file) { // 判断文件是否存或为空
      const fs = require(`fs`)
      return (
        (hasFile(file) === false)
        || fs.readFileSync(file, `utf-8`).trim() === ``
      )
    }

    return {
      fileStore,
      isFileEmpty,
      hasFile,
    }
  }

  function middleware() { // express 中间件
    const compression = require('compression') // 压缩 http 响应

    function httpLog({config}) { // 设置 http 请求日志中间件
      const morgan = require('morgan')
      const toolObj = tool()
      const {print} = require('./log.js')
      const colors = toolObj.cli.colors
      return morgan( (tokens, req, res) => {
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
          toolObj.time.dateFormat(`hh:mm:ss`, new Date),
          toolObj.httpClient.getClientIp(req),
          res.getHeader(config.apiInHeader),
          `${statusCode} ${res.statusMessage}`,
          `${tokens['response-time'](req, res)} ms`,
          len ? `${len} byte` : '',
        ].join(` `)
        // 使用原生 nodejs 打印日志
        print(colors[colorTable[statusCode[0]]](str)) // 根据状态码的第一位获取颜色函数
        return [] // return list.join(' ')
      })
    }

    function getJsonServerMiddlewares({config}) { // 获取 jsonServer 中的中间件
      // 利用 jsonServer 已有的中间件, 而不用额外的安装
      // 注意: 可能根据 jsonServer 版本的不同, 存在的中间件不同

      const jsonServer = require('json-server')
      const middlewares = jsonServer.defaults({bodyParser: true, logger: false}) // 可以直接使用的所有中间件数组
      middlewares.push(httpLog({config}))
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
      const rewrite = require('express-urlrewrite')
      Object.keys(routes).forEach(key => {
        app.use(rewrite(key, routes[key]))
      })
    }

    function replayHistoryMiddleware ({
      id,
      HTTPHISTORY,
      config,
    } = {}) {
      const {
        clientInjection,
        historyHandle,
      } = business()
      const {
        allowCors,
        setHeader,
        reSetApiInHeader,
      } = clientInjection({config})
      const {
        getHistory,
      } = historyHandle({config})
      return (req, res, next) => { // 修改分页参数, 符合项目中的参数
        const method = req.method.toLowerCase()
        const fullApi = id ? undefined :`${method} ${req.originalUrl}`
        HTTPHISTORY = HTTPHISTORY || require(config._httpHistory)
        const history = getHistory({history: HTTPHISTORY, id, fullApi, find: list => {
          const getStatus = (item) => {
            try {
              return item.data.res.lineHeaders.line.statusCode
            } catch (err) {
              console.log(`err`, err)
            }
          }
          const getStatusCodeItem = list => list.find(item => getStatus(item) === 200) // 查找 http 状态码为 200 的条目
          let getItemRes = undefined
          if(config.replayProxyFind) { // 先使用配置的 replayProxyFind 函数, 如果没有打到则使用普通状态码
            try {
              getItemRes = list.find((...arg) => config.replayProxyFind(...arg))
            } catch (error) {
              console.log(error)
            }
          }
          getItemRes = getItemRes || getStatusCodeItem(list) || list[0] || {} // 如果也没有找到状态码为 200 的, 则直接取第一条
          return getItemRes
        }}).data
        try {
          const lineHeaders = history.res.lineHeaders
          const headers = lineHeaders.headers
          setHeader(res, {
            ...headers, // 还原 headers
            ...reSetApiInHeader({headers}), // 更新 testApi
          })
          allowCors({res, req})
          const bodyPath = history.res.bodyPath
          if(bodyPath) {
            const path = require('path')
            const newPath = path.resolve(bodyPath) // 发送 body
            res.sendFile(newPath)
          } else {
            const {statusCode, statusMessage} = lineHeaders.line
            res.statusCode = statusCode
            res.statusMessage = statusMessage
            res.send()
          }
        } catch (err) {
          console.log(`err`, err)
          res.json(config.resHandleReplay({req, res}))
        }
      }
    }

    return {
      reWriteRouter,
      compression,
      httpLog,
      getJsonServerMiddlewares,
      replayHistoryMiddleware,
    }

  }

  function httpClient() {

    function midResJson({res, proxyRes, key, val, cb = body => body}) {
      const modifyResponse = require('node-http-proxy-json')
      modifyResponse(res, proxyRes, body => {
        body && key && obj().deepSet(body, key, val)
        return cb(body)
      })
    }

    function getClientUrlAndPath (originalUrl) { // 获取从客户端访问的 url 以及 path
      // 当重定向路由(mock api)时, req.originalUrl 和 req.url 不一致, req.originalUrl 为浏览器中访问的 url, 应该基于这个 url 获取 path
      return {
        url: originalUrl,
        path: (new URL(originalUrl, `http://127.0.0.1`)).pathname,
      }
    }

    function getClientIp (req) { // 获取客户端 IP
      let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
        req.ip ||
        req.connection.remoteAddress || // 判断 connection 的远程 IP
        req.socket.remoteAddress || // 判断后端的 socket 的 IP
        req.connection.socket.remoteAddress || ''
      if (ip.includes(',')) {
        ip = ip.split(',')[0]
      }
      ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length) // ::ffff:127.0.0.1 => 127.0.0.1
      return ip
    }

    return {
      midResJson,
      getClientUrlAndPath,
      getClientIp,
    }

  }

  function fn() { // 函数处理工具
    function emptyFn(f) {  // 把函数的参数 {}, [], null 转为默认值
      return (...a) => {
        return f(...a.map(
          v => {
            return (isEmpty(v) ? undefined : v)
          }
        ))
      }
    }
    return {
      emptyFn,
    }
  }

  function obj() { // 对象处理工具
    function flatObj(value, currentKey) { // 展开对象
      let result = {};
      Object.keys(value).forEach(key => {
        const tempKey = currentKey ? `${currentKey}.${key}` : key;
        if (typeof value[key] !== "object") {
          result[tempKey] = value[key];
        } else {
          result = { ...result, ...flatObj(value[key], tempKey) };
        }
      });
      return result;
    }

    function deepGet(object, keys = [], defaultValue) { // 深层获取对象值
      let res = (!Array.isArray(keys)
        ? keys
          .replace(/\[/g, '.')
          .replace(/\]/g, '')
          .split('.')
        : keys
      ).reduce((o, k) => (o || {})[k], object)
      return res !== undefined ? res : defaultValue
    }

    function deepMergeObject(originObj, adventObj) { // 深层合并对象
      const flatObjRes = flatObj(adventObj)
      Object.keys(flatObjRes).forEach(key => {
        deepSet(originObj, key, flatObjRes[key])
      })
      return originObj
    }

    function deepSet(object, keys, val) { // 深层设置对象值
      keys = Array.isArray(keys) ? keys : keys
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .split('.');
      if (keys.length > 1) {
        object[keys[0]] = object[keys[0]] || {}
        deepSet(object[keys[0]], keys.slice(1), val)
        return object
      }
      object[keys[0]] = val
      return object
    }

    function removeEmpty(obj) { // 删除对象中为空值的键
      obj = {...obj}
      Object.keys(obj).forEach(key => {
        if (type().isEmpty(obj[key])) {
          delete obj[key]
        }
      })
      return obj
    }

    function o2s(o) { // 对象转字符串
      return JSON.stringify(o, null, 2)
    }
    return {
      npm,
      deepMergeObject,
      flatObj,
      deepGet,
      deepSet,
      removeEmpty,
      o2s,
    }
  }

  function os() { // 系统工具
    /**
     *
     * @param {string} param0 动作, set, remove
     * @param {object} param1.ip 对应的 ip, 默认 127.0.0.1
     * @param {object} param1.hostname 对应的 hostname
     */
    async function sysHost(action, {ip = `127.0.0.1`, hostname}) {
      const hostile = await toolObj.generate.initPackge(`hostile`)
      return new Promise((resolve, reject) => {
        hostile[action](ip, hostname, err => {
          err ? reject(err) : resolve(true)
        })
      })
    }

    /**
     * 程序退出前清理工具
     * @param {object} param0.hostname 恢复 host 文件修改
     */
    function clearProcess({hostname} = {}) {
      function killProcess(...arg) {
        console.log(`err:`, ...arg)
        hostname ? sysHost(`remove`, {hostname}).finally(process.exit) : process.exit()
      }
      process.on(`SIGTERM`, killProcess)
      process.on(`SIGINT`, killProcess)
      process.on(`uncaughtException`, killProcess)
      process.on(`unhandledRejection`, killProcess)
    }

    function portIsOk (port) { // 判断端口是否可用
      if(typeof(port) === `object`) { // 判断多个端口
        return Promise.all(port.map(item => portIsOk(item)))
      }
      return new Promise(resolve => {
        const net = require('net')
        const server = net.createServer().listen(port)
        server.on('listening', () => server.close(resolve(true)))
        server.on('error', () => resolve(port))
      })
    }
    function getOsIp() { // 获取系统 ip
      const obj = require(`os`).networkInterfaces()
      const ip = Object.keys(obj).reduce((res, cur, index) => {
        return [...res, ...obj[cur]]
      }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
      return ip
    }
    return {
      clearProcess,
      sysHost,
      getOsIp,
      portIsOk,
    }
  }

  function type() { // 类型处理工具
    function isEmpty(value) { // 判断空值
      return (
        value === null
        || value === undefined // 避免存在 key 但未定义值
        || value === ``
        || typeof(value) === `object`
          && (
            value.length === 0
            || Object.keys(value).length === 0
          )
      )
    }
    function isType(data, type = undefined) { // 判断数据是否为 type, 或返回 type
      const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
      return type ? (dataType === type.toLowerCase()) : dataType
    }
    return {
      isEmpty,
      isType,
    }
  }

  function time() {
    /**
     * 时间格式化
     * @param {string} fmt 格式
     * @param {Date} date 时间对象
     */
    function dateFormat(fmt, date) {
      let ret
      const opt = {
        'Y+': date.getFullYear().toString(),        // 年
        'M+': (date.getMonth() + 1).toString(),     // 月
        'D+': date.getDate().toString(),            // 日
        'h+': date.getHours().toString(),           // 时
        'm+': date.getMinutes().toString(),         // 分
        's+': date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
      }
      for (let k in opt) {
        ret = new RegExp(`(${k})`).exec(fmt)
        if (ret) {
          fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')))
        }
      }
      return fmt
    }
    return {
      dateFormat,
    }
  }

  return {
    npm: npm(),
    control: control(),
    cache: cache(),
    generate: generate(),
    url: url(),
    file: file(),
    cli: cli(),
    hex: hex(),
    middleware: middleware(),
    httpClient: httpClient(),
    fn: fn(),
    obj: obj(),
    os: os(),
    type: type(),
    time: time(),
  }
}

function business() { // 与业务相关性较大的函数
  /**
   * 通过重新保存文件的方式触发 nodemon 的文件监听, 然后让服务重启
   */
  function reStartServer(filePath) {
    const fs = require(`fs`)
    const str = fs.readFileSync(filePath, `utf8`)
    fs.writeFileSync(filePath, str)
  }

  function wrapApiData({data, code}) { // 包裹 api 的返回值
    return {
      code,
      success: Boolean(('' + code).match(/^[2]/)), // 如果状态码以2开头则为 true
      data,
    }
  }

  /**
  * 把类似 schema 的列表转换为数据
  * @param {array} list 列表
  * @param {object} options 规则
  */
  function listToData(list, options = {}){
    const Mock = require('better-mock')
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
              }
            })
            example = vm.run(`module.exports = ${example}`, `vm.js`) || ``;
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
              break;
            case `array`:
              res[item.name] = res[item.name] || []
              res[item.name].push(listToDataRef(item.children))
              break;
            default:
              console.log(`no type`, item.type)
          }
        } else { // 如果不是引用类型, 则应用最后转换后的值 example
          res[`${item.name}#${item.type || 'string'}`] = example
        }
      })
      return res
    }
    let res = listToDataRef(list)
    res = {
      [`data${options.rule ? `|${options.rule}` : ''}`]: {object: res, array: [res]}[options.type]
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

  function apiWebHandle({config}) { // 处理 webApi 为 api
    const webApi = require(config.apiWeb).paths || {}
    const pathList = Object.keys(webApi).map(path => {
      return Object.keys(webApi[path]).map(method => ({
        key: `${method} ${path}`,
        path,
        method,
        ...webApi[path][method],
      }))
    }).flat()
    const apiObj = pathList.reduce((acc, cur, curIndex) => {
      return {
        ...acc,
        [cur.key]: (req, res, next) => {
          const {example = {}, table = []} = cur.responses[`200`]
          const {headers = {}, useDataType = `table`, custom, history, rule, type} = example
          if(useDataType === `table`) { // 使用表格中的数据
            try {
              const { setHeader } = clientInjection({config})
              setHeader(res, headers) // 设置自定义 header
              let data
              const listToDataRes = listToData(table, {rule, type})
              data = listToDataRes.data
              // 根据 apiWebWrap 处理数据
              if(config.apiWebWrap === true) {
                data = wrapApiData({data, code: 200})
              } else if(typeof(config.apiWebWrap) === `function`) {
                data = config.apiWebWrap({data, code: 200})
              }
              res.json(data)
            } catch (error) {
              res.status(500).json({msg: `转换错误: ${error.message}`})
            }
          }
          if (useDataType === `custom`) { // 自定义逻辑
            try {
              const { NodeVM } = require(`vm2`);
              const vm = new NodeVM({
                sandbox: { // 给 vm 使用的变量
                  tool: {
                    libObj,
                    wrapApiData,
                    listToData,
                    cur,
                  },
                }
              });
              const code = vm.run(`module.exports = ${custom}`, `vm.js`) || ``;
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
                msg: err.message
              })
            }
          }
          if (useDataType === `history`) { // 使用历史记录
            toolObj.middleware.replayHistoryMiddleware({
              id: history,
              config,
            })(req, res, next)
          }
        },
      }
    }, {})
    return apiObj
  }

  function customApi({api, db}) {
    /**
    * 自定义 api 处理程序, 包括配置中的用户自定义路由(config.api), 以及mock数据生成的路由(config.db)
    */

    function parseApi() { // 解析自定义 api
      const pathToRegexp = require('path-to-regexp')
      const serverRouterList = [] // server 可使用的路由列表
      Object.keys(api).forEach(key => {
        let {method, url} = toolObj.url.fullApi2Obj(key)
        let val = api[key]
        if(typeof(val) === `object`) { // 如果配置的值是对象, 那么直接把对象作为返回值, 注意, 读取一个文件也是对象
          const backVal = val
          val = (req, res, next) => res.json(backVal)
        }
        method = method.toLowerCase()
        const re = pathToRegexp(url)
        serverRouterList.push({method, router: url, action: val, re})
      })
      function noProxyTest({method, pathname}) {
        // return true 时不走真实服务器, 而是走自定义 api
        return serverRouterList.some(item => {
          // 当方法不同时才去匹配 url
          if(((item.method === `all`) || (item.method === method))) {
            return item.re.exec(pathname)
          } else {
            return false
          }
        })
      }
      return {
        serverRouterList,
        noProxyTest,
      }
    }

    function getDataRouter({method, pathname}) {
      /**
        给定一个 method 和 path, 根据 db.json 来判断是否应该过滤
        根据 db.json 获取要拦截的 route , 参考 node_modules/json-server/lib/server/router/index.js
      */
      const pathToRegexp = require('path-to-regexp')

      method = method.trim().toLowerCase()
      const isType = toolObj.type.isType
      const res = Object.keys(db).some(key => {
        const execPathname = pathToRegexp(`/${key}`).exec(pathname)
        const val = db[key]
        if (isType(val, `object`)) {
          return `get post put patch `.includes(`${method} `) && execPathname // 方法与路由匹配
        }
        if (isType(val, `array`)) {
          return (
            (`get post `.includes(`${method} `) && execPathname) // 获取所有或创建单条
            || (`get put patch delete `.includes(`${method} `) && pathToRegexp(`/${key}/:id`).exec(pathname)) // 处理针对于 id 单条数据的操作, 注意 id 的取值字段 foreignKeySuffix
          )
        }
      })
      return res
    }

    return {
      parseApi: parseApi(),
      getDataRouter,
    }

  }

  function initHandle() { // 初始化处理程序

    function getConfigFile() {
      const path = require(`path`)
      const fs = require(`fs`)
      const cliArg = toolObj.cli.parseArgv()
      const cwdConfigPath = `${process.cwd()}/mm.config.js`
      const hasCwdConfig = toolObj.file.hasFile(cwdConfigPath)
      let res = `${__dirname}/../config.js` // 默认配置文件
      if((cliArg.config === true) && (hasCwdConfig === false)) { // 如果 config=true 并且当前目录没有配置时, 则生成示例配置并使用
        const example = fs.readFileSync( `${__dirname}/../example.config.js`, `utf8`)
        fs.writeFileSync(cwdConfigPath, example)
        res = cwdConfigPath
      } else if((cliArg.config === true) && (hasCwdConfig === true)) { // 使用生成的示例配置
        res = cwdConfigPath
      } else if(typeof(cliArg.config) === `string`) { // 命令行上指定的 config 文件
        res = cliArg.config
      } else if(toolObj.file.hasFile(cwdConfigPath)) { // 命令运行位置下的配置
        res = cwdConfigPath
      }
      res = path.normalize(res)
      cliArg.config = res
      return res
    }

    function getOpenApi({openApi}) { // 使用服务器获取远程 openApi , 避免跨域
      const axios = require('axios')
      return new Promise((resolve, reject) => {
        axios.get(openApi, {}).then(res => {
          resolve(res.data)
        }).catch(err => {
          console.log(`err`, `openApi 获取失败`)
          reject(err.message)
        })
      })
    }

    function getDb({config}) { // 根据配置返回 db
      const fs = require(`fs`)
      const newDb = config.db()
      const o2s = toolObj.obj.o2s
      if(toolObj.file.isFileEmpty(config.dbJsonPath) || config.dbCover) { // 如果 db 文件为空或声明总是覆盖, 都重写整个文件
        fs.writeFileSync(config.dbJsonPath, o2s(newDb))
      }
      const oldDb = require(config.dbJsonPath)
      const resDb = {...newDb, ...oldDb}
      fs.writeFileSync(config.dbJsonPath, o2s(resDb)) // 更新 db 文件, 因为 jsonServer.router 需要用它来生成路由
      return resDb
    }

    function init({config}) { // 初始化, 例如创建所需文件, 以及格式化配置文件
      const fs = require(`fs`)
      const fileStore = toolObj.file.fileStore
      if(toolObj.file.hasFile(config.dataDir) === false) { // 如果没有目录则创建目录
        fs.mkdirSync(config.dataDir, {recursive: true})
      }
      fileStore(config._httpHistory)
      fileStore(config.apiWeb)

      { // 监听自定义目录更改后重启服务
        const nodemon = require(`nodemon`)
        toolObj.type.isEmpty(config.watch) === false && nodemon({
          exec: `node -e 0`, // 由于必须存在 exec 参数, 所以放置一条啥也不干的命令
          watch: config.watch,
        }).on('restart', () => {
          reStartServer(config.config)
        })
      }

      { // 初始化 store 中的内容
        const osIp = config.osIp
        const store = fileStore(config._store, {
          apiCount: 0,
          note: {
            remote: {},
          },
        })
        // 需要每次根据 osIp 更新调试地址
        store.set(`note.local`, {
          port: `http://${osIp}:${config.port}`,
          replayPort: `http://${osIp}:${config.replayPort}`,
          testPort: `http://${osIp}:${config.testPort}`,
        })
      }
      fileStore(config._share, {config}).set(`config`, config)
      const db = getDb({config})
      const { setHeader, allowCors } = clientInjection({config})
      const run = {
        async curl({req, res, cmd}) { // cmd: curl/bash
          const options = await toolObj.cli.getOptions(cmd)
          return new Promise(async (resolve, reject) => {
            const request = await toolObj.generate.initPackge(`request`)
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
      const api = {
        ...business().apiWebHandle({config}),
        ...config.api({ // 向 config.api 暴露一些工具库
          run,
        }),
      }
      const apiRootInjection = api[`*`] || api[`/`] || function (req, res, next) {return next()} // 统一处理所有自定义的根级别拦截器
      // 移交给 apiRootInjection, 它表示所有【自定义api, config.api 和 config.db 产生的 api】前的拦截功能
      // 为什么要删掉?
      // 因为这是用于判断是否进入 proxy 的条件
      // 如果不删除会导致恒等匹配成功, 无法进入 proxy
      delete api[`/`]
      delete api[`*`]
      return {
        db,
        api,
        apiRootInjection,
      }

    }

    return {
      wrapApiData,
      getConfigFile,
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
     * @param {object} param0.history require(config._httpHistory)
     */
    function getRawHistory({history}) {
      let list = []
      list = Object.keys(history).reduce((acc, cur) => {
        return acc.concat(history[cur])
      }, [])
      return list
    }

    /**
     * 获取简要信息的 history 列表
     * @param {object} param0 参数对象
     * @param {object} param0.history require(config._httpHistory)
     * @param {string} param0.method 方法 - 可选
     * @param {id} param0.method 方法 - 可选
     * @param {string} param0.api api - 可选
     * @return {array} 数组
     */
    function getHistoryList({history, method: methodRef, api: apiRef} = {}) {
      const fs = require(`fs`)
      let list = getRawHistory({history})
      list = list.filter(item => item.data).map(({fullApi, id, data: {req, res}}) => {
        const {method, url} = toolObj.url.fullApi2Obj(fullApi)
        if(methodRef && apiRef) {
          if(((method === methodRef) && (url === apiRef)) === false) { // 如果没有找到就返回, 找到才进入数据处理
            return false
          }
        }
        const resBodySize = res.bodyPath ? fs.statSync(res.bodyPath).size : 0
        const reqBodySize = req.bodyPath ? fs.statSync(req.bodyPath).size : 0
        return {
          id,
          method,
          api: url,
          // fullApi,
          statusCode: res.lineHeaders.line.statusCode,
          contentType: res.lineHeaders.headers[`content-type`],
          extensionName: (res.bodyPath || '').replace(/(.*)(\.)/, ''),
          resBodySize,
          reqBodySize,
          date: res.lineHeaders.headers.date,
        }
      }).filter(item => item)
      return list
    }

    /**
     * 获取单条记录的 history
     * @param {object} param0 参数对象
     * @param {object} param0.history require(config._httpHistory)
     * @param {string} param0.fullApi `method api` 可选
     * @param {function} param0.find 自定义筛选逻辑
     * @return {object} 为空时返回空对象
     */
    function getHistory({history, fullApi, id, status, find}) { // 获取指定 fullApi/id 中的历史记录
      if(fullApi === undefined && id) {
        return getRawHistory({history}).find(item => item.id === id) || {}
      }
      const { path } = toolObj.url.fullApi2Obj(fullApi)
      const list = [...(history[path] || [])].reverse().filter(item => ( // 传入 id 时比较 id
        (id === undefined ? true : (item.id === id))
        && (item.fullApi === fullApi)
      ))
      const res = find ? find(list) : list[0] || {}
      return res
    }

    function ignoreHttpHistory({config, req}) { // 是否应该记录 req
      const {method, url} = req
      return Boolean(
        method.match(/OPTIONS/i)
        || (
          method.match(/GET/i) && url.match(new RegExp(`/\/${config._proxyTargetInfo.pathname}\//`))
        )
      )
    }

    function createBodyPath({config, req, headersObj, reqOrRes, apiId}) { // 根据 url 生成文件路径, reqOrRes: req, res
      const filenamify = require('filenamify')
      const fs = require(`fs`)
      const mime = require('mime')
      const headers = headersObj[reqOrRes]
      const contentType = headers[`content-type`]
      const extensionName = mime.getExtension(contentType) || ``
      const {url, path} = toolObj.httpClient.getClientUrlAndPath(req.originalUrl)
      let {
        method,
      } = req
      method = method.toLowerCase()

      const newPath = () => {
        const osPath = require(`path`)
        const basePath = osPath.relative(process.cwd(), config.dataDir) + `/request` // 获取相对路径下的 dataDir 目录
        const apiDir =  osPath.normalize(`./${basePath}/${path}`).replace(/\\/g, `/`) // 以 path 创建目录, 生成相对路径以避免移动 dataDir 后无法使用
        if(toolObj.file.hasFile(apiDir) === false) { // 如果不存在此目录则进行创建
          fs.mkdirSync(apiDir, { recursive: true })
        }
        let shortUrl = url.indexOf(path) === 0 ? url.replace(path, ``) : url // 为了节约目录长度删除 url 中的 path 部分, 因为 pathDir 已经是 path 的表示
        shortUrl = shortUrl.slice(1, 100)
        const filePath = `${apiDir}/${
          filenamify(
            `${shortUrl}_${method}_${apiId}_${reqOrRes}.${extensionName}`,
            {maxLength: 255, replacement: '_'}
          )
        }`
        // 如果 filePath 已存在于记录中, 则使用新的
        return filePath
      }

      // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
      let bodyPath = newPath()
      return bodyPath
    }

    function createHttpHistory({config, history, dataDir, buffer, req, res}) {
      const fs = require(`fs`)
      let {
        method,
      } = req
      method = method.toLowerCase()
      const {url, path} = toolObj.httpClient.getClientUrlAndPath(req.originalUrl)
      const headersObj = {req: req.headers || req.getHeaders(), res: res.headers || res.getHeaders()}
      headersObj.res.date = headersObj.res.date || (new Date()).toGMTString() // 居然没有 date ?
      const {statusCode, statusMessage, headers} = res
      const fullApi = `${method} ${url}`
      const reqBody = req.body

      // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

      const apiCount = toolObj.file.fileStore(config._store).updateApiCount()
      const apiId = toolObj.hex.string10to62(apiCount)
      function getBodyPath() {
        const arg = {config, req, headersObj, dataDir, apiId}
        return {
          bodyPathReq: toolObj.type.isEmpty(reqBody) === false ? createBodyPath({...arg ,reqOrRes: `req`}) : undefined,
          bodyPathRes: toolObj.type.isEmpty(buffer) === false ? createBodyPath({...arg ,reqOrRes: `res`}) : undefined,
        }
      }
      const {bodyPathReq, bodyPathRes} = getBodyPath()
      bodyPathReq && fs.writeFileSync(bodyPathReq, JSON.stringify(reqBody), {encoding: 'utf8'})
      bodyPathRes && fs.writeFileSync(bodyPathRes, buffer, {encoding: 'buffer'})
      const resDataObj = {
        req: {
          lineHeaders: {
            line: toolObj.obj.removeEmpty({
              method,
              url,
              path,
              query: req.query,
              params: req.params,
              version: req.httpVersion,
            }),
            headers: headersObj.req,
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
            headers: headersObj.res,
            // _header: res._header,
          },
          // body: null,
          bodyPath: bodyPathRes,
        },
      }
      setHttpHistory({
        config,
        data: {path, fullApi, id: apiId, data: resDataObj},
        history,
      })
    }

    function setHttpHistory({config, data, history}) {
      const fs = require(`fs`)
      const {path} = data
      history[path] = (history[path] || []).concat(data)
      fs.writeFileSync(config._httpHistory, toolObj.obj.o2s(history))
    }

    function setHttpHistoryWrap({config, history, req, res, mock = false, buffer}) { // 从 req, res 记录 history
      if(ignoreHttpHistory({config, req}) === false) {
        const data = [];
        const arg = {
          config,
          history,
          buffer,
          req,
          res,
        }
        clientInjection({config}).setApiInHeader({req, res})
        if(mock === true) {
          createHttpHistory(arg)
          return false
        } else {
          res.on('data', function(chunk) {
            data.push(chunk)
          })
          req.on('close', function() {
            const buffer = Buffer.concat(data)
            createHttpHistory({...arg, buffer})
          })
        }
      }
    }

    return {
      setHttpHistoryWrap,
      createHttpHistory,
      createBodyPath,
      getHistory,
      getHistoryList,
      ignoreHttpHistory,
    }

  }

  function clientInjection({config}) { // 到客户端前的数据注入, 例如 添加测试 api, 统一处理数据格式
    function setHeader(reqOrRes, headerObj = {}) {
      reqOrRes.setHeader = reqOrRes.setHeader || reqOrRes.set || function (key, val) {reqOrRes.headers[key] = val}
      Object.keys(headerObj).forEach(key => {
        const val = headerObj[key]
        val && reqOrRes.setHeader(key, val)
      })
    }

    function allowCors({res, req, proxyConfig = {}}) { // 设置为允许跨域
      const target = proxyConfig.target || config._proxyTargetInfo.origin // 自定义代理时应使用 proxyConfig.target 中的 host
      if(config.cors === false) { // config.cors 为 false 时, 则不允许跨域
        return false
      }
      res && setHeader(res, {
        'access-control-allow-origin': req.headers.origin || `*`
      })
      req && setHeader(req, { // 一些服务器会校验 req 中的 referer, host
        'referer': target,
        'host': (new URL(target)).host
      })
    }

    function reSetApiInHeader({headers}) { // 根据当前配置刷新 testApi
      // 更新 x-test-api, 因为如果 httpData 移动到其他设备时, ip 会改变, 所以应更新为当前 ip
      const store = toolObj.file.fileStore(config._store)
      const note = store.get(`note`)
      const apiInHeader = config.apiInHeader
      const testUrl = (headers[apiInHeader] || ``).replace(/(.+?)(\/#\/.*)/, `${note.local.testPort}$2`)
      const testUrlRemote = config.remote
        ? (headers[apiInHeader + `-remote`] || ``).replace(/(.+?)(\/#\/.*)/, `${note.remote.testPort}$2`)
        : undefined
      const obj = toolObj.obj.removeEmpty({
        [apiInHeader]: testUrl,
        [apiInHeader + `-remote`]: testUrlRemote,
      })
      obj[`Access-Control-Expose-Headers`] = Object.keys(obj).join(`,`)
      return obj
    }

    function setApiInHeader({req, res}) { // 设置 testApi 页面到 headers 中
      const store = toolObj.file.fileStore(config._store)
      const note = store.get(`note`)
      const apiCount = store.get(`apiCount`) + 1
      const apiId = toolObj.hex.string10to62(apiCount)
      const testPath = `/#/history,${apiId}/${req.method.toLowerCase()}${req.originalUrl}`
      const testApi = `${note.local.testPort}${testPath}`
      const testApiRemote = (config.remote && note.remote) ? `${note.remote.testPort}${testPath}` : undefined
      setHeader(res, {
        [config.apiInHeader]: testApi,
        [config.apiInHeader + `-remote`]: testApiRemote,
      })
    }

    return {
      setHeader,
      allowCors,
      setApiInHeader,
      reSetApiInHeader,
    }
  }

  function reqHandle({config}) { // 请求处理程序
    function sendReq({token, getHistory, history, api, cb, apiId}) { // 发送请求
      const axios = require('axios')
      const fs = require(`fs`)

      // api httpHistory 中的 api
      // console.log(`httpHistory[api]`, httpHistory[api])
      const httpDataReq = getHistory({history, fullApi: api, id: apiId}).data.req
      const {line: {path, query, params}, headers} = httpDataReq.lineHeaders
      const [, method, url] = api.match(/(\w+)\s+(.*)/)
      let resErr = {message: ``, config: {}}
      if(token && config.updateToken) { // 更新 TOKEN
        headers.authorization = token
      }
      const pathOrUrl = path || url
      axios({
        baseURL: `http://localhost:${config.port}`,
        method,
        url: pathOrUrl, // 注意不要 url 和 params 上都同时存在 query
        params: query,
        headers,
        data: httpDataReq.bodyPath ? fs.readFileSync(httpDataReq.bodyPath) : {},
        responseType: 'arraybuffer',
      }).then(res => {
        const {data, status, statusText, headers, config, request} = res
        resErr = {
          success: true,
          message: `${status} ${statusText}`,
          config: res.config,
        }
      }).catch(err => {
        console.log(`err`, `内部请求失败`, pathOrUrl)
        let message = ``
        if(err.response) {
          const {status, statusText} = err.response
          message = `${status} ${statusText}`
        } else {
          message = err.toString()
        }
        resErr = {
          success: false,
          message,
          config: err.config,
        }
      }).finally(() => {
        cb(resErr)
      })
    }

    return {
      sendReq,
    }

  }

  function plugin() {
    /**
     * 运行多个 nginx 实例并获取他们的 url
     * @param {*} param0.serverList 服务列表, 例 {name: `web`, config: {addr: 8080}}
     */
    async function runNgrok({serverList}) {
      await toolObj.generate.initPackge(`ngrok`, {getRequire: false})
      const path = require(`path`)
      const mainPath = path.join(__dirname, '../') // 主程序目录
      const yaml = await toolObj.generate.initPackge(`yaml`)
      const getPort = await toolObj.generate.initPackge(`get-port`)
      const spawn = toolObj.cli.spawn
      const fs = require(`fs`)

      // 获取未占用的 tcp 端口, 用于 ngrok 的 web_addr, 会生成一个 api 供我们调用
      const portList = await Promise.all([4040, 4041, 4042].map(item => getPort(item) )).catch(err => console.log(`err`, err))

      // 使用这些端口以及用户配置生成 ngrok yaml 格式的配置文件
      portList.forEach((freePort, index) => {
        const {name, config} = serverList[index]
        const json = {
          web_addr: `localhost:${freePort}`,
          tunnels: {
            [name]: { // 服务名称
              proto: `http`,
              ...config,
            },
          }
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
          }
        )
      })

      // 收集启动 nginx 之后的公网 url
      const urlList = []
      const axios = require(`axios`)
      await Promise.all(portList.map((item, index) => {
        return toolObj.control.awaitTrue({
          timeout: 30e3,
          condition: () => { // 等待 /api/tunnels 接口返回所需的 url
            return new Promise(async resolve => {
              const res = await axios.get(`http://localhost:${item}/api/tunnels`).catch(err => {
                console.log(`err`, err)
                resolve(false)
              })
              if(res) {
                const tunnels = res.data.tunnels
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
    function showLocalInfo({store, config}) {
      console.log(`
本地服务信息:
port: ${`http://${config.osIp}:${config.port}/`}
replayPort: ${`http://${config.osIp}:${config.replayPort}/`}
testPort: ${`http://${config.osIp}:${config.testPort}/`}
      `)
    }

    /**
     * 启动和显示远程服务信息
     * @param {*} param0
     */
    async function remoteServer({store, config}) {
      console.log(`远程服务加载中...`)
      const serverList = [
        `port`,
        `replayPort`,
        `testPort`,
      ].map(name => ({
        name,
        config: {
          proto: `http`,
          addr: config[name],
          ...config.remote[name],
        },
      }))
      const urlList = await runNgrok({serverList}).catch(err => console.log(`err`, err))
      serverList.forEach((item, index) => {
        store.set(`note.remote.${item.name}`, urlList[index])
      })
      console.log(`远程服务加载完成.`)
      console.log(`
远程服务信息:
port: ${store.get(`note.remote.port`) || ``}
replayPort: ${store.get(`note.remote.replayPort`) || ``}
testPort: ${store.get(`note.remote.testPort`) || ``}
      `)
    }

    return {
      runNgrok,
      showLocalInfo,
      remoteServer,
    }

  }

  return {
    listToData,
    reStartServer,
    wrapApiData,
    apiWebHandle,
    plugin,
    initHandle,
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
  }
}

const toolObj = tool()

module.exports = {
  libObj,
  toolObj,
  business,
}
