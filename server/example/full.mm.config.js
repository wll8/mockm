/**
 * 文档: https://www.hongqiye.com/doc/mockm
 * @type {import('mockm/@types/config').Config}
 */

module.exports = util => {
  const {
    libObj: { midResJson, axios, mime, mockjs },
    toolObj,
  } = util
  return {
    disable: false,
    osIp: `127.0.0.1`,
    port: 9000,
    testPort: 9005,
    replayPort: 9001,
    replayProxy: true,
    replayProxyFind (item) {
      const bodyPath = item.data.res.bodyPath
      if(bodyPath && bodyPath.match(/\.json$/)) {
        const bodyPathCwd = require(`path`).join(process.cwd(), bodyPath)
        const body = require(bodyPathCwd)
        return body.status === 200 || body.status === `200`
      } else {
        return false
      }
    },
    hostMode: false,
    updateToken: true,
    apiInHeader: true,
    // proxy: 'http://httpbin.org/',
    proxy: { // string | object
      '/': `http://www.httpbin.org/`,
      // '/get': [`origin`, `127.0.0.1`], // 快速修改 json 格式的 body
      // '/get': [{msg: `ok`}],
      // '/get': [{origin: `127.0.0.1`, msg: `ok`, headers: {tips: `mid`}}, `deep`],

      // 自定义拦截过程, 参考 https://github.com/chimurai/http-proxy-middleware#http-proxy-options
      '/get': {
          onProxyReq (proxyReq, req, res) { // 拦截请求
            proxyReq.setHeader(`x-added`, `req`)
          },
          mid (req, res, next) { // 在进行代理之前添加中间件
            setTimeout(next, 2000) // 延时
          },
          onProxyRes (proxyRes, req, res) { // 拦截响应
            midResJson({proxyRes, res, key: `origin`, val: `127.0.0.1`}) // 修改 body
            proxyRes.headers[`x-added`] = `res` // 修改 headers
          },
      },

      // [fn] 使用函数处理内容
      '/anything/proxy/fn':[({req, json}) => {
        return (json.method + req.method).toLowerCase() // getget
      }],

      // [fn, fn] 函数1完成后, 传给函数2
      '/anything/proxy/fn_fn':[({req, json}) => {
        return json.method
      }, ({req, json}) => {
        return json.toLowerCase() // get
      }],

      // [fn, string] 函数处理后值, 通过路径再进入获取
      '/anything/proxy/fn_string':[({req, json}) => {
        return json
      }, `method`], // GET

      // [string, fn] 把路径对应的值取出来, 传给后面的函数
      '/anything/proxy/string_fn':[`method`, ({req, json}) => {
        return json.toLowerCase() // get
      }],
      '/any/proxy/test/byConfigAPICoverage': `/anything/proxy/test/byConfigAPICoverage`,
      '/any/proxy/test/slashSuffix1/': `/anything/proxy/test/slashSuffix1/`,
      '/any/proxy/test/slashSuffix2': `/anything/proxy/test/slashSuffix2`,
      '/any/proxy/test/slashSuffix3': `/anything/proxy/test/slashSuffix3/`,
    },
    remote: false,
    openApi: `http://httpbin.org/spec.json`,
    cors: true,
    dataDir: `./httpData/`,
    dbJsonPath: `./httpData/db.json`,
    dbCover: false,
    db () {
      const data = mockjs.mock({
        'books|40-60': [
          {
            'id|+1': 1,
            user: /\d\d/,
            view: /\d\d\d\d/,
            'type|1': [`js`, `css`, `html`],
            'discount|1': [`0`, `1`],
            author: {
              'name|1': [`张三`, `李四`],
            },
            title: `@ctitle`,
          },
        ],
      })
      return data
    },
    route: {
      '/db/api/*': `/$1`,
    },
    apiWeb: `./apiWeb.json`,
    apiWebWrap: wrapApiData,
    api (util) {
      const { run } = util
      return { // api 拦截器
        '/' (req, res, next) { // 在所有自定义 api 之前添加中间件
          // 注意, 如果不调用 next 将不会进入后面的中间件
          // 如果需要拦截所有到达服务器前的请求, 请从 config.proxy 中配置
          next()
        },
        '* /all/method' (req, res, next) { // * 号代表处理此路径的所有方法
          res.json({msg: req.method, url: req.url})
        },
        '* /test/:pathArg' (req, res, next) {
          res.json({
            method: req.method,
            params: req.params,
            query: req.query,
            headers: req.headers,
            body: req.body,
          })
        },
        async 'post /file/upload' (req, res, next) { // 获取客户端上传的文件
          const multiparty = await toolObj.generate.initPackge(`multiparty`)
          const form = new multiparty.Form()
          form.parse(req, (err, fields = [], files) => {
            const data = {fields, files, err}
            res.json(data)
          })
        },
        'get /ip': {res: `127.0.0.1`},
        '/anything/overrideProxy': `ok`,
        '/any/proxy/test/byConfigAPICoverage': `ok`,
        'get /name': {name: mockjs.mock(`@cname`)},
        'get /file' (req, res, next) { // 发送文件
          res.sendFile(__filename)
        },
        'post /status/:code' (req, res, next) { // 获取 url 上的 params, query 以及 body 参数
          const {params, query, body} = req
          res.status(params.code).json({params, query, body})
        },
        // curl-snippet
        'get /curl' (req, res, next) { // 运行 curl/bash 命令并获取执行结果
          // 示例 curl/bash 命令
          const cmd = `
            curl 'http://www.httpbin.org/ip' \
              -H 'Accept: */*' \
              -H 'Accept-Language: zh-CN,zh;q=0.9' \
              --compressed \
              --insecure
          `
          run.curl({req, res, cmd}).then(curRes => {
            res.send(curRes.body)
          })
        },
        // curl-snippet
        // fetch-snippet
        async 'get /fetch' (req, res, next) { // 运行 fetch 方法并获取执行结果
          const fetch = await toolObj.generate.initPackge(`node-fetch`)
          // 示例 fetch 方法
          const fetchRes = fetch(`http://www.httpbin.org/ip`, {
            "headers": {
              "accept": `*/*`,
              "accept-language": `zh-CN,zh;q=0.9`,
            },
          })
          run.fetch({
            req,
            res,
            fetchRes,
          }).then(async thenRes => {
            const thenResOk = await thenRes.buffer()
            res.send(thenResOk)
          }).catch(err => console.log(`err`, err))
        },
        // fetch-snippet
        'ws /wsecho' (ws, req) { // 创建 websocket API
          ws.send(`连接成功`)
          ws.on(`message`, (msg) => {
            ws.send(msg)
          })
        },
      }
    },
    resHandleReplay: ({req, res}) => wrapApiData({code: 200, data: {}}),
    resHandleJsonApi: ({req, res: { statusCode: code }, data}) => wrapApiData({code, data}),
    watch: [],
    clearHistory: false,
    guard: false,
    backOpenApi: 10,
    static: [],
    disableRecord: false,
  }
}

function wrapApiData({data, code = 200}) {
  code = String(code)
  return {
    code,
    success: Boolean(code.match(/^[2]/)),
    data,
  }
}
