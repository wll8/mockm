const path = require(`path`)
const libObj = {
  fetch: require('node-fetch'),
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

function defaultConfigFn(util) { // 默认配置
  const { fetch, midResJson, axios, mime, mockjs, multiparty } = util
  return {
    disable: false,
    osIp: getOsIp(),
    port: 9000,
    testPort: 9005,
    replayPort: 9001,
    replayProxy: true,
    replayProxyFind (item) {
      const bodyPath = require(`path`).join(process.cwd(), item.data.res.bodyPath)
      const body = require(bodyPath)
      return body.status === 200 || body.status === `200`
    },
    hostMode: false,
    updateToken: true,
    apiInHeader: true,
    proxy: 'http://httpbin.org/',
    remote: false,
    openApi: `http://httpbin.org/spec.json`,
    cors: true,
    dataDir: './httpData/',
    dbJsonPath: undefined,
    apiWeb: undefined,
    dbCover: false,
    db: {},
    route: {},
    api: {},
    resHandleReplay: ({req, res}) => wrapApiData({code: 200, data: {}}),
    resHandleJsonApi: ({req, res: { statusCode: code }, data}) => wrapApiData({code, data}),
  }
}

function wrapApiData({data, code}) { // 包裹 api 的返回值
  return {
    code,
    success: Boolean(('' + code).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}

libObj.midResJson = midResJson
const config = {
  ...defaultConfigFn(libObj),
  ...fileArgFn(libObj),
  ...cliArg,
}
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
  apiWeb: config.apiWeb ? handlePathArg(config.apiWeb) : handlePathArg(`${config.dataDir}/apiWeb.json`),
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
