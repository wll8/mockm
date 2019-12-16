# mock-server
前端接口模拟, 快速同步开发.

``` sh
npm i
npm start
# open http://localhost:9000/api/t/books
``` 

### 功能
- [x] 请求转发, 不影响联调完成的接口
- [x] 常用中间件 upload/formData/body/query/params
- [x] 基于 express, 可使用正则快速创建 api
- [x] 基于 json-srver/mockjs, 快速生成数据及 Restful API

### 配置
参考 config.js:

``` js
{
  prot: 9000, // 本地端口
  proxyTag: 't', // 测试标志, 若不匹配 /api/t/* 即进行转发
  proxyTarget: 'http://192.168.6.59:9000/', // 转发URL
}
```

### 应用
- 前端 baseApi 填写 `http://localhost:9000/api`
- 后端还没有完成的接口, 使用 `/t/books`, 完成后使用 `/books`

### 相关文档
- expressjs: http://expressjs.com/
- mockjs: http://mockjs.com/examples.html
- json-server: https://github.com/typicode/json-server
