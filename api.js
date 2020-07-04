const {mock} = require('mockjs')

module.exports = {
  "*" (req, res, next) { // 拦截所有方法和路由
    next()
  },
  "post /file/upload" (req, res, next) { // 获取上传的文件
    const multiparty = require('multiparty')
    const form = new multiparty.Form()
    form.parse(req, (err, fields = [], files) => {
      const data = {fields, files, err}
      res.json(data)
    })
  },
  "get /image/t/json" (req, res, next) { // 使用 mock 功能
    res.json(handleRes(res, {
      name: mock(`@cname`)
    }))
  },
  "get /file" (req, res, next) { // 发送文件
    res.sendFile(__dirname + '/readme.md')
  },
  "get /status/:code" (req, res, next) { // 使用 params 参数
    res.statusCode = req.params.code
    res.json(req.params)
  },
}

function handleRes(res, data) {
  return {
    code: res.statusCode,
    success: Boolean(('' + res.statusCode).match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}
