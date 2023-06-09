#!/usr/bin/env node

/**
 * 要实现监控 js 文件修改后重新启动, 需要用到 nodemon 这个工具, 之前是通过 packge.scripts 中的命令行方式使用的.
 * 由于向系统注册 packge.bin 时, 这个文件只能由 node 执行, 即只能为 js.
 * 所以, 需要一个额外的 js 文件来监听 config.js 修改, 然后重启 server.js
 * 把 run.js 中收集的命令行参数, 以 base64 方式传入 server.js 中.
 */

const {logHelper, print} = require(`${__dirname}/util/log.js`)
process.argv = require(`./lib/cross-argv@1.0.1.js`)()
process.argv.includes(`--log-line`) && logHelper()

const fs = require(`fs`)
const path = require(`path`)
const { tool, business } = require(`${__dirname}/util/index.js`)
const lib = require(`${__dirname}/util/lib.js`)
const packageJson = require(`${__dirname}/package.json`)
const cli = tool.cli
const cliArg = cli.parseArgv()
const serverPath = path.normalize(`${__dirname}/server.js`) // 转换为跨平台的路径
const { ProcessManager } = require(`@wll8/process-manager`)

{ // 尽早的, 无依赖的修改 cwd, 避免其他读取到旧值
  const cwd = tool.cli.handlePathArg(
    typeof(cliArg[`--cwd`]) === `string` 
      ? cliArg[`--cwd`] 
      : process.cwd(),
  )
  process.chdir(cwd)
}

{ // 仅查看版本号
  cliArg[`--version`] && (print(packageJson.version) || process.exit())
}

const {
  initHandle,
  plugin,
  saveLog,
  build,
} = business
let shareConfig = {}
const {
  templateFn,
  configFileFn,
  checkEnv,
} = initHandle()
templateFn({cliArg, version: packageJson.version})
const configFile = configFileFn({cliArg})
const base64config = Buffer.from(JSON.stringify(cliArg)).toString(`base64`) // 以 base64 方式向 `node server.js` 传送命令行参数
const os = require(`os`)
const sharePath = path.normalize(`${os.tmpdir}/publicStore_${Date.now()}.json`) // 此文件用于 run.js 与 server.js 共享变量

new Promise(async () => { // 显示程序信息, 例如版本号, logo
  const vTag = `version: `
  const logText = require(`fs`).readFileSync(`${__dirname}/util/logo.txt`, `utf8`)
  const versionLogo = logText.replace(new RegExp(`(${vTag})(.*)`), (match, $1, $2) => {
    const vStr = build.getBuildStr(packageJson)
    const vLength = vStr.length
    const vLine = vLength > $2.length // 如果版本号替换到版本标志后面
      ? `${$1}${vStr}` 
      : match.replace(new RegExp(`(${vTag})(.{${vLength}})`), `$1${vStr}`)
    return vLine
  })
  process.argv.includes(`--log-line`) === false && print(versionLogo)
})

new Promise(async () => { // 检查运行环境
  if(checkEnv() === false) {
    print(cli.colors.red(`node 版本应大于 v10.12.0`))
    process.exit()
  }
})

new Promise( async () => { // 检查更新
  if(Boolean(cliArg[`--no-update`]) === false) {
    const {name, version} = packageJson
    const {local, server} = await tool.npm.checkUpdate(name, {version}).catch(err => print(`Check for update failed: ${err}`))
    if(server && lib.compareVersions.compare(local, server, `<`)) {
      const msg = tool.string.removeLeft(`
        New version has been released: ${server}
        Your current version is:       ${local}
        View updated features:         https://hongqiye.com/doc/mockm/dev/change_log.html?update=${local},${server}
      `)
      print(cli.colors.yellow(msg))
    }
  }
})

new Promise(async () => { // 启动 server.js
  let log = ``
  const nodeArg = typeof(cliArg[`--node-options`]) === `string` ? cliArg[`--node-options`] : ``
  const arr = [nodeArg, serverPath, ...process.argv.slice(2), `_base64=${base64config}`, `_share=${sharePath}`].filter(item => item.trim() !== ``)
  const cp = new ProcessManager(arr)
  cp.on(`stdout`, (data) => {
    log = String(data)
  })
  cp.on(`stderr`, (data) => {
    log = String(data)
  })
  cp.on(`message`, ({action, data} = {}) => {
    if(action === `reboot`) {
      cp.reboot(0)
    }
    if(action === `config`) {
      cp.autoReStart = data.guard
    }
  })
  cp.on(`close`, () => {
    if(log.match(/killProcess:/)) { // 保存错误日志
      saveLog({
        code: ``,
        logStr: log,
        logPath: shareConfig._errLog,
      })
    }
  })

  function killProcess() {
    cp.kill()
    process.exit()
  }
  process.on(`SIGTERM`, killProcess)
  process.on(`SIGINT`, killProcess)
  process.on(`uncaughtException`, killProcess)
  process.on(`unhandledRejection`, killProcess)

  const {
    showLocalInfo,
    remoteServer,
  } = plugin()
  tool.control.awaitTrue({ // 等待 sharePath 文件存在, 期望 config 已经存入
    condition: () => tool.file.hasFile(sharePath),
    timeout: 60e3,
  }).then(() => {
    const share = tool.file.fileStore(sharePath)
    shareConfig = share.get(`config`)
    const store = tool.file.fileStore(shareConfig._store)
    store.set(`note.remote`, {})
    showLocalInfo({store, shareConfig})
    if(shareConfig.remote) { // 如果启用远程则进行相关功能处理
      remoteServer({store, shareConfig}).catch(err => console.log(`err`, err))
    }
  }).catch(err => {
    console.log(`err`, err)
    print(`Start timeout, please check whether the environment or configuration is wrong`)
    process.exit()
  })
})
