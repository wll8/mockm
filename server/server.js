#!/usr/bin/env node

const {logHelper, print} = require(`./util/log.js`)
process.setMaxListeners(0) // 不限制监听数量
process.argv.includes(`--log-line`) && logHelper()

const util = require(`./util/index.js`)

new Promise(async () => {
  global.config = await require(`./config.js`)
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

  const {
    allRoute,
    allRouteTest,
  } = customApi()

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
  
  /**
    为了解决 nodemon 可以检测到修改, 可以触发 on(`restart`) 事件, 但并没有成功重启本程序.
    所以在 restart 事件回调中生成一个 restartId, 在本程序中轮询获取 restartId, 如果与上次不一样, 则表示未启动成功, 则使用 process.exit 退出此程序. 
    然后 nodemon 从 on(`exit`) 中再启动此程序.

    这个方案虽然解决了修改文件却没有成功重启的问题, 
    但是在没有此问题的设备中, 会导致两次重启, 因为没有问题的情况下, 进入 restart 事件回调时就表示重启成功了.
  */
  new Promise(() => {
    const store = tool.file.fileStore(global.config._store)
    const restartId = store.get(`restartId`)
    setInterval(() => {
      const restartIdNew = store.get(`restartId`)
      if(restartId !== restartIdNew) {
        process.exit()
      }
    }, 1000)
  })
})
