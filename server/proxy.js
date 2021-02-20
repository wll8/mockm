const util = require(`./util/index.js`)

async function serverProxy({
  api,
  db,
  HTTPHISTORY,
  TOKEN,
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
    clientInjection,
    historyHandle,
    customApi,
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

  const jsonServer = require('json-server')
  const proxy = require('http-proxy-middleware').createProxyMiddleware
  const server = jsonServer.create()
  server.use((req, res, next) => {
    next()
  })
  middleware.reWriteRouter({app: server, routes: config.route})
  const router = jsonServer.router(config.dbJsonPath)
  server.use(middlewaresObj.corsMiddleware)
  // disable = false 才走自定义 proxy
  config.disable === false && config.proxy.forEach(item => {
    if(item.context === `/` || config.hostMode) { // 过滤掉主 URL, 给后面的拦截器使用
      return false
    } else {
      // 在统一的中间件里判断经过 proxy 的路由是否也存在于自定义 api 中, 如果存在则不进入代理, 即当 proxy 和自定义 api 同时存在时, 后者优先
      // eslint-disable-next-line no-inner-declarations
      function midHandler(fn) {
        return (req, res, next) => {
          const hasFind = serverRouterList.some(item => item.re.test(req.baseUrl))
          hasFind ? next() : fn(req, res, next)
        }
      }
      const mid = proxy(item.context, getProxyConfig(item.options))
      item.options.mid && server.use(item.context, midHandler(item.options.mid))
      server.use(item.context, midHandler(mid))
    }
  })
  server.use(proxy(
    (pathname, {method}) => { // 返回 true 时进行转发, 真实服务器
      method = method.toLowerCase()
      if(
        (config.disable === false) // disable = false 才走自定义 api
        && (config.hostMode || noProxyTest({method, pathname}) || getDataRouter({method, pathname, db}))
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

  server.use(middlewares) // 添加中间件, 方便取值
  server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
    req.query.page && (req.query._page = req.query.page)
    req.query.pageSize && (req.query._limit = req.query.pageSize)
    next()
  })
  server.use((req, res, next) => { // 保存自定义接口的请求历史
    const cloneDeep = require('lodash.clonedeep')
    const reqBody = cloneDeep(req.body) // 如果不 cloneDeep, 那么 req.body 到 send 回调中会被改变
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
        history: HTTPHISTORY,
        req: {...req, body: reqBody},
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
    if(method === `ws`) {
      (await tool.generate.initPackge(`express-ws`))(server)
    }
    server[method](router, action)
  }

  server.use(router) // 其他 use 需要在此行之前, 否则无法执行

  server.listen(config.port, () => {
    // console.log(`服务运行于: http://localhost:${config.port}/`)
  })

  router.render = (req, res) => { // 修改输出的数据, 符合项目格式
    // 在 render 方法中, req.query 会被删除
    // https://github.com/typicode/json-server/issues/311
    // https://github.com/typicode/json-server/issues/314

    const querystring = require('querystring')
    if(req._parsedUrl) {
      const query = querystring.parse(req._parsedUrl.query)
      req.query = query
    }
    let returnData = res.locals.data // 前面的数据返回的 data 结构
    const xTotalCount = res.get('X-Total-Count')
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
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        allowCors({req: proxyReq, proxyConfig: userConfig})
        middlewaresObj.logger(req, res, () => {})
        middlewaresObj.jsonParser(req, res, () => {
          if(ignoreHttpHistory({config, req}) === false) {
            // setHttpHistory(`${method} ${url}`, {req})
          }
        })
        TOKEN = req.get('Authorization') || TOKEN // 获取 token
      },
      onProxyRes: (proxyRes, req, res) => {
        allowCors({res: proxyRes, req})
        setHttpHistoryWrap({
          config,
          history: HTTPHISTORY,
          req,
          res: proxyRes,
        })
      },
      logLevel: `silent`,
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
