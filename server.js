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

server.use(proxy(
  pathname => (Boolean(pathname.match(`/${preFix}/t/`)) === false),
  {
    target: config.proxyTarget,
    changeOrigin: true,
    onProxyRes: (proxyRes, req, res) => { // 跨域配置
      if(req.method === 'OPTIONS') {
        proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin
        proxyRes.headers['Access-Control-Allow-Credentials'] = true
        proxyRes.headers['Access-Control-Allow-Methods'] = 'PUT, GET, POST, DELETE, OPTIONS'
        proxyRes.headers['Access-Control-Allow-Headers'] = 'authorization,cache-control,content-type,pragma,x-requested-with'
        proxyRes.headers['Access-Controll-Max-Age'] = '1728000'
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

