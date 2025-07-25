# 🔧 配置文件指南

欢迎进入 MockM 的配置世界！`mm.config.js` 就像是你的专属调试器，让 API Mock 服务完全按照你的需求运行。

## 🚀 快速开始

没有配置文件？没问题！MockM 会以默认配置启动，让你立即体验：

```bash
# 在任意目录执行，MockM 自动使用默认设置
mockm
```

## 💡 基础配置 - 从零开始

创建你的第一个配置文件非常简单：

**📁 mm.config.js**
```js
module.exports = {
  port: 9000,              // 🌐 服务端口
  host: '0.0.0.0',         // 📡 监听地址
  dataDir: './httpData'    // 📂 数据存储目录
}
```

## 🎯 进阶配置 - 函数式配置

当你需要更灵活的配置时，函数式配置就派上用场了：

```js
module.exports = (util) => {
  // 🛠️ 利用 MockM 提供的强大工具库
  return {
    port: process.env.NODE_ENV === 'production' ? 80 : 9000,
    
    // 📊 根据环境动态配置
    db: {
      users: util.libObj.mockjs.mock({
        'list|10': [{
          'id|+1': 1,
          'name': '@cname'
        }]
      }).list
    },
    
    // 🔧 高级功能配置
    api: {
      '/api/status': (req, res) => {
        res.json({ 
          status: 'running',
          timestamp: Date.now(),
          environment: process.env.NODE_ENV || 'development'
        })
      }
    }
  }
}
```

## 🌟 实用配置场景

### 📱 移动端开发场景
```js
module.exports = {
  port: 3001,
  cors: true,                    // 🌍 跨域支持
  static: './mobile-assets',     // 📱 静态资源目录
  
  // 🔄 代理真实 API 进行调试
  proxy: {
    '/api/prod': 'https://api.production.com'
  }
}
```

### 🧪 测试环境配置
```js
module.exports = (util) => {
  return {
    port: 9999,
    
    // 🎲 模拟各种网络状况
    api: {
      '/api/slow': (req, res) => {
        setTimeout(() => {
          res.json({ message: '模拟慢网络响应' })
        }, 3000)
      },
      
      '/api/error': (req, res) => {
        // 🚨 模拟错误响应用于测试
        res.status(500).json({ error: '服务器内部错误' })
      }
    }
  }
}
```

### 🏢 团队协作配置
```js
module.exports = (util) => {
  const teamConfig = {
    port: 8080,
    
    // 👥 团队共享的接口定义
    api: {
      // 📈 用户管理接口
      'GET /api/users': 'data1',
      'POST /api/users': 'data2',
      
      // 🛍️ 商品管理接口
      'GET /api/products': util.libObj.mockjs.mock({
        'list|20-50': [{
          'id|+1': 1,
          'name': '@ctitle(3,8)',
          'price|100-9999': 1,
          'category': '@pick(["电子产品", "服装", "食品", "图书"])'
        }]
      }).list
    },
    
    // 🔐 开发环境安全配置
    disable: process.env.NODE_ENV === 'production' ? ['record'] : []
  }
  
  return teamConfig
}
```

## 🎨 配置文件的艺术

### 📝 配置文件命名规则
- `mm.config.js` - 标准配置文件
- `mm.config.dev.js` - 开发环境专用
- `mm.config.prod.js` - 生产环境专用

### 🔄 环境变量集成
```js
module.exports = {
  port: process.env.MOCK_PORT || 9000,
  host: process.env.MOCK_HOST || 'localhost',
  
  // 🌱 根据环境启用不同功能
  disable: process.env.NODE_ENV === 'production' 
    ? ['record', 'history'] 
    : []
}
```

## 🚨 常见配置陷阱

1. **端口冲突** 🔥
   ```js
   // ❌ 避免使用系统保留端口
   port: 80  // 需要管理员权限
   
   // ✅ 使用开发友好的端口
   port: 9000
   ```

2. **路径配置错误** 📁
   ```js
   // ❌ 相对路径可能导致问题
   dataDir: '../data'
   
   // ✅ 使用绝对路径或 __dirname
   dataDir: path.join(__dirname, 'httpData')
   ```

## 🎯 下一步探索

配置文件只是开始！继续探索更多强大功能：

- 🔧 [高级配置选项](../config/option.md) - 解锁所有配置可能性
- 🛠️ [工具库使用](../config/config_fn.md) - 掌握 util 工具库的强大功能
- 🌟 [API 配置艺术](../config/config_api_fn.md) - 创建专业级 API Mock

> 💡 **专业提示**: 配置文件支持热重载，修改后自动生效，让你的开发体验更加顺滑！
