const util = require(`./util/index.js`)
const { print } = require(`./util/log.js`)

async function serverProxy({
  api,
  db,
  apiRootInjection,
}) {
  const config = global.config
  const {
    tool,
    business,
  } = util
  const {
    middleware,
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
    saveLog,
  } = business
  const {
    allowCors,
  } = clientInjection()
  const {
    setHttpHistoryWrap,
    ignoreHttpHistory,
  } = historyHandle()
  const {
    middlewares,
    middlewaresObj,
  } = middleware.getJsonServerMiddlewares()
  const {
    parseApi: {
      noProxyTest,
      serverRouterList,
    },
    getDataRouter,
    allRoute,
  } = customApi({api, db})

  const jsonServer = require(`json-server`)
  const proxy = require(`http-proxy-middleware`).createProxyMiddleware
  const server = jsonServer.create()
  require(`@wll8/express-ws`)(server)
  // 此中间件比任何用户自定义的都要先运行
  server.use((req, res, next) => {
    // 创建一个对象用于挂载用户添加的方法
    res.mm = {
      resHandleJsonApi: (arg) => arg.resHandleJsonApi(arg),
    }
    next()
  })
  middleware.reWriteRouter({app: server, routes: config.route})
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
  server.use((req, res, next) => { // 注入上次请求
    reqHandle().injectionReq({req, res, type: `get`})
    next()
  })
  let list = [
    `api`,
    `db`,
    `static`,
    `apiWeb`,
  ].reduce((acc, cur) => {
    acc.push(allRoute.obj[cur])
    return acc
  }, []).flat()
  for (let index = 0; index < list.length; index++) {
    const item = list[index]
    server[item.method](item.route, item.action)
  }
  list = [
    `proxy`,
  ].reduce((acc, cur) => {
    acc.push(allRoute.obj[cur])
    return acc
  }, []).flat()
  for (let index = 0; index < list.length; index++) {
    const item = list[index]
    if(config.hostMode === false) {
      item.options.mid && server.use(item.route, item.options.mid)
      server.use(item.route, proxy(item.route, getProxyConfig(item.options)))
    }
  }

  server.use((error, req, res, next) => {
    saveLog({logStr: error.stack, logPath: config._errLog})
    next(error)
  })

  server.listen(config.port, () => {
    // console.log(`服务运行于: http://localhost:${config.port}/`)
  })

  function getProxyConfig (userConfig = {}) {
    const rootTarget = config._proxyTargetInfo.origin
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


}

module.exports = serverProxy
