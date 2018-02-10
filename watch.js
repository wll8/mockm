let express = require('express') // 用于 http 请求
let url = require('url') // node 原生解析 url
let jsonfile = require('jsonfile') // 读取 json 文件， node 原生的读取的是字符串
let bodyParser = require('body-parser') // 用来解析 post 传输的参数

module.exports = (dbname, port) => {
  console.log('数据库 ', dbname)
  console.log('端口 ', port)
  let app = express()
  app.use(bodyParser.urlencoded({extended: false}))
  app.use(bodyParser.json())

  app.all('*', (req, res) => {
    console.log('访问 ', req.originalUrl)
    // 去除url前后的/，并分割为数组 /a/b/c => ['a', 'b', 'c']
    let pathname = url.parse(req.originalUrl).pathname.replace(/^\//,'').replace(/$\//,'').split('/')
    let database = jsonfile.readFileSync(dbname) // 读取到的 json
    let tablename = pathname[0] // 取得 /blog/1 中的 blog
    if(!database[tablename]) {
      return res.send({ error: `表${tablename}数据未找到` })
    }
    let id = pathname.length > 1 ? pathname[1] : -1 // 当有 id 时取得 id
    let get =  req.method === 'GET'
    let getAll = (get && id === -1) // 没有 id 时获取整张表
    let getOne = (get && id > -1)
    let post = req.method === 'POST'
    let patch = req.method === 'PATCH'
    let Delete = req.method === 'DELETE'
    let put = req.method === 'PUT'

    if(getAll){
      res.send(database[tablename]) // 没有 id 时发送整张表数据
    }
    if(getOne){
      let data = database[tablename]
      let obj = data.find(obj => { // filter 返回的是数组 find 是对象
        return obj.id == id
      })
      obj = obj || { error: `id${id}数据未找到` }
      res.send(obj) // 发送数据
    }
    if(post){
      let body = req.body
      database[tablename].push(body)
      jsonfile.writeFileSync(dbname, database, {spaces: 2})
      res.send(database[tablename])
    }
  })
  app.listen(port, () => {
    console.log('服务已经启动 ', port)
  })

}
//
