const util = require(`./util/index.js`)
const { print } = require(`./util/log.js`)

function serverTest({
  config,
  parseDbApi,
}) {
  const {
    tool,
    business,
  } = util
  const {
    middleware,
    httpClient,
    file: {
      getBackUrl,
    },
    url: {
      parseRegPath,
    },
  } = tool
  const {
    saveLog,
    initHandle,
    reqHandle,
    clientInjection,
    historyHandle,
    customApi,
    reStartServer,
    listToData,
  } = business
  const {
    init,
    getOpenApi,
  } = initHandle()
  const {
    allowCors,
  } = clientInjection({config})
  const {
    getHistory,
    getHistoryList,
  } = historyHandle({config})
  const {
    sendReq,
  } = reqHandle({config})
  const {
    middlewaresObj,
  } = middleware.getJsonServerMiddlewares({config})

  const apiWebStore = tool.file.fileStore(config.apiWeb)
  const disableApiList = apiWebStore.get(`disable`)

  const jsonServer = require(`json-server`)
  const serverTest = jsonServer.create()
  serverTest.use(middlewaresObj.corsMiddleware)
  serverTest.use(middlewaresObj.jsonParser)
  serverTest.use(middleware.compression())

  serverTest.get(`*`, (req, res, next) => {
    let {path} = httpClient.getClientUrlAndPath(req.originalUrl)
    if(path.match(/^\/api\//)) { // 为 /api/ 则视为 api, 否则为静态文件
      next()
    } else {
      path = path === `/` ? `/index.html` : path // 访问 / 时默认返回 index.html
      const filePath = require(`path`).resolve(__dirname, `./page/${path}`)
      if(tool.file.hasFile(filePath)) {
        return res.sendFile(filePath)
      } else {
        return res.status(404).send({msg: `文件未找到: ${path}`})
      }
    }
  })

  serverTest.get(`/api/:actionRaw/:api0(*)`, (req, res, next) => { // 给后端查询前端请求的接口
    let {actionRaw, api0} = parseRegPath(req.route.path, req.url)

    const [action, ...actionArg] = actionRaw.split(`,`)
    api0 = `/${api0}`
    const [, method, api] = api0.match(/\/(\w+)(.*)/) || []
    const actionArg0 = actionArg[0]
    const fullApi = api ? `${method} ${api}` : undefined

    function getFilePath({reqOrRes, id}) {
      try {
        const httpData = getHistory({fullApi, id}).data[reqOrRes]
        if(reqOrRes === `res`) { // 模仿 res 中的响应头, 但是开启跨域
          const headers = httpData.lineHeaders.headers || require(require(`path`).resolve(httpData.lineHeaders.headPath))
          res.set(headers)
          allowCors({res, req})
        }
        if(tool.file.hasFile(httpData.bodyPath)) {
          res.sendFile(require(`path`).resolve(httpData.bodyPath))
        } else {
          throw new Error(`不存在文件 ${httpData.bodyPath}`)
        }
      } catch (err) {
        console.log(`err`, {api, err})
        res.status(404).json({msg: err.message})
      }
    }
    const actionFnObj = {
      getApiList() {

        const list = getHistoryList({})
        let {
          _sort = ``,
          _order = ``,
          _page = 1,
          _limit = 10,
        } = req.query
        _sort = _sort.split(`,`)
        _order = _order.split(`,`)
        if(_sort[0] === `id`) { // 把 id 转换为数字, 这样 orderBy 才能进行比较
          _sort[0] = item => Number(tool.hex.string62to10(item.id))
        }
        if(_sort[0] === `date`) {
          _sort[0] = item => new Date(item.date).getTime()
        }
        const page = _page
        const limit = _limit
        const orderBy = require(`lodash.orderby`)
        const drop = require(`lodash.drop`)
        const take = require(`lodash.take`)
        const results = take(
          drop(
            orderBy(
              list,
              _sort, _order,
            ),
            (page - 1) * limit,
          ),
          limit,
        )
        const sendData = {
          count: list.length,
          results,
        }
        res.send(sendData)
      },
      getApiHistry(apiId) {
        const list = getHistoryList({method, api})
        res.send(list)
      },
      async getOpenApi() {
        const api = req.query.api
        const method = req.query.method
        // let openApiPrefix = `/` // openApi 的前缀
        const matchInfo = (await tool.url.findLikePath({
          api,
          method,
          config,
        }))
        const openApi = matchInfo.spec
        // openApiPrefix = openApiPrefix.replace(/\/$/, ``) // 最后面不需要 `/`, 否则会出现两个 `//`, 因为它是拼接在 `/` 开头的 api 前面的
        getOpenApi({openApi}).then(openApiData => {
          openApiData.info = {
            ...openApiData.info,
            // _openApiPrefix: openApiPrefix,
            _matchInfo: matchInfo,
          }
          res.send(openApiData)
        }).catch(async err => {
          // 当 openApi 获取失败时, 尝试从历史记录中获取, 以期望总是可以查看接口文档
          // header 中的 x-mockm-msg 值为 from history 表示是来自本地历史
          const file = await getBackUrl(config._openApiHistoryDir, openApi)
          if(file) {
            res.setHeader(`x-mockm-msg`, `from history`)
            const openApiData = require(file)
            openApiData.info = {
              ...openApiData.info,
              _matchInfo: matchInfo,
              // _openApiPrefix: openApiPrefix,
            }
            res.send(openApiData)
          } else {
            res.status(404)
            res.send({msg: `获取 openApi 错误`, err})
          }
          console.log(`err`, err)
        })
      },
      getApiListSse() {
        res.writeHead(200, {
          "Content-Type": `text/event-stream`,
          "Cache-Control": `no-cache`,
          "Connection": `keep-alive`,
        })
        res.write(`retry: 10000\n`)
        res.write(`event: message\n`)
        let oldSize = -1
        const interval = setInterval( () => {
          const fs = require(`fs`)
          fs.stat(config._httpHistory, (err, stats) => { // 不用全部读取文件即可读取文件大小信息, 减少内存占用
            if (err) {
              return console.error(err)
            }
            if(stats.size !== oldSize) {
              const str = JSON.stringify(getHistoryList({}))
              res.write(`data:${str}\n\n`)
              res.flush()
              oldSize = stats.size
            }
          })
        }, 500)

        req.connection.addListener(`close`,  () => {
          clearInterval(interval)
        }, false)
      },
      replay() {
        sendReq({
          getHistory,
          api: fullApi,
          res,
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
        const historyRes = JSON.parse(JSON.stringify(getHistory({fullApi, id: actionArg0})))
        if(historyRes.data) {
          const {method, path} = historyRes.data.req.lineHeaders.line
          historyRes.data.req.lineHeaders.headers = historyRes.data.req.lineHeaders.headers || require(require(`path`).resolve(historyRes.data.req.lineHeaders.headPath))
          historyRes.data.req.lineHeaders.headPath = undefined
          historyRes.data.res.lineHeaders.headers = historyRes.data.res.lineHeaders.headers || require(require(`path`).resolve(historyRes.data.res.lineHeaders.headPath))
          historyRes.data.res.lineHeaders.headPath = undefined
          const webApi = (apiWebStore.get([`paths`, path]) || {})[method]
          if(webApi) {
            webApi.disable = apiWebStore.get(`disable`).includes(historyRes.fullApi)
          }
          res.send({
            webApi,
            historyRes,
          })
        } else {
          res.status(404).send({
            msg: `记录不存在`,
          })
        }
      },
      getApiResponseById() {
        middleware.replayHistoryMiddleware({
          id: actionArg0,
          config,
          business,
        })(req, res, next)
      },
      getConfig() {
        res.send(config)
      },
      getInjectionRequest() {
        res.send(global.INJECTION_REQUEST)
      },
      getStore() {
        const str = require(`fs`).readFileSync(config._store, `utf8`)
        res.json(JSON.parse(str))
      },
      studio() {
        let path = req.query.path
        const apiWebStore = tool.file.fileStore(config.apiWeb)
        const apiWeb = apiWebStore.get(path ? [`paths`, path] : `paths`) || {}
        if(path) { // 获取单条
          res.json(apiWeb)
        } else { // 获取列表
          let sendData = []
          const disableApiList = apiWebStore.get(`disable`)
          const {
            api,
            db,
          } = init({config}) // 重新运行初始化方法, 以读取最新的 db 和 webApi 文件
          const {
            parseApi: {
              serverRouterList,
            },
          } = customApi({api, db, config})
          serverRouterList.forEach(item => { // 来自 config.apiWeb 和 config.api
            sendData.push({
              path: item.router,
              method: item.method,
              type: item.action.type || `api`,
              description: item.action.description,
              disable: item.action.disable,
            })
          })
          sendData = sendData.concat(parseDbApi) // 来自 config.db
          res.json({api: sendData, disable: disableApiList})
        }
      },
    }
    if (actionFnObj[action]) {
      actionFnObj[action](...actionArg)
    } else {
      print(`No matching method found`, {action, api, method})
      next()
    }
  })

  serverTest.patch(`/api/:actionRaw/:api0(*)`, (req, res, next) => {
    let {actionRaw, api0} = parseRegPath(req.route.path, req.url)
    const [action, ...actionArg] = actionRaw.split(`,`)
    const actionFnObj = {
      studio() {
        const {setPath, data} = req.body
        const oldVal = apiWebStore.get(setPath)
        apiWebStore.set(setPath, {...oldVal, ...data})
        res.json({msg: `ok`})
        reStartServer(config.config)
      },
    }
    if (actionFnObj[action]) {
      actionFnObj[action]()
    } else {
      print(`No matching method found`, {action})
      next()
    }
  })

  serverTest.post(`/api/:actionRaw/:api0(*)`, (req, res, next) => {
    let {actionRaw, api0} = parseRegPath(req.route.path, req.url)
    const [action, ...actionArg] = actionRaw.split(`,`)
    const actionFnObj = {
      listToData() {
        const {table, rule, type} = req.body
        const listToDataRes = listToData(table, {rule, type})
        res.json(listToDataRes.data)
      },
      async translate() {
        const {text, appid, key, type = `tree`} = req.body
        const { batchTextEnglish } = require(`./util/translate`)
        batchTextEnglish({
          text,
          appid,
          key,
          type,
        }).then(data => {
          res.json(data)
        }).catch(err => {
          res.json({err: err.message})
        })
      },
      removeApi() {
        const {setPath} = req.body
        apiWebStore.set(setPath, undefined)
        res.json({msg: `ok`})
        reStartServer(config.config)
      },
      changeWebApiStatus() {
        const {api} = req.body
        const findIndexRes = disableApiList.findIndex(item => item === api)
        if(findIndexRes >= 0) {
          disableApiList.splice(findIndexRes, 1)
        } else {
          disableApiList.push(api)
        }
        apiWebStore.set(`disable`, disableApiList)
        reStartServer(config.config)
        res.json({msg: `ok`})
      },
    }
    if (actionFnObj[action]) {
      actionFnObj[action]()
    } else {
      print(`No matching method found`, {action})
      next()
    }
  })

  serverTest.use((error, req, res, next) => {
    saveLog({logStr: error.stack, logPath: config._errLog})
    next(error)
  })

  serverTest.listen(config.testPort, () => {
    // console.log(`接口调试地址: http://localhost:${config.testPort}/`)
  })

}

module.exports = serverTest
