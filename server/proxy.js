const util = require(`./util/index.js`)
const { print } = require(`./util/log.js`)

async function serverProxy({
  api,
  db,
  apiRootInjection,
  config,
}) {
  const {
    tool,
    business,
  } = util
  const {
    middleware,
  } = tool
  const {
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
    saveLog,
  } = business
  const {
    allowCors,
  } = clientInjection({config})
  const {
    setHttpHistoryWrap,
    ignoreHttpHistory,
  } = historyHandle({config})
  const {
    middlewares,
    middlewaresObj,
  } = middleware.getJsonServerMiddlewares({config})
  const {
    parseApi: {
      noProxyTest,
      serverRouterList,
    },
    getDataRouter,
  } = customApi({api, db, config})

  const jsonServer = require(`json-server`)
  const proxy = require(`http-proxy-middleware`).createProxyMiddleware
  const server = jsonServer.create()
  const http = require(`http`)
  const serverRef = http.createServer(server)
  // 使用 upgrade 升级为 ws https://github.com/expressjs/express/issues/2594#issuecomment-103265227
  serverRef.on(`upgrade`, async (req, socket, upgradeHead) => {
    const ws = await tool.generate.initPackge(`ws`)
    const wss = new ws.Server({ noServer: true })
    const res = new http.ServerResponse(req)
    res.assignSocket(socket)
    res.websocket = (cb) => {
      let head = new Buffer.alloc(upgradeHead.length)
      upgradeHead.copy(head)
      wss.handleUpgrade(req, socket, head, (client) => {
        wss.emit(`connection`+req.url, client)
        wss.emit(`connection`, client)
        cb(client)
      })
    }
    // 捕获错误 ECONNRESET 错误 https://github.com/http-party/node-http-proxy/issues/1286#issuecomment-437672954
    socket.on(`error`, err => {
      print(err)
    })
    return server(req, res)
  })
  server.use((req, res, next) => {
    next()
  })
  middleware.reWriteRouter({app: server, routes: config.route})
  const router = jsonServer.router(config.dbJsonPath)
  server.use(middlewaresObj.corsMiddleware) // 当请求进入时即可允许跨域, 可能被后续 proxy 或中间件覆盖配置
  // disable = false 才走自定义 proxy
  config.disable === false && config.proxy.forEach(item => {
    if(item.context === `/` || config.hostMode) { // 过滤掉主 URL, 给后面的拦截器使用
      return false
    } else {
      // 在统一的中间件里判断经过 proxy 的路由是否也存在于自定义 api 中, 如果存在则不进入代理, 即当 proxy 和自定义 api 同时存在时, 后者优先
      // eslint-disable-next-line no-inner-declarations
      function midHandler(fn) {
        return (req, res, next) => {
          const hasFind = serverRouterList.filter(item => item.action.disable !== true).some(item => item.re.test(req.originalUrl))
          hasFind ? next() : fn(req, res, next)
        }
      }
      // 把代理路径 `/any` 变成 `/any/**` 的形式, 这样才能实现排除功能
      const key = `${item.context}${item.context.endsWith(`/`) ? `` : `/`}**`
      const mid = proxy([key], getProxyConfig(item.options))
      item.options.mid && server.use(item.context, midHandler(item.options.mid))
      server.use(item.context, midHandler(mid))
    }
  })
  server.use(proxy(
    (pathname, {method, headers: {upgrade = ``}}) => { // 返回 true 时进行转发, 真实服务器
      method = method.toLowerCase()
      if(
        (config.disable === false) // disable = false 才走自定义 api
        && (config.hostMode || noProxyTest({upgrade, method, pathname}) || getDataRouter({method, pathname, db}))
      ) {
        return false
      } else {
        return true
      }
    },
    {
      ...getProxyConfig(),
      target: config._proxyTargetInfo.origin,
    },
  ))

  server.use(middlewares) // 添加中间件, 方便取值 // todo 应删除未使用的中间件
  server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
    req.query.page && (req.query._page = req.query.page)
    req.query.pageSize && (req.query._limit = req.query.pageSize)
    next()
  })
  server.use((req, res, next) => { // 保存自定义接口的请求历史
    const cloneDeep = require(`lodash.clonedeep`)
    const newReq = cloneDeep(req) // 如果不 cloneDeep, 那么 req.body 到 send 回调中会被改变
    const oldSend = res.send
    res.send = (data = ``) => {
      let buffer =  undefined
      const dataType = tool.type.isType(data)
      if([`object`, `array`].includes(dataType)) {
        buffer = Buffer.from(tool.obj.o2s(data))
      }
      if([`string`].includes(dataType)) {
        buffer = Buffer.from(data)
      }
      res.send = oldSend
      setHttpHistoryWrap({
        config,
        req: newReq,
        res,
        mock: true,
        buffer,
      })
      return res.send(data)
    }
    next()
  })

  // 前端自行添加的测试 api
  server.use(apiRootInjection)

  for (let index = 0; index < serverRouterList.length; index++) {
    const {method, router, action} = serverRouterList[index]
    /**
      // todo
      目前测试 `server.use` 下来不能动态添加, 暂时不知道是 serve.use 本身的原因还是 serve-static 这个中间件的原因,
      例如以下代码没有按预期运行:
      预期的结果是访问 :/web/file.js 可以访问到文件
      实际表现为: 404, 虽然已经进入了此中间件.

      server.use((req, res, next) => { // use(`*`, `/`) 也是不行的, 也不是 async 的问题
        const action = require('serve-static')(`${__dirname}/public/`)
        action(req, res, next)
      })


      但是, 如果先指定了 `/web/`, 再访问 `:/web/file` 是可以使用的, 符合预期结果.

      server.use(`/web/`, (req, res, next) => {
        const action = require('serve-static')(`${__dirname}/public/`)
        action(req, res, next)
      })

      所以先使用启动程序就直接 use 的方案:
    */
    if(method === `use`) {
      server[method](router, action)
    }

  }

  server.use(async (req, res, next) => {
    reqHandle({config}).injectionReq({req, res, type: `get`})
    const pathToRegexp = require(`path-to-regexp`)
    const hasRouter = serverRouterList.some(item => {
      const {method, router, action} = item
      /**
        HTTP 1.1 中 upgrade 头用来表示升级协议
        https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Upgrade
      */
      const upgrade = req.headers.upgrade || ``
      const reqMethod = upgrade.match(/websocket/i) ? `ws` : req.method.toLowerCase()
      if( [`all`, reqMethod].includes(method) && pathToRegexp(router).exec(req.path)) {
        const handleFn = {
          /**
            // todo
            - 在 v2.0 中会统一中间件风格 (req, res, next) => {}
            - 这里是是为了修改为上个版本的形式 (ws, req) => {}
            - 参考: https://github.com/HenningM/express-ws
            - 参考: https://github.com/olalonde/express-websocket
          */
          ws: (req, res, next) => {
            res.websocket( (ws) => {
              try {
                action(ws, req)
              } catch (err) {
                print(err)
                res.status(500).send(String(err))
              }
            })
          },
        }[method]
        handleFn ? handleFn(req, res, next) : (() => {
          /**
            由于这里的接口实际都是通过 `app.use('*')` 过来的, 所以 req.params 参数并不存在.
            那么就需要我们自己去通过 config.api 中的 router 规则去解析得到 params
          */
          req.params = tool.url.parseRegPath(router, req.path)
          try {
            action(req, res, next)
          } catch (err) {
            print(err)
            res.status(500).send(String(err))
          }
        })()
        return true
      } else {
        return false
      }
    })
    if(hasRouter === false) { // 如果都没有找到则进入下一个中间件
      next()
    }
  })

  server.use(router) // 其他 use 需要在此行之前, 否则无法执行

  server.use((error, req, res, next) => {
    saveLog({logStr: error.stack, logPath: config._errLog})
    next(error)
  })

  serverRef.listen(config.port, () => {
    // console.log(`服务运行于: http://localhost:${config.port}/`)
  })

  router.render = (req, res) => { // 修改输出的数据, 符合项目格式
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
    res.json(config.resHandleJsonApi({req, res, data: returnData}))
  }

  function getProxyConfig (userConfig = {}) {
    const rootTarget = config.proxy.find(item => (item.context === `/`)).options.target
    const defaultConfig = {
      ws: true,
      target: rootTarget,
      secure: false,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        allowCors({req: proxyReq, proxyConfig: userConfig})
        middlewaresObj.logger(req, res, () => {})
        middlewaresObj.jsonParser(req, res, () => {
          if(ignoreHttpHistory({config, req}) === false) {
            // setHttpHistory(`${method} ${url}`, {req})
          }
        })
        reqHandle({config}).injectionReq({req, res, type: `get`})
      },
      onProxyRes: (proxyRes, req, res) => {
        allowCors({res: proxyRes, req, proxyConfig: userConfig})
        setHttpHistoryWrap({
          config,
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


}

module.exports = serverProxy
