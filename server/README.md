# mockm
一款便于使用, 功能灵活的接口工具.

QQ交流群: [62935222](https://qm.qq.com/cgi-bin/qm/qr?k=4rvOknpHyqs5wd3c2kEt34Eysx83djEZ&jump_from=webapi)

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

## 快速开始
1. 命令行输入 `npm i -g mockm` 安装
2. 创建配置文件 `mm.config.js` 并录入内容
``` js
module.exports = {
  api: {
    '/my/api': {msg: `我的 api`},
  },
}
```
3. 命令行输入 `mm` 启动

所有工作已经完成了, 请享用:
- 浏览器访问 http://127.0.0.1:9000/my/api 查看效果.
- 浏览器访问 http://127.0.0.1:9005/#/get/my/api 请求详情.
- 想了解更多功能请继续阅读...

文档: https://www.hongqiye.com/doc/mockm
