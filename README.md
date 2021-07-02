# mockm
<p align="center">
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/dt/mockm" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/v/mockm" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/l/mockm" alt="License"></a>
<p>

- [观看视频](https://hongqiye.com/doc/mockm/)
- [查看文档](https://hongqiye.com/doc/mockm/)

优雅的解决前端开发过程中的各种接口问题，例如跨域、接口模拟、数据生成、请求记录和重放……

## 快速使用 quick start
``` sh
# 查看 node 版本, 目前 mockm 支持 node v10.12.0 以上版本
node -v

# 安装
npm i -g mockm

# 运行
mockm

# 浏览器打开 http://127.0.0.1:9005
```

mockm 可以读取运行目录下的文件 `mm.config.js` 作为配置, 以下是示例内容.

``` js
module.exports = {
  proxy: `https://httpbin.org/`, // 代理后端的接口, 如果没有可以不填

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

    //... 更多功能和示例请参考文档
  },
}
```
## 常用选项 options
**remote**
是否自动映射服务到外网.

**guard**
是否异常崩溃后自动重启.

**watch**
指定一些目录或文件路径, 当它们被修改时自动重载服务.

**proxy**
要代理的后端接口地址.

**api**
自定义接口, 支持完整的编程逻辑, 各种便捷写法, websocket, 或中间件.

**static**
配置静态文件目录, 支持 history 模式.

**db**
自动生成 Restful api.


更多选项请参考文档.

## 问题 Issues
你可以先查阅文档, 如果还是不能解决, 请点击 [Issues](https://github.com/wll8/mockm/issues) 详细描述出现问题的步骤和期望. 

如果你认为这可能是 mockm 的问题, 建议在描述中附加 `httpData/log.err.txt` 中的相关错误日志. 

你也可以 [加入官方答疑QQ群62935222](https://qm.qq.com/cgi-bin/qm/qr?k=4rvOknpHyqs5wd3c2kEt34Eysx83djEZ&jump_from=webapi).

## 贡献 Contribution
mockm 还有很多不足, 如果愿意, 欢迎参与贡献.

## 许可 License
[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, xw


