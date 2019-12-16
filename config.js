const config = {
  prot: 9000, // 本地端口
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  proxyTarget: 'http://192.168.6.59:9000/', // 转发URL
}

module.exports = config
