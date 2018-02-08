#!/usr/bin/env node
console.log('hi mock')

let program = require('commander') // 解析命令行参数的库
let watchJson = require('./watch')

program
  .option('-p, --port <port>', '端口')
  .command('watch <db>', '文件')
  .action(dbname => {
    watchJson(dbname, program.port)
  })

  program.parse(process.argv)
