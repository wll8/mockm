#!/usr/bin/env node

const {logHelper} = require('./util/log.js')
process.argv.includes(`dev`) && logHelper()
const config = require(`./config.js`)
const util = require(`./util/index.js`)

new Promise(async () => {
  const {
    tool,
    business,
  } = util
  const portIsOkRes = await (tool.os.portIsOk([config.port, config.testPort, config.replayPort])).catch(err => console.log(`err`, err))
  if(portIsOkRes.every(item => (item === true)) === false) {
    console.log(`端口被占用:`, portIsOkRes)
    process.exit()
  }

  const {isIp, hostname} =  config._proxyTargetInfo
  if(config.hostMode && (isIp === false)) {
    await tool.os.sysHost(`set`, {hostname})
    tool.os.clearProcess({hostname})
  } else {
    tool.os.clearProcess()
  }
  const {
    initHandle,
    customApi,
  } = business

  const {
    init,
  } = initHandle()

  const {
    apiRootInjection,
    api,
    db,
  } = init({config})

  const {
    parseApi: {
      noProxyTest,
    },
    parseDbApi,
  } = customApi({api, db, config})

  const HTTPHISTORY = require(config._httpHistory) // 请求历史
  let TOKEN = ''
  require(`./proxy.js`)({
    api,
    db,
    HTTPHISTORY,
    TOKEN,
    apiRootInjection,
    config,
  })
  require(`./test.js`)({
    HTTPHISTORY,
    config,
    TOKEN,
    parseDbApi,
  })
  require(`./replay.js`)({
    HTTPHISTORY,
    noProxyTest,
    config,
  })
})
