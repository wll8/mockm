# mockm
<p align="center">
  <a href="https://github.com/wll8/mockm/blob/dev/README.zh.md">中文</a> |
  <a href="https://github.com/wll8/mockm/blob/dev/README.md">English</a>
<p>
<p align="center">
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/dt/mockm" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/v/mockm" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/l/mockm" alt="License"></a>
<p>

- 观看视频
- [👉 查看文档](https://hongqiye.com/doc/mockm/)

一款优雅解决前端开发过程中各种接口问题的 nodejs 工具.

## 特性
mockm 是由纯 node/js 实现的, 这意味着:
  - 对前端极为友好;
  - 可以使用 nodejs 的所有生态工具;
  - 不用担心浏览器兼容性, h5/小程序/app 都能用;

它实际是一个后端接口服务, 模拟更为全面, 例如:
  - 能在浏览器控制台看到网络请求;
  - 能模拟 websocket/文件上传/下载 各种接口功能;
  - 日志记录, 数据重放;

简便是此工具的目标, 例如: 
  - 你甚至不用安装, 仅运行命令 `npx mockm` 就能使用;
  - 修改即时生效;
  - 自带内网穿透;

## 快速使用
``` sh
# 查看 node 版本, 目前 mockm 支持 node v10.12.0 以上版本
node -v

# 安装
npm i -g mockm

# 使用示例配置运行它
mockm --config

# 浏览器打开 http://127.0.0.1:9005/#/apiStudio/
```

以上命令会生成常用配置, 修改 `mm.config.js` 尽情尝试吧.

👉 [部分示例](./server/example/simple.mm.config.js)

也可以[通过 UI 界面创建接口](https://hongqiye.com/doc/mockm/use/webui.html#%E6%8E%A5%E5%8F%A3%E7%BC%96%E8%BE%91).

## 区别

| 工具        | 简述 | 备注
| ----------- | ---- | ----
| mockjs      | 前端拦截 xhr 请求, 生成数据  | 不能在网络控制台看到请求
| json-server | 用 json 生成 Restful api  | 没有集成数据生成功能
| yapi/rap2 | 管理接口文档, 生成接口和数据  | 安装麻烦, 不方便与前端项目同步


## 问题
你可以先查阅文档, 如果还是不能解决, 请点击 [Issues](https://github.com/wll8/mockm/issues) 详细描述出现问题的步骤和期望. 

如果你认为这可能是 mockm 的问题, 建议在描述中附加 `httpData/log.err.txt` 中的相关错误日志. 

你也可以 [添加官方答疑QQ群62935222](https://qm.qq.com/cgi-bin/qm/qr?k=4rvOknpHyqs5wd3c2kEt34Eysx83djEZ&jump_from=webapi) 或作者微信 `mypastcn`.

## 鸣谢
mockm 的核心功能是由这些工具建立起来的, 感谢每一个开源作者的辛劳付出.
- [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)
- [json-server](https://github.com/typicode/json-server)
- [mockjs](https://github.com/nuysoft/Mock)

## 贡献
mockm 还有很多不足, 如果愿意, 欢迎参与贡献.

## 许可
[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2017-present, xw

## 友情推荐

| 项目        | 简介
| ----------- | ----
| [taroify](https://github.com/mallfoundry/taroify)      | Taroify 是移动端组件库 Vant 的 Taro 版本，两者基于相同的视觉规范，提供一致的 API 接口，助力开发者快速搭建小程序应用。