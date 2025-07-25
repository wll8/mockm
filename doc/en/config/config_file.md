# 🔧 Configuration File Guide

Welcome to MockM's configuration world! `mm.config.js` is like your personal debugger, making the API Mock service run exactly according to your needs.

## 🚀 Quick Start

No configuration file? No problem! MockM will start with default configuration, letting you experience immediately:

```bash
# Execute in any directory, MockM automatically uses default settings
mockm
```

## 💡 Basic Configuration - Starting from Zero

Creating your first configuration file is very simple:

**📁 mm.config.js**
```js
module.exports = {
  port: 9000,              // 🌐 Service port
  host: '0.0.0.0',         // 📡 Listen address
  dataDir: './httpData'    // 📂 Data storage directory
}
```

## 🎯 Advanced Configuration - Functional Configuration

When you need more flexible configuration, functional configuration comes in handy:

```js
module.exports = (util) => {
  // 🛠️ Utilize MockM's powerful utility library
  return {
    port: process.env.NODE_ENV === 'production' ? 80 : 9000,
    
    // 📊 Dynamic configuration based on environment
    db: {
      users: util.libObj.mockjs.mock({
        'list|10': [{
          'id|+1': 1,
          'name': '@name'
        }]
      }).list
    },
    
    // 🔧 Advanced feature configuration
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

## 🌟 Practical Configuration Scenarios

### 📱 Mobile Development Scenario
```js
module.exports = {
  port: 3001,
  cors: true,                    // 🌍 CORS support
  static: './mobile-assets',     // 📱 Static resource directory
  
  // 🔄 Proxy real API for debugging
  proxy: {
    '/api/prod': 'https://api.production.com'
  }
}
```

### 🧪 Test Environment Configuration
```js
module.exports = (util) => {
  return {
    port: 9999,
    
    // 🎲 Simulate various network conditions
    api: {
      '/api/slow': (req, res) => {
        setTimeout(() => {
          res.json({ message: 'Simulate slow network response' })
        }, 3000)
      },
      
      '/api/error': (req, res) => {
        // 🚨 Simulate error response for testing
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
}
```

### 🏢 Team Collaboration Configuration
```js
module.exports = (util) => {
  const teamConfig = {
    port: 8080,
    
    // 👥 Team shared interface definitions
    api: {
      // 📈 User management interfaces
      'GET /api/users': 'data1',
      'POST /api/users': 'data2',
      
      // 🛍️ Product management interfaces
      'GET /api/products': util.libObj.mockjs.mock({
        'list|20-50': [{
          'id|+1': 1,
          'name': '@title(3,8)',
          'price|100-9999': 1,
          'category': '@pick(["Electronics", "Clothing", "Food", "Books"])'
        }]
      }).list
    },
    
    // 🔐 Development environment security configuration
    disable: process.env.NODE_ENV === 'production' ? ['record'] : []
  }
  
  return teamConfig
}
```

## 🎨 The Art of Configuration Files

### 📝 Configuration File Naming Rules
- `mm.config.js` - Standard configuration file
- `mm.config.dev.js` - Development environment specific
- `mm.config.prod.js` - Production environment specific

### 🔄 Environment Variable Integration
```js
module.exports = {
  port: process.env.MOCK_PORT || 9000,
  host: process.env.MOCK_HOST || 'localhost',
  
  // 🌱 Enable different features based on environment
  disable: process.env.NODE_ENV === 'production' 
    ? ['record', 'history'] 
    : []
}
```

## 🚨 Common Configuration Pitfalls

1. **Port Conflicts** 🔥
   ```js
   // ❌ Avoid using system reserved ports
   port: 80  // Requires administrator privileges
   
   // ✅ Use development-friendly ports
   port: 9000
   ```

2. **Path Configuration Errors** 📁
   ```js
   // ❌ Relative paths may cause issues
   dataDir: '../data'
   
   // ✅ Use absolute paths or __dirname
   dataDir: path.join(__dirname, 'httpData')
   ```

## 🎯 Next Steps to Explore

Configuration files are just the beginning! Continue exploring more powerful features:

- 🔧 [Advanced Configuration Options](../config/option.md) - Unlock all configuration possibilities
- 🛠️ [Utility Library Usage](../config/config_fn.md) - Master the powerful util toolkit
- 🌟 [API Configuration Art](../config/config_api_fn.md) - Create professional-level API Mock

> 💡 **Pro Tip**: Configuration files support hot reload, automatically taking effect after modifications for a smoother development experience!
