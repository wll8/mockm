# mock-server
前端接口模拟, 快速同步开发.

``` sh
npm i
npm start
# open http://localhost:9000/api/t/books
``` 

### 功能
- [x] 请求转发, 不影响联调完成的接口
- [x] 请求重放, 当后端无法正常运行时也无忧演示
- [x] 常用中间件 upload/formData/body/query/params
- [x] 基于 express, 可使用正则快速创建 api
- [x] 基于 json-srver/mockjs, 快速生成数据及 Restful API
- [x] 方便前后端检测请求的调试页面

### 配置
参考 `config.js` 文件.

``` js
{
  prot: 9000, // 本地端口, 配置后你应在你的前端项目中使用此端口
  testProt: 9005, // 调试服务所使用的端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  preFix: 'api', // api 地址前缀
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  proxyTarget: 'http://1.2.3.4/', // 转发URL, 即真实服务器
  myHttpSever: 'http://192.168.6.20:9000/', // 想要暴露的 ip 地址, 为 localhost 时仅能自己使用
  httpHistory: './httpHistory.json', // 录制信息保存位置
  dbJsonName: './db.json', // mockjs 生成的 json 数据文件名
  dataDir: './httpData/', // 数据保存目录
}
```

### 相关文档
- expressjs: http://expressjs.com/
- mockjs: http://mockjs.com/examples.html
- json-server: https://github.com/typicode/json-server
