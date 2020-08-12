const path = require(`path`)
const {
  toolObj: {
    type: {
      isType,
    },
    url: {
      handlePathArg,
      prepareProxy,
      prepareOrigin,
    },
    cli: {
      parseArgv,
    },
  },
} = require(`./util/index.js`)

let cliArg = parseArgv()
if(cliArg._base64) { // 如果指定了 base64 配置, 则先解析并加载它
  const base64deCode = JSON.parse(Buffer.from(cliArg._base64, 'base64').toString())
  if (base64deCode.config) { // 如果指定了 config 文件, 则从文件中加载, 但是命令行上的参数具有最高优先级
    const fileArg = require(handlePathArg(base64deCode.config))
    cliArg = {...fileArg, ...cliArg}
  }
  cliArg = {...base64deCode, ...cliArg}
}

const config = { // 预置配置, 方便用户编写, 例如可以写多少形式
  prot: 9000, // 本地端口
  testProt: 9005, // 调试端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  replayProxy: true, // 记录中不存在所需请求时, 是否转发请求到 proxy
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  apiInHeader: true, // 在 header 中添加调试 api 地址, true: 是; false, 否; string: 以 string 为 header key
  // proxy: 'http://httpbin.org/', // 后台服务器的的 api
  proxy: { // string | object
    '/': `http://www.httpbin.org/`,
    '/get': { // 使用配置, 参考 https://github.com/chimurai/http-proxy-middleware#http-proxy-options
        target: `http://www.httpbin.org/`,
        onProxyReq (proxyReq, req, res) { // 拦截请求
          proxyReq.setHeader('x-added', 'req');
        },
        mid (req, res, next) { // 在进行代理之前添加中间件
          setTimeout(next, 5000) // 延时
        },
        onProxyRes (proxyRes, req, res) { // 拦截响应
          proxyRes.headers['x-added'] = 'res';
        },
    },
  },
  openApi: `http://httpbin.org/spec.json`, // 关联的 openApi 数据文件
  dataDir: './httpData/', // 数据保存目录
  httpHistory: './httpData/httpHistory.json', // 录制信息保存位置
  store: './httpData/store.json', // 录制信息保存位置
  cors: true, // 是否允许通过跨域
  api (util) { // 自建 api, 可以是 function 或 object, 为 function 时, 可以获取提供的常用 util
    const { run, fetch, axios, mime, mockjs, multiparty } = util
    return { // api 拦截器
      '*' (req, res, next) { // 拦截所有方法和路由
        next()
      },
      'post /file/upload' (req, res, next) { // 获取上传的文件
        const form = new multiparty.Form()
        form.parse(req, (err, fields = [], files) => {
          const data = {fields, files, err}
          res.json(data)
        })
      },
      'get /name' (req, res, next) { // 使用 mock 功能
        res.json({name: mockjs.mock(`@cname`)})
      },
      'get /file' (req, res, next) { // 发送文件
        res.sendFile(`${__dirname}/readme.md`)
      },
      'get /status/:code' (req, res, next) { // 使用 params 参数
        res.statusCode = req.params.code
        res.json(req.params)
      },
      'get /curl' (req, res, next) { // 输出 curl/bash 的执行结果
        run.curl({req, res, cmd: `curl 'http://www.httpbin.org/ip'`}).then(curRes => {
          res.send(curRes.body)
        })
      },
      'get /fetch' (req, res, next) { // 使用 node-fetch 的执行结果
        run.fetch({
          req,
          res,
          fetchRes: fetch(`http://www.httpbin.org/ip`)
        }).then(async thenRes => {
          const thenResOk = await thenRes.buffer()
          res.send(thenResOk)
        })
      },
    }
  },
  dbJsonName: './db.json', // json 数据生成的保存位置
  dbCover: false, // 每次启动总是生成新的 db.json
  db (util) { // 供 json-server 使用的 json 数据, function || object
    const { mockjs } = util
    const data = mockjs.mock({
      'books|3-7': [
        {
          'id|+1': 1,
          num: mockjs.Random.natural(1, 10),
          title: '@ctitle',
        }
      ],
    })
    return data
  },
  ...cliArg,
}

const handleConfig = { // 处理配置, 无论用户传入怎样的格式, 进行统一转换, 方便程序解析
  ...config,
  apiInHeader:
    config.apiInHeader === true
    ? `x-test-api`
    : (config.apiInHeader === false
      ? false
      : config.apiInHeader
    ),
  pathname: prepareOrigin(config.proxy).pathname,
  origin: prepareOrigin(config.proxy).origin,
  dbJsonName: handlePathArg(config.dbJsonName),
  dataDir: handlePathArg(config.dataDir),
  httpHistory: handlePathArg(config.httpHistory),
  proxy: prepareProxy(config.proxy),
  api: isType(config.api, `object`) ? () => config.api : config.api,
  db: isType(config.db, `object`) ? () => config.db : config.db,
}

module.exports = handleConfig
