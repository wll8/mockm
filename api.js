const {mock} = require('mockjs')

module.exports = server => {
  server.post('/file/upload', (req, res, next) => { // 上传文件
    const multiparty = require('multiparty')
    const form = new multiparty.Form()
    form.parse(req, (err, fields = [], files) => {
      const data = {fields, files, err}
      res.json(data)
    })
  })
  server.get(`/image/t/json`, (req, res, next) => {
    res.json(handleRes(res, {
      name: mock(`@cname`)
    }))
  })
  server.get(`/file`, (req, res, next) => {
    res.sendFile(__dirname + '/readme.md')
  })
  server.get(`/status/200`, (req, res, next) => {
    res.statusCode = 300
    res.send(`status 300`)
  })
  return server
}

function handleRes(res, data) {
  return {
    code: res.statusCode,
    success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}
