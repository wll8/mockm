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
默认: 内网网卡第一个 IP

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
类型: boolean | string
默认: true

是否自动从 req 中获取最新 token 然后替换到重发请求的 authorization 上.

- false 不添加
- true 自动添加
- string 自定义 header 字段

## config.apiInHeader
类型: boolean | string
默认: true

是否在 header 中添加调试 api 地址.

- false 不添加调试地址
- true 时 `x-test-api`.
- string: 时为自定义 header 字段.

## config.proxy
类型: string | object
::: details 默认
```js
proxy: {
  '/': `https://example.com/`,
},
```

:::


代理到远程的目标域名，为对象时每个键是分别对应一个要自定义代理的路由.

注: 是对象时, 需要存在键 `/` 表示默认域名.
此功能可以自定义拦截过程, 类似 webpack 中的 `devServer.proxy` .

- string 直接请求转发到指定地址. 
- object 相当于传入 proxy 的配置.

参考 [proxy](https://github.com/chimurai/http-proxy-middleware#http-proxy-options).

### 快速修改 json response

支持以简便的方式快速处理 json 格式的 response, 使用数组语法: `[A, B]`.
数组中不同个数和类型有不同的处理方式, 参考下表:

| 个数 | [A, B] 类型      | 处理方式       | 示例                          | 处理前              | 处理后                    |
| ---- | ---------------- | -------------- | ----------------------------- | ------------------- | ------------------------- |
| 0, 1 | [any]            | 直接替换       | `[]` 或 `[undefined]`         | `{a: 1}`            |
|      |                  |                | `[123]`                       | `{a: 1}`            | 123                       |
| 2    | [string, any]    | 替换指路径的值 | `['a', 2]`                    | `{a: 1}`            | `{a: 2}`                  |
|      |                  |                | `['a.b', undefined]`          | `{a: {b: 1, c: 2}}` | `{a: {c: 2}}`             |
| 2    | [object, `...`]  | 浅合并         | `[{a: {b: 2}, c: 1}, '...']`  | `{a: {a: 1}}`       | `{a: {b: 2}, c: 1}`       |
|      | [object, `deep`] | 深合并         | `[{a: {b: 2}, c: 1}, 'deep']` | `{a: {a: 1}}`       | `{a: {a: 1, b: 2}, c: 1}` |

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
  }
}

操作, 合并时直接替换
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

操作, 深层合并对象
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
  '/': `https://example.com/`,
  '/get': `https://www.httpbin.org/ip`,
},
```

## config.remote
类型: boolean | object
默认: false
注: 此修改需要重启才能生效.

是否映射本地服务到公网.

这里默认使用 ngrok 的免费服务. 值为 object 时是

- false 不启用.
- true 启用.
- object 启用并对每个服务进行配置.

ngrok 配置参考: https://ngrok.com/docs#tunnel-definitions

例:
```js
remote: {
  authtoken: `******`, // 配置 ngrok 用户权限
  tunnels: {
    testPort: { proto: `http` }, // 配置 testPort 的映射方式
    otherPort: { // 映射其他的外网服务, 你不必自己安装 ngrok 即可实现
      addr: 8080
    },
  },
}
```

- [ ] frp 支持正在规划中

## config.openApi
类型: string | array | object
默认: `http://httpbin.org/spec.json`

关联的 openApi 数据文件, 支持 yaml/json 格式, 会自动根据当前的 api 匹配对应的 swagger 文档. 支持多个 api 源.

- string 直接使用一个 openApi
- array api 与每项相比, 取匹配度最高的, 都不匹配时取第一条
- object api 与对象的 key 作为正则进行匹配(`new RegExp(key, 'i').test(pathname)`), 都不匹配时取第一条

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
于对象的数据已经生成了, 改变对象中的某个属性, 这个对象也不会改变.
如果需要改变, 删除 config.dbJsonPath 文件中的对应的对象, 再保存一下 mm.config.js 即可.

:::

## config.db
类型: object | function
默认: {}

供 [json-server](https://github.com/typicode/json-server) 使用的 json 数据.

- object 直接作为数据使用
- function 应返回一个对象

## config.route
类型: object
默认: {}

路由映射, 作用于 config.api 及 config.db 产生的 api
参考 [json-server](https://github.com/typicode/json-server#add-custom-routes).

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
function wrapApiData({data, code}) { // 包裹 api 的返回值
  return {
    code,
    success: Boolean(('' + code).match(/^[2]/)), // 如果状态码以2开头则为 true
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

## config.resHandleReplay
类型: function
默认: `({req, res}) => wrapApiData({code: 200, data: {}})`

处理重放请求出错时会进入这个方法.


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

清理请求记录.

- false 不启用
- true 启用, 使用默认配置
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
