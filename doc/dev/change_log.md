# 更新日志

本程序更新日志, 以月为目录, 模块为子目录来叙述, 为了获得更好的使用体验和功能, 建议及时更新.

::: tip

- 使用 `npm i -g mockm` 更新版本.
- 使用 `npm i -g mockm@版本号` 例如 `mockm@1.1.3` 回退到指定版本.

:::

## 2022 年 01 月

#### v1.1.26-alpha.2
- server
  - feat: 自动安装依赖时, 也显示安装目录. 当安装失败时可以手动执行命令. (#13)
  - fix: 在判断是否进行代理时应排除已禁用的 webApi
  - fix: 修正根据 eslint 推测的可能引发的错误
  - refactor: axios 请求方法应使用实例以便于统一配置 (#36)
  - fix: 代理路径后面含有斜杠会出现 404

## 2021 年 12 月

#### v1.1.26-alpha.1

- server
  - fix: 当 config.api 中的接口与后端接口路径相同时, 应覆盖后端接口 (#12)
  - feat: 回放时返回响应体较大的历史请求
  - fix: 避免某些请求携带 origin 导致 path-to-regexp 无法解析
  - feat: 也存储 http 请求错误日志
- test
  - 当发送请求失败时，进行重试
  - 提高 cli 启动的超时检测
  - 优化错误输出为只显示 msg
  - 优化测试代码, 避免 `okFn` 参数报错

## 2021 年 11 月

#### v1.1.25

- server

  - feat: 升级依赖
  - feat: 提高稳健性, 当自定义的 api 错误时不应导致服务崩溃
  - feat: 将 httpHistory 中的 head 存储为文件以提升性能
  - refactor: 把 history 放到 global 上, 避免各处传参
  - refactor: 添加 config.js 的 d.ts 支持
  - feat: 避免大于 10 个监听器时出现警告
  - fix: 安装依赖成功时不应该显示为红色
  - feat: 支持传入 node 运行参数
  - fix: 捕获 ws 接口不存在时的错误
  - fix: 应正确获取 IPv4 地址

- client
  - fix: 使用历史数据生成接口时应删除跨域标志

## 2021 年 10 月

#### v1.1.25-alpha.18

- server

  - feat: 更改控制台输出为英文
  - feat: 支持命令行参数 `--log-line` 显示 console.log 所在的行, 用于辅助调试.
  - feat: 支持命令行参数 `--version` 仅查看版本号, 然后退出程序, 不启动服务.
  - feat: [config.updateToken](../config/option.md#config-updatetoken) 参数支持更多配置
  - refactor: 处理接口 `:9005/api/getOpenApi/` 的返回值
  - fix: 处理 test.js 文件中的函数未声明错误 `ReferenceError: print is not defined`
  - fix: config.proxy 非 `/` 代理时, host 不应是 `/` 的代理
  - feat: 优化 openApi 历史文件的存储方式
    更改为排序 openApi json 内容后再保存, 因为 openApi 中的顺序不确定会导致比较时产生过多不必要的变更

- client

  - refactor(client): 去除无用的 state.serverConfig

- test
  test: 添加用例重试
  test: 优化测试用例, 处理依赖按需安装未完成导致的用例失败
  refactor: 重构测试用例中的 pkgPath 函数
  refactor: 重构测试脚本, 每个用例运行单独的命令行实例

- chore: 添加 windows 一键安装脚本
- refactor: 修正拼写错误的 oepnApiData 为 openApiData

## 2021 年 09 月

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

## 2021 年 08 月

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

## 2021 年 07 月

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

## 2021 年 06 月

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

## 2021 年 05 月

#### v1.1.25-alpha.9

- feat: 格式化 openApi 后再保存, 避免压缩的内容不易比较变更
- feat: 提高 openApi 备份文件名的可读性
- feat: 更新版本比较规则为比较大小, 而不是比较是否相同
- feat: 支持配置静态文件访问, 请参考 [config.static](../config/option.md#config-static)

#### v1.1.25-alpha.7

- feat: 添加 node 版本校验
- fix: 转换错误: req.getHeaders is not a function
  这是由于 node 在 v15.1 之后把 headers 相关的方法放到了 prototype 中, 造成了 mockm 参数传送错误导致.
  参考:
  - [node 修改源码](https://github.com/nodejs/node/commit/b6b7a3b86a#diff-91659c35a59a70aaf7db1c7cec1fcbcd5b78b33f9b37f9babfb140d099229446R104)
  - [node 官方文档中的修改日志](https://nodejs.org/docs/latest-v15.x/api/http.html#http_message_headers)

## 2021 年 04 月

#### v1.1.25-alpha.6

- feat: 添加 config.backOpenApi, 用于定时备份 openApi

## 2021 年 03 月

#### v1.1.25-alpha.5

不兼容的更新, 此版本 `node-fetch` 库更改为按需安装, 参考 [util.run.fetch](../config/config_api_fn.md#util-run-fetch).

- feat: 生成 restc 请求链接时自动填充 path 参数
- feat: 支持查看入参示例
- feat: 不默认安装依赖 node-fetch

#### v1.1.25-alpha.4

- feat: 支持从 web 页面上创建 WebSocket 接口
- feat: 按需安装依赖成功时显示反馈, 错误时可重试

## 2021 年 02 月

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

## 2021 年 01 月

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

## 2020 年 12 月

#### v1.1.20

- doc: 更新文档和版本号, 清理文件
- feat: 请求记录列表添加 loading
- fix: res.send(undefined) 时报错
- feat: 向 config 暴露所有 util
- fix: weApi 接口删除后不应该需要刷新才能看到已删除
- fix: 修复不能创建 webApi 的问题
  - 由于上个版本添加了 url 截取, 但漏写了 url 为空时的情况导致

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
  - 使用命令行参数 `--no-update` 禁用更新检查

#### v1.1.3

- doc: 在文档上显示 github 地址, 添加更新日志
- doc: 更新项目 readme
- doc: 更改中文名称为英文
- chore: 更新 server 中的 readme 及 package.json
- doc: 更新文档, 添加 `快速开始` 和 `以编程方式自定义接口响应`
- doc: 修正文档错误
- feat: 添加 webApi 的 自定义内容 和 请求 ID 必填验证

#### v1.1.2

- feat: 恢复 webApi 中 headers 的自定义功能

## 2020 年 11 月

#### v1.1.1

- feat: 优化控制台请求日志输出, 使用 testApi 替代 path
- feat: 避免总是产生新的请求
- feat: 支持示例值使用 js 代码, 并暴露 Mock 工具库
- fix: 应用响应时, 原 api 的描述信息不应该被清空
- fix: 页面上创建的 webApi 接口包含点符号时, 无法使用, 因为点符号会被处理为键的层级
- feat: 支持从 web 界面删除 webApi 接口
- feat: 在请求详情页面添加 `应用响应`, 快速应用到 apiWeb 的自定义返回值
- chore(doc): 移动相关依赖到 doc 中

#### v1.1.0

- feat: 不兼容的更新, 更改 config 为函数时收到的对象
  - 原 util 改为 util.libObj
  - 删除 curlconverter 和 multiparty 这两个 mockm 中没有直接用到的库, 可以使用 util.toolObj.generate.initPackge 动态加载他们

#### v1.0.29

- fix: 需要每次根据 osIp 更新调试地址
  - 上次修改导致的问题, 不应该仅使用 osIp 作为初始化

#### v1.0.28

- refactor: 把按需加载的 require 放置到 initPackge 中

#### v1.0.27

- chore: 使用删除不必要依赖的 better-mock
- chore: 发布时忽略 httpData

#### v1.0.26

- fix: 修正大小写
  - 避免在大小写敏感的系统上出现问题

#### v1.0.25

- feat: 优化 config.replayProxyFind, 只读取 json 格式
- fix: 代理整个网站时, 网站中的一些链接无法正常工作
- fix: 避免 end 事件不触发而没有记录信息
  - 例如当运行命令 `http :9000/image/jpeg` 时, 在命令行并不会读取图片内容, 这导致 end 事件不会触发
- fix: 首次使用程序时第一个请求 id 为空
- doc: 优化文档中代码引用
  `vuepress dev doc` 改为 `cd doc && npm start` 是因为打包文档时 @doc 会根据当前执行目录进行转换而导致插件引用目录路径出错.
  即更改 `vuepress build doc` 为 `cd doc && vuepress build .`
- doc: 完善文档, 添加综合示例
- doc: 更新 v1.0.24 文档
- feat: 删除不必要的功能
  - 由于有了导航菜单可用, 可以删除详情页的 apiList 按钮

#### v1.0.24

- feat: 优化 webApi 数据类型, 支持自定义接口逻辑
- feat: 由于 mockjs 的 extend 不支持深层, 所以取消使用此方案
- refactor: 减少页面渲染
- fix: 避免出现循环引用警告
  - 发生在 node v14 上 config 文件路径相同, 并访问了不存在的属性时

## 2020 年 10 月

#### v1.0.23

- feat: mock 模板支持转换数据类型

#### v1.0.22

- fix: config.proxy 直接转发 url 无效
  期望: 请求 /status/200 时返回 403 状态码
- refactor: 添加遍历需要的 key
- feat: 添加使用模板生成数据的按钮

#### v1.0.21

- feat: 命令行参数 proxy 可与配置文件进行合并
- fix: 避免 server 端不会检索 index.html
- feat: 删除不必要的 restc 功能
- feat: 在菜单中添加 restc
- feat(restc): 支持同时使用 URL 和 query string
- feat(restc): 支持从 url 传入 uri 参数
- feat: 添加 restc
  - reset v0.4.2
  - SHA-1: a26bf3dc849f4c19bc2e28c83317a94a64e122bf
- feat: 添加面包屑导航菜单
- feat: 构造 mockjs 模板时进行类型和值分析
- fix: 修复一些边缘情况错误, 以及初始值, 回显问题
- refactor: 删除 server 中的 listToData 方法, 处理一些默认值
  - 因为数据已经从前端生成
- feat: 点击取消关闭弹窗
- fix: 处理一些边缘情况
- feat: 取消自定义模版功能
  - 为避免功能冲突, 目前先取消
  - 当前仅允许使用`模版`或`值`默认响应
- feat: 支持自定义模板
- feat: 支持使用模板或值作为响应
- feat: 修改 apiWeb 数据结构
- feat: 支持响应数据的模板修改
- feat: 使用 config.apiWebWrap 处理从页面创建的数据

#### v1.0.20

- fix: 修复 dataDir 的相对路径处理
- fix: 处理命令行参数 config 为 true 时的, 将其作为路径使用带来的错误

#### v1.0.19

- feat: 将 apiWeb 中的接口响应示例转换为接口
  - 与 config.api 合并, 但 config.api 具有优先权
- feat: 不进行 url 转码以便于识别
- refactor: 优化 EditTable 组件渲染逻辑
- feat: 当用户切换 method 时, 刷新浏览器 url
- feat: 为 tabs 添加空数据标识, 没有数据的 tab 为灰色
- refactor: 拆分 ApiStudio 的组件结构
- feat: 添加 webApi 列表
- feat: 让 webApi 路径可配置
  - 更改 apiStudio.json 为 apiWeb.json

#### v1.0.18

- fix: request 依赖未声明导致启动出错
  - 注: request 作者已经停止维护
- feat: 使用命令行参数 v 查看版本号
- feat: 生产环境关闭 sourceMap, 包括 css sourceMap

#### v1.0.17

- feat: 命令行传入 config 但无路径时, 生成并使用示例配置
- feat: 添加字段重复以及接口路径格式校验
- feat: 支持使用快捷键 ctrl+s 保存输入内容
- feat: apiStudio 样式优化
- feat: 根据 query 参数请求数据
- refactor: 减少数据更新频率以优化性能
  - 更改 value 为 defaultValue
  - 更改文本输入类型的 onChange 为 onBlur
- feat: 保存界面上录入的 api 数据到 server 中
- feat: 完成接口数据录入的页面
- feat: 初步完成接口数据录入
- feat(client): 添加 api 创建界面
- feat: 添加缓存功能

## 2020 年 09 月

#### v1.0.16

- feat: 添加 server 调试用的入口
- feat(server): 优化 console 日志输出时间格式
- feat(server): 增强请求日志的 log 的直观性, 例如根据响应状态码不同颜色不同

#### v1.0.15

- fix(doc): 修正图片引用
  - 在 vuepress 中如何使用另名引用 .vuepress/public 目录中的资源?
  - `/image/` => `~@doc/image/` 错误

#### v1.0.14

- feat: 添加 config.disable 配置, 表示是否禁用所有自定义 api, 默认否

#### v1.0.13

- feat: config.openApi 支持对象
  - 以 `new RegExp(key, 'i').test(pathname)` 的形式匹配

#### v1.0.12

- fix: 生产环境关闭 sourceMap, 以减少发布包的体积
- fix: 添加错误处理, 避免未处理的错误导致程序退出
- refactor(client): 从 ApiDetail 中抽出各个功能模块
- refactor: 抽离 ApiDetail.jsx
- feat: config.openApi 支持数组
  - 数组时, 返回 pathname 匹配度最高的项
- fix(client): 接口历史记录列表样式优化

#### v1.0.11

- fix: 修正错别字 prot 为 port
- chore: 更改程序名称 mock-mock 为 mockm

  - 这是由于原名称在 npm 注册表中有太多相似

- feat: config.dbJsonPath 默认为 config.dataDir 下的 db.json
- fix: 当命令行参数与文件配置冲突时, 应当命令行参数优先
- refactor: 更改变量名 userConfig 为 fileArgFn
- feat: 在 config.api 中支持 `* /all/method` 写法, 表现与 `/all/method` 一致
  - `*` 号表示所有方法, 不写也是表示所有
  - 不写也表示所有, 是为了表现与 node-proxy 这个库一致
- feat: 如果 config.proxy 与 config.api 存在相同的路由时, proxy.api 优先
- fix(client): 期望避免点击 history 中的内容时出现列表闪烁现象
- doc
  - doc: 更新`待完成`和`参考`
  - doc: 添加图片
  - chore: 更新 icon
  - doc(server): 更新 readme
  - doc: 更新 readme
  - doc: 修正错别字
  - fix(doc): 修正文档发布命令, 期望可替换远程内容
  - doc: 添加文档 favicon.ico
  - chore: 添加文档发布脚本
  - doc: 添加统计功能
  - doc: 添加全文搜索功能
  - doc: 更新文档内部链接
  - doc: 优化文档样式, 避免 copy 图标占据代码块的空间
  - fix: 更换代码块复制插件, 以避免行高亮被影响的问题
  - doc: 添加选项描述 config.hostMode
  - doc: 添加特性描述
  - doc: 补充文档的选项描述
  - doc: 更新文档 config.dbJsonPath 的默认值描述
  - doc: 补充文档
  - feat: 优化显示效果
  - doc: 添加 todo list 插件
  - doc: 初始化文档

#### v1.0.10

- feat: 在单个接口上添加 req res 大小, 方便查找接口
- feat: 把请求的文件记录放在 request 目录中

#### v1.0.9

- feat: 删除(私有)用户可能不常用的配置 config.httpHistory 和 config.store

  - feat: 修改配置名称 config.dbJsonName 为 config.dbJsonPath
  - feat: 修改 config.dbJsonPath 默认值为 config.dataDir 目录中

#### v1.0.8

- feat: 通过修改 host 文件来实现代码 `0侵入`

#### v1.0.7

- refactor: 从 curl 命令中解析 request 库的 options 参数

#### v1.0.6

- fix: 添加端口是否被占用的检测, 避免它看起来正常运行了实际却没有
- refactor: 就近声明依赖
- refactor: 避免 lodash 冗余的依赖
- feat: 增加程序启动容错性
- refactor: 优化 fileStore 方法, 可传入初始化数据
- fix: 自定义了一个 api, 在 api 内请求自身的接口, 返回到客户端的 testUrl 中的 id 不正确
- fix: 有时候 url 上的 query 参数没有被正确读取到 line.query 中
  这是由于 router.render 方法中, req.query 会被删除. 而 setHttpHistoryWrap 是在 res.send 后执行, 也就是在 router.render 删除 req..query 后执行的, 所以导致没有正确获取 req.query
- fix: 修复 note.remote 相关的两个问题
  - 读取 `note.remote.testProt` 异常
  - res.header 中有时候不存在 note.remote, 这是由于自动刷新时 note.remote 被误删导致

#### v1.0.5

- feat: 在请求的 req.header 中也加入远程调试链接
  - 修改 config.testIp 为 config.osIp
- fix: 避免拦截到的 req.url 都是 /
  - 这是由于 server.use 的第一个参数是写死的 `*` 导致到
- fix: 补充 server 中所需依赖
- refactor: 由于目前 id 可能会生成重复, 先使用 index 吧~
- refactor: 全局处理 Promise 没有添加 then 的错误
- feat: 一点点体验优化
- feat: 使用普通 http 请求以及服务器分页来获取请求列表
- fix: 修复 mac 平台由 configPath 拼接导致的 ngrok 无法启动
  - catch 方法中需要调用 resolve 才能进入下一次条件检测
- chore: 更新启动和调试命令
- fix: 远程服务无法启动
- feat: 完善 client 公网模式支持
- feat: 支持所有端口映射到公网
  - 使用命令及配置的方式来避免单个会话限制

#### v1.0.4

- feat: 支持映射本地服务到公网, 通过 `config.remote` 配置, `修改后需重启生效`
- refactor: 使用在线 cdn 资源

## 2020 年 08 月

#### v1.0.3

- fix: config.proxy 不应报错
  ```txt
      const rootTarget = config.proxy.find(item => (item.context === `/`)).options.target
                                                                          ^
  TypeError: Cannot read property 'options' of undefined
  ```
- chore: 添加新的 npm 命令
- feat: 即使 dbCover 为 false, 也应该同步那些新添加的 key.
- fix: 在 db 中新创建 key, 应该要产生新的 api, 但是没有
- feat: 支持 config.route 路由映射
  参考
  - [add-custom-routes](https://github.com/typicode/json-server#add-custom-routes)
  - [run.js#L61](https://github.com/typicode/json-server/blob/4f315b090f6a504c261bab83894d3eb85eabe686/src/cli/run.js#L61)
- refactor: 优化代码
- feat: 支持自定义统一的 res 数据结构

  - config.resHandleReplay
    - 处理重放请求出错时会进入这个方法
    - 对于没有记录 res 的请求, 返回 404 可能会导致前端页面频繁提示错误(如果有做这个功能)
    - 所以这里直接告诉前面接口正常(200ok), 并返回前约定的接口数据结构, 让前端页面可以尽量正常运行
  - config.resHandleJsonApi
    - 由 db.json 生成的接口的最后一个拦截器
    - 可以用来构建项目所需的数据结构

- fix: api 中的动词省略错误
  - fix: `get /name` 不应导致 `post /name` 不能转发到服务器
  - feat: 支持省略动词时表示所有动词
  - fix: 需完善 config.api 中的 `*` 和 `/` 的支持, 表示在所有自定义 api 之前添加的中间件
- feat: 在 `config.proxy` 的选项中添加数组类型, 用来快速处理 res.body
  用于快速处理 json 格式的 response, 使用数组语法: `[A, B]`.
  数组中不同个数和类型有不同的处理方式.
- feat: api 可简写为直接以 json 对象作为返回值

#### v1.0.2

- chore: 更新程序名称 mock-server 为 mock-mock
  - 可执行文件更改为 `mm`
  - 配置文件更改为 `mm.config.js`
- feat: 支持命令行 watch 参数, 指目标修改时重启程序
  - 例如命令: `$0 watch=data` ,当修改 data 目录中的文件时, 会自动进行重启
  - 应用于当 config 中引入其他资源时
- feat: 简化命令行参数 == 为 =, 支持参数值中带有 =
  - 运行结果: `{a: 1, b: 'c=d'}`
  - 前 `$0 a==1 b==c=d`
  - 后 `$0 a=1 b=c=d`
- build: 从 package.json 中读取 name 和 version 作为发布文件名

#### v1.0.1

- feat: 添加 `config.proxy[].target` 的默认值
- chore: 补充依赖
- feat: 添加修改 response 中 json 的方法
- feat: 使用 dev 参数来决定是否使用 logHelper
  - 开发环境指定这个参数, 可以显示 log 行数
  - 生产环境不指定这个参数, 则不显示
- refactor: 把当前系统 IP 先收集在 config 中, 以方便使用, 避免重新调用函数

#### v1.0.1-alpha.4

- fix: 重放时更新 api 测试地址, `x-test-api`
- fix: 应先删除 server/page 再进行复制, 避免更新失败
- feat: 打包输出文件为 `.tgz`, 方便通过文件安装
  - 安装方式例如: `npm i http://example.com/package.tgz`
  - `.tgz` 是 tar 和 gzip 的意思, tar 表示存档, gzip 才表示压缩
  - gzip 功能通过 `tar.c({gzip: true})` 开启
- feat: 修改输出的目录 server 为 package
  - 这是为了方便发布, 参考 `package-lock.json` 中依赖的压缩包内目录为 `package/`

#### v1.0.1-alpha.3

- fix: 不应使用错误的客户端输出目录, 从而导致测试页面不能正确查找和访问
- feat: 添加发布功能
  - 在 `release/` 中运行 `npx gulp` 为生成 `dist/`
  - 在根目录运行 `npm run bt` 生成后安装依赖然并运行
  - 能使用 ms.config.js 中的配置运行
- refactor: 修改客户端编译结果的输出位置为 server 中
  为了方便发布. 因为发布后的文件为单个目录, 所以应该都包含在 server 中, 发布 server 目录即可
- fix: 应该添加变量声明, 避免打包后出错
- feat: 使用相对路径的 bodyPath, 让 httpData 可移植
- fix: 避免重放时没有记录时报错
- feat: 重放接口的判断条件支持自定义
  一些开发者不是使用 http 标准的状态码作为接口的成功与否判断条件, 而是在返回值中自定义字段和值作为依据.
- feat: 支持 function 或 object 类型的配置
  - 作为 function 时可以从参数接收工具库, 参考 `server/config.js:44`
- refactor: 用到 config 才传 config
- chore: 修正 server.js 调试参数

#### v1.0.1-alpha.2

- fix: 不应错误的传送 host,
  - 自定义代理时应使用 proxyConfig.target 中的 host
  - 参考[多 host 负载均衡](https://github.com/http-party/node-http-proxy/issues/1389)
- feat: 支持在自定义代理前添加 express 中间件
  参考:
  - [延迟请求/响应](https://github.com/chimurai/http-proxy-middleware/issues/83)
- fix: 应该正确拦截 proxy 中指定路由
  - 给 `server.use()` 传入要拦截的路由即可
- feat: 向自定义代理添加的 `记录请求历史`, 注入 `cors` 等功能
- feat: proxy 配置支持自定义代理
  - 此功能可以自定义拦截过程, 类似 webpack 中的 `devServer.proxy` .
  - proxy 中键的值可以是 `string | object`, string 的时候相当于请求转发. object 相当于传入 proxy 的配置.
  - [proxy 配置参考](https://github.com/chimurai/http-proxy-middleware#http-proxy-options)
- refactor: 删除 page 目录中的文件
  - page 目录中的文件已通过 webpack 方式重新编写到 client 目录中
- chore: http-proxy-middleware 依赖版本更新
- feat: 重放时抽取 code 为 200 的记录
- feat: 添加跨域功能在 run.curl 和 run.fetch 里面

#### v1.0.1-alpha.1

- feat: 添加跨域功能在 run.curl 和 run.fetch 里面
  - fix: 使用 run.fetch 方法时, 如果原接口是 gzip 数据时, 不应该导致返回的数据解析失败
    由于返回的内容其实已经被解码过了, 所以不能再告诉客户端 content-encoding 是压缩的 `gzip`, 否则会导致客户端无法解压缩
  - 例如导致浏览器无法解码: net::ERR_CONTENT_DECODING_FAILED 200 (OK)
- refactor: 清除 package.json 中未使用的依赖
- feat: 使用 gzip 压缩 serverTest 中的前端页面
- refactor: 设置 baseURL 配置为 window.location.origin
- refactor: 优化环境变量配置
- refactor: 借助 eslint 处理代码格式
- chore: 添加 build 后的依赖图查看工具
- fix: 不使具名正则表达, 因为无法转换为兼容性代码
- chore: 添加环境变量工具库 cross-env
- feat: 可运行从浏览器中直接复制的 `cURL(bash)` 命令和 `fetch(node.js)` 代码
  - 相当于同时复制了原接口的参数以及返回值
- feat: 转换 page 目录中的内容为 client 中
  - 把直接在浏览器中运行的 page 放到由 webpack 编译的 client 目录中

#### v1.0.0

- fix: 补充 client 中未提交的 public 目录
- fix: 避免控制台出现错误警告
  > Warning: findDOMNode is deprecated in StrictMode. findDOMNode was passed an instance of Wave which is inside StrictMode. Instead, add a ref directly to the element you want to reference. Learn more about using refs safely here: https://fb.me/react-strict-mode-find-node
  - [参考 #22493](https://github.com/ant-design/ant-design/issues/22493)
- feat: 在 client 中使用 antd
- feat: 在 client 中使用 scss
- feat: 初始化 client, `npx create-react-app client`
  - 准备重构 page 到 client 中, 更换 umd 方式为 webpack 方式
- refactor: 更新 server 中 page 目录的使用
- refactor: 移动 server 相关的文件到同一个目录中
- refactor: 配置全局 baseURL
- fix: 避免 config 是全路径时, 匹配失效

## 2020 年 07 月

#### v0.15.0

- feat: 更新 http log 格式
- feat: 更新日志格式
- feat: 默认以当前命令运行目录下的 ms.config.js 文件作为配置
  - 当没有此文件时, 使用默认配置
- feat: 使用服务器获取远程 openApi , 避免跨域
- refactor: 把 log.js 和 util.js 放入 util/ 目录中
- refactor: 删除无必要文件
- refactor: 重构 util 文件, 继续归纳同类方法
- feat: 添加分页器
- feat: 添加和重构跨域功能、选项
- refactor: 重构代码, 把相关性较高的函数集中在对象中

#### v0.14.0

- fix: 不应该使用不存在的 util 对象
- fix: 应避免 history 中 data 为空时报错
- fix: 自定义 api 也在 header 中添加 testApi 地址
- fix: 应该更新 headers 中的 x-test-api 地址
  - 添加完整的 apiId
- chore: 提交 `httpbin.org/spec.json` , 避免线上更新导致不符合期望~
- fix: 当没有传 apiId 时, 应该高亮最新 api
- feat: 当不传 apiId 的时候, 则返回最新一条 api
  - 有 apiId 时返回指定 api
  - 无 apiId 时返回最新 api
- fix: 当没有传 apiId 时不应该获取到不相关的记录
- feat: 取消请求重发并发限制
  - 不再需要等待上次请求完成才能进行第二次重发
  - 即支持模拟同一时间发送多次请求
- fix: 同目录多个实例时, 不应该每个请求都是一样的 apiId
- refactor: 删除不必要的 log
- feat: 生成更短的请求 id
- chore: 在 packge.json 中添加 morgan
- fix: 修正 print 方法
- feat: 统一与日志输入功能
  - 与 json-server 使用一致的请求日志风格
- fix: 避免错误的获取 req.body
  - `http :9000 title="js"` 获取到的 req.body 不应该包含 id
- fix: 不应该总是获取到第一个 bodyFile
- feat: 根据有无 swagger api 展示按钮
- feat: 替换 swagger 的请求地址以及当前请求的 token
- refactor: 优化初始化 config.httpHistory 的方法
- chore: 升级 json-server

#### v0.13.0

- fix: `req.params` 只能获取 path 中的参数会导致错误
  使用 `path-to-regexp@0.1.7` 来解析 regexp 及 req.url 得到完整的参数
- feat: 以解码方式显示 url 及 query 参数
- fix: 重发某条历史请求
- chore: 提交 vscode 调试配置
- feat: 从界面上查看某个请求的历史记录
- feat: 记录单个 url 的每次请求历史
  - 修改文件的存储方式, 以 path 生成目录
  - 修改请求的 id 标志

#### v0.12.0

- refactor: 调整函数引用顺序, 添加一些注释
- feat: 支持在配置中编写可供 json-server 使用的 db 数据
- refactor: 抽出 util 方法
- fix: 支持 json-server 生成的 api
  例如: `http :9000/books?_limit=1`
- feat: 支持以文件方式传入配置, 修改配置自动重启
  - 把拦截器 api 放在配置中
- feat: 向本地服务提供跨域能力
- refactor: 无需 config.js 中的 noProxy 配置, 存在拦截方法则进行拦截.
  更新 api.js 中的拦截器书写方式, 支持使用 [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) 的方式配置拦截的 path.

## 2020 年 06 月

#### v0.11.0

- fix: 避免 JSON.parse(undefined) 报错
- fix: 截图预览区域样式优化
- feat: 支持 swager path 参数对应 api
  eg: /status/403 => /status/{codes}
- refactor: 重构代码获取 ReqResState 的函数
- fix: 修正命令行名字 sm 为 ms
- refactor: 更新命令行参数解析方法
- feat: 支持从命令行传入简单参数调用
  由于 url 可能包含等号(=) , 所以使用两个等号作为参数标识, 以免参数解析错误

#### v0.10.0

- build: 修改 packge.json 中的入口文件为 server.js
- feat: 支持根据 openApi 自动匹配对应的 swagger api 接口
- refactor: 重构调试服务中的 action 相关方法.
- fix: 解决原来进入 getApiListSse 的条件 res.write 后再进入后面的 res.json 导致 sse 连接中断.
  即 getApiListSse 条件中没有 return, 导致进入后续条件.
- fix: 由于 root 被定义为浏览器高导致的截图不完整
- refactor: 使用拦截器优化 http 请求返回值
- fix: 处理重发请求时, 没有返回 err.response 的错误提示
- fix: 添加重放 api 的跨域功能
- feat: 可以在当前页面打开 swagger-ui 中的当前 api

## 2020 年 05 月

#### v0.9.0

- fix: 处理当目标服务器没有返回 response 时的情况
- fix: 增加重放功能跨域
- feat: 增强 mock api 配置 noProxy, 支持正则多路由
- feat: 使用 sse 实时获取新采集的接口

#### v0.8.0

- fix: 修正 url 匹配
- fix: 修复时间排序
- feat: 支持在 res headers 中添加调试页面的地址
- feat: 简化配置
- feat: 只要滚动就显示回到顶部
- feat: 把 apilist 中的时间改为相对时间
- feat: 支持保存 mockapi 的请求记录

#### v0.7.0

- fix: 他人不能访问 localhost
- feat: 使用按钮方式生成截图在页面上, 由用户自行复制.
  原型使用的 api navigator.clipboard 仅在 https 或 localhost/127.0.0.1 下可用.
- feat: 修改 api 默认排序为时间

## 2020 年 04 月

#### v0.6.0

- feat: 添加请求重发的功能; 以及点击回到请求列表的功能
- perf: 调整 api 摘要信息的样式
- feat: api 列表页 `apiList`, 使用 antd 表格控件, 支持排序
- perf: 进入 reqRes 页即使用已有的 lineHeaders 渲染
- feat: 获取 bodyFile 时还原 headers, 并允许跨域

#### v0.5.0

- fix: 更新为最新数据结构的重放功能
- feat: 使用 `react-router-dom` , 在切换 hash 时更新 state
- feat: 修改 ReqRes 默认值为全部展开
- feat: 添加列表页, ApiList
- feat: 使用 ctrl+c 复制页面内容为图片
- feat: 复制页面为图片到剪贴板
- feat: 使用 `react-json-view` 来渲染 json, 及 json 的展示折叠功能
- feat: ReqRes 面板
- feat: 重新指定 server.js 的数据返回格式, 以及可以保存 req 为文件
- feat: 预览 Response Body, 例如 image, json
- feat: headers source 模式(即 parse 模式不排序对象键)

#### v0.4.0

- fix: 避免获取默认值 null, `JSON.parse(null)`
- fix: 避免要复制的文本为空时也显示为复制成功
- feat: 从 xhr 请求中获取 httpData
- feat: 添加复制功能;
- feat: 添加图标;
- feat: 完成功能: parse encode source json copy
- feat: 使用非打包方式创建前端页面
- feat: 使用 replace 以及引用更新后缀名
- fix: 应当 res 的 content-type 更新后, 也更新对应的存储的文件后缀名

## 2020 年 03 月

#### v0.3.0

- feat: 支持存储响应体为文件, 以及在请求查看页打开此文件
- feat: 增加一个服务, 更方便的获取 api 调试地址

  - 原请求: `http://localhost:9004/api/task/?id=1`
  - 增加前: `http://localhost:9004/api/t/test/get/api/task/?id=1`
  - 增加后: `http://localhost:9005/get/api/task/?id=1`

- feat: 修改接口调试入口的传参方式, 让其更容易识别和使用.
  - 修改前: `http://localhost:9004/api/t/test?api=GET%20%2Fapi%2Ftask%2F%3Fpage%3D1%26pageSize%3D10`
  - 修改后: `http://localhost:9004/api/t/test/get/api/task/?page=1&pageSize=10`
  - 修改前, api 是作为 query 参数传入的, 需要进入转义, 但转义不易识别.
  - 修改后, api 作为路由的一部分, 不被转义.

## 2020 年 02 月

#### v0.3.0-alpha.1

- feat: 根据已保存的请求记录进行重放

## 2020 年 01 月

#### v0.2.0

- fix: 1. 处理 res 不存在的情况, 2. 配置本机 ip
- feat: 支持请求重播
- feat: 录制转发的请求与响应
- fix: -g/--globoff 关闭 URL 的通配符功能。这样就可以访问名称中含有字符 {、}、[、] 的文件了
- fix: 查看请求详情时, 如果转换为 json 失败则假设为 html
- feat: 持久化 token

## 2019 年 12 月

#### v0.1.0

由于在工作中由于众所周知的原因, 再次深刻感受到了要改善前后端接口协作的必要性. 于是又重新实现起这样一个工具, 在 github 上创建项目时, 却意外发现在 2 年前自己就已经做了一个类似工具的雏形了. 于是决定把灵魂归还给这个雏形, 让它继续成长, 但这一次我们要做的不仅仅是接口模拟.

- feat: 提供一个 /t/test 接口, 利用 curl 重发请求, 用于给后端查看请求信息
- feat: 添加跨域功能
- feat: 请求转发, 不影响联调完成的接口
- feat: 常用中间件 upload/formData/body/query/params
- feat: 基于 express, 可使用正则快速创建 api
- feat: 基于 json-server/mockjs, 快速生成数据及 Restful API

## 2018 年 02 月

一个使用 express 配合 json 文件实现的接口模拟, 名为 mock-server .

#### v0.0.1-alpha.1

- 初始化一个 cli 项目及注册全局命令
- commander 解析命令行参数
- 使用 express 实现一个简单的 http 服务
- 从浏览器指定要读取的 json
- 根据请求的 http 方法来决定如何返回 json
- 支持使用 post 中的 body 请求体来添加内容
