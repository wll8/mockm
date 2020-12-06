# 更新日志
本程序更新日志, 以月为目录, 模块为子目录来叙述.

## 2020年12月05日 (v1.1.6)
- fix: 修复当配置文件中的 config.proxy 为 string 时解构导致错误
- feat: 取消命令行参数 v, 修改为总是显示版本号
- feat: 支持在配置文件中声明 [watch](../config/option.md#config-watch) 参数
- feat: 支持检查新版本
  - 使用命令行参数  `--no-update` 禁用更新检查
## 2020年12月03日 (v1.1.3)
源代码发布.

- 0 侵入, 无需修改项目中的任何代码即可投入使用
- 快速生成接口和数据, 以及文档
- 支持 Restful API
- 支持 api 拦截, 注入, 请求及响应修改
- 修改实时生效
- 支持自动允许跨域
- 自动带参调试, 无需登录
- 自动根据接口查找文档和调试地址
- 请求记录, 重放
- 当提供接口的后端服务出现问题, 也可最大程度还原接口响应
- 无需数据库支持
- 跨平台, 支持 linux macos windows
- 支持远程调试, 一个属性完成内网穿透