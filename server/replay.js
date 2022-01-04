const util = require(`./util/index.js`)

function serverReplay({
  noProxyTest,
  config,
}) {
  const {
    tool,
    business,
  } = util
  const {
    historyHandle,
    saveLog,
  } = business
  const {
    middleware,
  } = tool
  const {
    middlewares,
    middlewaresObj,
  } = middleware.getJsonServerMiddlewares({config})
  const {
    getHistory,
  } = historyHandle({config})


  const jsonServer = require(`json-server`)
  const proxy = require(`http-proxy-middleware`).createProxyMiddleware
  const serverReplay = jsonServer.create()
  middleware.reWriteRouter({app: serverReplay, routes: config.route})
  serverReplay.use(middlewaresObj.corsMiddleware)
  serverReplay.use(proxy(
    (pathname, req) => {
      const method = req.method.toLowerCase()
      const fullApi = `${method} ${req.originalUrl}`
      const history = getHistory({fullApi}).data
      if(history || config.hostMode) { // 当存在 history 则不进入代理
        return false
      } else if(noProxyTest({method, pathname}) === true) { // 当没有 history, 则使用 noProxy 规则
        return true
      } else { // 当没有 history 也不匹配 noProxy 时, 则根据 replayProxy 规则
        return config.replayProxy
      }
    },
    {
      target: `http://localhost:${config.port}/`,
      logLevel: `silent`,
    },
  ))
  serverReplay.use(middlewares)
  serverReplay.use(middleware.replayHistoryMiddleware({
    config,
    business,
  }))

  serverReplay.use((error, req, res, next) => {
    saveLog({logStr: error.stack, logPath: config._errLog})
    next(error)
  })

  serverReplay.listen(config.replayPort, () => {
    // console.log(`服务器重放地址: http://localhost:${config.replayPort}/`)
  })

}

module.exports = serverReplay
