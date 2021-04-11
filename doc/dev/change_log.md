# 更新日志
本程序更新日志, 以月为目录, 模块为子目录来叙述, 为了获得更好的使用体验和功能, 建议及时更新.

::: tip
- 使用 `npm i -g mockm` 更新版本.
- 使用 `npm i -g mockm@版本号` 例如 `mockm@1.1.3` 回退到指定版本.
:::

## 2021年04月
#### v1.1.25-alpha.6
- feat: 添加 config.backOpenApi, 用于定时备份 openApi

## 2021年03月
#### v1.1.25-alpha.5
不兼容的更新, 此版本 `node-fetch` 库更改为按需安装, 参考 [util.run.fetch](../config/config_api_fn.md#util-run-fetch).

- feat: 生成 restc 请求链接时自动填充 path 参数
- feat: 支持查看入参示例
- feat: 不默认安装依赖 node-fetch

#### v1.1.25-alpha.4
- feat: 支持从 web 页面上创建 WebSocket 接口
- feat: 按需安装依赖成功时显示反馈, 错误时可重试

## 2021年02月
#### v1.1.25-alpha.3
- fix: 修正 cnpm 检测问题
- feat: 支持意外退出时自动重启, 配置项 [config.guard](../config/option.md#config-guard)

#### v1.1.25-alpha.2
- fix: 使用默认配置文件时, webApi 修改后不会自动更新
- feat: 扩展 config.api 支持的基本数据类型
- feat: config.api 支持 WebSocket
- feat: 支持 WebSocket 代理
- feat: 简化 remote 开启时的错误日志

#### v1.1.25-alpha.1
- feat: 在默认 restc 页添加 query header body 参数
- fix: 尝试修复偶然性错误 `Cannot set headers after they are sent to the client`

#### v1.1.24
- feat: 支持从 webApi 编写界面上使用示例请求参数进行调试, 功能位置: `action => try`
- feat: 放宽对字段名必填的校验, 以更好的支持快速编辑字段描述
- fix: 避免未联网时获取系统 IP 错误
- fix: 避免测试页面缓存导致升级后异常
- fix: 避免 webApi 未录入任何信息的空行加入数据生成, 导致的 `{undefined: ''}` 现象
- fix: 隐藏未完善功能的菜单
- fix: 避免在检查新版本出错时提示 `已发布新版本 undefined...`

## 2021年01月
#### v1.1.24-alpha.4
不兼容的更新, 此版本 `@image` 默认会添加 .jpg 后缀.

- feat: 更新 mockjs, 切换图片占位服务, 避免 https 证书错误

#### v1.1.24-alpha.3
- refactor(server): 拆分代码

#### v1.1.23
- feat: 优化检测版本更新的速度
- fix: 翻译程序出错后备用翻译程序需正常工作

#### v1.1.22
- fix: 修复 config.clearHistory.num 传入负数出错的问题
- fix: 修复使用添加 query 参数的 api 导致的不能找到历史记录的问题
- feat: 优化客户端接口提示

#### v1.1.21
- feat: 支持 [config.clearHistory](../config/option.md#config-clearhistory) 参数, 清除冗余记录

## 2020年12月
#### v1.1.20
- fix: 修复上个版本导致的不能创建 webApi
- fix: res.send(undefined) 时报错
- feat: 向 config 暴露所有 util
- fix: weApi 接口删除后不应该需要刷新才能看到已删除

#### v1.1.19
- feat: 优化翻译结果, 避免翻译为句子的形式

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
