const path = require(`path`)
const { parseArgv } = require(`./util.js`)
const util = require("./util.js")
let cliArg = parseArgv()
if(cliArg._base64) { // 如果指定了 base64 配置
  const base64deCode = JSON.parse(Buffer.from(cliArg._base64, 'base64').toString())
  if (base64deCode.config) { // 如果指定了 config 文件, 则从文件中加载, 但是命令行上的参数具有最高优先级
    const normalizePath = path.normalize(base64deCode.config)
    const fileArg = path.isAbsolute(normalizePath) ? require(normalizePath) : require(`${process.cwd()}/${normalizePath}`) // 处理相对路径
    cliArg = {...fileArg, ...cliArg}
  }
  cliArg = {...base64deCode, ...cliArg}
}

const config = {
  prot: 9000, // 本地端口
  testProt: 9005, // 调试端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  replayProxy: true, // 记录中不存在所需请求时, 是否转发请求到 proxy
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  apiInHeader: true, // 在 header 中添加调试 api 地址, true: 是; false, 否; string: 以 string 为 header key
  proxy: 'http://httpbin.org/', // 后台服务器的的 api
  openApi: `https://httpbin.org/spec.json`, // 关联的 openApi 数据文件
  dbJsonName: './db.json', // db.js 生成的 json 数据文件名
  dataDir: './httpData/', // 数据保存目录
  httpHistory: './httpData/httpHistory.json', // 录制信息保存位置
  api: util => { // 可以是 function 或 object, 为 function 时, 可以获取提供的常用 util
    const { axios, mime, mock, multiparty } = util
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
        res.json({name: mock(`@cname`)})
      },
      'get /file' (req, res, next) { // 发送文件
        res.sendFile(`${__dirname}/readme.md`)
      },
      'get /status/:code' (req, res, next) { // 使用 params 参数
        res.statusCode = req.params.code
        res.json(req.params)
      },
    }
  },
  ...cliArg,
}

const handleConfig = {
  ...config,
  apiInHeader:
    config.apiInHeader === true
    ? `x-test-api`
    : (config.apiInHeader === false
      ? false
      : config.apiInHeader
    ),
  pathname: (new URL(config.proxy)).pathname.replace(/\/$/, '') + '/',
  origin: (new URL(config.proxy)).origin,
  proxy: config.proxy.replace(/\/$/, '') + '/',
}

module.exports = handleConfig
