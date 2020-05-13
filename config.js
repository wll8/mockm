const config = {
  prot: 9000, // 本地端口
  testProt: 9005, // 调试端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  apiInHeader: true, // 在 header 中添加调试 api 地址, true: 是; false, 否; string: 以 string 为 header key
  proxy: 'http://httpbin.org/image/', // 后台服务器的的 api
  noProxy: 't/', // 不进行代理的路由
  dbJsonName: './db.json', // db.js 生成的 json 数据文件名
  dataDir: './httpData/', // 数据保存目录
  httpHistory: './httpData/httpHistory.json', // 录制信息保存位置
}

const handleConfig = {
  ...config,
  apiInHeader:
    config.apiInHeader === true
    ? `x-test-api`
    : (config.apiInHeader === false
      ? false
      : config.apiInHeader
    ),
  pathname: (new URL(config.proxy)).pathname, // 取出 ap 中的 pathname
  origin: (new URL(config.proxy)).origin,
  noProxy: config.noProxy.replace(/\/$/, '') + '/', // 在末尾添加 `/`
  proxy: config.proxy.replace(/\/$/, '') + '/',
}

module.exports = handleConfig
