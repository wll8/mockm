const util = require('./util.js')

exports.mochaGlobalSetup = async function() {
  await util.allTestBefore()
  console.log(`服务启动中...`)
  await util.startApp()
  await util.sleep(5000)
  console.log(`服务启动完成...`)
}

exports.mochaGlobalTeardown = async function() {
  console.log('测试完成')
  await util.allTestAfter()
}
