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
    module.exports = (dbname, port) => {
      console.log('数据库 ', dbname)
      console.log('端口 ', port)
    }
  // node index.js watch db.json -p 5050
```

## 启动 http 服务

``` js
  // watch.js
    let express = require('express') // 用于 http 请求的库

    module.exports = (dbname, port) => {
      console.log('数据库 ', dbname)
      console.log('端口 ', port)
      let app = express()
      app.all('*', (req, res) => {
        console.log('访问 ', req.originalUrl)
      })
      app.listen(port, () => {
        console.log('服务已经启动 ', port)
      })
    }


```

比如 `node index watch db -p 5050` 后访问 `http://localhost:5050/test` ，会看到控制台显示 `访问 test` 。
