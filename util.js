function isEmpty(value) {
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

function removeEmpty(obj) {
  obj = {...obj}
  Object.keys(obj).forEach(key => {
    if (isEmpty(obj[key])) {
      delete obj[key]
    }
  })
  return obj
}

function hasFile(filePath) { // 判断文件是否存在
  const fs = require(`fs`)
  return fs.existsSync(filePath)
}

function dataType(data, type) {
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
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

function parseArgv(arr) {
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
  let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
    radix = chars.length,
    qutient = +number,
    arr = [];
  do {
    mod = qutient % radix;
    qutient = (qutient - mod) / radix;
    arr.unshift(chars[mod]);
  } while (qutient);
  return arr.join('');
}

function string62to10(number) { // 62 进制转 10 进制
  let chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ',
    radix = chars.length,
    number = String(number),
    len = number.length,
    i = 0,
    origin_number = 0;
  while (i < len) {
    origin_number += Math.pow(radix, i++) * chars.indexOf(number.charAt(len - i) || 0);
  }
  return origin_number;
}

function nextId() { // 获取全局自增 id
  global.id = (global.id || 0) + 1
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
  dataType,
}
