- 2018-02-08
# mock-server

## 初始化项目及注册全局命令
``` js
  // npm init -y # 初始化项目

  // package.json
    "bin": {
      "mock": "./index.js"
    },

  // index.js
    #!/usr/bin/env node
    console.log('hi mock')

  // npm i -g # 安装 mock 到全局

```

## 解析命令行参数
``` js
  // index.js
    #!/usr/bin/env node
    console.log('hi mock')

    let program = require('commander')
    let watchJson = require('./watch')

    program
      .option('-p, --port <port>', 'watch port')
      .command('watch <db>')
      .action(dbname => {
        watchJson(dbname, program.port)
      })

      program.parse(process.argv)
  // watch.js
    module.exports = function (dbname, port) {
      console.log('数据库 ', dbname)
      console.log('端口 ', port)
    }
  // node index.js watch db.json -p 5050
```
