#!/usr/bin/env node

/**
 * 要实现监控 js 文件修改后重新启动, 需要用到 nodemon 这个工具, 之前是通过 packge.scripts 中的命令行方式使用的.
 * 由于向系统注册 packge.bin 时, 这个文件只能由 node 执行, 即只能为 js.
 * 所以, 需要一个额外的 js 文件来监听 config.js 修改, 然后重启 server.js
 * 把 run.js 中收集的命令行参数, 以 base64 方式传入 server.js 中.
 */

const path = require(`path`)
const { toolObj } = require(`./util/index.js`)
const cliArg = toolObj.cli.parseArgv()
const serverPath = path.normalize(`${__dirname}/server.js`) // 转换为跨平台的路径
const nodemon = require(`nodemon`)
const base64config = Buffer.from(JSON.stringify(cliArg)).toString('base64') // 以 base64 方式向 `node server.js` 传送命令行参数
nodemon({
  exec: `node ${serverPath} _base64==${base64config}`,
  watch: cliArg.config || `config.js`,
})
