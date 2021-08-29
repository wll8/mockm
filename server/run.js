#!/usr/bin/env node

/**
 * 要实现监控 js 文件修改后重新启动, 需要用到 nodemon 这个工具, 之前是通过 packge.scripts 中的命令行方式使用的.
 * 由于向系统注册 packge.bin 时, 这个文件只能由 node 执行, 即只能为 js.
 * 所以, 需要一个额外的 js 文件来监听 config.js 修改, 然后重启 server.js
 * 把 run.js 中收集的命令行参数, 以 base64 方式传入 server.js 中.
 */

const {logHelper} = require(`${__dirname}/util/log.js`)
process.argv.includes(`dev`) && logHelper()

const fs = require(`fs`)
const path = require(`path`)
const { tool, business } = require(`${__dirname}/util/index.js`)
const lib = require(`${__dirname}/util/lib.js`)
const packageJson = require(`${__dirname}/package.json`)
const cli = tool.cli
const cliArg = cli.parseArgv()
const serverPath = path.normalize(`${__dirname}/server.js`) // 转换为跨平台的路径
const nodemon = require(`nodemon`)
const {
  initHandle,
  plugin,
} = business
let config = {}
const {
  getConfigFile,
  checkEnv,
} = initHandle()
const configFile = getConfigFile()
cliArg[`--config`] = configFile
const base64config = Buffer.from(JSON.stringify(cliArg)).toString('base64') // 以 base64 方式向 `node server.js` 传送命令行参数
const os = require(`os`)
const sharePath = path.normalize(`${os.tmpdir}/publicStore_${Date.now()}.json`) // 此文件用于 run.js 与 server.js 共享变量

new Promise(async () => { // 显示程序信息, 例如版本号, logo
  const vTag = `>> mockm v`
  const logText = require('fs').readFileSync(`${__dirname}/util/logo.txt`, 'utf8')
  const versionLogo = logText.replace(new RegExp(`(${vTag})(.*)`), (match, $1, $2) => {
    const vLength = packageJson.version.length
    const vLine = vLength > $2.length // 如果版本号替换到版本标志后面
      ? `${$1}${packageJson.version}` 
      : match.replace(new RegExp(`(${vTag})(.{${vLength}})`), `$1${packageJson.version}`)
    return vLine
  })
  process.argv.includes(`dev`) === false && console.log(versionLogo)
})

new Promise(async () => { // 检查运行环境
  if(checkEnv() === false) {
    console.log(cli.colors.red(`node 版本应大于 v10.12.0`))
    process.exit()
  }
})

new Promise( async () => { // 检查更新
  if(Boolean(cliArg[`--no-update`]) === false) {
    const {name, version} = packageJson
    const {local, server} = await tool.npm.checkUpdate(name, {version}).catch(err => console.log(`检查更新失败: ${err}`))
    if(server && lib.compareVersions.compare(local, server, `<`)) {
      const msg = tool.string.removeLeft(`
        已发布新版本 ${server}
        您当前版本为 ${local}
        查看更新特性 https://hongqiye.com/doc/mockm/dev/change_log.html?update=${local},${server}
      `)
      console.log(cli.colors.yellow(msg))
    }
  }
})

new Promise(async () => { // 启动 server.js
  let log = ``
  function restart() {
    config.guard && setTimeout(() => {
      nodemon.emit('restart')
      console.log(`异常退出, 已重启服务`)
      log = ``
    }, 1000)
  }
  nodemon({
    ignoreRoot: [], // 覆盖 ignore, 避免 .git node_modules 中的内容不能被监听, 例如未指定配置文件时是使用 node_modules 中的配置
    exec: `node "${serverPath}" ${process.argv.slice(2).join(` `)} _base64=${base64config} _share=${sharePath}`,
    watch: [configFile],
    stdout: false,
  })
  .on('readable', function(arg) { // the `readable` event indicates that data is ready to pick up
    // console.log(`readable`, arg)
    this.stdout.pipe(process.stdout) // 把子进程的输出定向到本进程输出
    this.stderr.pipe(process.stderr) // 错误输出, 例如按需安装依赖时无权限
    this.stdout.on(`data`, data => {
      log = String(data)
    })
  })
  .on('start', (arg) => {
    // console.log(`start`, arg)
  })
  .on('crash', (arg) => { // 子进程被退出时重启, 例如 kill
    // console.log(`crash`, arg)
    restart()
  })
  // https://github.com/remy/nodemon/blob/master/doc/events.md
  .on(`exit`, (arg) => {
    // console.log(`exit`, arg)
    // arg null 异常退出, 例如语法错误, 端口占用, 运行错误
    // arg SIGUSR2 正常退出, 例如修改文件
    // arg undefined 用户退出, 例如 ctrl+c
    if(log.match(/Error:/)) { // 检测到错误日志时重启
      restart()
      if(config.dataDir) { // 保存错误日志
        const os = require(`os`)
        fs.writeFileSync(
          config._errLog,
          [
            [
              tool.time.dateFormat(`YYYY-MM-DD hh:mm:ss`, new Date()), // 当前时间
              `mockm:${packageJson.version}`, // mockm 版本号
              `node:${process.version}`, // node 版本号
              `os:${os.type()} ${os.release()}`, // 操作系统和版本号
              `arg:${process.argv.splice(2)}`, // 命令行参数
              `lang:${process.env.LANG}`, // 终端语言环境
            ].join(`, `), // 附件信息
            `\n`,
            log, // 调用栈
            `\n`,
            fs.readFileSync(config._errLog, `utf8`), // 旧 log
          ].join(``),
        )
      }
    }
  })
  .on(`restart`, (arg) => {
    if(Boolean(config._store) === false) { // fix: 有时候重载后的 config 值为空 {}
      return false
    }
    const store = tool.file.fileStore(config._store)
    store.set(`restartId`, String(Date.now()))
    // console.log(`restart`, arg)
  })
  const {
    showLocalInfo,
    remoteServer,
  } = plugin()
  tool.control.awaitTrue({ // 等待 sharePath 文件存在, 期望 config 已经存入
    condition: () => tool.file.hasFile(sharePath),
    timeout: 60e3,
  }).then(() => {
    const share = tool.file.fileStore(sharePath)
    config = share.get(`config`)
    const store = tool.file.fileStore(config._store)
    store.set(`note.remote`, {})
    showLocalInfo({store, config})
    if(config.remote) { // 如果启用远程则进行相关功能处理
      remoteServer({store, config}).catch(err => console.log(`err`, err))
    }
  }).catch(err => {
    console.log(`err`, err)
    console.log(`启动超时, 请检查环境或配置是否有误`)
    process.exit()
  })
})
