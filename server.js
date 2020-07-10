#!/usr/bin/env node

const { pathToRegexp } = require("path-to-regexp")
const interceptor = require('express-interceptor')
const modifyResponse = require('node-http-proxy-json')
const filenamify = require('filenamify')
const axios = require('axios')
const mime = require('mime')
const multiparty = require('multiparty')
const mockjs = require('mockjs')
const {htmlEscape} = require('escape-goat')
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const path = require('path')
const querystring = require('querystring')

require('./log.js').logHelper()
const config = require(`./config.js`)
const util = require(`./util.js`)

const { api, db } = init(config)

const server = jsonServer.create()
const serverReplay = jsonServer.create()
const serverTest = jsonServer.create()

const router = jsonServer.router(config.dbJsonName)
const middlewares = jsonServer.defaults({bodyParser: true})
const httpHistory = JSON.parse(fs.readFileSync(config.httpHistory).toString() || '{}') // 请求历史

const middlewaresObj = middlewares.flat().reduce((res, item) => {
  // 使用 jsonServer 里面的中间件, 以保持一致:
  // compression, corsMiddleware, serveStatic, logger, jsonParser, urlencodedParser
  return ({
    ...res,
    [item.name]: item,
  })
}, {})
let TOKEN = ''
serverTest.use(middlewaresObj.corsMiddleware)
server.use(middlewaresObj.corsMiddleware)

server.use(proxy(
  (pathname, {method}) => { // 返回 true 时进行转发
    return (noProxyTest(pathname) || getDataRouter({method, pathname, db})) ? false : true
  },
  {
    target: config.origin,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      middlewaresObj.jsonParser(req, res, () => {
        const {
          method,
          url,
        } = req
        if(ignoreHttpHistory(req) === false) {
          // setHttpHistory(`${method} ${url}`, {req})
        }
      })
      TOKEN = req.get('Authorization') || TOKEN // 获取 token
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers[config.apiInHeader] = `http://${util.getOsIp()}:${config.testProt}/#/${req.method}${req.originalUrl}`
      setHttpHistoryWrap({req, res: proxyRes})
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

function getHistory({fullApi, id}) {
  const { path } = util.fullApi2Obj(fullApi)
  console.log(`path`, path)
  return httpHistory[path] && httpHistory[path].find(item => {
    return ( // 传入 id 时比较 id, 不传入时取第一条匹配(最新记录)
      id === undefined ? true : (item.id === id)
      && (item.fullApi === fullApi)
    )
  }) || {}
}

const finalParagraphInterceptor = interceptor((req, res) => {
  // `express-interceptor`: 这个库的判断方式是基于十分有限的 content-type 判断为文本(是否转换为 buffer)
  // 其他拦截方案
  // https://stackoverflow.com/questions/33732509/express-js-how-to-intercept-response-send-response-json/33735452
  // https://www.youtube.com/watch?v=1jhdfS1Bwcc
  // https://www.npmjs.com/package/express-interceptor
return {
  isInterceptable: () => {
    return true
  },
  intercept: (body, send) => {
    const {statusCode, statusMessage, headers} = res
    setHttpHistoryWrap({
      req,
      res,
      mock: true,
      buffer: typeof(body) === `object` ? body : Buffer.from(body),
    })
    send(body)
  }
}
})

server.use(finalParagraphInterceptor)

serverTest.get(`*`, (req, res, next) => {
  const {path} = util.getClientUrlAndPath(req.originalUrl)
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
  let {actionRaw, api0} = req.params
  const [action, ...actionArg] = actionRaw.split(`,`)
  api0 = `/${api0}`
  const [, method, api] = api0.match(/\/(\w+)(.*)/) || []
  const urlData = {actionRaw, action, actionArg, api0, method, api}
  const fullApi = `${method} ${api}`

  function getFilePath({reqOrRes, id}) {
    try {
      const httpData = getHistory({fullApi, id}).data[reqOrRes]
      if(reqOrRes === `res`) { // 模仿 res 中的响应头, 但是开启跨域
        res.set(httpData.lineHeaders.headers)
        res.set(`access-control-allow-origin`, req.headers.origin)
      }
      res.sendFile(path.resolve(httpData.bodyPath))
    } catch (error) {
      console.log('error', {api, error})
      res.json('暂无请求数据')
    }
  }
  const actionFnObj = {
    getApiList() {
      const list = getHistoryList()
      res.send(list)
    },
    getApiHistry(apiId) {
      const list = getHistoryList({method, api})
      res.send(list)
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
        fs.stat(config.httpHistory, (err, stats) => {
          if (err) {
            return console.error(err);
          }
          if(stats.size !== oldSize) {
            const str = JSON.stringify(getHistoryList())
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
      sendReq(fullApi, err => {
        res.json(err)
      })
    },
    getBodyFileReq() {
      getFilePath({reqOrRes: `req`, id: actionArg[0]})
    },
    getBodyFileRes() {
      getFilePath({reqOrRes: `res`, id: actionArg[0]})
    },
    getHttpData() {
      res.send(getHistory({fullApi, id: actionArg[0]}).data)
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

// api(server) // 前端自行添加的测试 api
const noProxyRouteList = []
Object.keys(api).forEach(key => {
  let {method, url} = util.fullApi2Obj(key)
  method = method.toLowerCase()
  if((method === `*` || method === `/`) && (url === undefined)) { // 拦截所有方法所有路由
    server.all(`*`, api[key])
  } else if(url === undefined) { // 拦截指定方法的所有路由
    server[method](`*`, api[key])
  }
  if(method && url) { // 拦截指定方法的指定路由
    noProxyRouteList.push(url)
    server[method](url, api[key])
  }
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

server.use(router) // 其他 use 需要在此行之前, 否则无法执行

server.listen(config.prot, () => {
  console.log(`服务运行于: http://localhost:${config.prot}/`)
})

serverReplay.use(middlewaresObj.corsMiddleware)
serverReplay.use(proxy(
  (pathname, req) => {
    const fullApi = `${req.method.toLowerCase()} ${req.originalUrl}`
    const history = getHistory({fullApi}).data
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
  const history = getHistory({fullApi}).data
  try {
    const lineHeaders = history.res.lineHeaders
    res.set(lineHeaders.headers) // 还原 headers
    res.set(`access-control-allow-origin`, req.headers.origin)
    const bodyPath = history.res.bodyPath
    console.log(`bodyPath`, bodyPath)
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
serverTest.listen(config.testProt, () => {
  console.log(`接口调试地址: http://localhost:${config.testProt}/`)
})

function getHistoryList({method: methodFind, api: apiFind} = {}) {
  let list = []
  list = Object.keys(httpHistory).reduce((acc, cur) => {
    return acc.concat(httpHistory[cur])
  }, [])
  list = list.map(({fullApi, id, data: {req, res}}) => {
    const {method, url} = util.fullApi2Obj(fullApi)
    if(methodFind && apiFind) {
      if(((method === methodFind) && (url === apiFind)) === false) { // 如果没有找到就返回, 找到才进入数据处理
        return false
      }
    }
    return {
      id,
      method,
      api: url,
      // fullApi,
      statusCode: res.lineHeaders.line.statusCode,
      contentType: res.lineHeaders.headers[`content-type`],
      extensionName: (res.bodyPath || '').replace(/(.*)(\.)/, ''),
      date: res.lineHeaders.headers.date,
    }
  }).filter(item => item)
  return list
}

function noProxyTest(pathname) {
  // return true 时不走真实服务器, 而是走自定义 api
  return noProxyRouteList.some(route => pathToRegexp(route).exec(pathname))
}

function setHttpHistoryWrap({req, res, mock = false, buffer}) { // 从 req, res 记录 history
  if(ignoreHttpHistory(req) === false) {
    const data = [];
    function createHttpHistory({buffer}) {
      let {
        method,
      } = req
      method = method.toLowerCase()
      const {url, path} = util.getClientUrlAndPath(req.originalUrl)
      const headersObj = {req: req.headers || req.getHeaders(), res: res.headers || res.getHeaders()}
      headersObj.res.date = headersObj.res.date || (new Date()).toGMTString() // 居然没有 date ?
      const {statusCode, statusMessage, headers} = res
      const fullApi = `${method} ${url}`
      const reqBody = req.body

      // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

      function createBodyPath(reqOrRes, apiId) { // 根据 url 生成文件路径, reqOrRes: req, res
        const headers = headersObj[reqOrRes]
        const contentType = headers[`content-type`]
        console.log(`contentTypecontentType`, contentType)
        const extensionName = mime.getExtension(contentType) || ``

        const newPath = () => {
          const pathDir = `${config.dataDir}/${path}` // 以 path 创建目录
          if(util.hasFile(pathDir) === false) { // 如果不存在此目录则进行创建
            fs.mkdirSync(pathDir, { recursive: true })
          }
          let shortUrl = url.indexOf(path) === 0 ? url.replace(path, ``) : url // 为了节约目录长度删除 url 中的 path 部分, 因为 pathDir 已经是 path 的表示
          shortUrl = shortUrl.slice(1, 100)
          const filePath = `${pathDir}/${
            filenamify(
              `${shortUrl}_${method}_${reqOrRes}_${apiId}.${extensionName}`,
              {maxLength: 255, replacement: '_'}
            )
          }`
          // 如果 filePath 已存在于记录中, 则使用新的
          return filePath
        }

        // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
        let bodyPath = newPath()
        console.log(`bodyPath`, bodyPath)
        return bodyPath
      }

      const apiId = util.string10to62(util.nextId())
      // const apiId = util.nextId()
      function getBodyPath() {
        return {
          bodyPathReq: util.isEmpty(reqBody) === false ? createBodyPath(`req`, apiId) : undefined,
          bodyPathRes: util.isEmpty(buffer) === false ? createBodyPath(`res`, apiId) : undefined,
        }
      }
      const {bodyPathReq, bodyPathRes} = getBodyPath()
      bodyPathReq && fs.writeFileSync(bodyPathReq, JSON.stringify(reqBody), {encoding: 'utf8'})
      bodyPathRes && fs.writeFileSync(bodyPathRes, buffer, {encoding: 'buffer'})
      console.log(`${util.getClientIp(req)} => ${method} ${path} ${statusCode} ${statusMessage || ``}`)
      const resDataObj = {
        req: {
          lineHeaders: {
            line: util.removeEmpty({
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
      setHttpHistory({path, fullApi, id: apiId, data: resDataObj})
    }

    if(mock === true) {
      createHttpHistory({buffer})
      return false
    } else {
      res.on('data', function(chunk) {
        data.push(chunk)
      }).on('end', function() {
        const buffer = Buffer.concat(data)
        createHttpHistory({buffer})
      })
    }
  }
}

function handleRes(res, data) {
  return {
    code: res.statusCode,
    success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}
function ignoreHttpHistory(req) { // 不进行记录的请求
  const {method, url} = req
  return Boolean(
    method.match(/OPTIONS/i)
    || (
      method.match(/GET/i) && url.match(new RegExp(`/\/${config.pathname}\//`))
    )
  )
}

function init(config) { // 初始化, 例如创建所需文件, 以及格式化配置文件
  !util.hasFile(config.dataDir) && fs.mkdirSync(config.dataDir)
  !util.hasFile(config.httpHistory) && fs.writeFileSync(config.httpHistory, `{}`) // 请求历史存储文件
  const db = getDb()
  const api = config.api({axios, mime, mockjs, multiparty})

  return {
    db,
    api,
  }

  function getDb() { // 根据配置返回 db
    let db = config.db
    if( // 如果没有生成 json 数据文件, 才进行覆盖(为了数据持久)
      config.dbCover
      || (util.hasFile(config.dbJsonName) === false)
      || fs.readFileSync(config.dbJsonName, `utf-8`).trim() === ``
    ) {
      db = db({mockjs})
      fs.writeFileSync(config.dbJsonName, util.o2s(db))
      return db
    } else { // 如果 json 数据文件存在, 则从 json 文件中读取
      db = require(config.dbJsonName)
      return db
    }
  }

}

function setHttpHistory(data) {
  const {path} = data
  httpHistory[path] = (httpHistory[path] || []).concat(data)
  fs.writeFileSync(config.httpHistory, util.o2s(httpHistory))
}
function sendReq(api, cb, apiId) { // 发送请求
  // api httpHistory 中的 api
  // console.log(`httpHistory[api]`, httpHistory[api])
  const httpDataReq = getHistory({fullApi: api, id: apiId}).data.req
  const {line: {path, query, params}, headers} = httpDataReq.lineHeaders
  const [, method, url] = api.match(/(\w+)\s+(.*)/)
  let resErr = {message: ``, config: {}}
  if(TOKEN && config.updateToken) { // 更新 TOKEN
    headers.authorization = TOKEN
  }
  axios({
    baseURL: `http://localhost:${config.prot}`,
    method,
    url: path || url, // 注意不要 url 和 params 上都同时存在 query
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

function getDataRouter({method, pathname, db}) {
  /**
    给定一个 method 和 path, 根据 db.json 来判断是否应该过滤
    根据 db.json 获取要拦截的 route , 参考 node_modules/json-server/lib/server/router/index.js
  */

  method = method.trim().toLowerCase()
  const res = Object.keys(db).some(key => {
    const val = db[key]
    if (util.isType(val, `object`)) {
      return `get post put patch `.includes(`${method} `) && pathToRegexp(`/${key}`).exec(pathname) // 方法与路由匹配
    }
    if (util.isType(val, `array`)) {
      return (
        (`get post `.includes(`${method} `) && pathToRegexp(`/${key}`).exec(pathname)) // 获取所有或创建单条
        || (`get put patch delete `.includes(`${method} `) && pathToRegexp(`/${key}/:id`).exec(pathname)) // 处理针对于 id 单条数据的操作, 注意 id 的取值字段 foreignKeySuffix
      )
    }
  })
  return res
}

function getOsIp() { // 获取系统 ip
  const obj = require(`os`).networkInterfaces()
  const ip = Object.keys(obj).reduce((res, cur, index) => {
    return [...res, ...obj[cur]]
  }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
  return ip
}
