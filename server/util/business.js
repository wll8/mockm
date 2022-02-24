const lib = require(`./lib.js`)
const { print } = require(`./log.js`)
const tool = require(`./tool.js`)
const http = require(`./http.js`)

function business() { // 与业务相关性的函数
  /**
   * 保存日志
   */
  function saveLog({logStr, logPath}) {
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

  function staticHandle({config}) { // 处理 static 为 api, 实际上是转换为 use 中间件的形式
    let obj = {}
    config.static.map(item => {
      obj[`use ${item.path}`] = [
        async (req, res, next) => { // mode history
          if(item.mode === `history`) {
            await tool.generate.initPackge(`connect-history-api-fallback`)
            require(`connect-history-api-fallback`)(item.option)(req, res, next)
          } else {
            next()
          }
        },
        require(`serve-static`)(item.fileDir),
      ]
    })
    return obj
  }

  function apiWebHandle({config}) { // 处理 webApi 为 api
    const apiWebStore = tool.file.fileStore(config.apiWeb)
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
    const apiObj = pathList.reduce((acc, cur, curIndex) => {
      let fn = (req, res, next) => {
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
          tool.middleware.replayHistoryMiddleware({
            id: history,
            config,
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
      fn.type = `apiWeb`
      fn.description = cur.description
      fn.disable = disableApiList.includes(`/`)  // 如果含有根结点, 则表示全部禁用
        ? true
        : disableApiList.includes(cur.key)
      return {
        ...acc,
        [cur.key]: fn,
      }
    }, {})
    return apiObj
  }

  function customApi({api, db, config}) {
    /**
    * 自定义 api 处理程序, 包括配置中的用户自定义路由(config.api), 以及mock数据生成的路由(config.db)
    */

    function parseApi() { // 解析自定义 api
      const pathToRegexp = require(`path-to-regexp`)
      const serverRouterList = [] // server 可使用的路由列表
      Object.keys(api).forEach(key => {
        let {method, url} = tool.url.fullApi2Obj(key)
        method = method.toLowerCase()
        let val = api[key]
        if(method === `use`) { // 自定义中间件时不使用自动返回 json 的规则
          if([`function`, `array`].includes(tool.type.isType(val)) === false) { // use 支持单个和多个(数组)中间件
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
        const re = pathToRegexp(url)
        serverRouterList.push({method, router: url, action: val, re})
      })
      function noProxyTest({upgrade, method, pathname}) {
        // return true 时不走真实服务器, 而是走自定义 api
        return serverRouterList.some(item => {
          if (((item.method === `ws` ) && (method === `get` ))) { // ws 连接时, 实际上得到的 method 是 get, 并且 pathname + .websocket
            return (
              item.re.exec(pathname)
              && upgrade.match(/websocket/i)
              && Boolean(item.action.disable) === false
            )
          }
          if(item.method === `use`) {  // 当为中间件模式时, 匹配其后的任意路径
            return (
              pathname.startsWith(item.router)
              && Boolean(item.action.disable) === false
            )
          }
          // 当方法相同时才去匹配 url
          if(((item.method === `all`) || (item.method === method))) {
            return (
              item.re.exec(pathname) // 如果匹配到自定义的 api 则走自定义 api
              && Boolean(item.action.disable) === false // 如果自定义 api 为禁用状态, 则走真实服务器
            )
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

    function parseDbApi() {
      const isType = tool.type.isType
      let apiList = []
      Object.keys(db).forEach(key => {
        const val = db[key]
        if (isType(val, `object`)) {
          `get post put patch`.split(` `).forEach(method => {
            apiList.push({
              method,
              path: `/${key}`,
            })
          })
        }
        if (isType(val, `array`)) {
          `get post`.split(` `).forEach(method => {
            apiList.push({
              method,
              path: `/${key}`,
              type: `db`,
            })
          })
          ;`get put patch delete`.split(` `).forEach(method => {
            apiList.push({
              method,
              path: `/${key}/:id`,
              type: `db`,
            })
          })
          return apiList
        }
      })
      apiList = apiList.concat(Object.keys(config.route).map(key => {
        return {
          path: key,
          type: `route`,
        }
      }))
      return apiList
    }

    function getDataRouter({method, pathname}) {
      /**
        给定一个 method 和 path, 根据 db.json 来判断是否应该过滤
        根据 db.json 获取要拦截的 route , 参考 node_modules/json-server/lib/server/router/index.js
      */
      const pathToRegexp = require(`path-to-regexp`)

      method = method.trim().toLowerCase()
      const isType = tool.type.isType
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
      parseDbApi: parseDbApi(),
      getDataRouter,
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
      
      
      if((cliArg[`--config`] === true) && (hasCwdConfig === false)) { // 如果 config=true 并且当前目录没有配置时, 则生成示例配置并使用
        const example = fs.readFileSync( `${__dirname}/../example/full.mm.config.js`, `utf8`)
        fs.writeFileSync(cwdConfigPath, example)
        res = cwdConfigPath
      } else if((cliArg[`--config`] === true) && (hasCwdConfig === true)) { // 使用生成的示例配置
        res = cwdConfigPath
      } else if(typeof(cliArg[`--config`]) === `string`) { // 命令行上指定的 config 文件
        res = cliArg[`--config`]
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

    function getDb({config}) { // 根据配置返回 db
      const fs = require(`fs`)
      const newDb = config.db()
      const o2s = tool.obj.o2s
      if(tool.file.isFileEmpty(config.dbJsonPath) || config.dbCover) { // 如果 db 文件为空或声明总是覆盖, 都重写整个文件
        fs.writeFileSync(config.dbJsonPath, o2s(newDb))
      }
      const oldDb = require(config.dbJsonPath)
      const resDb = {...newDb, ...oldDb}
      fs.writeFileSync(config.dbJsonPath, o2s(resDb)) // 更新 db 文件, 因为 jsonServer.router 需要用它来生成路由
      return resDb
    }

    function init({config}) { // 初始化, 例如创建所需文件, 以及格式化配置文件
      const fs = require(`fs`)
      const fileStore = tool.file.fileStore
      if(tool.file.hasFile(config.dataDir) === false) { // 如果没有目录则创建目录
        fs.mkdirSync(config.dataDir, {recursive: true})
      }
      fileStore(config._httpHistory)
      fileStore(config.apiWeb, {
        paths: {},
        disable: [],
      })

      { // 监听自定义目录更改后重启服务
        const nodemon = require(`nodemon`)
        tool.type.isEmpty(config.watch) === false && nodemon({
          exec: `node -e 0`, // 由于必须存在 exec 参数, 所以放置一条啥也不干的命令
          watch: config.watch,
        }).on(`restart`, () => {
          reStartServer(config.config)
        })
      }

      { // 配置 httpData 目录中的 gitignore
        tool.file.isFileEmpty(config._gitIgnore.file)
        && fs.writeFile(
          config._gitIgnore.file,
          tool.string.removeLeft(config._gitIgnore.content).trim(),
          () => {},
        )
      }

      { // 初始化错误日志保存文件
        tool.file.isFileEmpty(config._errLog)
        && fs.writeFile(
          config._errLog,
          tool.string.removeLeft(`
          readme:
            - 本文件用于存储 mockm 运行过程中捕获到的一些错误.
          `).trim(),
          () => {},
        )
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

      { // 清理 history
        config.clearHistory && business().historyHandle().clearHistory(config)
      }

      { // 定时备份 openApi
        const openApiList = Boolean(config.backOpenApi) === false ? [] : config.openApi.map(item => item.spec)
        const backFn = () => {
          openApiList.forEach(item => {
            tool.file.backUrl(config._openApiHistoryDir, item, data => { // 格式化 openApi 后再保存, 避免压缩的内容不易比较变更
              return JSON.stringify(tool.obj.sortObj(JSON.parse(data)), null, 2) // 排序 obj, 因为 openApi 中的顺序不确定会导致变更过多
            })
          })
        }
        backFn()
        setInterval(backFn, config.backOpenApi * 60 * 1000)
      }

      fileStore(config._share, {config}).set(`config`, config)
      const db = getDb({config})
      const { setHeader, allowCors } = clientInjection({config})
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
      const api = {
        ...business().apiWebHandle({config}),
        ...config.api({ // 向 config.api 暴露一些工具库
          run,
        }),
        ...business().staticHandle({config}), // warn: use 放在后面其实是具有较低优先级
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

    function ignoreHttpHistory({config, req}) { // 是否应该记录 req
      const {method, url} = req
      return Boolean(
        method.match(/OPTIONS/i)
        || (
          method.match(/GET/i) && url.match(new RegExp(`//${config._proxyTargetInfo.pathname}//`))
        ),
      )
    }

    function createBodyPath({config, req, headersObj, reqOrRes, apiId, isHeader = false}) { // 根据 url 生成文件路径, reqOrRes: req, res
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
        const basePath = osPath.relative(process.cwd(), config._requestDir) // 获取相对路径下的 dataDir 目录
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

    function createHttpHistory({config, dataDir, buffer, req, res}) {
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

      const apiCount = tool.file.fileStore(config._store).updateApiCount()
      const apiId = tool.hex.string10to62(apiCount)
      function getBodyPath() {
        const arg = {config, req, headersObj, dataDir, apiId}
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
        config,
        data: {path, fullApi, id: apiId, data: resDataObj},
      })
    }

    function setHttpHistory({config, data}) {
      const history = global.HTTPHISTORY
      const fs = require(`fs`)
      const {path} = data
      history[path] = (history[path] || []).concat(data)
      fs.writeFileSync(config._httpHistory, tool.obj.o2s(history))
    }

    function setHttpHistoryWrap({config, req, res, mock = false, buffer}) { // 从 req, res 记录 history
      if(ignoreHttpHistory({config, req}) === false) {
        const data = []
        const arg = {
          config,
          buffer,
          req,
          res,
        }
        clientInjection({config}).setApiInHeader({req, res})
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

    function clearHistory(config) {
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

      global.HTTPHISTORY = require(config._httpHistory) // 请求历史
      const HTTPHISTORY = global.HTTPHISTORY
      let list = business().historyHandle().getHistoryList({md5: true})
      const delIdList = {
        function: config.clearHistory,
        object: list => getDelIdList(list, config.clearHistory),
        boolean: list => config.clearHistory ? getDelIdList(list) : [],
        undefined: () => [],
      }[tool.type.isType(config.clearHistory)](list)

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
      fs.writeFileSync(config._httpHistory, tool.obj.o2s(HTTPHISTORY))
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
        'access-control-allow-headers': req.headers[`access-control-allow-headers`],
        'access-control-allow-methods': req.method,
        'access-control-allow-credentials': `true`,
        'access-control-allow-origin': req.headers.origin || `*`,
        // 'access-control-max-age': undefined,
        // 'access-control-expose-headers': undefined,
      })
      req && setHeader(req, { // 一些服务器会校验 req 中的 referer referrer origin host
        'referer': target, // referer 实际上是 "referrer" 误拼写
        'referrer': target,
        'origin': target, // 不应包含任何路径信息
        'host': (new URL(target)).host,
      })
    }

    function reSetApiInHeader({headers}) { // 根据当前配置刷新 testApi
      // 更新 x-test-api, 因为如果 httpData 移动到其他设备时, ip 会改变, 所以应更新为当前 ip
      const store = tool.file.fileStore(config._store)
      const note = store.get(`note`)
      const apiInHeader = config.apiInHeader
      const testUrl = (headers[apiInHeader] || ``).replace(/(.+?)(\/#\/.*)/, `${note.local.testPort}$2`)
      const testUrlRemote = config.remote
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
      const store = tool.file.fileStore(config._store)
      const note = store.get(`note`)
      const apiCount = store.get(`apiCount`) + 1
      const apiId = tool.hex.string10to62(apiCount)
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
      reqHandle({config}).injectionReq({req: { headers }, res, type: `set`})
      const pathOrUrl = path || url
      http({
        baseURL: `http://localhost:${config.port}`,
        method,
        url: pathOrUrl, // 注意不要 url 和 params 上都同时存在 query
        params: query,
        headers,
        data: httpDataReq.bodyPath ? fs.readFileSync(httpDataReq.bodyPath) : {},
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
      if(Boolean(config.updateToken) === false) {
        return undefined
      }
      const {req, res, type} = arg
      if(type === `get`) {
        new Promise(() => {
          Object.entries(config.updateToken).forEach(([formKey, toKey]) => {
            const fn = {
              string: () => {
                const value = tool.obj.deepGet(arg, formKey)
                ;(value !== undefined) && (global.INJECTION_REQUEST[toKey] = value)
              },
              function: () => {
                const [key, value] = toKey({req}) || []
                ;(value !== undefined) && (global.INJECTION_REQUEST[key] = value)
              },
            }[tool.type.isType(toKey)]
            fn && fn()
          })
        })
      }
      if(type === `set`) {
        Object.entries(global.INJECTION_REQUEST).forEach(([key, value]) => {
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
    async function runNgrok({serverList}) {
      await tool.generate.initPackge(`ngrok`, {getRequire: false, env: {
        NGROK_CDN_URL: `https://cdn.jsdelivr.net/gh/wll8/static@1.0.2/bin.equinox.io/`,
      }})
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
        const json = {
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
    function showLocalInfo({store, config}) {
      const msg = tool.string.removeLeft(`
        Current configuration file:
        ${config.config}
      
        Local service information:
        Interface forwarding: ${`http://${config.osIp}:${config.port}/ => ${config._proxyTargetInfo.origin}`}
        Interface list:       ${`http://${config.osIp}:${config.testPort}/#/apiStudio/`}
      `)
      print(tool.cli.colors.green(msg))
    }

    /**
     * 启动和显示远程服务信息
     * @param {*} param0
     */
    async function remoteServer({store, config}) {
      print(`Remote service loading...`)
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
      print(`The remote service is loaded.`)
      const msg = tool.string.removeLeft(`
        Remote service information:
        Interface forwarding: ${store.get(`note.remote.port`) || ``} => http://${config.osIp}:${config.port}/
        Interface list:       ${store.get(`note.remote.testPort`) || ``}/#/apiStudio/ => http://${config.osIp}:${config.testPort}/#/apiStudio/
      `)
      print(tool.cli.colors.green(msg))
    }

    return {
      runNgrok,
      showLocalInfo,
      remoteServer,
    }

  }

  return {
    saveLog,
    listToData,
    reStartServer,
    wrapApiData,
    staticHandle,
    apiWebHandle,
    plugin,
    initHandle,
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
  }
}

module.exports = business()
