# mock-server
前端接口模拟, 快速同步开发.

``` sh
npm i
npm start
curl http://localhost:9000/image/svg # => 访问 http://httpbin.org/image/svg
curl http://localhost:9000/status/200 # 拦截并修改原接口 res `/status/200`
curl http://localhost:9001/image/svg # 从 GET method `/image/svg` 保存的的信息中获取 response
# open http://localhost:9005/#/GET/image/svg => 查看 GET method `/image/svg` 接口的调试页面
``` 

## 功能
- [x] 请求转发, 不影响联调完成的接口
- [x] 请求重放, 当后端无法正常运行时也无忧演示
- [x] 常用中间件 upload/formData/body/query/params
- [x] 基于 express, 可使用正则快速创建 api
- [x] 基于 json-srver/mockjs, 快速生成数据及 Restful API
- [x] 方便前后端检测请求的调试页面

## 配置
参考 `config.js` 文件.

``` js
{
  prot: 9000, // 本地端口, 配置后你应在你的前端项目中使用此端口
  testProt: 9005, // 调试服务所使用的端口
  replayProt: 9001, // 重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  updateToken: true, // 从 req 中获取 token 然后替换到重发请求的 authorization 上
  proxy: 'http://httpbin.org/image/', // 转发URL, 即真实服务器
  noProxy: 't/', // 不进行代理的路由
  dataDir: './httpData/', // 数据保存目录
  httpHistory: './httpData/httpHistory.json', // 录制信息保存位置
  dbJsonName: './db.json', // mockjs 生成的 json 数据文件名
}
```

### json-srver 数据文件
- **config.dbJsonName** `string`
  数据文件的保存文件名, 相对于命令运行位置, 默认 db.json
  
- **config.dbCover** `boolean`
  重新启动时是否根据 config.db 覆盖 db.json 文件. 默认 false
  
- **config.db** `function | object`
  生成 db.json 的函数或对象, 使用函数时可以获取一些常用工具库, 默认为 function

## 相关文档
- expressjs: http://expressjs.com/
- mockjs: http://mockjs.com/examples.html
- json-server: https://github.com/typicode/json-server
