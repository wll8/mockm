const path = require(`path`)
const libObj = {
  fetch: require('node-fetch'),
  request: require('request'),
  curlconverter: require('curlconverter'),
  axios: require('axios'),
  mockjs: require('mockjs'),
  mime: require('mime'),
  multiparty: require('multiparty'),
}

const {
  toolObj: {
    httpClient: {
      midResJson,
    },
    type: {
      isType,
    },
    os: {
      getOsIp,
    },
    url: {
      handlePathArg,
      prepareProxy,
      parseProxyTarget,
    },
    cli: {
      parseArgv,
    },
  },
} = require(`./util/index.js`)

let cliArg = parseArgv()
let fileArgFn = () => {}
if(cliArg._base64) { // 如果指定了 base64 配置, 则先解析并加载它
  const base64deCode = JSON.parse(Buffer.from(cliArg._base64, 'base64').toString())
  if (base64deCode.config) { // 如果指定了 config 文件, 则从文件中加载, 但是命令行上的参数具有最高优先级
    const fileArg = require(handlePathArg(base64deCode.config))
    if(typeof(fileArg) === `object`) {
      fileArgFn = () => fileArg
    }
    if(typeof(fileArg) === `function`) {
      fileArgFn = fileArg
    }
  }
  cliArg = {...base64deCode, ...cliArg}
}

function baseConfigFn(util) {
  const { fetch, midResJson, axios, mime, mockjs, multiparty } = util
  return { // 预置配置, 方便用户编写, 例如可以写多种形式
    disable: false, // 是否禁用所有自定义 api, 直接通往目标服务器
    osIp: getOsIp(), // 调试IP
    port: 9000, // 本地端口
    testPort: 9005, // 调试端口
    replayPort: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
    replayProxy: true, // 记录中不存在所需请求时, 是否转发请求到 proxy
    replayProxyFind (item) { // 自定义请求重放时的逻辑
      const bodyPath = require(`path`).join(process.cwd(), item.data.res.bodyPath)
      const body = require(bodyPath)
      return body.status === 200 || body.status === `200`
    },
    hostMode: false, // host 模式
    updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
    apiInHeader: true, // 在 header 中添加调试 api 地址, true: 是; false, 否; string: 以 string 为 header key
    // proxy: 'http://httpbin.org/', // 后台服务器的的 api
    proxy: { // string | object
      '/': `http://www.httpbin.org/`,
      '/get': { // 使用配置, 参考 https://github.com/chimurai/http-proxy-middleware#http-proxy-options
          onProxyReq (proxyReq, req, res) { // 拦截请求
            proxyReq.setHeader('x-added', 'req');
          },
          mid (req, res, next) { // 在进行代理之前添加中间件
            setTimeout(next, 5000) // 延时
          },
          onProxyRes (proxyRes, req, res) { // 拦截响应
            midResJson({proxyRes, res, key: `origin`, val: `127.0.0.1`}) // 修改 response
            proxyRes.headers['x-added'] = 'res';
          },
      },
      // '/get': [`origin`, `127.0.0.1`], // 第二个值存在, 以第二个值替换 origin, 第二个值为 undefined 时相当于删除
      // '/get': [{msg: `ok`}], // 只有0个或一个值, 直接替换 res
      // '/get': [{origin: `127.0.0.1`, msg: `ok`, headers: {tips: `mid`}}, `deep`], // 合并: [要合并的对象, 合并的方式], 合并的方式: deep(父级不会被替换), ...(父级会被替换, 类似于js扩展运行符)
    },
    remote: false, // false | object, 为 false 是不需要外网映射, 为 object 时是对每个服务端口的配置 `{testPort: { proto: `http` }}` , 参考 https://github.com/bubenshchykov/remote
    openApi: `http://httpbin.org/spec.json`, // 关联的 openApi 数据文件
    dataDir: './httpData/', // 数据保存目录
    cors: true, // 是否允许通过跨域
    api (util) { // 自建 api, 可以是 function 或 object, 为 function 时, 可以获取提供的常用 util
      const { run } = util
      return { // api 拦截器
        '/' (req, res, next) { // 在所有自定义 api 之前添加中间件
          // 注意, 如果不 next 将不会进入后面的中间件
          // 如果需要拦截所有到达服务器前的请求, 请从 config.proxy 中配置
          next()
        },
        '* /all/method' (req, res, next) { // 所有方法都会进入此路由
          res.json({msg: req.method, url: req.url})
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
        'get /ip' (req, res, next) {
          res.json({res: `127.0.0.1`})
        },
        'get /json': { // 直接返回 json 数据
          msg: `json api`
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
          }).catch(err => console.log(`err`, err))
        },
      }
    },
    dbJsonPath: undefined, // json 数据生成的保存位置, 默认为 dataDir 下的 db.json
    dbCover: false, // 每次启动总是生成新的 db
    db () { // 供 json-server 使用的 json 数据, function || object
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
    route: {
      // 路由映射, 作用于 config.api 及 config.db 产生的 api
      // 参考: https://github.com/typicode/json-server#add-custom-routes
      '/db/api/*': '/$1', // /api/a => /a
    },
    resHandleReplay({req, res}) {
      // 处理重放请求出错时会进入这个方法
      // 对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能)
      // 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以尽量正常运行
      res.statusCode = 200
      return {
        code: res.statusCode,
        success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
        data: {},
      }
    },
    resHandleJsonApi({req, res, data}) {
      // 由 db 生成的接口的最后一个拦截器
      // 可以用来构建项目所需的数据结构
      return {
        code: res.statusCode,
        success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
        data,
      }
    },
    ...fileArgFn(util),
    ...cliArg,
  }
}

libObj.midResJson = midResJson
const config = baseConfigFn(libObj)
const _proxyTargetInfo = parseProxyTarget(config.proxy)
const handleConfig = { // 处理配置, 无论用户传入怎样的格式, 进行统一转换, 方便程序解析
  ...config,
  apiInHeader:
    config.apiInHeader === true
    ? `x-test-api`
    : (config.apiInHeader === false
      ? false
      : config.apiInHeader
    ),
  port: config.hostMode ? _proxyTargetInfo.port : config.port, // 如果是 host 模式, 强制更改端口与目标端口一致
  dbJsonPath: config.dbJsonPath ? handlePathArg(config.dbJsonPath) : handlePathArg(`${config.dataDir}/db.json`),
  dataDir: handlePathArg(config.dataDir),
  proxy: prepareProxy(config.proxy),
  api: isType(config.api, `object`) ? () => config.api : config.api,
  db: isType(config.db, `object`) ? () => config.db : config.db,
  remote: config.remote === false // 每个服务的 remote 配置
    ? false
    : config.remote === true
      ? {}
      : config.remote,

  // 约定下划线开关的配置为私有配置, 一般是根据用户配置产生的一些方便使用的变量
  _proxyTargetInfo, // 解析 proxy[`/`] 的内容
  _store: handlePathArg(`${config.dataDir}/store.json`), // 简要信息存储
  _httpHistory: handlePathArg(`${config.dataDir}/httpHistory.json`), // 请求记录表保存位置
}

module.exports = handleConfig
