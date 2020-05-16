const interceptor = require('express-interceptor')
const modifyResponse = require('node-http-proxy-json')
const filenamify = require('filenamify')
require('./log.js').logHelper()
const axios = require('axios')
const mime = require('mime')
const {htmlEscape} = require('escape-goat')
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const path = require('path')
const server = jsonServer.create()
const serverReplay = jsonServer.create()
const serverTest = jsonServer.create()
const config = require('./config.js')
const db = require('./db.js')()
const api = require('./api.js')

fs.writeFileSync(config.dbJsonName, o2s(db))
const router = jsonServer.router(config.dbJsonName)
const middlewares = jsonServer.defaults({bodyParser: true})
init()
const httpHistory = JSON.parse(fs.readFileSync(config.httpHistory).toString() || '{}') // 请求历史
const querystring = require('querystring')
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

server.use(proxy(
  pathname => {
    return noProxyTest(pathname) === false
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
      proxyRes.headers[config.apiInHeader] = `http://${getOsIp()}:${config.testProt}/#/${req.method}${req.originalUrl}`
      setHttpHistoryWrap({req, res: proxyRes})
    },
  },
))

server.use(middlewares) // 添加中间件, 方便取值
server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  req.query.page && (req.query._page = req.query.page)
  req.query.pageSize && (req.query._limit = req.query.pageSize)
  const {url, body, query, params} = req
  next()
})

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
  const {path} = getClientUrlAndPath(req.originalUrl)
  if(path.match(/^\/(get|post|head|put|delete|connect|options|trace)\b,/i)) { // 以 http `${method},` 单词加逗号开头的 path 视为 api
    next()
  } else {
    res.sendFile(__dirname + `/page/${path}`, err => {
      if (err) {
        res.status(404).send({msg: `文件未找到: ${path}`})
      }
    })
  }
})

serverTest.get(`/:argList/:api(*)`, (req, res, next) => { // 给后端查询前端请求的接口
  let {api, argList} = req.url.match(new RegExp(`\/(?<argList>.*?)(?<api>\/.*)`)).groups
  const rawApi = api
  argList = argList.split(',')
  const {query, params} = req
  const {method, action} = argList.map((item, index) => index).reduce((res, index) => ({
    ...res,
    [['method', 'action'][index]]: argList[index]
  }), {})
  api = `${method.toUpperCase()} ${api}`
  function getHistoryList() {
    let list = []
    for (const fullApi in httpHistory) {
      if (httpHistory.hasOwnProperty(fullApi)) {
        const {method, api} = getMethodUrl(fullApi)
        list.push({
          method,
          api,
          // fullApi,
          statusCode: httpHistory[fullApi].res.lineHeaders.line.statusCode,
          contentType: httpHistory[fullApi].res.lineHeaders.headers[`content-type`],
          extensionName: (httpHistory[fullApi].res.bodyPath || '').replace(/(.*)(\.)/, ''),
          date: httpHistory[fullApi].res.lineHeaders.headers.date,
        })
      }
    }
    return list
  }
  if(action === 'getApiList') {
    const list = getHistoryList()
    res.send(list)
    return true
  }
  if(action === 'getApiListSse') {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    })
    res.write("retry: 3000\n")
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

  }
  if(action === 'replay') {
    sendReq(api, err => {
      res.json(err)
    })
    return true
  } else {
    let httpRes
    let httpReq
    try {
      httpRes = {...httpHistory[api].res}
      httpReq = {...httpHistory[api].req}
    } catch (error) {
      console.log('error', {api, error})
      res.json('暂无请求数据')
    }

    if(action === 'getBodyFileReq') {
      res.sendFile(path.resolve(httpReq.bodyPath))
    }
    if(action === 'getBodyFileRes') {
      res.set(httpRes.lineHeaders.headers)
      res.set(`access-control-allow-origin`, req.headers.origin)
      res.sendFile(path.resolve(httpRes.bodyPath))
    }
    if(action === 'getHttpData') {
      res.send(httpHistory[api])
    }
  }
})

api(server) // 前端自行添加的测试 api

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

serverReplay.use(proxy(
  (pathname, req) => {
    const history = getHttpHistory(req, 'url')
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
  },
))
serverReplay.use(middlewares)
serverReplay.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  const history = getHttpHistory(req, 'url')
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

function noProxyTest(pathname) {
  // return true 时不走代理
  if(Boolean(config.noProxy) === false) {
    return false
  } else {
    const reStrList = typeof(config.noProxy) === `string` ? [config.noProxy] : config.noProxy
    return reStrList.map(reStr => Boolean(pathname.match((new RegExp(reStr)))) ).some(item => item === true)
  }
}

function getClientUrlAndPath (originalUrl) { // 获取从客户端访问的 url 以及 path
  // 当重定向路由(mock api)时, req.originalUrl 和 req.url 不一致, req.originalUrl 为浏览器中访问的 url, 应该基于这个 url 获取 path
  return {
    url: originalUrl,
    path: (new URL(originalUrl, `http://127.0.0.1`)).pathname,
  }
}

function setHttpHistoryWrap({req, res, mock = false, buffer}) { // 从 req, res 记录 history
  if(ignoreHttpHistory(req) === false) {
    const data = [];
    function createHttpHistory({buffer}) {
      const {
        method,
      } = req
      const {url, path} = getClientUrlAndPath(req.originalUrl)
      const headersObj = {req: req.headers || req.getHeaders(), res: res.headers || res.getHeaders()}
      headersObj.res.date = headersObj.res.date || (new Date()).toGMTString() // 居然没有 date ?
      const {statusCode, statusMessage, headers} = res
      const fullApi = `${method} ${url}`
      const reqBody = req.body

      // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

      function createBodyPath(reqOrRes, apiId) { // 根据 url 生成文件路径, reqOrRes: req, res
        const headers = headersObj[reqOrRes]
        const contentType = headers[`content-type`]
        const extensionName = mime.getExtension(contentType)

        const bodyPathOld = ((getHttpHistory(req, 'url') || {})[reqOrRes] || {}).bodyPath
        const newPath = () => {
          return `${config.dataDir}/${
            filenamify(
              `${url.slice(1, 100)}_${method}_${reqOrRes}_${apiId}.${extensionName}`,
              {maxLength: 255, replacement: '_'}
            )
          }`
        }

        // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
        let bodyPath = bodyPathOld || newPath()
        if(mime.getType(bodyPathOld) !== contentType) {
          bodyPath = bodyPath.replace(/(.*\.)(.*)/, `$1${extensionName}`)
        }
        return bodyPath
      }

      function getBodyPath() {
        const apiId = string10to62(nextId())
        return {
          bodyPathReq: isEmpty(reqBody) === false ? createBodyPath(`req`, apiId) : undefined,
          bodyPathRes: isEmpty(buffer) === false ? createBodyPath(`res`, apiId) : undefined,
        }
      }
      const {bodyPathReq, bodyPathRes} = getBodyPath()
      bodyPathReq && fs.writeFileSync(bodyPathReq, JSON.stringify(reqBody), {encoding: 'utf8'})
      bodyPathRes && fs.writeFileSync(bodyPathRes, buffer, {encoding: 'buffer'})
      console.log(`${getClientIp(req)} => ${method} ${path} ${statusCode} ${statusMessage}`)
      const resDataObj = {
        req: {
          lineHeaders: {
            line: removeEmpty({
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
      setHttpHistory(fullApi, resDataObj)
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

function removeEmpty(obj) {
  obj = {...obj}
  Object.keys(obj).forEach(key => {
    if (isEmpty(obj[key])) {
      delete obj[key]
    }
  })
  return obj
}

function handleRes(res, data) {
  return {
    code: res.statusCode,
    success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}

function getOptions(cmd) {
  const curlconverter = require('curlconverter');
  let str = curlconverter.toNode(cmd)
  let res = {}
  str = str.replace(`request(options, callback)`, `res = options`)
  eval(str)
  try {
    res.body = JSON.parse(res.body)
  } catch (error) {
    res.body = {}
  }
  return res
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

function getHttpHistory(req, type) { // 获取某个请求的记录
  // type: url|path 匹配方式, path 会忽略 url 上的 query 参数
  const {url, path} = getClientUrlAndPath(req.originalUrl)

  if(type === 'url') {
    return httpHistory[`${req.method} ${url}`]
  }
  if(type === 'path') {
    let re = new RegExp(`^${req.method} `)
    let key  = Object.keys(httpHistory).find(key => {
      return (key.match(re) && (httpHistory[key].req.path === path))
    })
    return httpHistory[key]
  }
}

function init() { // 初始化, 例如所需文件
  !hasFile(config.dataDir) && fs.mkdirSync(config.dataDir)
  !hasFile(config.httpHistory) && fs.writeFileSync(config.httpHistory, `{}`) // 请求历史存储文件
}

function hasFile(filePath) {
  return fs.existsSync(filePath)
}

function o2s(o) {
  return JSON.stringify(o, null, 2)
}

function getToken() {}

function setHttpHistory(api, resDataObj) {
  const [, method, url] = api.match(/(\w+)\s+(.*)/)
  httpHistory[`${method} ${url}`] = {
    ...httpHistory[`${method} ${url}`],
    ...resDataObj,
  }
  fs.writeFileSync(config.httpHistory, o2s(httpHistory))
}

function getMethodUrl(path) {
  const [, method, api] = path.match(/(\w+)\s+(.*)/)
  return {method, api}
}

function sendReq(api, cb) { // 发送请求
  // api httpHistory 中的 api
  // console.log(`httpHistory[api]`, httpHistory[api])
  const httpDataReq = httpHistory[api].req
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
    const {status, statusText} = err.response || {}
    resErr = {
      success: false,
      message: `${status} ${statusText}`,
      config: err.config,
    }
  }).finally(() => {
    cb(resErr)
  })
}

function isEmpty(value) {
  return (
    value === null
    || value === ``
    || typeof(value) === `object`
      && (
        value.length === 0
        || Object.keys(value).length === 0
      )
  )
}

function emptyFn(f) {  // 把函数的参数 {}, [], null 转为默认值
  return (...a) => {
    return f(...a.map(
      v => {
        return (isEmpty(v) ? undefined : v)
      }
    ))
  }
}

function getClientIp (req) { // 获取客户端 IP
  var ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    req.ip ||
    req.connection.remoteAddress || // 判断 connection 的远程 IP
    req.socket.remoteAddress || // 判断后端的 socket 的 IP
    req.connection.socket.remoteAddress || ''
  if (ip.includes(',')) {
    ip = ip.split(',')[0]
  }
  ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length) // ::ffff:127.0.0.1 => 127.0.0.1
  return ip
}

function string10to62(number) {
  var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
    radix = chars.length,
    qutient = +number,
    arr = [];
  do {
    mod = qutient % radix;
    qutient = (qutient - mod) / radix;
    arr.unshift(chars[mod]);
  } while (qutient);
  return arr.join('');
}

function string62to10(number) {
  var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
    radix = chars.length,
    number = String(number),
    len = number.length,
    i = 0,
    origin_number = 0;
  while (i < len) {
    origin_number += Math.pow(radix, i++) * chars.indexOf(number.charAt(len - i) || 0);
  }
  return origin_number;
}

function nextId() {
  global.id = (global.id || 0) + 1
  return global.id
}

function getOsIp() { // 获取系统 ip
  const obj = require(`os`).networkInterfaces()
  const ip = Object.keys(obj).reduce((res, cur, index) => {
    return [...res, ...obj[cur]]
  }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
  return ip
}