const config = require('./config.js')
const preFix = 'api' // api 地址前缀
const proxy = require('http-proxy-middleware')
const jsonServer = require('json-server')
const fs = require('fs')
const server = jsonServer.create()
const db = require('./db.js')()
fs.writeFileSync('./db.json', JSON.stringify(db, null, 2))
const router = jsonServer.router('./db.json')
const middlewares = jsonServer.defaults()
const multiparty = require('multiparty')
let TOKEN = ''
let CMD = `
  curl http://www.httpbin.org/get
`

server.use(proxy(
  pathname => (Boolean(pathname.match(`/${preFix}/t/`)) === false),
  {
    target: config.proxyTarget,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      TOKEN = req.get('Authorization') || TOKEN // 获取 token
    },
    onProxyRes: (proxyRes, req, res) => {
      if(req.method === 'OPTIONS') {
        // // 配置跨域跨域之后, 可以直接在浏览器控制台使用 fetch 测试 api, 但是如果配置没有与后端一致, 则导致模拟不统一
        // proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin
        // proxyRes.headers['Access-Control-Allow-Credentials'] = true
        // proxyRes.headers['Access-Control-Allow-Methods'] = 'PUT, GET' // 允许的方法列表
        // proxyRes.headers['Access-Control-Allow-Headers'] = 'authorization, cache-control' // 允许的自定义 headers
        // proxyRes.headers['Access-Controll-Max-Age'] = '1728000' // 在些时间内不需再申请跨域
      }
    },
  },
))

server.use(middlewares)
server.use(jsonServer.bodyParser)

server.use(jsonServer.rewriter({ // 修改路由, 方便后面的 api 书写
  [`/${preFix}/${config.proxyTag}/*`] : '/$1',
}))
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

server.get('/test', (req, res, next) => { // 给后端查询前端请求的接口
  let cmd = `${CMD} -s -l -v -g`
    .replace(/\n/g, '')
    .trim()
  if(TOKEN) {
    cmd = cmd.replace(/(Authorization: ).*?'/, `$1${TOKEN}'`)
  }
  let jsonInfo = {obj: {}, str: ''}
  try {
    jsonInfo.obj = getOptions(cmd)
    jsonInfo.str = JSON.stringify(jsonInfo.obj, null, 2)
  } catch (error) {
    console.log('error', error)
  }
  new Promise(() => {
    require('child_process').exec(cmd, (err, stdio, stderr) => {
      let isHtml = stderr.includes('< content-type: text/html')
      try {
        stdio = JSON.stringify(JSON.parse(stdio), null, 2)
      } catch (error) {
        isHtml = true
        console.log('error', error)
      }
      res.type('html')
      res.send(`
        <style>
           body {
             margin: 0;
             padding: 10px;
             background: #000;
             color: #fff;
           }
           body>pre {
             white-space: pre-wrap;
             overflow: scroll;
           }
           body>pre>details>summary {
             cursor: pointer;
             border-bottom: 1px solid #666;
             outline: none;
             font-size: 14px;
           }
           body>pre>details>textarea {
             font-size: 12px;
             width: 100%;
             height: 40vh;
             color: #fff;
             outline: none;
             font-size: nomore;
             resize: vertical;
             border: none;
             background: #333;
           }
        </style>
        <pre>
${jsonInfo.obj.method || 'GET'} ${jsonInfo.obj.url}
<details>
<summary>----- input:</summary>
<textarea disabled spellcheck="false">${jsonInfo.str}</textarea>
</details>
<details open="open">
<summary>----- out:</summary>
${isHtml ? stdio : `<textarea disabled spellcheck="false">${stdio}</textarea>`}
</details>
<details>
<summary>----- headers:</summary>
<textarea disabled spellcheck="false">${stderr}</textarea>
</details>
        </pre>
      `)
      // res.json({
      //   res: JSON.parse(cmdRes),
      // })
    })
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

function getToken() {}
