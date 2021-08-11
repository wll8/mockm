# 待完成

## 文档
- [ ] doc: 如何更新 replayPort 返回的数据?
  - 如果代理服务是 9000, 使用同样的参数再请求一下 9000 端口即可, 因为重放时的数据默认会从最新的请求记录中获取
## 功能
- [ ] feat: 支持在 config.package 参数用于更新依赖版本, 这利于在不更新 mockm 的情况使用新的依赖版本
``` js
package: {
  ngrok: `latest`, // 始终安装 ngrok 的最新版本
  ws: `7.4.6`, // 固定 ws 为 7.4.6 版本
}
```
  - [ ] 需要研究如何将 json 依赖声明改为 npm install 的参数, 也可理解为如何把 install 参数保存到 package.json 对象中
  - 以上配置将生成类似命令 `npm i ngrok@latest ws@7.4.6` 进行安装
  - mockm 在启动时即更新依赖, 完毕后自动重载
  - 与已安装的版本比较, 如果相同版本已存在则不触发安装
  - 版本编写规则参考 https://www.npmjs.cn/files/package.json/#dependencies

- [ ] feat: 支持在后端服务关闭时可以以文档形式浏览 openApi
- [ ] feat: config.clearHistory 支持字符串 `all` 表示清除(清空 request, httpHistory.json)
- [ ] feat: 当使用 remote 加载远程 url 时, 应使用`获取中...或进度比`来显示, 而不是输出 err log
- [x] feat: 支持使用记录的响应数据来创建接口
  - 因为 id 引用的是 httpHistory 目录中的内容, 但此目录通常又不方便上传到版本控制系统, 所以把请求记录的值直接转换为 webApi, 可方便的多人共享或复用已有的数据.
- [ ] feat: 支持自定义多个重放时要更新的 header
  - 有些授权字段不一定是 authorization, 可能是其他的一个或多个字段, 这时候可以通过 config.updateHeader 来配置. 重发请求或者在 swagger 界面测试请求时, 都会更新指定的 header 后再发送请求.
- [ ] feat: 支持关闭和开启 testPort 和 replayPort 功能, 因为某些服务可能不需要
- [ ] feat: 支持禁用请求记录, 例如禁用所有, 禁用某个 url, 仅保存后xx条, 因为有些类似心跳的请求总是记录的意义不大
- [ ] feat: 参考 https://github.com/YMFE/yapi 重新实现 webApi table 的开发, 以支持各种格式的数据
- [ ] feat: webApi 支持从 json 数据解析为 table
- [ ] feat: webApi 接口列表支持多选删除, 禁用, 启用
- [ ] feat: 支持 ws 示例
  - https://github.com/aral/express-ws
- [x] feat: 当访问不存在的 test-api 时, 不应显示操作按钮, 并且提示记录不存在
- [x] feat: 添加崩溃重启功能
- [x] feat: 支持配置静态文件目录, 可配置多个
- [ ] feat: 优化mock生成规则
  - [ ] video|movie https://www.w3school.com.cn/i/movie.mp4
  - [ ] cover @image
  - [ ] author @cname
  - [ ] describe @cparagraph
  - [ ] limit$(ed) @natural
  - [ ] address @address - 注意此地址规则无效
- [x] feat: 向 config 暴露所有 util
- [ ] feat: 支持在 config.api 中按条件再回到 config.proxy
- [ ] feat: 支持 node v10.12.0 以下的版本, 需注意 fs.mkdirSync 的 recursive 选项, babel 只能转换 js 标准 api
- [x] feat: 从 cdn 下载 ngrok 程序
- [x] feat: webApi 支持批处理, 自动翻译, 类型转换, 数据生成
- [ ] feat: 分离常用功能例如API文档创建器到浏览器插件, 例如 FeHelper https://github.com/zxlie/FeHelper
- [x] feat: 从 web 页面创建模拟接口及文档
- [x] feat: 在请求详情页面添加 `应用响应`, 快速应用到 apiWeb 的自定义返回值
- [x] refactor: 分离示例配置和默认配置
  - 目前的默认配置其实是函数很多解释参数作为的示例配置, 这样并不利于文档编写, 因为有些示例值并不适合用珩默认值.
- [ ] feat: 各平台一键安装命令
- [ ] feat: 显示完整的 swagger , 方便浏览其他 api
- [ ] feat: 标记数据是来自自定义 api 还是后台接口
- [ ] feat: 思考如何解决记录的请求与实际发送的请求的混乱问题, 例如
  - req.url 和 req.method 被修改, 应该如何记录
- [ ] feat: 应该记录原始请求, 例如 req.originalUrl , 因为 req.url 会在程序内被修改, 记录它会感觉很奇怪
- [ ] feat: 注入 Eruda 或 vConsole
- [ ] feat: 自定义日志输出 https://github.com/expressjs/morgan#using-a-custom-format-function
- [ ] feat: 支持 yaml 格式的 openApi, 例如 https://petstore.swagger.io/v2/swagger.yaml
- [ ] feat: 提供相关工具
  - 数据转换 参考
    - https://github.com/Jokero/mapper.js
    - https://github.com/bozzltron/node-json-transform
    - https://goessner.net/articles/JsonPath/
    - https://stackoverflow.com/questions/50081462/javascript-how-to-map-a-backend-entity-to-a-frontend-entity-and-the-opposite
    - https://github.com/JSONPath-Plus/JSONPath
- [ ] feat: config 中应该也把获取 db 的方法按 util 给出, 为了方便使用 db 自定义 api
- [ ] feat: config.route 应支持不同的动词转发
- [x] feat: config.api 的 key 需支持简写, 即可以不写 method, 不写时表示所有 method
- [ ] feat: 在当前接口中搜索请求信息
  - 搜索范围: req, res, 搜索 `c`
  - api 历史 1
    - req header: ab`c`cd
    - req header: abc`c`d
    - req body:  bc`c`d
    - res header:  bc`c`d
    - res body:  bc`c`d
- [ ] feat: 重放时默认以忽略 query 参数方式进行匹配, 则仅匹配 path
- [ ] feat: npm frp 一键安装支持逻辑
  - 运行 `frpc frpc.ini` 命令前, 判断 node_modules 是否存在 frpc, 是则运行
  - 否则到远程下载, 下载完成后再运行 frps
    - 解析 json 配置为 ini
  
## 缺陷
- [ ] fix: 未注册的 ngrok 要求总是更新版本
  - 处理方式: 移除 mockm 中固定的 ngrok cdn 地址

## mockm remote 不能正常使用的解决方案

原因是由于 ngrok 强制要求更新到最新版本。

`mockm v1.1.25-alpha.15` 之前的版本可以在 mockm 的安装目录使用 npx ngrok update 更新版本来解决此问题。

以下是参考命令:

``` sh
# 获取全局安装目录(假设你是全局安装的 mockm, 如果是局部安装的可以跳过此步)
> npm root -g
node_modules

# 进入 mockm 的所在目录
> cd node_modules/mockm

# 更新 ngrok
> npx ngrok update
```

## 详细原因分析
错误现象:

``` sh
# 开启 remote 模式时一直输出以下信息, 远程服务信息为空
> mm remote 
err connect ECONNREFUSED 127.0.0.1:58725
err connect ECONNREFUSED 127.0.0.1:58726
err connect ECONNREFUSED 127.0.0.1:58727
err connect ECONNREFUSED 127.0.0.1:58725

远程服务信息:
port: 
replayPort: 
testPort: 

# 查看本地 ngrok 版本
> ngrok -v
ngrok version 2.3.35

# 直接使用 ngrok 来启动外网服务, 得到具体的原因是未注册的用户必须保持更新 ngrok
> ngrok http 80
Your ngrok agent version "2.3.40" is no longer supported. Only the most recent version of the ngrok agent is supported without an account.
Update to a newer version with `ngrok update` or by downloading from https://ngrok.com/download.
Sign up for an account to avoid forced version upgrades: https://ngrok.com/signup.
ERR_NGROK_120
```



- [ ] fix: 当 webApi 与 config.api 相同时, webApi 不应该优先
  - 违背了文档: `从 web 页面创建的接口数据, 会与 config.api 合并, config.api 具有优先权`
  - 这似乎是某个版本之后导致的问题
- [ ] fix: 当 config.proxy 与 config.api 相同时, proxy 不应该优先
  - 违背了文档: `当与 config.proxy 中的路由冲突时, config.api 优先.`
- [x] fix: 某些设备修改 mm.config.js 文件并不会自动重载
  - 更新到最新版本 nodemon@2.0.12 无效
  - 使用 `legacyWatch: true` 参数无效
  - 使用 `config.watch = ['mm.config.js']` 无效
  - 使用 `nodemon -w mm.config.js --exec "fkill -f :9000 & mm"` 无效
  - 最后发现是 nodemon 自身的功能问题, 参考 checkChangeRestart 函数
- [x] fix: v1.1.25-alpha.12 版本的 config.db 功能失效, v1.1.25-alpha.10 可以正常使用
- [x] fix: v1.1.25-alpha.12 版本的 path 功能失效, v1.1.25-alpha.10 可以正常使用
- [ ] fix: 当前端参数为 form data 时, 请求头为 content-type: application/x-www-form-urlencoded, 请求体没有被记录和保存
- [ ] fix: 奔溃自动重启后会丢失 cli 上传入的参数
- [x] fix: config.proxy 无法代理到其他域
``` js
// 正确 http://127.0.0.1:9000/api2/quickSearch == ok
proxy: { 
  '/': `http://192.168.1.2:9000/`,
  '/api2': `http://192.168.1.2:9000/api/`,
},

// 错误 http://127.0.0.1:9000/api2/quickSearch == no
proxy: { 
  '/': `http://www.httpbin.org/`,
  '/api2': `http://192.168.1.2:9000/api/`,
},
```
- [ ] fix: 删除 apiWeb 中的空对象, 避免手动编辑 apiWeb 时出现重复的 key
- [x] fix: 添加 webApi 时不能自动生效
  - [x] 当没有指定配置文件时, 使用的是 node_modules 中的配置文件, 更改 node_modules 中的 config.js 并不会触发重启, 这是 nodemon 的默认规则导致
- [x] fix: 初始化 cnpm 后导致无法启动 `Cannot find module 'core-js-pure/stable/instance/splice`
  - 这是由于初始化 cnpm 时是使用 npm 来安装的, npm 安装时会对原来 cnpm 安装的依赖冲突.
- [X] fix: config.api 为 {ip: 123} 时报错 `Error: Route.acl() requires a callback function but got a [object Number]`
- [x] fix: 不能检测到使用 nvm 的全局安装的 cnpm
- [x] fix: 如果检查新版本出错时, 不应提示更新 `已发布新版本 undefined...`
- [x] fix: 从请求详情中点击编辑 webApi 时, 不应该携带 query 参数
- [x] fix: 应该把有道翻译放在最后面, 因为它的翻译结果不精简. 例如 `名称` 不应该被翻译为 `The name of the` , 而应该翻译为 `name`.
- [x] fix: weApi 接口删除后不应该需要刷新才能看到已删除
- [ ] fix: 中文 api 路径会有问题
- [x] fix: res.send(undefined) 时报错
- [ ] fix: 当 http body json 的内容较大, 例如 6M 时, 在页面上无法查看详情, 导致浏览器内存不足页崩溃
- [ ] fix: 发送文件时, header 中没有 x-test-api
- [x] fix: node v10.12.0 没有触发 req 的 close 事件, node v12.18.3 执行了. 导致某些情况没有保存请求记录到 json 文件中, 参考: 
  - https://github.com/nodejs/node/commit/f22c7c10ca0c8c7a10057de71bc423bf8b633b88
  - https://github.com/nodejs/node/issues/31394
  - https://github.com/nodejs/node/issues/21063
  - https://github.com/nodejs/node/pull/20611
  - https://nodejs.org/api/http.html
  - https://github.com/jshttp/on-finished
- [x] fix: 页面上创建的 webApi 接口包含点符号时, 无法使用, 因为点符号会被处理为键的层级
- [x] fix: 初始化项目, 第一次请求接口时, x-test-api 值为 `http://127.0.0.1:9005/#/history,/get/name`, id 丢失, 便记录列表中有显示.
- [x] fix: 当没有配置文件时, 在 node14.2 中启动时出现警告 `Warning: Accessing non-existent property 'proxy' of module exports inside circular dependency`
  - 这可能是由于默认的 config.js 中 base64deCode.config 的值也是 config.js 造成的循环 require
- [ ] fix: 使用重放接口时, 也应该能使用 config.proxy 和 config.api
- [ ] fix: 当 config.api 中 `/all/method` 与 `get /all/method` 冲突时, 使用后者
- [ ] fix: 实际获取的与实际记录的不一致, 修改 res.body 之后, 记录的 body 还是修改前的
- [ ] fix: config.api 中修改 req.method 为 patch 之后, 不应该是全部修改
- [ ] fix: 请求 id 会有一定的概率重复, 复制的 id 可能会导致排序出错, 或需要 rowKey 的组件渲染出错
- [x] fix: 代理整个网站时, 网站中的一些链接无法正常工作
- [ ] fix(doc): 文档中的表格应该 100% 宽度度支持自适应

## 更新计划
- 1.2.x: 期望 webApi 禁用所有API时应为 `*` 而不是 `/`, 因为它可能表示仅禁止根 api
- 1.2.x: 期望 httpHistory 中仅保存 fullApi 和 id, 因为可能大多数请求只有少量报文却有大量 header, 导致 httpHistory 文件激增
- 1.2.x: 期望更改 httpData 目录为 mmData, 因为 httpData 名字比较通用, 可能会被其他程序使用
- 1.2.x: 期望`仅有命令行可用的参数`都添加 `--` 前缀, 例如 `config` 改为 `--config`, 用这样的方式降低理解混淆

## 解决 mockjs 的问题
### 前端API问题
- 不能使用 fetch https://github.com/nuysoft/Mock/issues/430
