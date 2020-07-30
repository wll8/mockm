#!/usr/bin/env node

const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const path = require('path')
const cloneDeep = require('lodash/cloneDeep')
const morgan = require('morgan')
morgan.token('dateLcoal', (req, res) => (new Date()).toLocaleString())
const logger = morgan(`:dateLcoal :remote-addr :method :url :status :response-time ms - :res[content-length]`)
const {logHelper, print} = require('./util/log.js')
logHelper()

const config = require(`./config.js`)
const util = require(`./util/index.js`)

const {
  toolObj,
  business,
} = util

const {
  initHandle,
  reqHandle: {
    sendReq,
  },
  clientInjection: {
    handleRes,
    allowCors,
    setApiInHeader,
  },
  historyHandle: {
    setHttpHistoryWrap,
    getHistory,
    getHistoryList,
    ignoreHttpHistory,
  },
  customApi,
} = business({config})

const { api, db } = initHandle.init()
const {
  middleware,
  httpClient,
  url: {
    parseRegPath,
  },
} = toolObj
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
} = customApi({api, db})

const HTTPHISTORY = require(config.httpHistory) // 请求历史
let TOKEN = ''

const server = () => {
  return {
    serverProxy() {
      const server = jsonServer.create()
      const router = jsonServer.router(config.dbJsonName)
      server.use(middlewaresObj.corsMiddleware)
      server.use(proxy(
        (pathname, {method}) => { // 返回 true 时进行转发
          return (noProxyTest(pathname) || getDataRouter({method, pathname, db})) ? false : true
        },
        {
          target: config.origin,
          changeOrigin: true,
          onProxyReq: (proxyReq, req, res) => {
            allowCors({req: proxyReq})
            logger(req, res, () => {})
            middlewaresObj.jsonParser(req, res, () => {
              const {
                method,
                url,
              } = req
              if(ignoreHttpHistory({req}) === false) {
                // setHttpHistory(`${method} ${url}`, {req})
              }
            })
            TOKEN = req.get('Authorization') || TOKEN // 获取 token
          },
          onProxyRes: (proxyRes, req, res) => {
            allowCors({res: proxyRes, req})
            setApiInHeader({res: proxyRes, req})
            setHttpHistoryWrap({history: HTTPHISTORY, req, res: proxyRes})
          },
          logLevel: `silent`,
        },
      ))

      server.use(middlewares) // 添加中间件, 方便取值
      server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
        req.query.page && (req.query._page = req.query.page)
        req.query.pageSize && (req.query._limit = req.query.pageSize)
        const {url, body, query, params} = req
        next()
      })
      server.use((req, res, next) => { // 保存自定义接口的请求历史
        setApiInHeader({res, req})
        const reqBody = cloneDeep(req.body) // 如果不 cloneDeep, 那么 req.body 到 send 回调中会被改变
        const oldSend = res.send
        res.send = function(data) {
          res.send = oldSend
          setHttpHistoryWrap({
            history: HTTPHISTORY,
            req: {...req, body: reqBody},
            res,
            mock: true,
            buffer: typeof(data) === `object` ? data : Buffer.from(data),
          })
          return res.send(data)
        }
        next()
      })

      // 前端自行添加的测试 api
      serverRouterList.forEach(({method, router, action}) => {
        server[method](router, action)
      })

      server.use(router) // 其他 use 需要在此行之前, 否则无法执行

      server.listen(config.prot, () => {
        console.log(`服务运行于: http://localhost:${config.prot}/`)
      })

      router.render = (req, res) => { // 修改输出的数据, 符合项目格式
        let returnData = res.locals.data // 前面的数据返回的 data 结构
        const xTotalCount = res.get('X-Total-Count')
        if(xTotalCount) {
          returnData = {
            count: xTotalCount,
            results: res.locals.data,
          }
        }

        res.json(handleRes(res, returnData))
      }

    },
    serverTest() {
      const serverTest = jsonServer.create()
      serverTest.use(middlewaresObj.corsMiddleware)

      serverTest.get(`*`, (req, res, next) => {
        const {path} = httpClient.getClientUrlAndPath(req.originalUrl)
        if(path.match(/^\/api\//)) { // 为 /api/ 则视为 api, 否则为静态文件
          next()
        } else {
          res.sendFile(__dirname + `/page/${path}`, err => {
            if (err) {
              res.status(404).send({msg: `文件未找到: ${path}`})
            }
          })
        }
      })

      serverTest.get(`/api/:actionRaw/:api0(*)`, (req, res, next) => { // 给后端查询前端请求的接口
        let {actionRaw, api0} = parseRegPath(req.route.path, req.url)

        const [action, ...actionArg] = actionRaw.split(`,`)
        api0 = `/${api0}`
        const [, method, api] = api0.match(/\/(\w+)(.*)/) || []
        const urlData = {actionRaw, action, actionArg, api0, method, api}
        const actionArg0 = actionArg[0]
        const fullApi = `${method} ${api}`

        function getFilePath({reqOrRes, id}) {
          try {
            const httpData = getHistory({history: HTTPHISTORY, fullApi, id}).data[reqOrRes]
            if(reqOrRes === `res`) { // 模仿 res 中的响应头, 但是开启跨域
              res.set(httpData.lineHeaders.headers)
              allowCors({res, req})
            }
            res.sendFile(path.resolve(httpData.bodyPath))
          } catch (error) {
            console.log('error', {api, error})
            res.json('暂无请求数据')
          }
        }
        const actionFnObj = {
          getApiList() {

            const list = getHistoryList({history: HTTPHISTORY})
            res.send(list)
          },
          getApiHistry(apiId) {
            const list = getHistoryList({history: HTTPHISTORY, method, api})
            res.send(list)
          },
          getOpenApi() {
            initHandle.getOpenApi().then(oepnApiData => {
              res.send(oepnApiData)
            })
          },
          getApiListSse() {
            res.writeHead(200, {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"
            })
            res.write("retry: 10000\n")
            res.write("event: message\n")
            let oldSize = -1
            const interval = setInterval( () => {
              const fs = require(`fs`)
              fs.stat(config.httpHistory, (err, stats) => { // 不用全部读取文件即可读取文件大小信息, 减少内存占用
                if (err) {
                  return console.error(err);
                }
                if(stats.size !== oldSize) {
                  const str = JSON.stringify(getHistoryList({history: HTTPHISTORY}))
                  res.write(`data:${str}\n\n`)
                  oldSize = stats.size
                }
              })
            }, 500)

            req.connection.addListener("close",  () => {
              clearInterval(interval);
            }, false);
          },
          replay() {
            sendReq({
              token: TOKEN,
              getHistory,
              history: HTTPHISTORY,
              api: fullApi,
              cb: err => {
                res.json(err)
              },
              apiId: actionArg0,
            })
          },
          getBodyFileReq() {
            getFilePath({reqOrRes: `req`, id: actionArg0})
          },
          getBodyFileRes() {
            getFilePath({reqOrRes: `res`, id: actionArg0})
          },
          getHttpData() {
            res.send(getHistory({history: HTTPHISTORY, fullApi, id: actionArg0}).data)
          },
          getConfig() {
            res.send(config)
          },
        }
        if (actionFnObj[action]) {
          actionFnObj[action](...actionArg)
        } else {
          console.log(`无匹配方法`, {action, api, method})
        }
      })

      serverTest.listen(config.testProt, () => {
        console.log(`接口调试地址: http://localhost:${config.testProt}/`)
      })

    },
    serverReplay() {
      const serverReplay = jsonServer.create()
      serverReplay.use(middlewaresObj.corsMiddleware)
      serverReplay.use(proxy(
        (pathname, req) => {
          const fullApi = `${req.method.toLowerCase()} ${req.originalUrl}`
          const history = getHistory({history: HTTPHISTORY, fullApi}).data
          if(history) { // 当存在 history 则不进入代理
            return false
          } else if(noProxyTest(pathname) === true) { // 当没有 history, 则使用 noProxy 规则
            return true
          } else { // 当没有 history 也不匹配 noProxy 时, 则根据 replayProxy 规则
            return config.replayProxy
          }
        },
        {
          target: `http://localhost:${config.prot}/`,
          logLevel: `silent`,
        },
      ))
      serverReplay.use(middlewares)
      serverReplay.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
        const fullApi = `${req.method.toLowerCase()} ${req.originalUrl}`
        const history = getHistory({history: HTTPHISTORY, fullApi}).data
        try {
          const lineHeaders = history.res.lineHeaders
          res.set(lineHeaders.headers) // 还原 headers
          allowCors({res, req})
          const bodyPath = history.res.bodyPath
          if(bodyPath) {
            const newPath = path.resolve(bodyPath) // 发送 body
            res.sendFile(newPath)
          } else {
            const {statusCode, statusMessage} = lineHeaders.line
            res.statusCode = statusCode
            res.statusMessage = statusMessage
            res.send()
          }
        } catch (error) {
          console.log(`error`, error)
          // 对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能)
          // 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以正常运行
          res.statusCode = 200
          res.json(handleRes(res, {}))
        }
      })
      serverReplay.listen(config.replayProt, () => {
        console.log(`服务器重放地址: http://localhost:${config.replayProt}/`)
      })

    }
  }
}

const serverObj = server()

serverObj.serverProxy()
serverObj.serverTest()
serverObj.serverReplay()
