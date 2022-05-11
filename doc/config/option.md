# 配置项

## config.disable
类型: boolean
默认: false

用于快速屏蔽是所有自定义的 api, 直接通往服务器.

::: details FQA
**如何禁用单个自定义的接口**
不需要提供配置, 方法比较多.
- 改一下路径, 让接口匹配不上自定义接口即可.
- 直接注释掉想跳过的接口.
:::

## config.osIp
类型: string
默认: 本地网卡第一个 IPv4 地址

想绑定到 mm 程序的 IP, 会自动添加到 [调试链接](#config-apiinheader) 中.

::: details 示例
**绑定已经有内网穿透的IP到 x-test-api 上**
``` js
{
  osIp: `8.8.8.8`
}
```
例如 8.8.8.8 是一个已经映射了外网的服务器, 那么请求的响应体上的 x-test-api 上的 IP 会被替换.
``` sh
# 替换前
x-test-api: http://127.0.0.0:9005/#/history,v/get/ip

# 替换后
x-test-api: http://8.8.8.8:9005/#/history,v/get/ip
```
::: 

## config.port
类型: number | string
默认: 9000

服务端口, 用于接口调用.

## config.testPort
类型: number | string
默认: 9005

调试端口, 用于生成测试页面服务

## config.replayPort

类型: number | string
默认: 9001

重放端口, 用于使用服务端口产生的缓存数据.

## config.replayProxy
类型: boolean
默认: true

记录中不存在所需请求时, 是否转发请求到 [proxy](#config-proxy).

- false 不转发
- true 转发

## config.replayProxyFind
类型: function
默认:

@[code transcludeWith=snippet-replayProxyFind](@/../server/config.js)

自定义请求重放时的逻辑.

## config.hostMode
类型: boolean
默认: false

是否通过修改 host 文件来实现代码 `0侵入`.

- true 是
- false 否

::: details 注意
- 启用时 port 配置将被忽略, 将自动与 proxy 端口保持一致, 因为 host 文件无法实现类似 `127.0.0.1:9000 a.com:8080` 的指定端口效果, 所以只能通过在本地启动与目标一致的端口来解决这个问题.
  - 参考 [Using port number in Windows host file](https://stackoverflow.com/questions/8652948/using-port-number-in-windows-host-file), 
- 由于是使用更改 host 文件来实现的, 当程序异常退出时没有还原修改会导致无法访问原地址.
- 仅支持 proxy 是域名的情况, 这是由 host 文件的工作性质决定的, 即 ip 就直接访问 ip, 不会经过 host 文件.
- proxy 中的拦截功能将失效, 即不能再转发到目标服务器(因为已经在 host 声明目标服务器就是自己, 自己再指定自己就陷入循环了).
:::

## config.updateToken
类型: boolean | string | string[] | object
默认: true

指定如何从上一个 http 请求获取数据到重放和调试时的 http 请求上.

对象的 key 指定了从上一个请求的的哪里获取值.

``` js
/** 
 * 不使用
 */
updateToken = false

/**
 * 相当于 `{'req.headers.authorization': 'req.headers.authorization'}`
 */
updateToken = true

/**
 * 相当于 `{'req.headers.auth': 'req.headers.auth'}`
 */
updateToken = `auth`

/**
 * 相当于
 * ```
 * {
 *   'req.headers.auth': 'req.headers.auth',
 *   'req.headers.auth2': 'req.headers.auth2',
 * }
 * ```
 */
updateToken = [`auth`, `auth2`] 

/**
 * 自定义每个 key/value 的对应关系, 目前仅支持 `req.headers.*` , value 可使用函数 `({req}) => [key, value]`
 */
updateToken = {
  'req.headers.authorization': 'req.headers.authorization',
  'req.headers.a': 'req.headers.b',
  'req.headers.a2': ({req, value}) => { // 动态设置, 参数中的 value 是上一次请求中对应路径的值
    return ['req.headers.b2', `123456`] // 第一项是要设置的 key, 第二项是 value
  },
}
```

## config.apiInHeader
类型: boolean | string
默认: true

是否在 header 中添加调试 api 地址.

- false 不添加调试地址
- true 时 `x-test-api`.
- string: 时为自定义 header 字段.

## config.proxy
类型: string | object
默认: `http://www.httpbin.org/`


代理到远程的目标域名，为对象时每个键是分别对应一个要自定义代理的路由.

注: 是对象时, 需要存在键 `/` 表示默认域名.
此功能可以自定义拦截过程, 类似 webpack 中的 `devServer.proxy` .

- string 直接请求转发到指定地址. 
- object 相当于传入 proxy 的配置.

参考 [proxy](https://github.com/chimurai/http-proxy-middleware#http-proxy-options).

### 快速修改 json response

支持以简便的方式快速处理 json 格式的 response, 使用数组语法: `[A, B]`.
数组中不同个数和类型有不同的处理方式, 参考下表:

| 个数 | [A, B] 类型      | 处理方式       | 处理前              | 操作                          | 处理后                    |
| ---- | ---------------- | -------------- | ------------------- | ----------------------------- | ------------------------- |
| 0, 1 | [any]            | 直接替换       | `{a: 1}`            | `[]` 或 `[undefined]`         |
|      |                  |                | `{a: 1}`            | `[123]`                       | 123                       |
| 2    | [string, any]    | 替换指路径的值 | `{a: 1}`            | `['a', 2]`                    | `{a: 2}`                  |
|      |                  |                | `{a: {b: 1, c: 2}}` | `['a.b', undefined]`          | `{a: {c: 2}}`             |
| 2    | [object, `...`]  | 浅合并         | `{a: {a: 1}}`       | `[{a: {b: 2}, c: 1}, '...']`  | `{a: {b: 2}, c: 1}`       |
|      | [object, `deep`] | 深合并         | `{a: {a: 1}}`       | `[{a: {b: 2}, c: 1}, 'deep']` | `{a: {a: 1, b: 2}, c: 1}` |

A 或 B 支持传入函数, 可以接收 `{req, json}`, 返回值是前端最终收到的值.

::: details 示例
进一步解释表格中的示例.

**直接替换**

```txt
处理前
{
  "a": 1
}

操作, 直接替换为空
[] 或 [undefined]

处理后
undefined
```

**直接替换**

```txt
处理前
{
  "a": 1
}

操作, 直接替换为 123
[123]

处理后
123
```

**替换指定路径的值**

```txt
处理前
{
  "a": 1
}

操作, 把 a 的值替换为 2
['a', 2]

处理后
{
  "a": 2
}
```

**替换指定路径的值**

```txt
处理前
{
  "a": {
    "b": 1,
    "c": 2
  }
}

操作, 把 a 下面 b 的值删除
['a.b', undefined]

处理后
{
  "a": {
    "c": 2
  }
}
```

**浅合并**

```txt
处理前
{
  "a": {
    "a": 1
  },
  "c": 1
}

操作, 合并时直接替换, 此示例会直接替换掉 a 对象
[
  {
    "a": {
      "b": 2
    },
    "c": 1
  },
  "..."
]

处理后
{
  "a": {
    "b": 2
  },
  "c": 1
}
```

**深合并**

```txt
处理前
{
  "a": {
    "a": 1
  }
}

操作, 深层合并对象, 此对象会合并 a 对象
[
  {
    "a": {
      "b": 2
    },
    "c": 1
  },
  "deep"
]

处理后
{
  "a": {
    "a": 1,
    "b": 2
  },
  "c": 1
}
```

:::

### 请求转发
可以方便的支持任意路径转发, 以下演示转发到其他域名:

```js {3}
proxy: {
  '/': `https://httpbin.org/`,
  '/get': `https://www.httpbin.org/ip`,
},
```

## config.remote
类型: boolean
默认: false
是否启用外网映射.

::: details 注意
此修改需要重启才能生效, 由于此服务是使用 ngrok 的免费服务提供的, 无需注册, 所以有一些 ngrok 给予的限制, 具体限制以 ngrok 的错误提示为准, 例如:

- 不固定的随机生成外网 URL
- 限制每个 URL 的使用时长
- 限制每分钟请求数
- 较慢的网络速度(这与大陆网络环境也有一定的关系)
- 强制的版本更新

虽然看起来有点苛刻, 但是对于免注册来说已经很良心了, 对于常见 api 测试来说已经足够了.

由于 mockm 在 `v1.1.25-alpha.15` 之前不知道 ngrok 对于未注册用户会强制要求更新而导致外网映射功能无法正常使用.

要解决此问题有两个方案:
- 方案1: 更新 mockm 到 v1.1.25-alpha.15 以上的版本
- 方案2: 手动进入 mockm 的安装目录(node_modules\mockm)运行命令 `npx ngrok update` 来更新 ngrok

:::

## config.openApi
类型: string | string[] | openApi | openApi[]
默认: `http://httpbin.org/spec.json`

关联的 openApi 数据文件, 支持 json 格式, 会自动根据当前的 api 匹配对应的 swagger 文档. 支持多个 api 源.

- string 直接使用一个 openApi
- string[] api 根据顺序到每个 json 中匹配对应的 path
- openApi api 应用配置后再进行匹配，例如上个版本的 key 作为此版本的 resPrefix
  ``` ts
  interface openApi {
    /**
     * openApi 地址
     */
    spec: string, 
    /**
     * 将前缀添加到 oepnApi 的 path 中, 支持传入函数, 接收请求的 api 用于自定义
     */
    resPrefix: string|((api: string) => string),
    /**
     * 将前缀添加到请求的 path 中
     */
    reqPrefix: string|((api: string) => string),
  }
  ```
支持 basic-auth 认证, 在 url 上携带用户名密码即可, 例如 http://name:passwd@httpbin.org/spec.json.

当为 object 时, key 也作为 ui 界面上 swagger 调试地址的匹配. 例如某个服务有 openApi 地址, 在里面有一个 api 是 /user, 但是最终部署之后经过代理的请求接口实际是 /api/server/user, 这种情况下 key 的值就是 `/api/server`.

## config.cors
类型: boolean
默认: true

是否允许通过跨域.

- true 自动允许跨域
- false 不对源跨域方式做任何处理

## config.dataDir
类型: string
默认: `./httpData/`

http 请求数据保存目录.

## config.dbJsonPath
类型: string
默认: `${config.dataDir}/db.json`

json 数据生成的保存位置.

## config.dbCover
类型: boolean
默认: false

是否在重载时重新根据 config.db 生成新的数据文件.

- false 不重新生成, 但会补充新添加的数据
- true 总是重新生成

::: details FQA
**修改了 config.db 中的深层对象的属性没有生效**
由于对象的数据已经生成了, 改变对象中的某个属性, 这个对象也不会改变.
如果需要改变, 删除 config.dbJsonPath 文件中的对应的对象, 再保存一下 mm.config.js 即可.

:::

## config.db
类型: object | function
默认: {}

供 [json-server](https://github.com/typicode/json-server) 使用的 json 数据.

- object 直接作为数据使用
- function 应返回一个对象

::: details 示例
随机生成带有 id, 用户, 阅读量, 作者等信息的 40 至 60 本书数据, 以及相关的增删查改接口. 不到 1分钟即可实现这些功能.

``` js
module.exports = util => {
  return {
    db: util.libObj.mockjs.mock({
      'books|40-60': [
        {
          'id|+1': 1,
          user: /\d\d/,
          view: /\d\d\d\d/,
          'type|1': [`js`, `css`, `html`],
          'discount|1': [`0`, `1`],
          author: {
            'name|1': [`张三`, `李四`],
          },
          title: '@ctitle',
        }
      ],
    }),
  }
}
```

所有的创建或修改都会像真实的后台接口把操作结果存储在数据库一样.

- 基本操作
GET    /books -- 获取所有
POST   /books -- 增加一条
GET    /books/1 -- 获取某条
PUT    /books/1 -- 修改某条
PATCH  /books/1 -- 部分修改某条
DELETE /books/1 -- 删除某条

- 过滤
GET /books?discount=1&type=js -- 不同字段查询
GET /books?id=1&id=2 -- 相同字段不同的值
GET /books?author.name=张三 -- 使用点查询深层数据

- 分页
GET /books?_page=2 -- 分页
GET /books?_page=2&_limit=5 -- 分页并指定每页数量

- 排序
GET /books?_sort=view&_order=asc -- 排序
GET /books?_sort=user,view&_order=desc,asc -- 多字段排序

- 截取
GET /books?_start=2&_end=5 -- 截取 _start 到 _end 之间的内容
GET /books?_start=20&_limit=10 -- 截取 _start 后面的 _limit 条内容

- 运算
GET /books?view_gte=3000&view_lte=7000 -- 范围  `_gte` `_lte`
GET /books?id_ne=1 -- 排除 `_ne`
GET /books?type_like=css|js -- 过滤器 `_like`, 支持正则

- 全文检索
GET /books?q=张三 -- 精确全文匹配

:::

## config.route
类型: object
默认: {}

路由映射, 作用于 config.api 及 config.db 产生的 api

::: details 示例

假设接口 `/books/1` 希望能通过 `/test/db/api/` 前缀访问, 配置如下:

``` js
{
  '/test/db/api/*': '/$1', // /test/db/api/books/1 => /books/1
}
```

参考 [json-server](https://github.com/typicode/json-server#add-custom-routes).
::: 

## config.apiWeb
类型: string
默认: `${config.dataDir}/webApi.json`

从 web 页面创建的接口数据, 会与 config.api 合并, config.api 具有优先权

## config.apiWebWrap
类型: boolean | function
默认: wrapApiData

统一包装从 web 页面创建的接口数据.

这是默认统一使用的包裹结构: wrapApiData
``` js
function wrapApiData({data, code = 200}) { // 包裹 api 的返回值
  code = String(code)
  return {
    code,
    success: Boolean(code.match(/^[2]/)), // 如果状态码以2开头则为 true
    data,
  }
}
```

## config.api
类型: object | function
默认: {}

自建 api.

- object 对象的 key 为 api 路由.
- function 可以获得工具库, 参考 [config.api.fn](../config/config_api_fn.md). 函数应返回一个对象.

当与 config.proxy 中的路由冲突时, config.api 优先.

对象的 key 为 api 路由, `请求方法 /路径`, 请求方法可省略, 示例:

- `/api/1` 省略请求方法, 可以使用所有 http 方法访问接口, 例如 get post put patch delete head options trace.
- `get /api/2` 指定请求方法, 例如只能使用 get 方法访问接口
- `ws /api/3` 创建一个 websocket 接口
- `use /api/4` 自定义一个中间件, 作用于任何 method 的任何子路由

非 use 时, value 可以是函数或 json, 为 json 时直接返回 json 数据.

``` js
api: {
  // 当为基本数据类型时, 直接返回数据
  'get /api/1': {msg: `ok`},
  // http 接收的参数, 参考 example 中间件 http://expressjs.com/en/guide/using-middleware.html
  'get /api/2' (req, res, next) {
    res.send({msg: `ok`})
  },
  // websocket 接收的参数, 参考 https://github.com/websockets/ws
  'ws /api/3' (ws, req) {
    ws.on('message', (msg) => ws.send(msg))
  }
  // 使用中间件实现静态资源访问, config.static 就是基于此方式实现的
  'use /news/': require('serve-static')(`${__dirname}/public`),
  // 拦截 config.db 生成的接口
  '/books/:id' (req, res, next) { // 在所有自定义 api 之前添加中间件
    req.body.a = 1 // 修改用户传入的数据
    next()
    res.mm.resHandleJsonApi = (arg) => {
      arg.res.locals.data // json-server 原始的数据
      arg.data // 经预处理的数据, 例如将分页统计放置于响应体中
      arg.resHandleJsonApi // 是全局 config.resHandleJsonApi 的引用, 若无需处理则直接 return arg.data
      arg.data.a = 2 // 修改响应, 不会存储到 db.json
      return arg.resHandleJsonApi(arg)
    }
  },
},
```

## config.resHandleReplay
类型: function
默认: `({req, res}) => wrapApiData({code: 200, data: {}})`

处理重放请求出错时会进入这个方法.

::: tip
对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能), 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以尽量正常运行.
:::

## config.resHandleJsonApi
类型: function
默认: `({req, res: { statusCode: code }, data}) => wrapApiData({code, data})`

由 config.db 生成的接口的最后一个拦截器, 可以用来构建项目所需的数据结构.

## config.watch
类型: string | array[string]
默认: []

指定一些目录或文件路径, 当它们被修改时自动重载服务. 支持绝对路径和相对于配置文件的路径.

## config.clearHistory
类型: boolean | object | function
默认: false

启动时清理冗余的请求记录.

- boolean 是否启用
  - false 不清理记录
  - true 使用默认配置清理记录
- object 启用并传入配置
  - retentionTime 从多少分钟前的历史中选择要清除的项目
    - 默认 `60 * 24 * 3`, 即 3 天前
  - num 相同内容保留条数, 正数时保留新记录, 负数时保留旧记录
    - 默认 `1`
- function 自定义清理函数, 获取 history 列表, 返回要删除的 id 列表

默认配置使用以下几个内容来判断内容相同.
  - 请求 URL
  - 请求方法,
  - 状态码,
  - 请求体 MD5,
  - 响应体 MD5,

## config.guard
类型: boolean
默认: false

当程序异常退出时, 是否自动重启.

## config.backOpenApi
类型: boolean | number
默认: 10

每隔多少分钟检测 openApi 更新记录, 保存到 `${config.dataDir}/openApiHistory` 目录中.

- boolean 是否启用
  - false 禁用
  - true 使用默认配置
-  number 启用并设置检测的分钟数

## config.static
类型: string | object | array
默认: undefined

配置静态文件访问地址, 优先级大于 proxy, 支持 histroy 模式.

- string 可以是相对于运行目录的路径, 或绝对路径
- object
  - path: string 浏览器访问的 url 前缀, 默认 `/`
  - fileDir: string 本地文件的位置. 可以是相对于运行目录的路径, 或绝对路径
  - mode: string 配置访问模式, 可选 `histroy` 和 `hash(默认值)`
  - option: object [模式的更多配置](https://github.com/bripkens/connect-history-api-fallback#options)
- array[object] 使用多个配置

::: details 示例

``` js
{
  static: `public`, // 访问 http://127.0.0.1:9000/ 则表示访问 public 中的静态文件, 默认索引文件为 index.html
  static: { // 访问 dist 目录下 history 模式的项目
    fileDir: `dist`,
    mode: `history`,
  },
  static: [ // 不同的路径访问不同的静态文件目录
    {
      path: `/web1`,
      fileDir: `/public1`,
    },
    {
      path: `/web2`,
      fileDir: `/public2`,
    },
    {
      path: `/web3`,
      fileDir: `/public3`,
      mode: `history`,
    },
  ],
}
```
::: 

## config.disableRecord
类型: boolean | string | string[] | DisableRecord | DisableRecord[]
默认: false

哪些请求不记录.

- boolean 是否禁用
  - false 默认不禁用
  - true 不记录所有
- string 禁用的 path
- DisableRecord 使用对象配置
  ``` ts
  interface DisableRecord {
    /**
     * 请求地址, 将被转换为正则
     */
    path: string,

    /**
     * 请求方法, 不指定时为匹配所有
     */
    method: Method,

    /**
     * 仅记录后 n 条, 0 表示不记录
     * @default
     * 0
     */
    num: number,
  }
  ```
- DisableRecord[] 使用多个配置
