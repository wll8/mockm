let express = require('express') // 用于 http 请求
let url = require('url') // node 原生解析 url
let jsonfile = require('jsonfile') // 读取 json 文件， node 原生的读取的是字符串

module.exports = (dbname, port) => {
  console.log('数据库 ', dbname)
  console.log('端口 ', port)
  let app = express()
  app.all('*', (req, res) => {
    console.log('访问 ', req.originalUrl)
    // 去除url前后的/，并分割为数组 /a/b/c => ['a', 'b', 'c']
    let pathname = url.parse(req.originalUrl).pathname.replace(/^\//,'').replace(/$\//,'').split('/')
    let database = jsonfile.readFileSync(dbname)
    let tablename = pathname[0] // 读取到的 json
    let id = pathname[1] // 取得 /blog/1 中的 blog
    res.send(database[tablename]) // 发送数据
  })
  app.listen(port, () => {
    console.log('服务已经启动 ', port)
  })
}
