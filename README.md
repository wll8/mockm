# mockm
一款便于使用, 功能灵活的接口工具.
<p align="center">
  <a href="https://www.npmjs.com/package/qs-cli"><img src="https://img.shields.io/npm/v/mockm.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/qs-cli"><img src="https://img.shields.io/npm/l/mockm.svg?sanitize=true" alt="License"></a>
<p>

## 安装和使用
请参考文档: https://www.hongqiye.com/doc/mockm

## 模块
本工具分为几个模块, 分别对应以下目录.

``` txt
├─.vscode // vscode 配置
├─client // web
├─doc // 文档
├─release // 发布器
├─server // 服务端
```

### WEB页面
基于 react, antd, axios.

详情参考: [./client](./client)

### 文档系统
基于 vuepress.

详情参考: [./doc](./doc)

### 发布器
基于 gulp, 自动打包发布到 npm, 发布文档.

详情参考: [./release](./release)

## 服务端
基于 express.

详情参考: [./server](./server)
