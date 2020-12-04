#!/usr/bin/env node

/**
 * 要实现监控 js 文件修改后重新启动, 需要用到 nodemon 这个工具, 之前是通过 packge.scripts 中的命令行方式使用的.
 * 由于向系统注册 packge.bin 时, 这个文件只能由 node 执行, 即只能为 js.
 * 所以, 需要一个额外的 js 文件来监听 config.js 修改, 然后重启 server.js
 * 把 run.js 中收集的命令行参数, 以 base64 方式传入 server.js 中.
 */

const path = require(`path`)
const { toolObj, business } = require(`./util/index.js`)
const cli = toolObj.cli
const cliArg = cli.parseArgv()
if(cliArg.v) {
  console.log(require(`${__dirname}/package.json`).version)
  process.exit()
}
const serverPath = path.normalize(`${__dirname}/server.js`) // 转换为跨平台的路径
const nodemon = require(`nodemon`)
const {
  initHandle,
  plugin,
} = business()
const configFile = initHandle().getConfigFile()
cliArg.config = configFile
const base64config = Buffer.from(JSON.stringify(cliArg)).toString('base64') // 以 base64 方式向 `node server.js` 传送命令行参数
const watch = cli.getWatchArg({cliArgWatch: cliArg.watch, configFile})
const os = require(`os`)
const sharePath = path.normalize(`${os.tmpdir}/publicStore_${Date.now()}.json`) // 此文件用于 run.js 与 server.js 共享变量
nodemon({
  exec: `node ${serverPath} ${process.argv.slice(2).join(` `)} _base64=${base64config} _share=${sharePath}`,
  watch,
})

Boolean(cliArg[`--no-update`]) === false && new Promise( async () => { // 检查更新
  const {name, version} = require(`./package.json`)
  const {local, server} = await toolObj.npm.checkUpdate(name, {version}).catch(err => console.log(`检查更新失败: ${err}`))
  if(local !== server) {
    const msg = `\n已发布新版本 ${server}\n您当前版本为 ${local}\n查看更新特性 https://hongqiye.com/doc/mockm?update=${local},${server}\n`
    console.log(cli.colors.yellowBright(msg))
  }
})
new Promise(async () => {
  const {
    showLocalInfo,
    remoteServer,
  } = plugin()
  toolObj.control.awaitTrue({ // 等待 sharePath 文件存在, 期望 config 已经存入
    condition: () => toolObj.file.hasFile(sharePath),
    timeout: 60e3,
  }).then(() => {
    const share = toolObj.file.fileStore(sharePath)
    const config = share.get(`config`)
    const store = toolObj.file.fileStore(config._store)
    store.set(`note.remote`, {})
    showLocalInfo({store, config})
    if(config.remote) { // 如果启用远程则进行相关功能处理
      remoteServer({store, config}).catch(err => console.log(`err`, err))
    }
  }).catch(err => {
    console.log(`err`, err)
    console.log(`启动超时, 请检查配置是否有误`)
    process.exit()
  })
})
