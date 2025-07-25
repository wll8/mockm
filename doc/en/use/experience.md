# Team Collaboration Best Practices - From Individual to Enterprise-Level Application 🚀

> **From solo development to team collaboration, make MockM your development weapon!**

This guide is based on real project experience and is suitable for modern development teams using **version control**, **multi-person collaboration**, and **frontend-backend separation**.

---

## 🏗️ Project-Level Deployment - Team Shared Configuration

### 🎯 Why Choose Project-Level Installation?
- ✅ **Version Consistency** - Team members use the same version, avoiding environment differences
- ✅ **Configuration Sharing** - All configuration files enter version control, team synchronization
- ✅ **Newcomer Friendly** - Clone project and start developing immediately, zero configuration barrier
- ✅ **CI/CD Integration** - Can be used directly in automated workflows

### 📦 Standard Installation Process

```bash
# Install as project dependency
npm install mockm --save-dev

# Or use yarn
yarn add mockm --dev

# Or use pnpm (recommended)
pnpm add mockm -D
```

**Check Result**: `package.json` will contain:
```json
{
  "devDependencies": {
    "mockm": "^1.1.27"
  }
}
```

> 💡 **Pro Tip**: Global installation (`npm i -g mockm`) is still useful for quickly starting temporary services anywhere

---

## ⚡ One-Click Initialization - Professional Project Structure

### 🎭 Magic Command
```bash
npx mockm --template
```

### 🎉 Instantly Have Professional Structure
```
📁 Project Root/
├── 📁 mm/                     # MockM working directory
│   ├── 📁 api/                # Manually created API interfaces
│   │   ├── user.js            # User-related interfaces
│   │   ├── order.js           # Order-related interfaces
│   │   └── index.js           # Interface entry file
│   ├── util.js                # Common utility methods
│   └── mm.config.js           # MockM main configuration file
├── package.json               # Added mockm scripts
└── ...
```

### 📋 Auto-Configured NPM Scripts
```json
{
  "scripts": {
    "mockm": "mockm",
    "mockm:dev": "mockm --your-parameters",
    "mockm:prod": "mockm --your-parameters"
  }
}
```

### 🚀 Standard Startup Methods
```bash
# Basic startup
npm run mockm

# Development mode
npm run mockm:dev

# Production mode
npm run mockm:prod
```

---

### 🔧 Main Configuration File Example (mm.config.js)
```javascript
const { loadApiModules } = require('./util')
const env = process.env.NODE_ENV || 'development'

module.exports = util => {
  // Load different configurations based on environment
  const envConfig = require(`./config/${env === 'development' ? 'dev' : env}`)
  
  return {
    ...envConfig,
    
    // Auto-load all API modules
    api: {
      ...loadApiModules(util),
      
      // Health check interface
      'get /health' (req, res) {
        res.json({
          status: 'ok',
          timestamp: Date.now(),
          env: process.env.NODE_ENV,
          version: require('../package.json').version
        })
      }
    },
    
    // Development environment special configuration
    ...(env === 'development' && {
      watch: ['./mm/**/*.js'],  // Watch file changes
      remote: true              // Enable remote access
    })
  }
}
```

### 🛠️ Utility Functions (util.js)
```javascript
const fs = require('fs')
const path = require('path')

// Auto-load API modules
function loadApiModules(util) {
  const apiDir = path.join(__dirname, 'api')
  const modules = {}
  
  if (fs.existsSync(apiDir)) {
    const files = fs.readdirSync(apiDir)
    files.forEach(file => {
      if (file.endsWith('.js') && file !== 'index.js') {
        const moduleName = path.basename(file, '.js')
        const moduleExports = require(path.join(apiDir, file))
        
        if (typeof moduleExports === 'function') {
          Object.assign(modules, moduleExports(util))
        } else {
          Object.assign(modules, moduleExports)
        }
      }
    })
  }
  
  return modules
}

// Unified response format
function wrapApiData(data, message = 'success', code = 200) {
  return {
    code,
    message,
    data,
    timestamp: Date.now()
  }
}

// Error handling middleware
function errorHandler(error, req, res, next) {
  console.error('API Error:', error)
  res.status(500).json(wrapApiData(null, error.message, 500))
}

// Environment-based configuration loader
function loadEnvConfig(env = 'development') {
  const configPath = path.join(__dirname, 'config', `${env}.js`)
  
  if (fs.existsSync(configPath)) {
    return require(configPath)
  }
  
  // Fallback to development config
  return require(path.join(__dirname, 'config', 'dev.js'))
}

module.exports = {
  loadApiModules,
  wrapApiData,
  errorHandler,
  loadEnvConfig
}
```

---

## 📁 API Module Organization - Modular Management

### 🎯 Module Structure Best Practices

**User Module (api/user.js)**
```javascript
const { wrapApiData } = require('../util')

module.exports = util => ({
  // User list
  'get /api/users' (req, res) {
    const { page = 1, limit = 10, keyword = '' } = req.query
    
    // Simulate database query
    const users = util.libObj.mockjs.mock({
      [`data|${limit}`]: [{
        'id|+1': 1000,
        username: '@cname',
        email: '@email',
        status: '@pick(["active", "inactive"])',
        createTime: '@datetime'
      }]
    }).data
    
    res.json(wrapApiData({
      list: users,
      total: 100,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  },
  
  // User details
  'get /api/users/:id' (req, res) {
    const { id } = req.params
    
    const user = {
      id: parseInt(id),
      username: util.libObj.mockjs.mock('@cname'),
      email: util.libObj.mockjs.mock('@email'),
      profile: {
        avatar: util.libObj.mockjs.mock('@image("200x200")'),
        bio: util.libObj.mockjs.mock('@cparagraph(1, 3)'),
        location: util.libObj.mockjs.mock('@city(true)')
      },
      createTime: util.libObj.mockjs.mock('@datetime'),
      lastLogin: util.libObj.mockjs.mock('@datetime')
    }
    
    res.json(wrapApiData(user))
  },
  
  // Create user
  'post /api/users' (req, res) {
    const userData = req.body
    
    // Simulate validation
    if (!userData.username || !userData.email) {
      return res.status(400).json(wrapApiData(null, 'Username and email are required', 400))
    }
    
    const newUser = {
      id: Date.now(),
      ...userData,
      createTime: new Date().toISOString()
    }
    
    res.status(201).json(wrapApiData(newUser, 'User created successfully'))
  }
})
```

**Order Module (api/order.js)**
```javascript
const { wrapApiData } = require('../util')

module.exports = util => ({
  // Order list
  'get /api/orders' (req, res) {
    const { userId, status, page = 1, limit = 10 } = req.query
    
    const orders = util.libObj.mockjs.mock({
      [`data|${limit}`]: [{
        'id|+1': 10000,
        userId: userId || '@integer(1000, 9999)',
        'status|1': ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
        'amount|100-9999.2': 1,
        items: [{
          'productId|+1': 1,
          productName: '@ctitle(5, 15)',
          'quantity|1-5': 1,
          'price|10-999.2': 1
        }],
        createTime: '@datetime'
      }]
    }).data
    
    res.json(wrapApiData({
      list: orders,
      total: 50,
      page: parseInt(page),
      limit: parseInt(limit)
    }))
  },
  
  // Order details
  'get /api/orders/:id' (req, res) {
    const { id } = req.params
    
    const order = {
      id: parseInt(id),
      userId: util.libObj.mockjs.mock('@integer(1000, 9999)'),
      status: util.libObj.mockjs.mock('@pick(["pending", "paid", "shipped", "delivered"])'),
      amount: util.libObj.mockjs.mock('@float(100, 9999, 2, 2)'),
      items: util.libObj.mockjs.mock({
        'data|1-5': [{
          'productId|+1': 1,
          productName: '@ctitle(5, 15)',
          'quantity|1-5': 1,
          'price|10-999.2': 1
        }]
      }).data,
      shipping: {
        address: util.libObj.mockjs.mock('@county(true)'),
        phone: util.libObj.mockjs.mock(/^1[3-9]\d{9}$/),
        recipient: util.libObj.mockjs.mock('@cname')
      },
      createTime: util.libObj.mockjs.mock('@datetime'),
      updateTime: util.libObj.mockjs.mock('@datetime')
    }
    
    res.json(wrapApiData(order))
  }
})
```

---

## 🌍 Environment Configuration - Multi-Environment Management

### 📁 Configuration Directory Structure
```
📁 mm/config/
├── dev.js          # Development environment
├── test.js         # Test environment
├── staging.js      # Staging environment
└── prod.js         # Production environment
```

### 🔧 Development Environment (config/dev.js)
```javascript
module.exports = {
  port: 9000,
  testPort: 9001,
  replayPort: 9002,
  
  // Development backend
  proxy: 'http://localhost:8080',
  
  // Enable features for development
  remote: true,
  cors: true,
  
  // File watching
  watch: [
    './mm/**/*.js',
    './src/**/*.js'
  ],
  
  // Development database
  db: {
    users: require('../data/users.json'),
    orders: require('../data/orders.json')
  },
  
  // Development-specific middleware
  middleware: [
    (req, res, next) => {
      console.log(`[DEV] ${req.method} ${req.url}`)
      next()
    }
  ]
}
```

### 🧪 Test Environment (config/test.js)
```javascript
module.exports = {
  port: 9010,
  testPort: 9011,
  replayPort: 9012,
  
  // Test backend
  proxy: 'http://test-api.example.com',
  
  // Disable remote access for security
  remote: false,
  cors: true,
  
  // Test data
  db: {
    users: require('../data/test-users.json'),
    orders: require('../data/test-orders.json')
  },
  
  // Test-specific configuration
  responseDelay: 100, // Simulate network delay
  
  // Test middleware
  middleware: [
    (req, res, next) => {
      // Add test headers
      res.setHeader('X-Test-Environment', 'true')
      next()
    }
  ]
}
```

### 🚀 Production Environment (config/prod.js)
```javascript
module.exports = {
  port: process.env.PORT || 9000,
  
  // Production backend
  proxy: process.env.API_BASE_URL || 'https://api.example.com',
  
  // Security settings
  remote: false,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://example.com']
  },
  
  // Minimal logging
  verbose: false,
  
  // Production optimizations
  cache: true,
  compression: true,
  
  // Health check
  api: {
    'get /health' (req, res) {
      res.json({
        status: 'healthy',
        timestamp: Date.now(),
        version: process.env.APP_VERSION || '1.0.0'
      })
    }
  }
}
```

---

## 🔄 Version Control Integration - Git Best Practices

### 📝 .gitignore Configuration
```gitignore
# MockM generated files
/mm/data/httpHistory.json
/mm/data/log.*.txt
/mm/data/store.json

# Keep structure but ignore dynamic data
/mm/data/*.json
!/mm/data/static-*.json

# Temporary files
*.tmp
*.log

# Environment variables
.env.local
.env.*.local
```

### 📋 Essential Files to Track
```bash
✅ mm/config/           # Environment configurations
✅ mm/api/             # API modules
✅ mm/util.js          # Utility functions
✅ mm/mm.config.js     # Main configuration
✅ mm/data/static-*.json  # Static seed data
✅ package.json        # Dependencies and scripts
```

### 🚫 Files to Ignore
```bash
❌ mm/data/httpHistory.json    # Request history
❌ mm/data/log.*.txt          # Log files
❌ mm/data/store.json         # Runtime state
❌ node_modules/              # Dependencies
❌ .env.local                 # Local environment variables
```

---

## 👥 Team Workflow - Collaboration Guidelines

### 🎯 Development Workflow

**1. Project Setup**
```bash
# New team member joins
git clone https://github.com/team/project.git
cd project
npm install
npm run mockm:dev
```

**2. Feature Development**
```bash
# Create feature branch
git checkout -b feature/user-management

# Modify API configuration
# Edit mm/api/user.js or mm/config/dev.js

# Test changes
npm run mockm:dev

# Commit changes
git add mm/
git commit -m "feat: add user management API"
```

**3. Code Review**
- Review API structure and naming conventions
- Check response format consistency
- Verify error handling
- Test with different environments

**4. Integration**
```bash
# Merge to main branch
git checkout main
git merge feature/user-management

# Deploy to staging
npm run mockm:staging
```

### 📋 Team Conventions

**API Naming Convention**
```javascript
// ✅ Good - RESTful and consistent
'get /api/users'           // List users
'get /api/users/:id'       // Get user details
'post /api/users'          // Create user
'put /api/users/:id'       // Update user
'delete /api/users/:id'    // Delete user

// ❌ Avoid - Inconsistent naming
'get /user-list'
'get /getUserById/:id'
'post /createUser'
```

**Response Format Standard**
```javascript
// ✅ Unified response structure
{
  "code": 200,
  "message": "success",
  "data": {...},
  "timestamp": 1640995200000
}

// ✅ Error response structure
{
  "code": 400,
  "message": "Validation failed",
  "errors": {
    "username": "Username is required",
    "email": "Invalid email format"
  },
  "timestamp": 1640995200000
}
```

---

## 🚀 CI/CD Integration - Automated Deployment

### 🔧 GitHub Actions Example
```yaml
# .github/workflows/mockm.yml
name: MockM API Testing

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test-api:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start MockM server
      run: |
        npm run mockm:test &
        sleep 10  # Wait for server to start
    
    - name: Run API tests
      run: |
        # Test health endpoint
        curl -f http://localhost:9010/health
        
        # Test user API
        curl -f http://localhost:9010/api/users
        
        # Test with data
        curl -f -X POST http://localhost:9010/api/users \
          -H "Content-Type: application/json" \
          -d '{"username":"test","email":"test@example.com"}'
    
    - name: Stop MockM server
      run: pkill -f mockm || true
```

### 🐳 Docker Integration
```dockerfile
# Dockerfile.mockm
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy MockM configuration
COPY mm/ ./mm/

# Expose ports
EXPOSE 9000 9001 9002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

# Start MockM
CMD ["npm", "run", "mockm:prod"]
```

**Docker Compose for Development**
```yaml
# docker-compose.yml
version: '3.8'

services:
  mockm:
    build:
      context: .
      dockerfile: Dockerfile.mockm
    ports:
      - "9000:9000"
      - "9001:9001"
      - "9002:9002"
    environment:
      - NODE_ENV=development
      - API_BASE_URL=http://backend:8080
    volumes:
      - ./mm:/app/mm
    depends_on:
      - backend
    
  backend:
    image: your-backend-image
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
```

---

## 📊 Monitoring and Debugging - Production Ready

### 🔍 Built-in Monitoring
```javascript
// mm/config/prod.js
module.exports = {
  // ... other config
  
  // Custom middleware for monitoring
  middleware: [
    // Request logging
    (req, res, next) => {
      const start = Date.now()
      
      res.on('finish', () => {
        const duration = Date.now() - start
        console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`)
        
        // Send to monitoring service
        if (process.env.MONITORING_URL) {
          fetch(process.env.MONITORING_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: req.method,
              url: req.url,
              statusCode: res.statusCode,
              duration,
              timestamp: Date.now()
            })
          }).catch(console.error)
        }
      })
      
      next()
    },
    
    // Error tracking
    (err, req, res, next) => {
      console.error('MockM Error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      })
      
      // Send to error tracking service
      if (process.env.ERROR_TRACKING_URL) {
        fetch(process.env.ERROR_TRACKING_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: err.message,
            stack: err.stack,
            context: {
              url: req.url,
              method: req.method,
              userAgent: req.get('User-Agent')
            },
            timestamp: new Date().toISOString()
          })
        }).catch(console.error)
      }
      
      next(err)
    }
  ]
}
```

### 📈 Performance Metrics
```javascript
// mm/util.js
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeConnections: 0
    }
  }
  
  recordRequest(duration, statusCode) {
    this.metrics.requests++
    this.metrics.responseTime.push(duration)
    
    if (statusCode >= 400) {
      this.metrics.errors++
    }
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000)
    }
  }
  
  getStats() {
    const responseTime = this.metrics.responseTime
    const avgResponseTime = responseTime.length > 0 
      ? responseTime.reduce((a, b) => a + b, 0) / responseTime.length 
      : 0
    
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0,
      avgResponseTime: Math.round(avgResponseTime),
      activeConnections: this.metrics.activeConnections
    }
  }
}

const metrics = new MetricsCollector()

module.exports = {
  metrics,
  // ... other exports
}
```

---

## 💡 Advanced Tips - Pro Level

### 🎯 Dynamic Configuration Loading
```javascript
// mm/config/dynamic.js
const fs = require('fs')
const path = require('path')

// Hot reload configuration without restart
function createDynamicConfig() {
  let config = {}
  let lastModified = 0
  
  const configPath = path.join(__dirname, 'runtime.json')
  
  function loadConfig() {
    try {
      const stats = fs.statSync(configPath)
      if (stats.mtime.getTime() > lastModified) {
        delete require.cache[require.resolve(configPath)]
        config = require(configPath)
        lastModified = stats.mtime.getTime()
        console.log('Configuration reloaded')
      }
    } catch (error) {
      console.warn('Runtime config not found, using defaults')
    }
    
    return config
  }
  
  return {
    get: loadConfig,
    middleware: (req, res, next) => {
      req.dynamicConfig = loadConfig()
      next()
    }
  }
}

module.exports = createDynamicConfig()
```

### 🔐 Security Best Practices
```javascript
// mm/middleware/security.js
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
})

// API key validation
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  
  if (process.env.NODE_ENV === 'production' && !apiKey) {
    return res.status(401).json({
      code: 401,
      message: 'API key required'
    })
  }
  
  if (process.env.VALID_API_KEYS && !process.env.VALID_API_KEYS.split(',').includes(apiKey)) {
    return res.status(403).json({
      code: 403,
      message: 'Invalid API key'
    })
  }
  
  next()
}

module.exports = {
  limiter,
  helmet: helmet(),
  validateApiKey
}
```

---

## 🎉 Summary - Team Success Formula

### ✅ Key Takeaways

1. **🏗️ Project-Level Installation** - Ensure team consistency
2. **⚡ Template Initialization** - Get professional structure instantly
3. **📁 Modular Organization** - Keep APIs organized and maintainable
4. **🌍 Environment Management** - Handle different deployment stages
5. **🔄 Version Control** - Track important files, ignore temporary data
6. **👥 Team Conventions** - Establish clear naming and response standards
7. **🚀 CI/CD Integration** - Automate testing and deployment
8. **📊 Monitoring** - Keep track of performance and errors

### 🎯 Next Steps

- Set up your team's MockM configuration repository
- Establish API development standards and conventions
- Integrate with your CI/CD pipeline
- Monitor and optimize based on usage patterns

> 🌟 **Team Success**: When everyone follows these practices, MockM becomes more than a mocking tool - it becomes the foundation of your team's API development workflow!

> 📚 **Further Reading**:
> - [Configuration Reference](../config/option.md) - Deep dive into all options
> - [Practical Examples](../use/example.md) - Learn with real scenarios
> - [API Function Tools](../config/config_api_fn.md) - Advanced API capabilities
