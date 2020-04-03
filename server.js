const modifyResponse = require('node-http-proxy-json')
const filenamify = require('filenamify')
require('./log.js').logHelper()
const axios = require('axios')
const mime = require('mime')
const {htmlEscape} = require('escape-goat')
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
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
// server.use(middlewaresObj.corsMiddleware)

server.use(proxy(
  pathname => (Boolean(pathname.match(`/${config.preFix}/${config.proxyTag}/`)) === false),
  {
    target: config.proxyTarget,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      middlewaresObj.jsonParser(req, res, () => {
        const {
          method,
          url,
        } = req
        if(ignoreHttpHistory(req) === false) {
          setHttpHistory(`${method} ${url}`, {req})
        }
      })
      TOKEN = req.get('Authorization') || TOKEN // 获取 token
    },
    onProxyRes: (proxyRes, req, res) => {
      if(ignoreHttpHistory(req) === false) {
        const data = [];
        proxyRes.on('data', function(chunk) {
          data.push(chunk);
        }).on('end', function() {
          const {
            method,
            url,
          } = req
          const {statusCode, statusMessage, headers} = proxyRes
          const fullApi = `${method} ${url}`
          const buffer = Buffer.concat(data);
          const contentType = headers[`content-type`]
          const extensionName = mime.getExtension(contentType)
          const bodyPathOld = (getHttpHistory(req, 'url').res || {body: {}}).body.bodyPath
          // 保存 body 数据文件, 由于操作系统对文件名长度有限制, 下面仅取 url 的前 100 个字符, 后面自增

          function createBodyPath() {
            return `${config.dataDir}/${
              filenamify(
                `${url.slice(1, 100)}_${method}_body_${nextId()}.${extensionName}`,
                {maxLength: 255, replacement: '_'}
              )
            }`
          }

          // 使用 bodyPath 的后缀判断文件类型, 如果与新请求的 contentType 不同, 则更改原文件名后缀
          let bodyPath = bodyPathOld || createBodyPath()
          if(mime.getType(bodyPathOld) !== contentType) {
            bodyPath = bodyPath.replace(/(.*\.)(.*)/, `$1${extensionName}`)
          }

          fs.writeFileSync(bodyPath, buffer, {encoding: 'buffer'})
          console.log(`${method} ${req.path} ${statusCode} ${statusMessage}`)
          setHttpHistory(fullApi, {res: {
            info: {
              status: statusCode,
              statusText: statusMessage,
            },
            body: {
              contentType,
              extensionName,
              bodyPath,
            },
            headers: headers,
          }})
        });

      }

    },
  },
))

server.use(jsonServer.rewriter({ // 修改路由, 方便后面的 api 书写
  [`/${config.preFix}/*`] : '/$1',
}))
server.use(middlewares) // 添加中间件, 方便取值
server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  req.query.page && (req.query._page = req.query.page)
  req.query.pageSize && (req.query._limit = req.query.pageSize)
  const {url, body, query, params} = req
  next()
})

serverTest.get(`/`, (req, res, next) => {
  res.type('html')
  res.send(`
    <ul style="word-wrap: break-word;">
      ${Object.keys(httpHistory).map(key => {
        const {info = {}} = httpHistory[key].res || {}
        const [, method, url] = key.match(/(\w+)\s+(.*)/)
        return `
          <li><a href="/${method}${url}">
            ${info.status || '--'}
            ${htmlEscape(key)}
          </a></li>
        `
      }).join('')}
    </ul>
  `)
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
  if(action === 'replay') {
    sendReq(api, () => {
      res.json({message: '重发请求完成'})
    })
    return
  } else {
    let httpRes
    let httpReq
    let bodyPath
    let contentType
    try {
      httpRes = {...httpHistory[api].res}
      httpReq = {...httpHistory[api].req}
      bodyPath = httpRes.body.bodyPath
      contentType = httpRes.headers[`content-type`]
    } catch (error) {
      console.log('error', {api, error})
      res.json('暂无请求数据')
      return
    }

    if(action === 'getBodyFile') {
      res.sendFile(require('path').resolve(bodyPath))
      return true
    }

    const mainPath = `/`
    const replayApi = `/${method},replay${rawApi}`
    const getBodyFileApi = `/${method},getBodyFile${rawApi}`

    res.type('html')
    res.send(`
      <style>
        body.api {
          margin: 0;
          padding: 10px;
          // background: #000;
        }
        body.api>.sketch {
          word-wrap: break-word;
          // color: #fff;
        }
        body.api>button {
          cursor: pointer;
        }
        body.api>button a {
          text-decoration: none;
          color: initial;
        }
        body.api>details summary {
          cursor: pointer;
          border-bottom: 1px solid #666;
          outline: none;
          font-size: 14px;
          // color: #fff;
        }
        body.api>details summary .replay {
          display: inline-block;
        }
        body.api>details textarea {
          font-size: 12px;
          padding: 4px;
          width: 100%;
          height: 40vh;
          // color: #fff;
          outline: none;
          font-size: nomore;
          resize: vertical;
          border: none;
          // background: #333;
        }
        body.api>details .html {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          border: 0;
          outline: none;
        }
      </style>
      <body class="api">
      <div class="sketch">${httpHistory[api].res.info.status} ${htmlEscape(api)}</div>
      <button><a href="${mainPath}">返回</a></button>
      <button onClick="replay('${api}')">重发</button>
      <button onClick="openRes('${getBodyFileApi}')">Response</button>
      <details>
        <summary>----- input:</summary>
        <textarea disabled spellcheck="false">${o2s(httpReq)}</textarea>
      </details>
      <details open="open">
        <summary>----- out:</summary>
        <textarea disabled spellcheck="false">${o2s({
          ...(httpRes || {}),
          body: contentType === `application/json` ? JSON.parse(fs.readFileSync(bodyPath, 'utf8')) : undefined, // 删除 body
        })}</textarea>
      </details>
      <script src="https://unpkg.com/axios@0.19.1/dist/axios.js"></script>
      <script>
        let isDone = true
        function openRes(api) {
          window.open(api)
        }
        function replay(api) {
          if(isDone) {
            isDone = false
            axios({
              // baseURL: '${config.myHttpSever}',
              method: 'get',
              url: '${replayApi}',
            }).then(({data, status, statusText, headers, config, request}) => {
              console.log({data, status, statusText, headers, config, request})
              isDone = true
              alert('重发完成')
              document.location.reload()
            }).catch(err => {
              console.error(err)
              alert('重发失败')
            })
          } else {
            alert('请等待重发结束')
          }
        }
      </script>
      </body>
    `)
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

serverReplay.use(proxy( // 重放也可以使用 /t/* 临时接口
  pathname => (Boolean(pathname.match(`/${config.preFix}/`)) === true),
  {
    target: `http://localhost:${config.prot}/`,
  },
))
serverReplay.use(middlewares)
serverReplay.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  const history = getHttpHistory(req, 'url')
  try {
    res.json(history.res.body)
  } catch (error) {
    // res.json({})

    // 对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能)
    // 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以正常运行
    res.json(handleRes(res, {}))
  }
})
serverReplay.listen(config.replayProt, () => {
  console.log(`服务器重放地址: http://localhost:${config.replayProt}/`)
})
serverTest.listen(config.testProt, () => {
  console.log(`接口调试地址: http://localhost:${config.testProt}/`)
})

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
      method.match(/GET/i) && url.match(new RegExp(`/\/${config.preFix}\//`))
    )
  )
}

function getHttpHistory(req, type) { // 获取某个请求的记录
  // type: url|path 匹配方式, path 会忽略 url 上的 query 参数

  if(type === 'url') {
    return httpHistory[`${req.method} ${req.url}`]
  }
  if(type === 'path') {
    let re = new RegExp(`^${req.method} `)
    let key  = Object.keys(httpHistory).find(key => {
      return (key.match(re) && (httpHistory[key].req.path === req.path))
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

function setHttpHistory(api, {req, res}) {
  const [, method, url] = api.match(/(\w+)\s+(.*)/)
  httpHistory[`${method} ${url}`] = {
    ...httpHistory[`${method} ${url}`],
    ...(
      req
      ? {
          req: {
            headers: req.headers,
            body: req.body,
            // params: req.params,
            query: req.query,
            path: req.path,
          }
        }
      : {
          res: {
            info: res.info,
            headers: res.headers,
            body: res.body,
          }
        }
    ),
  }
  fs.writeFileSync(config.httpHistory, o2s(httpHistory))
}

function sendReq(api, cb) { // 发送请求
  // api httpHistory 中的 api
  const {body, params, query, headers, path} = httpHistory[api].req
  const [, method, url] = api.match(/(\w+)\s+(.*)/)
  if(TOKEN && config.updateToken) { // 更新 TOKEN
    headers.authorization = TOKEN
  }
  axios({
    baseURL: config.myHttpSever,
    method,
    url: path || url,
    params: query,
    headers,
    data: body,
    responseType: 'arraybuffer',
  }).then(res => {
    const {data, status, statusText, headers, config, request} = res
  }).catch(err => {
    const {data, status, statusText, headers, config, request} = err.response
  }).finally(() => {
    cb()
  })
}

function nextId() {
  global.id = (global.id || 0) + 1
  return global.id
}
