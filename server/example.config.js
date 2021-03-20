/**
 * 文档: https://www.hongqiye.com/doc/mockm
 */

module.exports = util => {
  const {
    libObj: { midResJson, axios, mime, mockjs },
    toolObj,
  } = util
  return {
    disable: false, // 是否禁用所有自定义 api, 直接通往目标服务器
    osIp: `127.0.0.1`, // 调试IP
    port: 9000, // 本地端口
    testPort: 9005, // 调试端口
    replayPort: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
    replayProxy: true, // 记录中不存在所需请求时, 是否转发请求到 proxy
    replayProxyFind (item) { // 自定义请求重放时的逻辑
      const bodyPath = item.data.res.bodyPath
      if(bodyPath && bodyPath.match(/\.json$/)) {
        const bodyPathCwd = require(`path`).join(process.cwd(), bodyPath)
        const body = require(bodyPathCwd)
        return body.status === 200 || body.status === `200`
      } else {
        return false
      }
    },
    hostMode: false, // host 模式
    updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
    apiInHeader: true, // 在 header 中添加调试 api 地址, true: 是; false, 否; string: 以 string 为 header key
    // proxy: 'http://httpbin.org/', // 后台服务器的的 api
    proxy: { // string | object
      '/': `http://www.httpbin.org/`,
      // '/get': [`origin`, `127.0.0.1`], // 快速修改 json 格式的 body
      // '/get': [{msg: `ok`}],
      // '/get': [{origin: `127.0.0.1`, msg: `ok`, headers: {tips: `mid`}}, `deep`],

      // 自定义拦截过程, 参考 https://github.com/chimurai/http-proxy-middleware#http-proxy-options
      '/get': {
          onProxyReq (proxyReq, req, res) { // 拦截请求
            proxyReq.setHeader('x-added', 'req');
          },
          mid (req, res, next) { // 在进行代理之前添加中间件
            setTimeout(next, 5000) // 延时
          },
          onProxyRes (proxyRes, req, res) { // 拦截响应
            midResJson({proxyRes, res, key: `origin`, val: `127.0.0.1`}) // 修改 body
            proxyRes.headers['x-added'] = 'res' // 修改 headers
          },
      },
    },
    remote: false, // false | object, 为 false 是不需要外网映射, 为 object 时是对每个服务端口的配置 `{testPort: { proto: `http` }}` , 参考 https://github.com/bubenshchykov/remote
    openApi: `http://httpbin.org/spec.json`, // 关联的 openApi 数据文件
    cors: true, // 是否允许通过跨域
    dataDir: './httpData/', // 数据保存目录
    dbJsonPath: './httpData/db.json', // json 数据生成的保存位置, 默认为 dataDir 下的 db.json
    dbCover: false, // 每次启动总是生成新的 db
    db () { // 供 json-server 使用的 json 数据, function || object
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
            title: '@ctitle',
          }
        ],
      })
      return data
    },
    route: {
      // 路由映射, 作用于 config.api 及 config.db 产生的 api
      // 参考: https://github.com/typicode/json-server#add-custom-routes
      '/db/api/*': '/$1', // /api/a => /a
    },
    apiWeb: './apiWeb.json', // 从 web 页面创建的接口数据, 会与 config.api 合并, config.api 具有优先权
    apiWebWrap: wrapApiData, // boolean | function({data, code}) 处理从 web 页面创建的接口数据
    api (util) { // 自建 api, 可以是 function 或 object, 为 function 时, 可以获取提供的常用 util
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
        async 'post /file/upload' (req, res, next) { // 获取客户端上传的文件
          const multiparty = await toolObj.generate.initPackge(`multiparty`)
          const form = new multiparty.Form()
          form.parse(req, (err, fields = [], files) => {
            const data = {fields, files, err}
            res.json(data)
          })
        },
        'get /ip': {res: `127.0.0.1`}, // 模拟原有接口
        'get /name': {name: mockjs.mock(`@cname`)}, // 使用 mock 功能
        'get /file' (req, res, next) { // 发送文件
          res.sendFile(`${__dirname}/readme.md`)
        },
        'post /status/:code' (req, res, next) { // 获取 url 上的 params, query 以及 body 参数
          const {params, query, body} = req
          res.status(params.code) .json({params, query, body})
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
          const fetchRes = fetch("http://www.httpbin.org/ip", {
            "headers": {
              "accept": "*/*",
              "accept-language": "zh-CN,zh;q=0.9"
            },
          });
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
          ws.on('message', (msg) => {
            ws.send(msg)
          })
        },
      }
    },
    // 处理重放请求出错时会进入这个方法
    // 对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能)
    // 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以尽量正常运行
    resHandleReplay: ({req, res}) => wrapApiData({code: 200, data: {}}),
    // 由 db 生成的接口的最后一个拦截器, 可以用来构建项目所需的数据结构
    resHandleJsonApi: ({req, res: { statusCode: code }, data}) => wrapApiData({code, data}),
    watch: [],
    clearHistory: false,
    guard: false,
  }
}

function wrapApiData({data, code}) { // 包裹 api 的返回值
  return {
    code,
    success: Boolean(('' + code).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}
