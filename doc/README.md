# mockm
<p align="center">
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/v/mockm.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/l/mockm.svg?sanitize=true" alt="License"></a>
<p>

集模拟和调试功能于一身. 自动生成数据和增删查改一系列接口, 支持文件上传下载, 延迟, 自定义接口逻辑...

## 特性
- 0 侵入, 无需修改项目中的任何代码即可投入使用
- 快速生成接口和数据, 以及文档
- 支持 Restful API
- 以最方便的形式支持 api 拦截, 注入, 请求及响应修改
- 修改实时生效
- 支持自动允许跨域
- 自动带参调试, 无需登录
- 自动根据接口查找文档和调试地址, 标识字段描述
- 请求记录, 重放
- 当提供接口的后端服务出现问题, 也可最大程度还原接口响应
- 参数预校验, 助你分析接口联调的问题所在
- 无需数据库支持
- 根据接口生成业务代码
- 跨平台, 支持 linux macos windows
- 支持远程调试, 一个属性完成内网穿透

## 使用
1. **安装**: 命令行输入 `npm i -g mockm`
2. **配置**: 创建文件 `mm.config.js` 并录入内容
``` js
module.exports = {
  proxy: `https://example.com/`, // 替换为后端的接口地址, 如果没有可不填
  api: { // 编写自己的接口
    '/my/api': {
      msg: `我的 api`
    },
  },
}
```
3. **启动**: 命令行输入 `mm`

所有工作已经结束了, 并且你还创建了一个自己的 api, 拥有了后端接口允许跨域的功能, 接口记录功能和重放功能...
- 浏览器访问 http://127.0.0.1:9000/my/api 查看效果.
- 浏览器访问 http://127.0.0.1:9005/#/get/my/api 查看请求详情.
- 想了解更多功能请继续...

### 示例
https://www.hongqiye.com/doc/mockm/use/example.html

## 部分功能截图
**请求记录**
可以从查看请求记录, 手机上也能使用, 不用担心浏览器关闭.

![请求记录](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_api_list_2020-09-21_100140.png)

**请求详情**
可以查看每个接口的请求详情, 包括请求参数, 响应参数.

![请求详情](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_history_2020-11-10-11-33-26.png)

**swagger**
可以直接使用进行 swagger 调试, 不用再去找接口.

![swagger](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_swagger_2020-11-10-11-32-18.png)

**接口编辑**
可以从界面上快速创建接口/文档, 同时生成数据.

![接口编辑](https://cdn.jsdelivr.net/gh/wll8/mockm@1.1.14/doc/image/mockm_apiWebEdit_2020-11-10-14-03-22.png)

