const db = require('./db.js')()

module.exports = async (req, res, next) => {
  await urlTable(req, res, next)
}

async function urlTable(req, res, next) { // 自定义路由进行拦截, 如果立即返回 res 则不应该调用 next
  const table = {
    async 'post /user/login'(req, res, next) {
      const {username, password} = req.body
      const find = db.user.find(item => ((item.name === username) && (item.password === password)))
      find ? res.json({data: find}) : res.status(401).json({message: '密码或用户名错误' })
    },
    async 'get /user'(req, res, next) {
      console.log('abc', res.locals.data)
      // res.send(req)
      next()
    },
    async 'get /user/a/:b/:c'(req, res, next) {
      res.header('X-Hello', 'World')
      res.json({data: req.params})
    },
  }
  const findUrlFn =  Object.keys(table).find(item => {
    const [, method, url] = item.match(/(.*)\s+(.*)/)
    req = {...req, ...getData(url, req)} // 获取参数信息
    return testUrl(method, url, req)
  })
  findUrlFn ? await table[findUrlFn](req, res, next) : next()
}


function getData(rulTest, req) {
  const {match} = require('micro-match')
  const pathname = req._parsedUrl.pathname
  return {
    body: req.body,
    query: req.body,
    params: match(rulTest, pathname),
  }
}

function testUrl(method, rulTest, req) {
  const {test} = require('micro-match')
  const pathname = req._parsedUrl.pathname
  const testRes = test(rulTest, pathname)
  const methodRes = method.trim().toUpperCase() === req.method
  return methodRes && testRes
}
