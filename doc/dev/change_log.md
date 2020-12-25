# 更新日志
本程序更新日志, 以月为目录, 模块为子目录来叙述.

## 2020年12月

#### v1.1.18
- fix: 从请求详情中点击编辑 webApi 时, 不应该携带 query 参数

#### v1.1.17
- fix: 使用 spawn 方法的 env 参数时合并 process.env, 避免在某些系统出现问题
- feat: 支持 MOCKM_REGISTRY 或 NPM_CONFIG_REGISTRY 环境变量指定按需安装依赖时的镜像地址

#### v1.1.16
- fix: [#9 某些时候颜色打印出错](https://github.com/wll8/mockm/issues/9)

#### v1.1.15
- feat: 支持从文本转换
  - 在 webApi 界面双击 table 中的加号使用

#### v1.1.14
- feat: 从请求详情页可以启用或禁用该接口的 webApi
- feat: 优化请求详情页中的 swagger 按钮加载状态

#### v1.1.13
- feat: 支持从界面上对 webApi 进行启用和禁用

#### v1.1.12
- feat: 按需安装 cnpm
- chore: 更新依赖版本

#### v1.1.11
- feat: 当 cnpm 没有安装时, 进行安装
- feat: 优化信息输出

#### v1.1.10
- feat: 优化启用外网映射时下载 ngrok 的速度
- feat: 支持 MOCKM_REGISTRY 环境变量指定按需安装依赖时的镜像地址

#### v1.1.9
- fix: 添加 example.config.js 文件中遗漏的变量声明

#### v1.1.8
- feat: 向下支持到 node v10.12.0
- refactor: 避免使用保留字 package

#### v1.1.7
- fix: 修复当配置文件中的 config.proxy 为 string 时解构导致错误
- chore: 优化信息输出代码, 添加启动 logo

#### v1.1.6
- feat: 取消命令行参数 v, 修改为总是显示版本号

#### v1.1.5
- feat: 支持在配置文件中声明 [watch](../config/option.md#config-watch) 参数

#### v1.1.4
- feat: 支持检查新版本
  - 使用命令行参数  `--no-update` 禁用更新检查
  
#### v1.1.3
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
