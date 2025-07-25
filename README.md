# MockM - 前后端并行开发神器 🚀

<p align="center">
  <strong>一站式 API 模拟与调试平台，让前后端开发零障碍并行</strong>
</p>

<p align="center">
  <a href="https://github.com/wll8/mockm/blob/dev/README.md">中文</a> |
  <a href="https://github.com/wll8/mockm/blob/dev/README.en.md">English</a> |
  <a href="https://wll8.github.io/mockm/">📚 文档</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/dt/mockm?style=flat-square&color=blue" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/v/mockm?style=flat-square&color=green" alt="Version"></a>
  <a href="https://www.npmjs.com/package/mockm"><img src="https://img.shields.io/npm/l/mockm?style=flat-square&color=orange" alt="License"></a>
  <a href="https://github.com/wll8/mockm/stargazers"><img src="https://img.shields.io/github/stars/wll8/mockm?style=flat-square&color=yellow" alt="Stars"></a>
</p>

<p align="center">
  <img src="./doc/image/mockm_api_list_2020-09-21_100140.png" alt="MockM 界面预览" width="800">
</p>

## ✨ 核心特性

🎯 **零配置启动** - 2 行命令搞定一切，秒变 API 服务器  
🔄 **智能代理** - 无侵入式跨域解决方案，告别 CORS 烦恼  
📊 **数据生成** - 内置 MockJS，逼真数据一键生成  
🎭 **Restful API** - 自动生成增删改查接口，开发效率翻倍  
🕸️ **WebSocket 支持** - 完整的实时通信解决方案  
📱 **可视化管理** - 直观的 Web UI，拖拽式 API 管理  
🔄 **请求重放** - 历史请求一键重现，调试无忧  
🌐 **远程调试** - 内置内网穿透，随时随地协作  
⚡ **热更新** - 配置修改实时生效，开发体验丝滑

</p>

## 🚀 快速开始

### 一分钟上手

```bash
# 全局安装
npm i -g mockm

# 启动示例项目
mm --config
```

🎉 **就这么简单！** 你已经拥有了：
- ✅ 跨域代理服务器 (http://127.0.0.1:9000)
- ✅ 可视化管理界面 (http://127.0.0.1:9005)
- ✅ 完整的 API 生态系统
- ✅ 请求记录与重放功能

### 立即体验
- 🌐 访问 http://127.0.0.1:9000/api/1 查看 API 效果
- 📊 访问 http://127.0.0.1:9005/#/get/api/1 查看请求详情
- 🔧 查看生成的配置文件了解更多功能

> 💡 **提示**: `--config` 参数会创建一个示例配置，包含常用功能演示

## 💡 核心功能展示

### 🌍 跨域代理 - 一行代码解决所有跨域问题

**问题**：前端开发时总是被 CORS 错误困扰？  
**解决**：MockM 让你彻底告别跨域烦恼！

```bash
# 最简单的跨域代理
mm proxy=http://your-backend:8080
```

或者使用配置文件：
```javascript
module.exports = {
  proxy: 'http://your-backend:8080'
}
```

**效果**：原本的 `http://your-backend:8080/api/users` 现在通过 `http://127.0.0.1:9000/api/users` 访问，自动处理跨域！

### 🎭 秒建 API - 3 行代码创建完整接口

```javascript
module.exports = {
  api: {
    '/my/awesome/api': {
      message: '我的第一个 API',
      data: { success: true }
    }
  }
}
```

**立即可用**：http://127.0.0.1:9000/my/awesome/api

### 🔄 Restful API 生成器 - 一个配置搞定 CRUD

想要一个完整的博客系统？只需要：

```javascript
module.exports = {
  db: {
    posts: [
      { id: 1, title: '我的第一篇博客', content: '使用 MockM 真的太简单了！' }
    ]
  }
}
```

**瞬间获得**：
- `GET /posts` - 获取所有文章
- `GET /posts/1` - 获取指定文章  
- `POST /posts` - 创建新文章
- `PUT /posts/1` - 更新文章
- `DELETE /posts/1` - 删除文章
- `GET /posts?q=关键词` - 搜索文章

### 📊 智能数据生成 - MockJS 深度集成

```javascript
module.exports = util => ({
  db: {
    users: util.libObj.mockjs.mock({
      'data|20-50': [{
        'id|+1': 1,
        name: '@cname',           // 随机中文姓名
        email: '@email',          // 随机邮箱
        avatar: '@image("200x200")', // 随机头像
        'age|18-65': 1,          // 18-65岁随机年龄
        address: '@county(true)'  // 随机地址
      }]
    }).data
  }
})
```

### 🛠️ 响应拦截与修改 - 无需后端配合

需要修改后端返回的数据？轻松搞定：

```javascript
module.exports = {
  proxy: {
    '/': 'http://your-backend:8080',
    '/api/user': ['data.name', '张三'], // 将用户名改为张三
    '/api/status': ['success'] // 直接返回 "success"
  }
}
```

### ⏱️ 接口延时模拟 - 测试网络慢的情况

```javascript
module.exports = {
  proxy: {
    '/api/slow': {
      mid(req, res, next) {
        setTimeout(next, 3000) // 延时 3 秒
      }
    }
  }
}
```

### 🔌 WebSocket 支持 - 实时通信轻松实现

```javascript
module.exports = {
  api: {
    'ws /chat'(ws, req) {
      ws.send('欢迎进入聊天室！')
      ws.on('message', msg => {
        ws.send(`回音: ${msg}`)
      })
    }
  }
}
```

### 📱 可视化管理 - 拖拽式 API 管理

通过 Web UI 轻松管理 API：
- 📋 查看所有接口列表
- 🔍 搜索和过滤接口  
- ✏️ 在线编辑接口逻辑
- 📊 查看请求历史和统计
- 🔄 一键重放历史请求

### 🌐 远程协作 - 内网穿透一键开启

```javascript
module.exports = {
  remote: true // 开启远程访问
}
```

自动生成公网地址，支持：
- 🌍 远程团队协作
- 📱 微信公众号开发  
- 🔗 第三方服务对接

## 🏆 使用场景

### 👨‍💻 前端开发者
- **快速搭建** Mock 服务，无需等待后端
- **跨域问题** 一行代码解决
- **数据驱动** 使用真实数据进行开发

### 👩‍💻 后端开发者  
- **API 文档** 自动生成，前端对接更顺畅
- **请求参数** 一键分享，告别截图传参
- **调试工具** 完整的请求历史记录

### 🎯 测试工程师
- **接口测试** 内置 Postman 式工具
- **数据模拟** 各种边界情况轻松测试  
- **性能测试** 延时、错误模拟

### 👥 团队协作
- **远程调试** 一键生成公网地址
- **版本管理** 配置文件化，Git 友好
- **环境隔离** 多环境配置，灵活切换

## 📸 界面预览

<details>
<summary>🖱️ 点击查看更多界面截图</summary>

**请求记录详情**  
![请求记录详情](./doc/image/mockm_replay_2020-11-10-11-21-51.png)

**API 请求历史**  
![API 请求历史](./doc/image/mockm_history_2020-11-10-11-33-26.png)

**可视化 API 编辑**  
![可视化 API 编辑](./doc/image/mockm_apiWebEdit_2020-11-10-14-03-22.png)

</details>

## 🆚 竞品对比

### 📊 完整功能对比表

| 功能特性 | MockM | MockJS | JSON-Server | YApi/Rap2 | Postman Mock | Wiremock | MSW | Faker.js | Apifox |
|---------|-------|--------|-------------|-----------|--------------|----------|-----|----------|--------|
| 🚀 **零配置启动** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 🌐 **跨域处理** | ✅ 自动 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 📊 **数据生成** | ✅ 内置 MockJS | ✅ | ❌ | ✅ | 🔶 基础 | 🔶 基础 | ✅ | ✅ | ✅ |
| 🔄 **Restful API** | ✅ 自动生成 | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 🕸️ **WebSocket** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 📱 **可视化管理** | ✅ | ❌ | ❌ | ✅ | ✅ | 🔶 第三方 | ❌ | ❌ | ✅ |
| 🔄 **请求重放** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| 🌍 **远程调试** | ✅ 内置穿透 | ❌ | ❌ | ✅ | ✅ 云端 | ❌ | ❌ | ❌ | ✅ 云端 |
| ⚡ **热更新** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| 🛠️ **响应拦截** | ✅ | ✅ 仅前端 | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 💻 **运行环境** | Node.js | Browser | Node.js | Java/Docker | Cloud | Java | Browser/Node | Node.js | Desktop/Cloud |
| 💰 **费用** | 免费 | 免费 | 免费 | 免费/付费 | 免费/付费 | 免费 | 免费 | 免费 | 免费/付费 |

### 🎯 工具定位说明

**数据生成类工具**
- **MockJS**: 纯前端数据模拟，无法在 Network 中看到真实请求
- **Faker.js**: 仅数据生成库，需要自行构建服务器
- **MockM**: 内置 MockJS + 完整服务器，开箱即用

**API 服务器类工具** 
- **JSON-Server**: 简单 REST API 生成，无数据生成和跨域功能
- **WireMock**: Java 生态的强大 Mock 服务器，配置复杂
- **MockM**: Express 生态，配置简单，功能全面

**测试工具类**
- **Postman Mock**: 云端 Mock 服务，需要联网，功能相对基础
- **MSW**: 专注于测试环境的请求拦截，学习成本较高
- **MockM**: 开发+测试双用途，本地优先，可扩展云端

**平台化工具**
- **YApi/Rap2**: 企业级 API 管理平台，安装部署复杂
- **Apifox**: 商业化一体化 API 工具，功能强大但收费
- **MockM**: 轻量级本地工具，专注开发效率

### 💡 选择建议

| 使用场景 | 推荐工具 | 原因 |
|---------|---------|------|
| 🚀 快速原型开发 | **MockM** | 零配置，即开即用 |
| 🧪 前端单元测试 | MSW + Faker.js | 专业测试工具链 |
| 🏢 企业级 API 管理 | YApi + MockM | 文档管理 + 开发调试 |
| ☁️ 团队协作开发 | Apifox / MockM远程模式 | 云端协作 |
| 🎯 Java 后端测试 | WireMock | Java 生态集成 |
| 📊 纯数据生成 | MockJS / Faker.js | 轻量级方案 |

### ❓ 常见误区澄清

**🤔 "MockM 和 MockJS 有什么区别？"**
- **MockJS**: 仅在浏览器中拦截 XHR 请求，无真实网络请求
- **MockM**: 运行真实服务器，可在 Network 面板看到请求，支持跨域

**🤔 "MockM 和 JSON-Server 不是一样的吗？"**
- **JSON-Server**: 只能生成简单的 REST API，无数据生成能力
- **MockM**: REST API + 数据生成 + 代理 + 可视化管理 + 远程调试

**🤔 "为什么不直接用 Postman Mock？"**
- **Postman Mock**: 云端服务，需要网络，功能相对基础，配置复杂
- **MockM**: 本地优先，功能全面，零配置启动，可选云端模式

**🤔 "MSW 看起来也很强大？"**
- **MSW**: 专注测试环境，主要用于单元测试和集成测试
- **MockM**: 专注开发环境，提供完整的开发服务器解决方案

**🤔 "企业已经有 YApi/Apifox 了，还需要 MockM 吗？"**
- **YApi/Apifox**: 重文档管理和团队协作，开发时仍需本地工具
- **MockM**: 完美补充，专注开发效率，可与文档平台配合使用

## 🤝 社区与支持

### 📚 文档与教程
- [📖 完整文档](https://wll8.github.io/mockm/)
- [🎯 快速入门](https://wll8.github.io/mockm/use/try.html)
- [💡 最佳实践](https://wll8.github.io/mockm/use/example.html)
- [🔧 配置参考](https://wll8.github.io/mockm/config/option.html)

### 🌟 友情项目

| 项目 | 简介 |
|------|------|
| [🎨 Taroify](https://github.com/mallfoundry/taroify) | 移动端组件库 Vant 的 Taro 版本，助力小程序开发 |
| [🎯 wot-design-uni](https://github.com/Moonofweisheng/wot-design-uni) | 基于 Vue3+TS 的 uni-app 组件库，70+ 高质量组件 |

如果你有项目需要在此页面上展示，请告诉我。

### 💬 交流与反馈
- [🐛 Bug 反馈](https://github.com/wll8/mockm/issues)
- [💡 功能建议](https://github.com/wll8/mockm/issues)
- [❓ 使用问题](https://github.com/wll8/mockm/discussions)

## 📄 开源协议

本项目基于 [MIT](https://opensource.org/licenses/MIT) 协议开源

Copyright (c) 2017-present, xw

---

<p align="center">
  <strong>⭐ 如果这个项目对你有帮助，请给我们一个 Star！</strong>
</p>

<p align="center">
  <a href="https://github.com/wll8/mockm">
    <img src="https://img.shields.io/github/stars/wll8/mockm?style=social" alt="GitHub stars">
  </a>
</p>
