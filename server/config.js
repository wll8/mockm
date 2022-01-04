const path = require(`path`)
const exportsUtil = require(`./util/index.js`)
const {
  lib,
  business,
  tool,
  tool: {
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
} = exportsUtil
const {
  wrapApiData,
} = business

let cliArg = parseArgv()
let fileArgFn = () => {}
if(cliArg._base64) { // 如果指定了 base64 配置, 则先解析并加载它
  const base64deCode = JSON.parse(Buffer.from(cliArg._base64, `base64`).toString())
  if (base64deCode[`--config`]) { // 如果指定了 config 文件, 则从文件中加载, 但是命令行上的参数具有最高优先级
    const handlePathRes = handlePathArg(base64deCode[`--config`])
    // 避免 node v14 上 config 文件路径相同并访问了不存在的属性而出现循环引用警告
    const fileArg = handlePathRes === __filename ? {} : require(handlePathRes)
    if(typeof(fileArg) === `object`) {
      fileArgFn = () => fileArg
    }
    if(typeof(fileArg) === `function`) {
      fileArgFn = fileArg
    }
  }
  cliArg = {
    ...base64deCode,
    ...cliArg,
    // 命令行参数 config = true 时, 视为使用程序预设的路径
    config: cliArg[`--config`] === true ? base64deCode[`--config`] : (base64deCode[`--config`] || cliArg[`--config`]),
    // 命令行参数 proxy 存在时, 转换为对象, 方便与文件中的 proxy 进行合并
    ...(typeof(cliArg.proxy) === `string` ? {proxy: {"/": cliArg.proxy}} : {}),
  }
}

/** @type {import('mockm/@types/config').Config} */
const defaultConfigFn = (util) => { // 默认配置
  const {
    libObj: { fetch, midResJson, axios, mime, mockjs },
    toolObj,
  } = util
  return {
    disable: false,
    osIp: getOsIp(),
    port: 9000,
    testPort: 9005,
    replayPort: 9001,
    replayProxy: true,
    // snippet-replayProxyFind
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
    // snippet-replayProxyFind
    hostMode: false,
    updateToken: true,
    apiInHeader: true,
    proxy: {
      '/': `http://www.httpbin.org/`,
    },
    remote: false,
    openApi: `http://httpbin.org/spec.json`,
    cors: true,
    dataDir: `./httpData/`,
    dbJsonPath: undefined,
    apiWeb: undefined,
    apiWebWrap: wrapApiData,
    dbCover: false,
    db: {},
    route: {},
    api: {},
    resHandleReplay: ({req, res}) => wrapApiData({code: 200, data: {}}),
    resHandleJsonApi: ({req, res: { statusCode: code }, data}) => wrapApiData({code, data}),
    watch: [],
    clearHistory: false,
    guard: false,
    backOpenApi: 10,
    static: undefined,
  }
}


lib.midResJson = midResJson
const defaultArg = defaultConfigFn(exportsUtil)
const fileArg = fileArgFn(exportsUtil)
const config = {
  ...defaultArg,
  ...fileArg,
  ...cliArg,
}

config.proxy = [ // 合并 proxy 对象
  defaultArg.proxy,
  fileArg.proxy,
  cliArg.proxy,
].reduce((acc, cur) => {
  return {
    ...acc,
    ...(
      isType(cur) === `string` // string 时转为对象
        ? {'/': cur}
        : cur
    ),
  }
}, {})

const _proxyTargetInfo = parseProxyTarget(config.proxy)
const handleConfig = { // 处理配置, 无论用户传入怎样的格式, 进行统一转换, 方便程序解析
  ...config,
  static: (() => {
    const baseObj = {
      path: `/`,
      mode: `hash`,
      option: {},
    }
    return config.static
      ? (
        isType(config.static, `string`)
          ? [{
            ...baseObj,
            fileDir: handlePathArg(config.static),
          }]
          : isType(config.static, `object`)
            ? [{
              ...baseObj,
              ...config.static,
            }]
            : isType(config.static, `array`)
              ? config.static.map(item => ({
                ...baseObj,
                ...item,
                fileDir: handlePathArg(item.fileDir),
              }))
              : []
      )
      : []
  })(),
  updateToken: (() => {
    const updateToken = config.updateToken
    const fn = {
      boolean: () => (updateToken ? {'req.headers.authorization': `req.headers.authorization`} : undefined),
      string: () => ({[`req.headers.${updateToken}`]: `req.headers.${updateToken}`}),
      array: () => updateToken.reduce((acc, cur) => ({...acc, [`req.headers.${cur}`]: `req.headers.${cur}`}), {}),
      object: () => Object.entries(updateToken).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: isType(value, `string`) 
          ? value
          : isType(value, `function`)
            ? value
            : undefined,
      }), {}),
    }[isType(updateToken)]
    return fn ? fn() : undefined
  })(),
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
  watch: isType(config.watch, `string`)
      ? [config.watch]
      : isType(config.watch, `array`)
        ? config.watch
        : [],
  openApi: {
    string: () => [{spec: config.openApi}],
    array: () => config.openApi.map(item => (isType(item, `string`) ? {spec: item} : item)),
    object: () => [config.openApi],
  }[isType(config.openApi)](),
  backOpenApi: config.backOpenApi === true ? defaultArg.backOpenApi : config.backOpenApi,

  // 约定下划线开头的配置为私有配置, 一般是根据用户配置产生的一些方便使用的变量
  _proxyTargetInfo, // 解析 proxy[`/`] 的内容
  _store: handlePathArg(`${config.dataDir}/store.json`), // 简要信息存储
  _httpHistory: handlePathArg(`${config.dataDir}/httpHistory.json`), // 请求记录表保存位置
  _openApiHistoryDir: handlePathArg(`${config.dataDir}/openApiHistory/`), // openApi 的更新历史的保存目录
  _gitIgnore: { // 配置一些几乎总是需要忽略的文件
    file: handlePathArg(`${config.dataDir}/.gitignore`),
    content: `
      openApiHistory/
      request/
      db.json
      httpHistory.json
      log.err.txt
      store.json
    `,
  },
  _requestDir: handlePathArg(`${config.dataDir}/request`), // 请求记录表保存位置
  _errLog: handlePathArg(`${config.dataDir}/log.err.txt`), // 错误日志保存位置
}

module.exports = handleConfig
