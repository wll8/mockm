const config = {
  prot: 9000, // 本地端口
  testProt: 9005, // 调试端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  apiTest: 'test', // api 调试地址, 即 /api/t/test/* 进入接口调试
  preFix: 'api', // api 地址前缀
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  proxyTarget: 'http://192.168.6.59:9000/', // 转发URL
  myHttpSever: 'http://192.168.6.20:9000/', //
  httpHistory: './httpHistory.json', // 录制信息保存位置
  dbJsonName: './db.json', // db.js 生成的 json 数据文件名
  dataDir: './httpData/', // 数据保存目录
  httpHistory: './httpData/httpHistory.json', // 录制信息保存位置
}

module.exports = config
