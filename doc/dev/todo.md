# 待完成

## 文档
- [x] fix: [DELETE request will delete all data](https://github.com/typicode/json-server/issues/885)
- [ ] fix: 创建的 ws 接口在项目中使用时报错 `Invalid frame header`
  - 控制台可多次正常发送 send, 但是在项目中发送时会触发 `Invalid frame header`
  - 单独使用 `@wll8/express-ws` 创建的 ws api 可以在项目中正常使用
  - 使用相同的配置和相同版本的 mockm 启动服务, 但项目中仅 ws 使用该服务时不会出现问题, 但项目中的 http 也走该服务就会出现问题
  - 初步怀疑是大量的 http proxy 在使用时会与 ws 的使用产生干扰
- [x] feat: 使用默认网关的 ip 作为 osIp 的默认值
- [ ] fix: ws 代理无效
  - 源 host 上有 ws 并可直连使用, 但通过代理无法连接
- [ ] fix: ws 接口未正常断开时无法再次连接
  - 在 config.api 中创建 ws 接口, 然后再浏览器中连接它
  - 刷新浏览器让 ws 在不是调用 ws.close 的情况下异常断开
  - 再连接 ws 接口
  - ws 接口报错 `Invalid frame header`
  ``` js
    const result = require('default-gateway').v4.sync()
    const res = require('address').ip(result && result.interface) // 获取默认IP
  ```
- [ ] feat: 由于移除了 ws, 所以 d.ts 中的 `import WebSocket from 'ws'` 应变更为 `@wll8/express-ws` 中的 ws
- [ ] feat: 自动检测安装 mockm 使用的包管理器
  - 参考 [ni](https://github.com/antfu/ni/blob/main/src/detect.ts), 使用 package.json 中的 packageManager 字段
  - 检测 lock 文件, 例如当都存在时检测更新日期
  - 检测 node_modules 特征

- [x] feat: config.static 支持显示目录列表功能
  - [x] 可点击路径条
  - 列表, 排序
  - 搜索
- [ ] feat: config.static 配置的目录应是
  - 绝对路径
  - 相对路径, 相对于运行时的目录(可被 --cwd 改变)
- [x] fix(test): 中途退出测试时不应使用 `process.exit`, 否则会导致无法捕获错误的用例, `Uncaught error outside test suite`.
- [x] fix(test): 优化用例 `WebSocket 消息收发`, 因为启动 mockm 后 websocket 服务可能并未初始化, 此时连接会出错.
- [ ] feat: config.db 在列表中支持可折叠
- [x] feat: httpLog 显示完整的时间
- [ ] fix: 当请求被取消时, httpLog 显示 `undefined undefined`
- [x] fix: config.proxy 子路径冲突
  ``` js
    config = {
      proxy: {
        '/im':`ws:///192.168.160.74:10000/im`,
        '/im/dept':`http://192.168.160.74:10000/im/dept`, // 不应该无法使用
      }
    }
  ```
- [x] refactor: 更改 `require('serve-static')` 为 `express.static`
- [x] refactor: 尝试使用 express-ws 替代 ws
  - 替代后可以统一使用 `app.ws(route, fn)` 的形式实现逻辑, 而不是在 root 下自己实现 upgrade 协议升级和路由判断
  - express-ws 已一年以上没有更新
- [ ] refactor: 使用单个中间件实现多个 use 的效果
  ```js
  // 修改前
  app.use(fn)
  isOk && app.use(fn2)
  ``` 
  ```js
  // 修改后
  app.use(() => {
    return isOk ? [fn, fn2] : [fn]
  })
  ``` 
- [x] refactor: 移动 `router.render` 的位置到 router 声明的地方
- [x] refactor: 抽取 getProxyConfig 方法到公共业务中
- [ ] fix: 多个 proxy ws 无法代理
  - https://github.com/chimurai/http-proxy-middleware#external-websocket-upgrade
  - https://github.com/chimurai/http-proxy-middleware/issues/463#issuecomment-1128835468
  ``` js
  config = {
    proxy: {
      '/': `http://httpbin.org`,
      '/ws1': `ws://ws.ifelse.io`, // 不应无法工作
      '/ws2': `http://ws.ifelse.io`, // 不应无法工作
    }
  }
  config = {
    proxy: {
      '/': `http://127.0.0.1:9000`,
      '/ws': `http://127.0.0.1:9000/websocket`, // 不应无法工作
    },
  }
  ```
- [ ] feat: 目前 config.route 是否支持参数映射
  - 例如 path 中的参数转为 query 中的参数
  - https://github.com/typicode/json-server#add-custom-routes
- [x] refactor: 在统一的地方处理 api, 由于目前处理这些配置的时机不同和方式不同, 出现问题不便处理
  - 目前以下配置都会生成 exporess 中间件, 优先级由上到下从高到低
    - config.route - getDataRouter - 路由重定向, 对 api apiWeb db static 生效, 而不对 proxy 生效
    - config.api - parseApi
    - config.db - parseDbApi
    - config.static - staticHandle - use
    - config.apiWeb - apiWebHandle
    - config.proxy - http-proxy-middleware
  - 先把以上配置都进行统一格式化为一个列表, 并按优先级排序此列表, 标记占用情况
    ``` js
    list = [
      {
        route: String, // 用户路径
        re: RegExp, // 用户路径转换为正则
        method: String, // 用户方法, * 或 all
        type: Enum, // 属于什么配置, 例如 api db proxy
        description: String, // 接口描述
        disable: Boolean, // 是否禁用
        action: Function, // 要执行中间件函数
        occupied: { // 被谁占用, 如果是被占用的状态, 则不会被使用
          type: Enum,
          route: String,
        },
        info: {}, // 根据 type 可能不同结构的附加信息
      },
    ]
    ```
  - 转换 proxy 以及内部路由判断为普通的 use
- [ ] doc: 如何更新 replayPort 返回的数据?
  - 如果代理服务是 9000, 使用同样的参数再请求一下 9000 端口即可, 因为重放时的数据默认会从最新的请求记录中获取
## 功能
- [ ] feat: 在翻译的 api 中返回翻译服务提供商, 以便于排查问题
- [ ] chore: 应向发布后的包注入 commit hash, 以便于精确追溯历史版本, 便于回退版本, 修复缺陷
- [ ] fix: 避免依赖冲突
  ```
  warning package.json: "dependencies" has dependency "mockjs" with range "^1.0.1-beta3" that collides with a dependency in "devDependencies" of the same name with version "^1.1.0"
  ```

- [ ] fix: config.route 也应支持 webApi
- [ ] feat: config.proxy 应支持 url 匹配模式
  ``` js
  config.proxy = {
    "/": `http://127.0.0.1`,
    '/api/:id': [`data.customDict[0].enabled`, 1], // 此拦截规则不应失效
  }
  ```
- [ ] fix: config.proxy 子路径拦截不应该失效
  ``` js
  config.proxy = {
    "/api/": `http://127.0.0.1/api/`,
    '/api/a/b/c/:id': [`data.customDict[0].enabled`, 1], // 此拦截规则不应失效
  }
  config.proxy = {
    '/api/a/b/c/:id': [`data.customDict[0].enabled`, 1], // 此拦截规则不应失效
    "/api/": `http://127.0.0.1/api/`,
  }
  ```
- [x] feat: 支持操作 lowdb 实例
  - https://github.com/typicode/json-server/issues/484 - 推荐
  - https://github.com/typicode/json-server/issues/401
  - https://github.com/typicode/lowdb
  - https://github.com/typicode/json-server/issues/349

- [ ] feat: 支持自动添加更新时间
  - https://github.com/typicode/json-server/issues/125
  - https://github.com/typicode/json-server/issues/262
  - https://github.com/typicode/json-server/issues/854
  - https://github.com/typicode/json-server/issues/113
  - https://github.com/typicode/json-server/issues/125

- [x] feat: 支持从 config.api 拦截 config.db 的接口
- [ ] feat: 支持根路径拦截
  ``` js
  config.proxy = {
    '/': {
      target: `http://www.httpbin.org/`, // target host
      onProxyReq (proxyReq, req, res) { // 拦截请求
        console.log(`req`, req.url)
        proxyReq.setHeader(`x-added`, `req`)
      },
    },
  }
  ```
  可以修改 `config.proxy.forEach`  中的逻辑 context 为 `/` 时也运行 server.use 逻辑, 目前修改之后会导致 config.db 中的接口失效
- [x] refactor: 将依赖 git 仓库的 better-mock 更改为 npm 的 @wll8/better-mock
- [x] refactor: 把 config 放置于全局, 避免传参位置过多
- [x] refactor: 在 util 中
  - 抽离以下方法, 因为他们属于业务
    - [x] prepareProxy
    - [x] parseProxyTarget
    - [x] parseRegPath
  - [x] 把 handlePathArg 放到 cli 中
  - [x] middleware 中内容应属业务方法
- [x] fix: config.api 是 config.proxy 的子路径并携带参数时应能覆盖
  例如以下配置不应导致 `/api/test?a=1` 不能使用
  ``` js
  config = {
    proxy: {
      '/api/': `http://172.16.203.81/api/`,
    },
    api: {
      '/api/test': {msg: 123},
    },
  }
  ```
- [x] fix: 连接不存在的 ws api 2-3次会报错
- [x] fix: config.proxy 非 `/` 代理时, host 不应是 `/` 的代理
- [ ] feat: 支持根据运行环境自动切换语言
- [ ] feat: 支持生成纯前端可用的 mock 数据
- [x] feat: 添加配置文件自动提示功能
- [ ] feat: mockjs 生成多条数据例如数组时, 应在函数中能知道当前是第几次调用, 或者添加 @index 表示当前索引
- [x] feat: 把命令行参数 `config` 替换为 `--config`, 期望双横线开关的参数都代表是仅命令行可用的参数
- [x] feat: config.proxy 支持函数, 自定义 response 修改过程, 返回响应值
- [x] feat: 程序的 SIGINT 事件不应显示日志, 容易造成误解
- [x] feat: 去除动态安装时的弹窗
  - 弹窗原来是为了可以看到安装进度, 但是在安装次数过多时会造成过打扰
- [ ] feat: 支持在后端服务关闭时可以以文档形式浏览 openApi
- [ ] feat: config.clearHistory 支持字符串 `all` 表示清除(清空 request, httpHistory.json)
- [x] feat: 当使用 remote 加载远程 url 时, 不应总是输出 err log, 避免认为程序错误
- [x] feat: 支持使用记录的响应数据来创建接口
  - 因为 id 引用的是 httpHistory 目录中的内容, 但此目录通常又不方便上传到版本控制系统, 所以把请求记录的值直接转换为 webApi, 可方便的多人共享或复用已有的数据.
- [x] feat: 支持自定义多个重放时要更新的 header
  - 有些授权字段不一定是 authorization, 可能是其他的一个或多个字段, 这时候可以通过 config.updateToken 来配置. 重发请求或者在 swagger 界面测试请求时, 都会更新指定的 header 后再发送请求.
- [x] fix: 重载时 global.INJECTION_REQUEST 中的值不应丢失
  - [x] server 应该把值保存在文件中, 而不是变量中
  - [x] client 应在请求时获取 INJECTION_REQUEST, 而不是刷新页面才获取
- [ ] feat: 支持关闭和开启 testPort 和 replayPort 功能, 因为某些服务可能不需要
- [x] feat: 支持禁用请求记录, 因为有些类似心跳的请求总是记录的意义不大. 例如
  - [x] 禁用所有
  - [x] 禁用某个 url
  - [ ] 仅记录后 n 条
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
  - [x] window
  - [ ] macos/linux
- [ ] feat: 显示完整的 swagger , 方便浏览其他 api
- [ ] feat: 标记数据是来自自定义 api 还是后台接口
- [ ] feat: 思考如何解决记录的请求与实际发送的请求的混乱问题, 例如
  - req.url 和 req.method 被修改, 应该如何记录
- [ ] feat: 应该记录原始请求, 例如 req.originalUrl , 因为 req.url 会在程序内被修改, 记录它会感觉很奇怪
- [ ] fix: 应该尽量使用 req.originalUrl
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
- [ ] fix: 当 webApi 与 config.api 相同时, webApi 不应该优先
  - 违背了文档: `从 web 页面创建的接口数据, 会与 config.api 合并, config.api 具有优先权`
  - 这似乎是某个版本之后导致的问题
  - 禁用 webApi 也无效
- [x] fix: 当 config.proxy 与 config.api 相同时, proxy 不应该优先
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
  - 未重现
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
- [x] fix: 删除 apiWeb 中的空对象, 避免手动编辑 apiWeb 时出现重复的 key
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

## 重构
- [x] refactor: 处理接口 `:9005/api/getOpenApi/` 的返回值, 更改为在原始 openApi.info 中添加 _openApiPrefix 作为接口前缀
- [x] refactor: 修正拼写错误的 oepnApiData 为 openApiData
- [x] refactor(test): 移除测试脚本中的 `with` 写法, 因为它会影响编辑器的自动提示功能
  - 例如在 `with (util) {}` 内输入 `require('fs').ex` 时并不会自动提示 `require('fs').existsSync`

## 破坏性更新计划
- 2.x
  - [ ] refactor: 移除 libObj.midResJson 方法, 因为他并不是一个 lib
  - [ ] refactor: 把 initPackge, hasPackage, installPackage 放到 npm 中
  - [ ] feat: 客户端支持从本地引用静态资源, 避免在不能访问外网时无法连接 cdn 
  - [ ] refactor: node 支持版本调整为 v12+
  - [ ] refactor: 更改 config 函数中的 tool 为 toolObj , lib 为 libObj
  - [ ] fix: 期望 webApi 禁用所有API时应为 `*` 而不是 `/`, 因为它可能表示仅禁止根 api
  - [ ] refactor: 期望 httpHistory 中仅保存 id, 因为可能大多数请求只有少量报文却有大量 header, 导致 httpHistory 文件激增
  - [ ] refactor: 期望更改 httpData 目录为 mockm_data, 因为 httpData 名字比较通用, 可能会被其他程序使用
  - [ ] feat: 依赖更新: ws@8.x 文本消息和关闭原因不再解码为字符串, 而是默认返回 Buffers. 另外, 8.2.x 支持 esm
  - [ ] feat(server): 更改 openApi 的功能 - 破坏性修改
    - 为了统一逻辑, 删除 array[string] 的 pathname 最高匹配度特性
    - 支持的类型: string | array[string] | object | array[object] 
    - string - 指定一个 openApi 地址
    - array[string] - 根据顺序到每个 json 中匹配对应的 path 返回 json
    - object - 配置后再进行匹配，例如上个版本的 key 作为此版本的 resPrefix
    - object.url openApi - 文件地址
    - object.resPrefix - 将前缀添加到 oepnApi 的 path 中
    - object.reqPrefix - 将前缀添加到请求的 path 中
    - array[object] - 参考 object
## 备注
- [ ] filenamify@5.x 只支持 esm
- [ ] node-fetch@3.x 只支持 esm
- [ ] get-port@6.x 只支持 esm
- esm 升级说明: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
- esm 工具 https://medium.com/web-on-the-edge/tomorrows-es-modules-today-c53d29ac448c
## 解决 mockjs 的问题
### 前端API问题
- 不能使用 fetch https://github.com/nuysoft/Mock/issues/430
