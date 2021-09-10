# 更新日志
本程序更新日志, 以月为目录, 模块为子目录来叙述, 为了获得更好的使用体验和功能, 建议及时更新.

::: tip
- 使用 `npm i -g mockm` 更新版本.
- 使用 `npm i -g mockm@版本号` 例如 `mockm@1.1.3` 回退到指定版本.
:::

## 2021年09月
#### v1.1.25-alpha.17
- test
  - refactor: 去除 with 语法
  - refactor: 重构测试脚本, 使其更易读
- server
  - feat: 更新启动时的输出信息
  - feat: 更新崩溃信息检测方式, 增加崩溃重启概率
  - fix: 避免初始化模板时 package.json 没有要处理的 key 时出现错误
  - feat: 支持引用声明文件来实现自动提示功能
  - feat: 更新了模板文件以支持自动提示
- client
  - feat: 在 api 列表页支持调试接口

## 2021年08月
#### v1.1.25-alpha.16
- feat: 支持命令行参数 `--template` 生成常用 mockm 配置
- feat: 支持命令行参数 `--cwd` 设置程序的工作目录
- feat: 更新初始化 httpData 时的 gitignore 文件
  之前是先忽略所有文件再取反, 这可能导致用户在 httpData 目录下创建必要的新文件时, 由于没有手动修改 gitignore 而导致文件未进行版本控制
- feat: 把命令行参数 `config` 替换为 `--config`
- fix: 初始化 get-port 后很久才出来远程服务, 这看起来像卡住了
- fix: 尝试处理 proxy 的 res 覆盖 headers 导致跨域失败
- feat: config.proxy 快速修改 json response 支持使用函数来自定义逻辑

#### v1.1.25-alpha.15
- fix: ngrok 强制要求未注册用户使用最新版本
- feat: 程序的 SIGINT 事件不应显示日志, 容易造成误解
- feat: 当加载远程 url 时, 不应总是输出 err log, 避免认为程序错误
- feat: 去除动态安装时的弹窗
  弹窗原来是为了可以看到安装进度, 但容易造成打扰
- feat: 当 openApi 获取失败时, 尝试从历史记录中获取
- feat: 启动服务时立即发起一次 openApi 备份
- feat(client): 优化 UI 界面上的 swagger 接口请求
  就算开启远程模式, 但访问的是链接地址是内网时, swagger try 的请求地址仍使用内网 url, 以增加访问速度

## 2021年07月
#### v1.1.25-alpha.14
- feat: 给包裹 api 的返回值的函数设置 code 默认值
- feat: 支持使用记录的响应数据来创建接口

#### v1.1.25-alpha.13
- fix: 修复 config.db 功能失效的问题
- fix: 处理 config.api path 参数失效, 不能获取 req.params 的问题
- fix: 避免 logo.txt 中版本标记所在的行字符数小于版本号字符数时出错
- feat: 在错误日志中添加运行环境
- feat: 请求记录支持匹配多个服务的 openApi
- fix: 修复某些设备修改不会自动重载服务

一些功能失效的问题都是由于 `v1.1.25-alpha.12` 版本导致的, 为了避免再出现类似的问题, 后面会花一些时间添加自动化测试功能, 确保发布前验证功能正常.

## 2021年06月
#### v1.1.25-alpha.12
- feat: ws url 支持 path 参数
- fix: 解决 `ws /echo` 和 `get /echo/.websocket` 不能同时存在的限制
  - 此限制是 express-ws 所导致的
- feat: openApi 支持 basic-auth 认证
- feat: 通过 .gitignore 忽略一些文件, 避免产生不必要的关注

#### v1.1.25-alpha.10
- fix: config.proxy 无法代理到其他域
- fix: proxy 值为 localhost 域时报错
- fix: 避免修改不支持的 json 类型导致报错

## 2021年05月
#### v1.1.25-alpha.9
- feat: 支持配置静态文件访问, 请参考 [config.static](../config/option.md#config-static)
- feat: 格式化 openApi 后再保存, 避免压缩的内容不易比较变更
- feat: 提高 openApi 备份文件名的可读性
- feat: 更新版本比较规则为比较大小, 而不是比较是否相同

#### v1.1.25-alpha.7
- feat: 添加 node 版本校验
- fix: 转换错误: req.getHeaders is not a function

这是由于 node 在 v15.1 之后把 headers 相关的方法放到了 prototype 中, 造成了 mockm 参数传送错误导致.

参考:
- [node修改源码](https://github.com/nodejs/node/commit/b6b7a3b86a#diff-91659c35a59a70aaf7db1c7cec1fcbcd5b78b33f9b37f9babfb140d099229446R104)
- [node官方文档中的修改日志](https://nodejs.org/docs/latest-v15.x/api/http.html#http_message_headers)
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
