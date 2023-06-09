#!/usr/bin/env node

const {logHelper, print} = require(`./util/log.js`)
process.setMaxListeners(0) // 不限制监听数量
process.send = process.send || new Function()
process.argv.includes(`--log-line`) && logHelper()

const util = require(`./util/index.js`)

new Promise(async () => {
  global.config = await require(`./config.js`)
  process.send({action: `config`, data: global.config})
  util.tool.file.fileChange([global.config._configFile, ...global.config.watch], (files) => process.send({action: `reboot`, data: files}))
  const {
    tool,
    business,
  } = util
  const portIsOkRes = await (tool.os.portIsOk([global.config.port, global.config.testPort, global.config.replayPort])).catch(err => console.log(`err`, err))
  if(portIsOkRes.every(item => (item === true)) === false) {
    print(`Port is occupied:`, portIsOkRes)
    process.exit()
  }

  const {isIp, hostname} =  global.config._proxyTargetInfo
  if(global.config.hostMode && (isIp === false)) {
    await tool.os.sysHost(`set`, {hostname})
    tool.os.clearProcess({hostname})
  } else {
    tool.os.clearProcess()
  }
  const {
    initHandle,
    customApi,
  } = business

  initHandle().init()
  await business.pluginRun(`hostFileCreated`)
  
  const {
    allRoute,
    allRouteTest,
  } = await customApi()

  global.HTTPHISTORY = require(global.config._httpHistory) // 请求历史
  global.STORE = tool.file.fileStore(global.config._store) // 自动注入下次调试请求的数据
  require(`./proxy.js`)({
    allRoute,
  })
  require(`./test.js`)()
  require(`./replay.js`)({
    allRoute,
    allRouteTest,
  })
})
