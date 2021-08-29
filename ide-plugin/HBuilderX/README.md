# 使用说明
这是 mockm 的 HBuilderX 辅助工具. 安装后会在右键菜单中添加 `接口编辑`, `简易 postman` 一系列的功能.

如果不能正常使用, 请先安装 [mockm(点击查看文档)](https://github.com/wll8/mockm):
``` sh
# 查看 node 版本, 目前 mockm 支持 node v10.12.0 以上版本
node -v

# 安装
cnpm i -g mockm

# 运行
mockm
```


## 从配置文件生成接口
也可以从[配置文件](https://hongqiye.com/doc/mockm/config/config_file.html)中快速以编程形式创建接口.

示例 mm.config.js :

``` js
module.exports = {
  // proxy: `https://example.com/`, // 代理后端的接口, 如果没有可不填

  api: {  // 自己编写的接口

    // 当为基本数据类型时, 直接返回数据, 这个接口返回 {"msg":"ok"}
    '/api/1': {msg: `ok`},

    // 也可以像 express 一样返回数据
    '/api/2' (req, res) {
      res.send({msg: `ok`})
    },

    // 一个只能使用 post 方法访问的接口
    'post /api/3': {msg: `ok`},

    // 一个 websocket 接口, 会发送收到的消息
    'ws /api/4' (ws, req) {
      ws.on('message', (msg) => ws.send(msg))
    }

    // 一个下载文件的接口
    '/file' (req, res) {
      res.download(`文件路径`, `文件名`)
    },
  
    // 获取动态的接口路径的参数 code
    '/status/:code' (req, res) {
      res.json({statusCode: req.params.code})
    },

    //... 更多功能和示例请参考原 mockm 文档
  },
}
```

访问 http://127.0.0.1:9000/api/1 查看效果, 其他接口类似.

## 打开UI界面 - 接口编辑

![批量添加](https://z3.ax1x.com/2021/05/18/gfuHTU.gif)

如果还没有真实的接口, 可以通过此功能创建便于前后端参考的 `接口|文档` , 它描述了请求的地址, 方法, 参数的位置, 类型, 响应, 并且可以生成供前端调用的接口.

这里创建的接口称为 webApi 接口, 与 [config.api](https://hongqiye.com/doc/mockm/config/option.html#config-api) 中编写的接口进行合并, 重复时会被后者覆盖.

mockm 会根据填写的 `字段名, 示例值, 类型` 转换为对应的响应数据, 支持 mockjs 语法.

快捷键 `ctrl+s` 或点击 method 区域的 `action -> save` 保存.

默认情况下, 生成的整个数据是一个对象. 如果要精确控制返回值, 可以使用快捷键 `ctrl+e` 或点击 `action -> example` 打开的窗口中操作.


### 使用表格中的数据作为响应
![apiWebEdit](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_apiWebEdit_2020-11-10-14-05-27.png)

则根据你在表中录入情况生成数据, 你可以修改返回值为 `object` 或 `array`. 为 object 时, 生成规则表示从单个对象中随机取几个字段, 为 array 时, 表示返回的数组中有多少个对象.

示例数据是根据表格中录入的内容配合生成规则形成的, 仅供预览. 

支持自定义响应头, 以 `key:value` 形式编写即可.

注: 表格形式生成的数据 content-type 为 `application/json` .

### 以编程方式自定义接口响应
![apiWebEdit](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_apiWebEdit_2020-11-10-14-07-10.png)

你可使用 js 编写该接口的逻辑, 例如响应数据根据请求的不同而不同.

与 [config.api](https://hongqiye.com/doc/mockm/config/option.html#config-api) 的编写方式对应, 由于需要考虑安全性, web 界面上不支持直接使用某些方法, 例如 fs 模块. 作为函数使用的时候, 为了方便提供了 `tool` 全局变量.

- tool 这是一个全局对象
  - libObj - 函数接收到的工具, 例如 mockjs, axios
  - wrapApiData - config.js 数据统一处理函数
  - listToData - 可转换 table 为数据的函数
  - cur - 当前接口信息

### 使用历史记录作为响应
![apiWebEdit](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_apiWebEdit_2020-12-03-10-44-49.png)

输入请求ID, 请求当前接口时, 总是返回所输入请求ID的响应, 包括 headers 以及其中的测试链接也总是一样的.

### 批量添加
#### 从文本批量添加
编辑接口时, 双击表格中的添加按钮, 在弹窗中输入要内容即可, 支持层级, 自动翻译, mock 数据和类型自动生成.

示例:
``` txt
昵称
邮箱
头像
孩子
- 年龄
- 出生日期
- 手机号
```

![批量添加](https://z3.ax1x.com/2021/05/18/gfuHTU.gif)

## 更多示例

这里列出一些常用的业务场景, 方便快速查找.
如果有需要后台接口的地方, 统一假设为 http://192.168.1.18:8080.

### 如何使后端的接口允许跨域
> 不需要配置 webpack, 不需要后端人员更改, 不需要浏览器插件

这个功能 mockm 默认是支持的, 以最简方式启动 mockm 就能拥有此功能, 只要在命令行输入下面这条命令即可.
``` sh
mm proxy=http://192.168.1.18:8080
```

你也可以使用配置文件的方式, 创建 `mm.config.js` 文件并录入以下内容, 然后命令行输入 `mm` 即可:

``` js
module.exports = {
  proxy: `http://192.168.1.18:8080`
}
```

然后更换原来的请求地址为自己的即可, 例如自己的 IP 为 192.168.1.17 则做以下更改:
- 更改前: http://192.168.1.18:8080/api/
- 更改后: http://192.168.1.17:9000/api/


### 如何从接口获取请求信息
当我们需要根据接口传入的值来返回不同的内容时, 也是很容易:

``` js
module.exports = {
  api: {
    '/my/value' (req, res) {
      // req.params 是 url 上的路径参数
      // req.query 是 url 上的查询参数
      // req.body 是请求体中的参数
      res.json({desc: `你传入的值`, data: req.query})
    },
  },
}
```

接下访问接口传入一些 url 参数测试一下 http://localhost:9000/my/value?city=上海 结果为:

``` json
{
  "desc": "你传入的值",
  "query": {
    "city": "上海"
  }
}
```

### 如何快速生成 Restful API
假设我要写一个博客文章的列表, 并且要实现添加文章, 查询文章, 分页, 模糊搜索, 删除, 修改等各种功能的接口. 那么只需添加以下内容:

``` js
module.exports = {
  db: {
    'blogs': [
      {
        id: 1,
        content: `mockm 是一款便于使用, 功能灵活的接口工具. 看起来不错~`,
        title: `认识 mockm 的第一天`,
      },
    ],
  },
}
```

这时候上面要实现的所有接口已经实现了. 
这里我用 http 作为请求工具简单表示几个功能, 你可以使用你喜欢的工具发送请求.

``` sh
# 查看 id 为 1 的博文详情
http :9000/blogs/1

# 创建一篇关于同事的文章
http post :9000/blogs title=同事的一天 content=今天他的生活还是同样的苦涩

# 获取所有文章
http :9000/blogs

# 查询所有含有 `苦涩` 的文章
http :9000/blogs?q=苦涩
```

### 如何生成逼真的数据
[mockjs](http://wll8.gitee.io/mockjs-examples/) 是一个不错的数据生成工具, mockm 默认集成了它, 下面用它生成一批用户信息.

``` js
module.exports = util => {
  return {
    db: {
      'users': util.libObj.mockjs.mock({
        'data|15-23': [ // 随机生成 15 至 23 条数据
          {
            'id|+1': 1, // id 从 1 开始自增
            name: `@cname`, // 随机生成中文名字
            'sex|1': [`男`, `女`, `保密`], // 性别从这三个选项中随机选择一个
          },
        ]
      }).data,
    },
  }
}
```

现在访问 http://localhost:9000/users 已经可以看到很多逼真的用户数据了.

### 如何更改后端返回的数据
> 很多时候后端不方便直接修改数据, 因为会涉及很多逻辑, 前端直接写在代码里既麻烦又容易引发问题.

假设后台接口 `http://192.168.1.18:8080/api/user` get 请求返回的数据是这样的:
``` js
{
    "code": 200,
    "data": {
        "books": [
            {
                "page": 52,
                "type": "css"
            },
            {
                "page": 26,
                "type": "js"
            }
        ],
        "name": "张三"
    },
    "success": true
}

```

如果要修改 books 索引为 1 的 type 为 html, 那么配置如下:
``` js
module.exports = {
  proxy: {
    '/': `http://192.168.1.18:8080`,
    '/api/user': [`data.books[1].type`, `html`], // 数组第一个参数是修改的路径, 第二个参数是修改后的值
  },
}
```

如果要直接替换整个返回值为 `html` , 可以这样:
``` js
module.exports = {
  proxy: {
    '/': `http://192.168.1.18:8080`,
    '/api/user': [`html`], // 如果只提供一个参数, 则直接替换
  },
}
```

更多操作方式请参考 [config.proxy](https://hongqiye.com/doc/mockm/config/option.html#config-proxy)

### 如何延迟后端接口的响应时间
示例延迟 http://192.168.1.18:8080/api/user 这个接口的响应时间为 5 秒之后:

``` js
module.exports = {
  proxy: {
    '/': `http://192.168.1.18:8080`,
    '/api/user': {
        mid (req, res, next) {
          setTimeout(next, 5000)
        },
    },
  },
}
```
### 如何创建一个下载文件的接口
实现一个文件下载接口 http://127.0.0.1:9000/file, 发送某文件给客户端.

``` js
module.exports = {
  api: {
    '/file' (req, res, next) {
      res.sendFile(`这里写要下载的文件路径`)
    },
  },
}
```

### 如何创建 websocket 接口
实现一个  websocket 接口 ws://127.0.0.1:9000/wsecho, 当连接成功时发送 `连接成功`, 并把客户端发送的信息再原样返回给客户端.

``` js
api: {
  'ws /wsecho' (ws, req) {
    ws.send(`连接成功`)
    ws.on('message', (msg) => {
      ws.send(msg)
    })
  }
},
```

客户端连接代码, 可以直接打开浏览器 console 测试:

``` js
function startWs(wsLink){
  window.ws = new WebSocket(wsLink)
  ws.onopen = (evt) => { 
    ws.send(`客户端发送的消息`)
  }
  ws.onmessage = (evt) => {
    console.log( `服务器返回的消息`, evt.data)
  }
  ws.onclose = (evt) => { // 断线重连
    setTimeout(() => startWs(wsLink), 1000)
  }
}
startWs(`ws://127.0.0.1:9000/wsecho`)
// ws.send(`发送新消息`)
```

### 如何接收客户端上传的文件
实现一个 post 方法的文件上传接口 http://127.0.0.1:9000/file/upload, 文件上传后保存到临时目录, 并返回文件信息.

``` js
module.exports = util => {
  const {
    toolObj,
  } = util
  return {
    api: {
      async 'post /file/upload' (req, res, next) {
        const multiparty = await toolObj.generate.initPackge(`multiparty`)
        const form = new multiparty.Form()
        form.parse(req, (err, fields = [], files) => {
          const data = {fields, files, err}
          res.json(data) // 保存上传的文件并返回文件信息
        })
      },
    }
  }
}
```

### 如何实现动态的接口路径参数
实现一个接口 http://127.0.0.1:9000/status/code, 其中 code 的位置是一个动态参数, 并返回接收到的 code.

``` js
module.exports = {
  api: {
    '/status/:code' (req, res, next) {
      const {params, query, body} = req
      res.json({statusCode: params.code})
    },
  },
}
```

### 如何向后端展示接口参数
> 告别截图, 告别一问一答, 告别参数太多无法复制

默认情况下, 每次请求会生成一条链接在响应头中的 x-test-api 上, 把这个链接发给后端即可.

- 方法1
直接在启动 mockm 的命令行里可能看到.

- 方法2
在 http://127.0.0.1:9005 页面上的列表中查找.

- 方法3
如果你使用 chrome 开发工具, 可以在 Network 中找到请求的接口在 Response Headers 中找到 x-test-api.

### 如何远程使用接口
把 [config.remote](https://hongqiye.com/doc/mockm/config/option.html#config-remote) 设置为 true 就能拥有域名的和 https 证书的公网接口, 能够在微信公众号上使用, 或者发给其他人远程使用..

在控制台会显示 `远程服务信息`, x-test-api 和接口都会生成对应的远程访问链接.

### 如何接入微信消息推送
当 remote 设置为 true 后会获得一个远程地址, 将其带上接口 `/msg` 填入 `URL(服务器地址)` 中, token 填写例如 `123`, 数据格式推荐 `JSON`. 保存后即可验证通过, 所有微信小程序的消息都会通过 `/msg` 这个接口收到.

``` js
module.exports = {
  remote: true,
  api: {
    '/msg' (req, res) {
      const token = `123` // 这里填写 Token(令牌)
      const crypto = require(`crypto`)
      const { signature, timestamp, nonce, echostr, } = req.query
      const sha = crypto.createHash('sha1').update([token, timestamp, nonce].sort().join('')).digest('hex')
      sha === signature ? res.send(echostr) : res.json({ msg: `验证失败` })
      console.log(req.query, req.body)
    },
  },
}
```

### 如何恢复出错的接口
如果某个接口之前是好的, 但是由于某些问题现在坏了, 后端又没来得及修复, 可是前端现在有页面依赖这个接口, 怎么办?

在 http://127.0.0.1:9005 页面选择对应接口的请求历史, 点击 `webApi => 使用此记录` 即可.

### 如何在后端关闭时不影响页面
页面要展示的内容来源于数据, 如果后端服务器出现问题, 所有接口无法使用, 这时候修改请求地址为 http://127.0.0.1:9001 即可让页面使用之前服务器返回的数据.

### 如何使用多个主机不同的接口
如果某个项目需要用到两个接口, 例如分别在 `192.168.1.13:8098` 和 `192.168.1.13:8099`, 启动多个 mm 实例即可.

如果想要使用同一份配置文件, 只是接口地址不同, 那么只需要从命令行传入不同的部分即可:

``` sh
mm dataDir=./httpData/8081/ port=8081 replayPort=8181  testPort=8281 proxy=http://192.168.1.13:8081
mm dataDir=./httpData/8082/ port=8082 replayPort=8182  testPort=8282 proxy=http://192.168.1.13:8082
```

如果要使用不同的配置, 那么启动 mm 时传入配置文件路径即可, 然后再从配置文件中编写不同的部分:
``` sh
mm --config=./8081.config.js
mm --config=./8082.config.js
```

## 寄语
如果有任何使用问题, 请直接问我, 必将尽力解决.

如果觉得有用, 开源不易, 点个 start 以表支持:
- 源码地址: [https://github.com/wll8/mockm](https://github.com/wll8/mockm)
- 文档地址: [https://hongqiye.com/doc/mockm](https://hongqiye.com/doc/mockm)