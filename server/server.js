#!/usr/bin/env node

const proxy = require('http-proxy-middleware').createProxyMiddleware
const jsonServer = require('json-server')
const fs = require('fs')
const path = require('path')
const cloneDeep = require('lodash/cloneDeep')
const {logHelper, print} = require('./util/log.js')
process.argv.includes(`dev`) && logHelper()
const config = require(`./config.js`)
const util = require(`./util/index.js`)

const {
  toolObj,
  business,
} = util

const {
  initHandle,
  reqHandle,
  clientInjection,
  historyHandle,
  customApi,
} = business()
const {
  allowCors,
  setApiInHeader,
} = clientInjection({config})
const {
  setHttpHistoryWrap,
  getHistory,
  getHistoryList,
  ignoreHttpHistory,
} = historyHandle({config})
const {
  sendReq,
} = reqHandle({config})

const {
  init,
  getOpenApi,
} = initHandle()

const { api, db } = init({config})
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
  const getProxyConfig = (userConfig = {}) => {
    const rootTarget = config.proxy.find(item => (item.context === `/`)).options.target
    const defaultConfig = {
      target: rootTarget,
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        allowCors({req: proxyReq, proxyConfig: userConfig})
        middlewaresObj.logger(req, res, () => {})
        middlewaresObj.jsonParser(req, res, () => {
          const {
            method,
            url,
          } = req
          if(ignoreHttpHistory({config, req}) === false) {
            // setHttpHistory(`${method} ${url}`, {req})
          }
        })
        TOKEN = req.get('Authorization') || TOKEN // 获取 token
      },
      onProxyRes: (proxyRes, req, res) => {
        allowCors({res: proxyRes, req})
        setApiInHeader({res: proxyRes, req})
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

  return {
    serverProxy() {
      const server = jsonServer.create()
      middleware.reWriteRouter({app: server, routes: config.route})
      const router = jsonServer.router(config.dbJsonName)
      server.use(middlewaresObj.corsMiddleware)
      config.proxy.forEach(item => {
        if(item.context === `/`) { // 过滤掉主 URL, 给后面的拦截器使用
          return false
        } else {
          const mid = proxy(item.context, getProxyConfig(item.options))
          item.options.mid && server.use(item.context, item.options.mid)
          server.use(item.context, mid)
        }
      })
      server.use(proxy(
        (pathname, {method}) => { // 返回 true 时进行转发
          return (noProxyTest(pathname) || getDataRouter({method, pathname, db})) ? false : true
        },
        {
          ...getProxyConfig(),
          target: config.origin,
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
            config,
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
        // console.log(`服务运行于: http://localhost:${config.prot}/`)
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
        res.json(config.resHandleJsonApi({req, res, data: returnData}))
      }

    },
    serverTest() {
      const serverTest = jsonServer.create()
      serverTest.use(middlewaresObj.corsMiddleware)
      serverTest.use(middleware.compression())

      serverTest.get(`*`, (req, res, next) => {
        let {path} = httpClient.getClientUrlAndPath(req.originalUrl)
        if(path.match(/^\/api\//)) { // 为 /api/ 则视为 api, 否则为静态文件
          next()
        } else {
          path = path === `/` ? `/index.html` : path // 访问 / 时默认返回 index.html
          const filePath = require(`path`).resolve(__dirname, `./page/${path}`)
          res.sendFile(filePath, err => {
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
            getOpenApi({config}).then(oepnApiData => {
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
                  res.flush()
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
          getStore() {
            const str = require(`fs`).readFileSync(config.store, `utf8`)
            res.json(JSON.parse(str))
          },
        }
        if (actionFnObj[action]) {
          actionFnObj[action](...actionArg)
        } else {
          console.log(`无匹配方法`, {action, api, method})
        }
      })

      serverTest.listen(config.testProt, () => {
        // console.log(`接口调试地址: http://localhost:${config.testProt}/`)
      })

    },
    serverReplay() {
      const serverReplay = jsonServer.create()
      middleware.reWriteRouter({app: serverReplay, routes: config.route})
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
        const history = getHistory({history: HTTPHISTORY, fullApi, find: list => {
          const getStatus = (item) => {
            try {
              return item.data.res.lineHeaders.line.statusCode
            } catch (err) {
              console.log(err)
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
          res.set(lineHeaders.headers) // 还原 headers
          { // 更新 x-test-api, 因为如果 httpData 移动到其他设备时, ip 会改变, 所以应更新为当前 ip
            let testUrl = lineHeaders.headers[config.apiInHeader] || ``
            testUrl = testUrl.replace(/:\/\/.+?\/#/, `://${config.testIp}:${config.testProt}/#`)
            res.set({
              [config.apiInHeader]: testUrl,
            })
          }
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
          res.json(config.resHandleReplay({req, res}))
        }
      })
      serverReplay.listen(config.replayProt, () => {
        // console.log(`服务器重放地址: http://localhost:${config.replayProt}/`)
      })

    }
  }
}

const serverObj = server()

serverObj.serverProxy()
serverObj.serverTest()
serverObj.serverReplay()
