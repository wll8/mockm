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
