const modifyResponse = require('node-http-proxy-json')
const {htmlEscape} = require('escape-goat')
const config = require('./config.js')
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const server = jsonServer.create()
const db = require('./db.js')()
fs.writeFileSync(config.dbJsonName, o2t(db))
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
const multiparty = require('multiparty')
const axios = require('axios')
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
      const {
        method,
        url,
      } = req
      modifyResponse(res, proxyRes, body => {
        const {statusCode, statusMessage} = proxyRes
        if(ignoreHttpHistory(req) === false) {
          console.log(`${method} ${req.path} ${statusCode} ${statusMessage}`)
          setHttpHistory(`${method} ${url}`, {res: {
            info: {
              status: proxyRes.statusCode,
              statusText: proxyRes.statusMessage,
            },
            body,
            headers: proxyRes.headers,
          }})
        }
        return body
      })
    },
  },
))

server.use(jsonServer.rewriter({ // 修改路由, 方便后面的 api 书写
  [`/${config.preFix}/${config.proxyTag}/*`] : '/$1',
}))
server.use(middlewares)
server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  req.query.page && (req.query._page = req.query.page)
  req.query.pageSize && (req.query._limit = req.query.pageSize)
  const {url, body, query, params} = req
  next()
})
server.post('/file/upload', (req, res, next) => { // 上传文件
  const form = new multiparty.Form()
  form.parse(req, (err, fields = [], files) => {
    const data = {fields, files, err}
    res.json(data)
  })
})

server.get(`/${config.apiTest}`, (req, res, next) => { // 给后端查询前端请求的接口
  const {api, action} = req.query
  if(!api) {
    res.type('html')
    res.send(`
      <ul style="word-wrap: break-word;">
        ${Object.keys(httpHistory).map(key => {
          const {info = {}} = httpHistory[key].res || {}
          return `
            <li><a href="/${config.preFix}/${config.proxyTag}/${config.apiTest}?api=${querystring.escape(key)}">
              ${info.status || '--'}
              ${htmlEscape(key)}
            </a></li>
          `
        }).join('')}
      </ul>
    `)
    return
  }
  if(action === 'replay') {
    sendReq(api, () => {
      res.json({message: '重发请求完成'})
    })
    return
  } else {
    new Promise(() => {
      let isHtml
      let httpRes
      let httpReq
      try {
        httpReq = httpHistory[api].req
        httpRes = httpHistory[api].res
        try {
          isHtml = (httpRes.headers[`content-type`] || '').includes(`text/html`)
        } catch (error) {
          isHtml = false
        }
      } catch (error) {
        console.log('error', {api, error})
        res.json('暂无请求数据')
        return
      }
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
        <button><a href="/api/t/test">返回</a></button>
        <button onClick="replay('${api}')">重发</button>
        <details>
          <summary>----- input:</summary>
          <textarea disabled spellcheck="false">${o2t(httpReq)}</textarea>
        </details>
        <details open="open">
          <summary>----- out:</summary>
          ${
            isHtml
            ? `<iframe class="html" srcdoc="${htmlEscape(httpRes.body)}"></iframe>`
            : `<textarea disabled spellcheck="false">${o2t(httpRes || {})}</textarea>`
          }
        </details>
        <script src="https://unpkg.com/axios@0.19.1/dist/axios.js"></script>
        <script>
          let isDone = true
          function replay(api) {
            if(isDone) {
              isDone = false
              axios({
                baseURL: '${config.myHttpSever}',
                method: 'get',
                url: 'api/t/test',
                params: {api, action: 'replay'},
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
    })
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
      method.match(/GET/i) && url.match(new RegExp(`/\/${config.preFix}\/${config.proxyTag}\/${config.apiTest}/`))
    )
  )
}

function init() {
  !hasFile(config.httpHistory) && fs.writeFileSync(config.httpHistory, `{}`)
}

function hasFile(filePath) {
  return fs.existsSync(filePath)
}

function o2t(o) {
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
  fs.writeFileSync(config.httpHistory, o2t(httpHistory))
}

function sendReq(api, cb) { // 发送请求
  // api httpHistory 中的 api
  const {body, params, query, headers, path} = httpHistory[api].req
  const [, method, url] = api.match(/(\w+)\s+(.*)/)
  if(TOKEN && config.updateToken) { // 更新 TOKEN
    headers.authorization = TOKEN
  }
  axios({
    baseURL: 'http://localhost:9000/',
    method,
    url: path || url,
    params: query,
    headers,
    data: body,
  }).then(res => {
    const {data, status, statusText, headers, config, request} = res
    setHttpHistory(api, {res: {
      info: {
        status,
        statusText,
      },
      headers,
      body: data,
    }})
  }).catch(err => {
    const {data, status, statusText, headers, config, request} = err.response
    setHttpHistory(api, {res: {
      info: {
        status,
        statusText,
      },
      headers,
      body: data,
    }})
    console.log('err', {data})
  }).finally(() => {
    cb()
  })
}
