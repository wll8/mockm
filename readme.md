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

### 配置
`config.js` 文件中所用的配置.

#### prot
本地端口
  
#### replayProt
重放地址, 使用重放地址进行请求时, 从已保存的请求历史中获取信息, 而不是从目标服务器获取
  
#### proxyTag
测试标志, 若不匹配 /api/t/* 即进行转发
  
#### apiTest
api 调试地址, 即 /api/t/test/* 进入接口调试
  
#### preFix
api 地址前缀
  
#### updateToken
从 req 中获取 token 然后替换到重发请求的 authorization 上
  
#### proxyTarget
转发URL, 即真实服务器
  
#### myHttpSever
给测试页所用, 要 `myip:prot` . 虽然可以自动获取, 但是由于一台电脑可能有多个 ip, 不同的 ip 可能用于不同的网络范围, 所以需要手动指定.

#### httpHistory
录制信息保存位置
  
#### dbJsonName
db.js 生成的 json 数据文件名, 由 db.js 生成, `json-server` 读取

### 应用
- 前端 baseApi 填写 `http://localhost:9000/api`
- 后端还没有完成的接口, 使用 `/t/books`, 完成后使用 `/books`

### 相关文档
- expressjs: http://expressjs.com/
- mockjs: http://mockjs.com/examples.html
- json-server: https://github.com/typicode/json-server
