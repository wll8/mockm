function isEmpty(value) { // 判断空值
  return (
    value === null
    || value === ``
    || typeof(value) === `object`
      && (
        value.length === 0
        || Object.keys(value).length === 0
      )
  )
}

function parseRePath(rePath, url) { // 使用 path-to-regexp 转换 express 的 router, 并解析参数为对象
  // 注: path-to-regexp 1.x 自带 match 方法可处理此方法, 但是当前的 json-server 依赖的 express 的路由语法仅支持 path-to-regexp@0.1.7
  // 所以只能手动转换, 参考: https://github.com/ForbesLindesay/express-route-tester/blob/f39c57fa660490e74b387ed67bf8f2b50ee3c27f/index.js#L96
  const pathToRegexp = require('path-to-regexp')
  const keys = []
  const re = pathToRegexp(rePath, keys)
  const pathUrl = url
  const result = re.exec(pathUrl)
  const obj = keys.reduce((acc, cur, index) => {
    acc[cur.name] = result[index + 1]
    return acc
  }, {})
  return obj
}

function isFileEmpty(file) { // 判断文件是否存或为空
  const fs = require(`fs`)
  return (
    (hasFile(file) === false)
    || fs.readFileSync(file, `utf-8`).trim() === ``
  )
}

function fullApi2Obj(api) {
  let [, method, url] = api.match(/(\w+)\s+(.*)/) || [, api.trim()]
  const {path} = getClientUrlAndPath(url)
  return {path, method, url}
}

function removeEmpty(obj) { // 删除对象中为空值的键
  obj = {...obj}
  Object.keys(obj).forEach(key => {
    if (isEmpty(obj[key])) {
      delete obj[key]
    }
  })
  return obj
}

function hasFile(filePath) { // 判断文件或目录是否存在
  const fs = require(`fs`)
  return fs.existsSync(filePath)
}

function handlePathArg(pathStr) { // 处理命令行上传入的路径参数, 如果是相对路径, 则相对于运行命令的目录, 而不是相对于书写 require() 方法文件的目录
  const path = require(`path`)
  let newPathStr = path.isAbsolute(pathStr) ? pathStr : `${process.cwd()}/${pathStr}` // 如果是相对路径, 则相对于运行命令的位置
  newPathStr = path.normalize(newPathStr) // 转换为跨平台的路径
  return newPathStr
}

function getOptions(cmd) { // curl 命令转 body
  const curlconverter = require('curlconverter');
  let str = curlconverter.toNode(cmd)
  let res = {}
  str = str.replace(`request(options, callback)`, `res = options`)
  eval(str)
  try {
    res.body = JSON.parse(res.body)
  } catch (error) {
    res.body = {}
  }
  return res
}

function parseArgv(arr) { // 解析命令行参数
  return (arr || process.argv.slice(2)).reduce((acc, arg) => {
    let [k, v] = arg.split('==')
    acc[k] = v === undefined // 没有值时, 则表示为 true
      ? true
      : (
        /^(true|false)$/.test(v) // 转换指明的 true/false
        ? v === 'true'
        : (
          /[\d|\.]+/.test(v)
          ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
          : v
        )
      )
    return acc
  }, {})
}

function string10to62(number) { // 10 进制转 62 进制, 用来压缩数字长度
  const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('')
  const radix = chars.length
  const arr = []
  let qutient = +number
  do {
    mod = qutient % radix;
    qutient = (qutient - mod) / radix;
    arr.unshift(chars[mod]);
  } while (qutient);
  return arr.join('');
}

function string62to10(str) { // 62 进制转 10 进制
  str = String(str)
  const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'
  const radix = chars.length
  const len = str.length
  let origin_number = 0
  let i = 0
  while (i < len) {
    origin_number += Math.pow(radix, i++) * chars.indexOf(str.charAt(len - i) || 0);
  }
  return origin_number;
}

function nextId() { // 获取全局自增 id
  global.id = (global.id || 0) + Date.now() + 1
  return global.id
}

function getClientIp (req) { // 获取客户端 IP
  let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
    req.ip ||
    req.connection.remoteAddress || // 判断 connection 的远程 IP
    req.socket.remoteAddress || // 判断后端的 socket 的 IP
    req.connection.socket.remoteAddress || ''
  if (ip.includes(',')) {
    ip = ip.split(',')[0]
  }
  ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length) // ::ffff:127.0.0.1 => 127.0.0.1
  return ip
}

function o2s(o) { // 对象转字符串
  return JSON.stringify(o, null, 2)
}

function emptyFn(f) {  // 把函数的参数 {}, [], null 转为默认值
  return (...a) => {
    return f(...a.map(
      v => {
        return (util.isEmpty(v) ? undefined : v)
      }
    ))
  }
}

function getOsIp() { // 获取系统 ip
  const obj = require(`os`).networkInterfaces()
  const ip = Object.keys(obj).reduce((res, cur, index) => {
    return [...res, ...obj[cur]]
  }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
  return ip
}

function isType(data, type) { // 判断数据是否为 type, 或返回 type
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}

function getClientUrlAndPath (originalUrl) { // 获取从客户端访问的 url 以及 path
  // 当重定向路由(mock api)时, req.originalUrl 和 req.url 不一致, req.originalUrl 为浏览器中访问的 url, 应该基于这个 url 获取 path
  return {
    url: originalUrl,
    path: (new URL(originalUrl, `http://127.0.0.1`)).pathname,
  }
}

module.exports = {
  isFileEmpty,
  parseRePath,
  fullApi2Obj,
  handlePathArg,
  nextId,
  getClientUrlAndPath,
  isType,
  getOsIp,
  emptyFn,
  o2s,
  hasFile,
  string10to62,
  string62to10,
  getClientIp,
  isEmpty,
  removeEmpty,
  parseArgv,
}
