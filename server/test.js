const util = require(`./util/index.js`)

function serverTest({
  HTTPHISTORY,
  config,
  TOKEN,
  parseDbApi,
}) {
  const {
    tool,
    business,
  } = util
  const {
    middleware,
    httpClient,
    url: {
      parseRegPath,
    },
  } = tool
  const {
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

  const jsonServer = require('json-server')
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
        const httpData = getHistory({history: HTTPHISTORY, fullApi, id}).data[reqOrRes]
        if(reqOrRes === `res`) { // 模仿 res 中的响应头, 但是开启跨域
          res.set(httpData.lineHeaders.headers)
          allowCors({res, req})
        }
        const path = require('path')
        if(tool.file.hasFile(httpData.bodyPath)) {
          res.sendFile(path.resolve(httpData.bodyPath))
        } else {
          throw new Error(`不存在文件 ${httpData.bodyPath}`)
        }
      } catch (err) {
        console.log('err', {api, err})
        res.status(404).json({msg: err.message})
      }
    }
    const actionFnObj = {
      getApiList() {

        const list = getHistoryList({history: HTTPHISTORY})
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
        const page = _page;
        const limit = _limit;
        const orderBy = require(`lodash.orderby`);
        const drop = require(`lodash.drop`);
        const take = require(`lodash.take`);
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
        const list = getHistoryList({history: HTTPHISTORY, method, api})
        res.send(list)
      },
      getOpenApi() {
        const api = req.query.api
        const openApi = {
          string: () => config.openApi, // 字符串时, 直接返回
          array: () => { // 数组时, 返回 pathname 匹配度最高的项
            const pathname = new URL(`http://127.0.0.1${api}`).pathname
            return tool.url.findLikeUrl({
              urlList: config.openApi,
              pathname,
            })
          },
          object: () => { // 对象时, 以 `new RegExp(key, 'i').test(pathname)` 的形式匹配
            const pathname = new URL(`http://127.0.0.1${api}`).pathname
            let firstKey = ``
            const key = Object.keys(config.openApi).find(key => {
              if (firstKey === ``) { // 把第一个 key 保存起来, 当没有找到对应的 key 时则把它作为默认的 key
                firstKey = key
              }
              const re = new RegExp(key, `i`)
              return re.test(pathname)
            })
            return config.openApi[key || firstKey]
          },
        }[tool.type.isType(config.openApi)]()
        getOpenApi({openApi}).then(oepnApiData => {
          res.send(oepnApiData)
        }).catch(err => console.log(`err`, err))
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
          fs.stat(config._httpHistory, (err, stats) => { // 不用全部读取文件即可读取文件大小信息, 减少内存占用
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
        const historyRes = getHistory({history: HTTPHISTORY, fullApi, id: actionArg0})
        if(historyRes.data) {
          const {method, path} = historyRes.data.req.lineHeaders.line
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
          HTTPHISTORY,
          config,
          business,
        })(req, res, next)
      },
      getConfig() {
        res.send(config)
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
      console.log(`无匹配方法`, {action, api, method})
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
      console.log(`无匹配方法`, {action})
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
      console.log(`无匹配方法`, {action})
      next()
    }
  })

  serverTest.listen(config.testPort, () => {
    // console.log(`接口调试地址: http://localhost:${config.testPort}/`)
  })

}

module.exports = serverTest
