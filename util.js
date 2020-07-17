function customApi({api, db}) {
  /**
   * 自定义 api 处理程序, 包括配置中的用户自定义路由(config.api), 以及mock数据生成的路由(config.db)
   */

  function parseApi() { // 解析自定义 api
    const noProxyRouteList = []
    const serverRouterList = [] // server 可使用的路由列表
    Object.keys(api).forEach(key => {
      let {method, url} = fullApi2Obj(key)
      method = method.toLowerCase()
      if((method === `*` || method === `/`) && (url === undefined)) { // 拦截所有方法所有路由
        serverRouterList.push({method: `all`, router: `*`, action: api[key]})
      } else if(url === undefined) { // 拦截指定方法的所有路由
        server[method](`*`, api[key])
        serverRouterList.push({method, router: `*`, action: api[key]})
      }
      if(method && url) { // 拦截指定方法的指定路由
        noProxyRouteList.push(url)
        serverRouterList.push({method, router: url, action: api[key]})
      }
    })
    function noProxyTest(pathname) {
      // return true 时不走真实服务器, 而是走自定义 api
      const pathToRegexp = require('path-to-regexp')
      return noProxyRouteList.some(route => pathToRegexp(route).exec(pathname))
    }
    return {
      noProxyRouteList,
      serverRouterList,
      noProxyTest,
    }
  }

  function getDataRouter({method, pathname}) {
    /**
      给定一个 method 和 path, 根据 db.json 来判断是否应该过滤
      根据 db.json 获取要拦截的 route , 参考 node_modules/json-server/lib/server/router/index.js
    */
    const pathToRegexp = require('path-to-regexp')

    method = method.trim().toLowerCase()
    const res = Object.keys(db).some(key => {
      const val = db[key]
      if (isType(val, `object`)) {
        return `get post put patch `.includes(`${method} `) && pathToRegexp(`/${key}`).exec(pathname) // 方法与路由匹配
      }
      if (isType(val, `array`)) {
        return (
          (`get post `.includes(`${method} `) && pathToRegexp(`/${key}`).exec(pathname)) // 获取所有或创建单条
          || (`get put patch delete `.includes(`${method} `) && pathToRegexp(`/${key}/:id`).exec(pathname)) // 处理针对于 id 单条数据的操作, 注意 id 的取值字段 foreignKeySuffix
        )
      }
    })
    return res
  }

  return {
    parseApi: parseApi(),
    getDataRouter,
  }

}

function initHandle({config}) { // 初始化处理程序
  const axios = require('axios')
  const mockjs = require('mockjs')
  const mime = require('mime')
  const multiparty = require('multiparty')

  function getDb() { // 根据配置返回 db
    const fs = require(`fs`)
    let db = config.db
    if( // 如果没有生成 json 数据文件, 才进行覆盖(为了数据持久)
      config.dbCover || isFileEmpty(config.dbJsonName)
    ) {
      db = db({mockjs})
      fs.writeFileSync(config.dbJsonName, o2s(db))
      return db
    } else { // 如果 json 数据文件存在, 则从 json 文件中读取
      db = require(config.dbJsonName)
      return db
    }
  }

  function init() { // 初始化, 例如创建所需文件, 以及格式化配置文件
    const fs = require(`fs`)
    if(hasFile(config.dataDir) === false) { // 如果没有目录则创建目录
      fs.mkdirSync(config.dataDir, {recursive: true})
    }
    if(isFileEmpty(config.httpHistory)) { // 如果文件为空则创建文件
      fs.writeFileSync(config.httpHistory, `{}`) // 请求历史存储文件
    }
    if(isFileEmpty(config.store)) {
      fs.writeFileSync(config.store, `{}`)
    }
    const db = getDb()
    const api = config.api({axios, mime, mockjs, multiparty})

    return {
      db,
      api,
    }

  }

  return {
    init,
  }

}

function historyHandle({config}) {
  /**
   * 历史记录处理
   */

  function getHistoryList({history, method: methodRef, api: apiRef} = {}) {
    let list = []
    list = Object.keys(history).reduce((acc, cur) => {
      return acc.concat(history[cur])
    }, [])
    list = list.filter(item => item.data).map(({fullApi, id, data: {req, res}}) => {
      const {method, url} = fullApi2Obj(fullApi)
      if(methodRef && apiRef) {
        if(((method === methodRef) && (url === apiRef)) === false) { // 如果没有找到就返回, 找到才进入数据处理
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

  function getHistory({history, fullApi, id}) { // 获取指定 fullApi/id 中的历史记录
    const { path } = fullApi2Obj(fullApi)
    return history[path] && [...history[path]].reverse().find(item => {
      return ( // 传入 id 时比较 id, 不传入时取第一条匹配(最新记录)
        (id === undefined ? true : (item.id === id))
        && (item.fullApi === fullApi)
      )
    }) || {}
  }

  function ignoreHttpHistory({req}) { // 是否应该记录 req
    const {method, url} = req
    return Boolean(
      method.match(/OPTIONS/i)
      || (
        method.match(/GET/i) && url.match(new RegExp(`/\/${config.pathname}\//`))
      )
    )
  }

  function createBodyPath({req, headersObj, reqOrRes, apiId}) { // 根据 url 生成文件路径, reqOrRes: req, res
    const filenamify = require('filenamify')
    const fs = require(`fs`)
    const mime = require('mime')
    const headers = headersObj[reqOrRes]
    const contentType = headers[`content-type`]
    const extensionName = mime.getExtension(contentType) || ``
    const {url, path} = getClientUrlAndPath(req.originalUrl)
    let {
      method,
    } = req
    method = method.toLowerCase()

    const newPath = () => {
      const apiDir = `${config.dataDir}/${path}` // 以 path 创建目录
      if(hasFile(apiDir) === false) { // 如果不存在此目录则进行创建
        fs.mkdirSync(apiDir, { recursive: true })
      }
      let shortUrl = url.indexOf(path) === 0 ? url.replace(path, ``) : url // 为了节约目录长度删除 url 中的 path 部分, 因为 pathDir 已经是 path 的表示
      shortUrl = shortUrl.slice(1, 100)
      const filePath = `${apiDir}/${
        filenamify(
          `${shortUrl}_${method}_${apiId}_${reqOrRes}.${extensionName}`,
          {maxLength: 255, replacement: '_'}
        )
      }`
      // 如果 filePath 已存在于记录中, 则使用新的
      return filePath
    }

    // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
    let bodyPath = newPath()
    return bodyPath
  }

  function createHttpHistory({history, dataDir, buffer, req, res}) {
    const fs = require(`fs`)
    let {
      method,
    } = req
    method = method.toLowerCase()
    const {url, path} = getClientUrlAndPath(req.originalUrl)
    const headersObj = {req: req.headers || req.getHeaders(), res: res.headers || res.getHeaders()}
    headersObj.res.date = headersObj.res.date || (new Date()).toGMTString() // 居然没有 date ?
    const {statusCode, statusMessage, headers} = res
    const fullApi = `${method} ${url}`
    const reqBody = req.body

    // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

    const apiCount = localStore(config.store).updateApiCount()
    const apiId = string10to62(apiCount)
    function getBodyPath() {
      const arg = {req, headersObj, dataDir, apiId}
      return {
        bodyPathReq: isEmpty(reqBody) === false ? createBodyPath({...arg ,reqOrRes: `req`}) : undefined,
        bodyPathRes: isEmpty(buffer) === false ? createBodyPath({...arg ,reqOrRes: `res`}) : undefined,
      }
    }
    const {bodyPathReq, bodyPathRes} = getBodyPath()
    bodyPathReq && fs.writeFileSync(bodyPathReq, JSON.stringify(reqBody), {encoding: 'utf8'})
    bodyPathRes && fs.writeFileSync(bodyPathRes, buffer, {encoding: 'buffer'})
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
    setHttpHistory({
      data: {path, fullApi, id: apiId, data: resDataObj},
      history,
    })
  }

  function setHttpHistory({data, history}) {
    const fs = require(`fs`)
    const {path} = data
    history[path] = (history[path] || []).concat(data)
    fs.writeFileSync(config.httpHistory, o2s(history))
  }

  function setHttpHistoryWrap({history, req, res, mock = false, buffer}) { // 从 req, res 记录 history
    if(ignoreHttpHistory({req}) === false) {
      const data = [];
      const arg = {
        history,
        buffer,
        req,
        res,
      }
      if(mock === true) {
        createHttpHistory(arg)
        return false
      } else {
        res.on('data', function(chunk) {
          data.push(chunk)
        }).on('end', function() {
          const buffer = Buffer.concat(data)
          createHttpHistory({...arg, buffer})
        })
      }
    }
  }

  return {
    setHttpHistoryWrap,
    createHttpHistory,
    createBodyPath,
    getHistory,
    getHistoryList,
    ignoreHttpHistory,
  }

}

function clientInjection({config}) { // 到客户端前的数据注入, 例如 添加测试 api, 统一处理数据格式
  function setHeader(reqOrRes, headerObj = {}) {
    reqOrRes.setHeader = reqOrRes.setHeader || reqOrRes.set || function (key, val) {reqOrRes.headers[key] = val}
    Object.keys(headerObj).forEach(key => {
      reqOrRes.setHeader(key, headerObj[key])
    })
  }

  function allowCors({res, req}) { // 设置为允许跨域
    if(config.cors === false) { // config.cors 为 false 时, 则不允许跨域
      return false
    }
    res && setHeader(res, {
      'access-control-allow-origin': req.headers.origin || `*`
    })
    req && setHeader(req, { // 一些服务器会校验 req 中的 referer, host
      'referer': config.origin,
      'host': (new URL(config.origin)).host
    })
  }

  function handleRes(res, data) {
    return {
      code: res.statusCode,
      success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
      data,
    }
  }

  function setApiInHeader({req, res}) { // 设置 testApi 页面到 headers 中
    const apiCount = localStore(config.store).get(`apiCount`) + 1
    const apiId = string10to62(apiCount)
    const testApi = `http://${getOsIp()}:${config.testProt}/#/history,${apiId}/${req.method.toLowerCase()}${req.originalUrl}`
    setHeader(res, {[config.apiInHeader]: testApi})
  }

  return {
    setHeader,
    allowCors,
    handleRes,
    setApiInHeader,
  }
}

function reqHandle({config}) { // 请求处理程序
  function sendReq({token, getHistory, history, api, cb, apiId}) { // 发送请求
    const axios = require('axios')
    const fs = require(`fs`)

    // api httpHistory 中的 api
    // console.log(`httpHistory[api]`, httpHistory[api])
    const httpDataReq = getHistory({history, fullApi: api, id: apiId}).data.req
    const {line: {path, query, params}, headers} = httpDataReq.lineHeaders
    const [, method, url] = api.match(/(\w+)\s+(.*)/)
    let resErr = {message: ``, config: {}}
    if(token && config.updateToken) { // 更新 TOKEN
      headers.authorization = token
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

  return {
    sendReq,
  }

}

function getJsonServerMiddlewares() { // 获取 jsonServer 中的中间件
  // 利用 jsonServer 已有的中间件, 而不用额外的安装
  // 注意: 可能根据 jsonServer 版本的不同, 存在的中间件不同

  const jsonServer = require('json-server')
  const middlewares = jsonServer.defaults({bodyParser: true}) // 可以直接使用的所有中间件数组
  const middlewaresObj = middlewares.flat().reduce((res, item) => {
    // 使用 jsonServer 里面的中间件, 以保持一致:
    // compression, corsMiddleware, serveStatic, logger, jsonParser, urlencodedParser
    return ({
      ...res,
      [item.name]: item,
    })
  }, {})
  return {middlewares, middlewaresObj}
}

function localStore(storePath) { // 存取需要持久化存储的数据
  const fs = require(`fs`)
  let store = () => JSON.parse(fs.readFileSync(storePath, `utf-8`))
  return {
    set(key, val) {
      const newStore = store()
      newStore[key] = val
      fs.writeFileSync(storePath, o2s(newStore))
      return store
    },
    get(key) {
      const newStore = store()
      return newStore[key]
    },
    updateApiCount() {
      const apiCountOld =  this.get(`apiCount`) || 0
      this.set(`apiCount`, apiCountOld + 1)
      return this.get(`apiCount`)
    },
  }
}

function isEmpty(value) { // 判断空值
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

function parseRePath(rePath, url) { // 使用 path-to-regexp 转换 express 的 router, 并解析参数为对象
  // 注: path-to-regexp 1.x 自带 match 方法可处理此方法, 但是当前的 json-server 依赖的 express 的路由语法仅支持 path-to-regexp@0.1.7
  // 所以只能手动转换, 参考: https://github.com/ForbesLindesay/express-route-tester/blob/f39c57fa660490e74b387ed67bf8f2b50ee3c27f/index.js#L96
  const pathToRegexp = require('path-to-regexp')
  const keys = []
  const re = pathToRegexp(rePath, keys)
  const pathUrl = url
  const result = re.exec(pathUrl)
  const obj = keys.reduce((acc, cur, index) => {
    acc[cur.name] = result[index + 1]
    return acc
  }, {})
  return obj
}

function isFileEmpty(file) { // 判断文件是否存或为空
  const fs = require(`fs`)
  return (
    (hasFile(file) === false)
    || fs.readFileSync(file, `utf-8`).trim() === ``
  )
}

function fullApi2Obj(api) {
  let [, method, url] = api.match(/(\w+)\s+(.*)/) || [, api.trim()]
  const {path} = getClientUrlAndPath(url)
  return {path, method, url}
}

function removeEmpty(obj) { // 删除对象中为空值的键
  obj = {...obj}
  Object.keys(obj).forEach(key => {
    if (isEmpty(obj[key])) {
      delete obj[key]
    }
  })
  return obj
}

function hasFile(filePath) { // 判断文件或目录是否存在
  const fs = require(`fs`)
  return fs.existsSync(filePath)
}

function handlePathArg(pathStr) { // 处理命令行上传入的路径参数, 如果是相对路径, 则相对于运行命令的目录, 而不是相对于书写 require() 方法文件的目录
  const path = require(`path`)
  let newPathStr = path.isAbsolute(pathStr) ? pathStr : `${process.cwd()}/${pathStr}` // 如果是相对路径, 则相对于运行命令的位置
  newPathStr = path.normalize(newPathStr) // 转换为跨平台的路径
  return newPathStr
}

function getOptions(cmd) { // curl 命令转 body
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

function parseArgv(arr) { // 解析命令行参数
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, v] = arg.split('==')
    acc[k] = v === undefined // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === 'true'
        : (
          /[\d|\.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}

function string10to62(number) { // 10 进制转 62 进制, 用来压缩数字长度
  const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('')
  const radix = chars.length
  const arr = []
  let qutient = +number
  do {
    mod = qutient % radix;
    qutient = (qutient - mod) / radix;
    arr.unshift(chars[mod]);
  } while (qutient);
  return arr.join('');
}

function string62to10(str) { // 62 进制转 10 进制
  str = String(str)
  const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'
  const radix = chars.length
  const len = str.length
  let origin_number = 0
  let i = 0
  while (i < len) {
    origin_number += Math.pow(radix, i++) * chars.indexOf(str.charAt(len - i) || 0);
  }
  return origin_number;
}

function nextId() { // 获取全局自增 id
  global.id = (global.id || 0) + Date.now() + 1
  return global.id
}

function getClientIp (req) { // 获取客户端 IP
  let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
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

function o2s(o) { // 对象转字符串
  return JSON.stringify(o, null, 2)
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

function getOsIp() { // 获取系统 ip
  const obj = require(`os`).networkInterfaces()
  const ip = Object.keys(obj).reduce((res, cur, index) => {
    return [...res, ...obj[cur]]
  }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
  return ip
}

function isType(data, type) { // 判断数据是否为 type, 或返回 type
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}

function getClientUrlAndPath (originalUrl) { // 获取从客户端访问的 url 以及 path
  // 当重定向路由(mock api)时, req.originalUrl 和 req.url 不一致, req.originalUrl 为浏览器中访问的 url, 应该基于这个 url 获取 path
  return {
    url: originalUrl,
    path: (new URL(originalUrl, `http://127.0.0.1`)).pathname,
  }
}
function delRequireCache(filePath) {
  delete require.cache[require.resolve(filePath)]
}

module.exports = {
  initHandle,
  reqHandle,
  clientInjection,
  historyHandle,
  customApi,
  getJsonServerMiddlewares,
  localStore,
  delRequireCache,
  isFileEmpty,
  parseRePath,
  fullApi2Obj,
  handlePathArg,
  nextId,
  getClientUrlAndPath,
  isType,
  getOsIp,
  emptyFn,
  o2s,
  hasFile,
  string10to62,
  string62to10,
  getClientIp,
  isEmpty,
  removeEmpty,
  parseArgv,
}
