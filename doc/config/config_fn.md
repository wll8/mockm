# config 作为函数
当 [配置](./config_file.md#js) 为函数的时候, 会向函数传入一个 util 对象:.
util 目前包含以下内容:

## util.server
暴露出来服务.

### util.server.app httpServer
原生 httpServer 实例, 例如需要监听 http 协议升级时:
``` js
module.exports = util => {
  util.server.httpServer.on(`upgrade`, () => {})
}
```

### util.server.app
express 实例.

``` js
module.exports = util => {
  const app = util.server.app
  app.get(`/`, (req, res) => {
    res.send(`Hello World`)
  })
}
```

### util.libObj.mockjs 数据生成库

## util.libObj 第三方库
### util.libObj.mockjs 数据生成库
- 参考: http://wll8.gitee.io/mockjs-examples/

``` js
const mockjs = util.libObj.mockjs
console.log(mockjs.mock(`@cname`)) // 张三
```

::: details 模板格式
- String
  - 'name|min-max': string
  - 'name|count': string
- Number
  - 'name|+1': number
  - 'name|min-max': number
  - 'name|min-max.dmin-dmax': number
- Boolean
  - 'name|1': boolean
  - 'name|min-max': boolean
- Object
  - 'name|count': object
  - 'name|min-max': object
- Array
  - 'name|1': array
  - 'name|+1': array
  - 'name|min-max': array
  - 'name|count': array
- Function
  - 'name': function
- RegExp
  - 'name': regexp
- Path
  - Absolute Path
  - Relative Path
:::

::: details 占位符
- Basic
  - boolean 
  - natural
  - integer
  - float
  - character
  - string
  - range
- Date
  - date
  - time
  - datetime
  - now
- Image
  - image
  - dataImage
- Color
  - color
  - hex
  - rgb
  - rgba
  - hsl
- Text
  - paragraph
  - sentence
  - word
  - title
  - cparagraph
  - csentence
  - cword
  - ctitle
- Name
  - first
  - last
  - name
  - cfirst
  - clast
  - cname
- Web
  - url
  - domain
  - protocol
  - tld
  - email
  - ip
- Address
  - region
  - province
  - city
  - county
  - zip
- Helper
  - capitalize
  - upper
  - lower
  - pick
  - shuffle
- Miscellaneous
  - guid
  - id
  - increment
:::

### util.libObj.axios 请求库
- 参考: https://github.com/axios/axios

``` js
const axios = util.libObj.axios
axios.defaults.baseURL = 'http://httpbin.org' // 设置 baseURL
axios.interceptors.request.use(config => config,  error => Promise.reject(error)) // 请求拦截
axios.interceptors.response.use(response => response, error => Promise.reject(error)) // 响应拦截

axios.get(`/ip`, { // get 请求与 query 参数
  id: 123,
})

axios.post(`/user/change`, { // post 请求与 body 参数
  name: '张三',
})

axios({ // 同时存在 query 和 body 参数
  method: 'post',
  url: '/user/change',
  params: { id: 123 }, // query 参数
  data: { name: '张三' }, // body 参数
  headers: {'X-Requested-With': 'XMLHttpRequest'}, // 请求头
});

```


### util.libObj.mime 文件类型识别
- 参考: https://github.com/broofa/mime

``` js
const mime = util.libObj.mime

mime.getType('txt')                    // ⇨ 'text/plain'
mime.getExtension('text/plain')        // ⇨ 'txt'
```

## util.toolObj 工具函数
[参考源码 tool.js](https://github.com/wll8/mockm/blob/master/server/util/tool.js)

- array
- string
- npm
- control
- cache
- generate
- url
- file
- cli
- hex
- middleware
- httpClient
- fn
- obj
- os
- type
- time

## util.business 与业务相关性的函数
[参考源码 business.js](https://github.com/wll8/mockm/blob/master/server/util/business.js)

- wrapApiData - 包裹 api 的返回值
- listToData - 把类似 schema 的列表转换为数据
- strReMatch - 如果字符串是正则就返回正则, 否则返回 false
