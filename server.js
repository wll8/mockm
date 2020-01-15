const modifyResponse = require('node-http-proxy-json')
const {htmlEscape} = require('escape-goat')
const config = require('./config.js')
const preFix = 'api' // api 地址前缀
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const server = jsonServer.create()
const db = require('./db.js')()
fs.writeFileSync('./db.json', o2t(db))
const router = jsonServer.router('./db.json')
const middlewares = jsonServer.defaults({bodyParser: true})
const httpHistory = require('./httpHistory.json') // 请求历史
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
let TOKEN = ''
// server.use(middlewaresObj.corsMiddleware)

server.use(proxy(
  pathname => (Boolean(pathname.match(`/${preFix}/${config.proxyTag}/`)) === false),
  {
    target: config.proxyTarget,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      middlewaresObj.jsonParser(req, res, () => {
        const {
          method,
          url,
        } = req
        httpHistory[`${method} ${url}`] = {
          req: {
            headers: req.headers,
            body: req.body,
            params: req.params,
            query: req.query,
          },
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
        if( // 这些路由不记录
          method.match(/OPTIONS/i)
          || (
            method.match(/GET/i) && url.match(new RegExp(`/\/api\/${config.proxyTag}\/${config.apiTest}/`))
          )
        ) {
          return body
        }
        httpHistory[`${method} ${url}`] = {
          ...httpHistory[`${method} ${url}`],
          res: {
            headers: proxyRes.headers,
            body,
          }
        }
        fs.writeFileSync(`./httpHistory.json`, o2t(httpHistory))
        // console.log('httpHistory', o2t(httpHistory))
        return body
      })
    },
  },
))

server.use(jsonServer.rewriter({ // 修改路由, 方便后面的 api 书写
  [`/${preFix}/${config.proxyTag}/*`] : '/$1',
}))
server.use(middlewares)
server.use((req, res, next) => { // 修改分页参数, 符合项目中的参数
  req.query.page && (req.query._page = req.query.page)
  req.query.pageSize && (req.query._limit = req.query.pageSize)
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
  const {api} = req.query
  if(!api) {
    res.type('html')
    res.send(Object.keys(httpHistory).map(item => `<a href="/api/${config.proxyTag}/${config.apiTest}?api=${querystring.escape(item)}">${item}</a>`).join('<br />'))
    return
  }

  new Promise(() => {
    let isHtml
    let httpRes
    let httpReq
    try {
      httpReq = httpHistory[api].req
      httpRes = httpHistory[api].res
      isHtml = httpRes.headers[`content-type`].includes(`text/html`)
    } catch (error) {
      console.log('error', {api, error})
      res.send(error)
      return
    }
    res.type('html')
    res.send(`
      <style>
        body.api {
          margin: 0;
          padding: 10px;
          background: #000;
        }
        body.api>.sketch {
          color: #fff;
        }
        body.api>details summary {
          cursor: pointer;
          border-bottom: 1px solid #666;
          outline: none;
          font-size: 14px;
          color: #fff;
        }
        body.api>details textarea {
          font-size: 12px;
          padding: 4px;
          width: 100%;
          height: 40vh;
          color: #fff;
          outline: none;
          font-size: nomore;
          resize: vertical;
          border: none;
          background: #333;
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
      <span class="sketch">${api}</span>
      <details>
        <summary>----- input:</summary>
        <textarea disabled spellcheck="false">${o2t(httpReq)}</textarea>
      </details>
      <details open="open">
        <summary>----- out:</summary>
        ${isHtml ? `<iframe class="html" srcdoc="${htmlEscape(httpRes.body)}"></iframe>` : `<textarea disabled spellcheck="false">${o2t(httpRes)}</textarea>`}
      </details>
      </body>
    `)
  })
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

function o2t(o) {
  return JSON.stringify(o, null, 2)
}

function getToken() {}
