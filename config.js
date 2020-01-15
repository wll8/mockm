const config = {
  prot: 9000, // 本地端口
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  apiTest: 'test', // api 调试地址, 即 /api/t/test/* 进入接口调试
  proxyTarget: 'http://192.168.6.59:9000/', // 转发URL
}

module.exports = config
