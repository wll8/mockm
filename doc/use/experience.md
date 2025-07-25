# 团队协作最佳实践 - 从个人到企业级应用 🚀

> **从单兵作战到团队协作，让 MockM 成为你们的开发利器！**

本指南基于真实项目经验，适用于**版本控制**、**多人协作**、**前后端分离**的现代化开发团队。

---

## 🏗️ 项目级部署 - 团队共享配置

### 🎯 为什么选择项目级安装？
- ✅ **版本统一** - 团队成员使用相同版本，避免环境差异
- ✅ **配置共享** - 所有配置文件进入版本控制，团队同步
- ✅ **新人友好** - 克隆项目即可开始开发，零配置门槛
- ✅ **CI/CD 集成** - 自动化流程中可直接使用

### 📦 标准安装流程

```bash
# 安装到项目依赖
npm install mockm --save-dev

# 或使用 yarn
yarn add mockm --dev

# 或使用 pnpm（推荐）
pnpm add mockm -D
```

**效果检查**：`package.json` 中会出现：
```json
{
  "devDependencies": {
    "mockm": "^1.1.27"
  }
}
```

> 💡 **专业提示**：全局安装 (`npm i -g mockm`) 仍然有用，可以在任何位置快速启动临时服务

---

## ⚡ 一键初始化 - 专业项目结构

### 🎭 魔法命令
```bash
npx mockm --template
```

### 🎉 瞬间拥有专业结构
```
📁 项目根目录/
├── 📁 mm/                     # MockM 工作目录
│   ├── 📁 api/                # 手动创建的 API 接口
│   │   ├── user.js            # 用户相关接口
│   │   ├── order.js           # 订单相关接口
│   │   └── index.js           # 接口入口文件
│   ├── util.js                # 通用工具方法
│   └── mm.config.js           # MockM 主配置文件
├── package.json               # 新增了 mockm 脚本
└── ...
```

### 📋 自动配置的 NPM 脚本
```json
{
  "scripts": {
    "mockm": "mockm",
    "mockm:dev": "mockm --你的参数",
    "mockm:prod": "mockm --你的参数"
  }
}
```

### 🚀 标准启动方式
```bash
# 基础启动
npm run mockm

# 开发模式
npm run mockm:dev

# 生产模式
npm run mockm:prod
```

---

### 🔧 主配置文件示例 (mm.config.js)
```javascript
const { loadApiModules } = require('./util')
const env = process.env.NODE_ENV || 'development'

module.exports = util => {
  // 根据环境加载不同配置
  const envConfig = require(`./config/${env === 'development' ? 'dev' : env}`)
  
  return {
    ...envConfig,

    // 自动加载所有 API 模块
    api: {
      ...loadApiModules(util),
      
      // 健康检查接口
      'get /health' (req, res) {
        res.json({
          status: 'ok',
          timestamp: Date.now(),
          env: process.env.NODE_ENV,
          version: require('../package.json').version
        })
      }
    },
    
    // 开发环境特殊配置
    ...(env === 'development' && {
      watch: ['./mm/**/*.js'],  // 监听文件变化
      remote: true              // 开启远程访问
    })
  }
}
```

### 🛠️ 工具函数 (util.js)
```javascript
const fs = require('fs')
const path = require('path')

// 自动加载 API 模块
function loadApiModules(util) {
  const modules = {
    // ...
  }
  return modules
}

// 统一响应格式
function wrapApiData(data, message = 'success', code = 200) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  }
}

// 错误处理中间件
function errorHandler(error, req, res, next) {
  console.error('API Error:', error)
  res.status(500).json(wrapApiData(null, error.message, 500))
}

module.exports = {
  loadApiModules,
  wrapApiData,
  errorHandler
}
```

---
