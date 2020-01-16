const config = {
  prot: 9000, // 本地端口
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  apiTest: 'test', // api 调试地址, 即 /api/t/test/* 进入接口调试
  preFix: 'api', // api 地址前缀
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  proxyTarget: 'http://192.168.6.59:9000/', // 转发URL
  httpHistory: './httpHistory.json', // 录制信息保存位置
  dbJsonName: './db.json', // db.js 生成的 json 数据文件名
}

module.exports = config
