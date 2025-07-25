# 🛠️ Function-based Configuration Toolkit

When configuration files adopt the [function form](./config_file.md), MockM provides you with a super powerful `util` toolkit! It's like installing a turbocharger for your API Mock service.

## 🎯 Toolkit Overview

```js
module.exports = (util) => {
  console.log('🎉 Welcome to the MockM toolkit world!')
  
  // 🚀 Server instance
  const { app } = util.server
  
  // 📚 Third-party libraries
  const { mockjs, axios, mime } = util.libObj
  
  // 🔧 Utility functions
  const tools = util.toolObj
  
  // 💼 Business functions
  const business = util.business
  
  // 🌟 API extensions
  const { side } = util
  
  return { /* your configuration */ }
}
```

## 🚀 util.server - Server Core

### 🌐 Express Application Instance (util.server.app)

Direct access to the underlying Express application, giving you complete control:

```js
module.exports = (util) => {
  const { app } = util.server
  
  // 🎨 Custom routes
  app.get('/custom/hello', (req, res) => {
    res.json({ 
      message: '👋 Hello from MockM!',
      timestamp: new Date().toISOString()
    })
  })
  
  // 🔒 Add authentication middleware
  app.use('/api/protected/*', (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
      return res.status(401).json({ error: '🚫 Token required' })
    }
    next()
  })
  
  // 📊 Custom status monitoring
  app.get('/status', (req, res) => {
    res.json({
      status: '🟢 running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: require('../../package.json').version
    })
  })
  
  return {}
}
```

## 📚 util.libObj - Third-party Library Collection

### 🎲 MockJS - Data Generation Magic

[🔗 More Examples](https://wll8.github.io/mockjs-examples/)

```js
module.exports = (util) => {
  const { mockjs } = util.libObj
  
  return {
    api: {
      // 👥 Generate user list
      'GET /api/users': mockjs.mock({
        'code': 200,
        'message': 'success',
        'data|10-20': [{
          'id|+1': 1,
          'name': '@cname',              // Chinese name
          'email': '@email',             // Email
          'avatar': '@image("200x200")', // Avatar
          'age|18-65': 1,               // Age
          'city': '@city',              // City
          'createTime': '@datetime'      // Create time
        }]
      }),
      
      // 📊 Generate statistical data
      'GET /api/dashboard': mockjs.mock({
        'totalUsers|1000-9999': 1,
        'activeUsers|100-999': 1,
        'revenue|10000-99999.2': 1,
        'growth|0.1-0.5.1-2': 1,
        'chart|7': [{
          'date': '@date("MM-dd")',
          'value|100-1000': 1
        }]
      })
    }
  }
}
```

<details>
<summary>🎨 MockJS Syntax Quick Reference</summary>

#### 📝 String Templates
```js
'name|min-max': 'string'  // Repeat string
'name|count': 'string'    // Repeat specified times
```

#### 🔢 Number Templates
```js
'name|+1': number         // Auto-increment number
'name|min-max': number    // Random integer
'name|min-max.dmin-dmax': number  // Random float
```

#### 📋 Array Templates
```js
'name|1': array          // Randomly select one element
'name|+1': array         // Select elements in order
'name|min-max': array    // Repeat array elements
'name|count': array      // Repeat specified times
```

#### 🎯 Common Placeholders
- **🧑 Names**: `@name` (English) / `@cname` (Chinese)
- **📧 Contact**: `@email` / `@phone` / `@url`
- **📍 Address**: `@province` / `@city` / `@county`
- **⏰ Time**: `@date` / `@time` / `@datetime` / `@now`
- **🎨 Color**: `@color` / `@hex` / `@rgb`
- **🖼️ Image**: `@image` / `@dataImage`
- **📝 Text**: `@sentence` / `@paragraph` / `@title`

</details>

### 🌐 Axios - HTTP Request Tool

```js
module.exports = (util) => {
  const { axios } = util.libObj
  
  // ⚙️ Global configuration
  axios.defaults.timeout = 5000
  axios.defaults.baseURL = 'https://api.example.com'
  
  // 🔧 Request interceptor
  axios.interceptors.request.use(config => {
    console.log('📤 Sending request:', config.url)
    config.headers['X-Request-ID'] = Date.now()
    return config
  })
  
  // 📨 Response interceptor
  axios.interceptors.response.use(
    response => {
      console.log('📥 Received response:', response.status)
      return response
    },
    error => {
      console.error('❌ Request failed:', error.message)
      return Promise.reject(error)
    }
  )
  
  return {
    api: {
      // 🔄 Proxy and enhance external API
      'GET /api/weather/:city': async (req, res) => {
        try {
          const { city } = req.params
          const response = await axios.get(`/weather?q=${city}`)
          
          res.json({
            code: 200,
            data: response.data,
            cached: false,
            timestamp: Date.now()
          })
        } catch (error) {
          res.status(500).json({
            code: 500,
            message: 'Weather service temporarily unavailable',
            error: error.message
          })
        }
      }
    }
  }
}
```

### 📎 MIME - File Type Recognition

```js
module.exports = (util) => {
  const { mime } = util.libObj
  
  return {
    api: {
      // 📁 File upload handling
      'POST /api/upload': (req, res) => {
        const fileName = req.body.fileName
        const fileType = mime.getType(fileName)
        const extension = mime.getExtension(fileType)
        
        res.json({
          fileName,
          fileType,
          extension,
          isImage: fileType?.startsWith('image/'),
          isDocument: ['application/pdf', 'application/msword'].includes(fileType)
        })
      }
    }
  }
}
```

## 🔧 util.toolObj - Utility Collection

[🔗 Complete Source Code Reference](https://github.com/wll8/mockm/blob/master/server/util/tool.js)

MockM provides rich utility functions to make your development more efficient:

```js
module.exports = (util) => {
  const tools = util.toolObj
  
  return {
    api: {
      // 🔄 Array operation example
      'GET /api/array-demo': (req, res) => {
        const data = [1, 2, 3, 4, 5]
        res.json({
          original: data,
          processed: tools.array.shuffle(data),
          unique: tools.array.unique([1, 1, 2, 2, 3])
        })
      },
      
      // 📝 String processing example
      'GET /api/string-demo': (req, res) => {
        const text = 'hello world'
        res.json({
          original: text,
          camelCase: tools.string.toCamelCase(text),
          kebabCase: tools.string.toKebabCase(text),
          hash: tools.string.md5(text)
        })
      },
      
      // ⏰ Time utility example
      'GET /api/time-demo': (req, res) => {
        res.json({
          now: tools.time.now(),
          format: tools.time.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
          relative: tools.time.relative(new Date(Date.now() - 3600000))
        })
      }
    }
  }
}
```

### 🛠️ Tool Category Overview

| Category | Description | Typical Use |
|----------|-------------|-------------|
| 🔄 **array** | Array operations | Deduplication, sorting, shuffling |
| 📝 **string** | String processing | Format conversion, encryption, validation |
| 📦 **npm** | Package management | Dependency checking, version comparison |
| 🎮 **control** | Flow control | Debounce, throttle, retry |
| 💾 **cache** | Cache management | Memory cache, persistence |
| 🎲 **generate** | Generators | ID generation, random data |
| 🌐 **url** | URL processing | Parsing, building, validation |
| 📁 **file** | File operations | Read/write, upload, compression |
| 💻 **cli** | Command line | Parameter parsing, color output |
| 🔤 **hex** | Base conversion | Hexadecimal processing |
| 🌊 **middleware** | Middleware | Express middleware |
| 🌍 **httpClient** | HTTP client | Request encapsulation |
| ⚡ **fn** | Function utilities | Functional programming |
| 🎯 **obj** | Object operations | Deep copy, merge |
| 💻 **os** | System info | Platform detection |
| 🏷️ **type** | Type detection | Type checking |
| ⏰ **time** | Time processing | Formatting, calculation |

## 💼 util.business - Business Logic Assistant

[🔗 Complete Source Code Reference](https://github.com/wll8/mockm/blob/master/server/util/business.js)

```js
module.exports = (util) => {
  const { wrapApiData, listToData, strReMatch } = util.business
  
  return {
    api: {
      // 📦 Unified API response wrapper
      'GET /api/products': (req, res) => {
        const products = [
          { id: 1, name: 'Apple', price: 5.5 },
          { id: 2, name: 'Banana', price: 3.2 }
        ]
        
        res.json(wrapApiData(products, {
          code: 200,
          message: 'success',
          total: products.length
        }))
      },
      
      // 🗂️ Schema data conversion
      'GET /api/schema-demo': (req, res) => {
        const schema = [
          { key: 'name', type: 'string', example: 'John' },
          { key: 'age', type: 'number', example: 25 }
        ]
        
        res.json(listToData(schema))
      },
      
      // 🔍 Regex matching processing
      'GET /api/regex-demo': (req, res) => {
        const pattern = req.query.pattern || '/test/i'
        const regex = strReMatch(pattern)
        
        res.json({
          pattern,
          isRegex: !!regex,
          match: regex ? 'Test String'.match(regex) : null
        })
      }
    }
  }
}
```

## 🌟 util.side - API Extension Magic

Give your APIs superpowers! One interface, multiple aliases, easy solution:

```js
module.exports = (util) => {
  const { side } = util
  
  return {
    api: {
      // 🎯 Basic alias usage
      '/api/users': side({
        alias: ['/api/members', 'POST /api/user-list'],
        action: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      }),
      
      // 🚀 Advanced feature combination
      '/api/products': side({
        alias: [
          '/api/goods',           // Goods alias
          '/api/items',           // Items alias  
          'POST /api/product-search' // Support different HTTP methods
        ],
        action: (req, res) => {
          res.json({
            message: '🎉 This interface has multiple entry points!',
            method: req.method,
            path: req.path,
            timestamp: Date.now()
          })
        }
      }),
      
      // 📚 RESTful API quick creation
      '/api/articles': side({
        alias: [
          'GET /api/posts',        // Article list
          'GET /api/blogs',        // Blog list
          'POST /api/content'      // Content creation
        ],
        action: {
          'list|10': [{
            'id|+1': 1,
            'title': '@ctitle(5,10)',
            'content': '@cparagraph(3,5)',
            'author': '@cname',
            'createTime': '@datetime'
          }]
        }
      })
    }
  }
}
```

### 💡 Power of Side Function

```js
// 🔄 Traditional way - Repeated definitions
config = {
  api: {
    '/api/users': userData,
    '/api/members': userData,      // Duplicate!
    'POST /api/user-list': userData // Duplicate!
  }
}

// ✨ Side function - Define once, use multiple times
config = (util) => ({
  api: {
    '/api/users': util.side({
      alias: ['/api/members', 'POST /api/user-list'],
      action: userData
    })
  }
})
```

## 🎯 Practical Case: Building a Complete User System

```js
module.exports = (util) => {
  const { mockjs, axios } = util.libObj
  const { wrapApiData } = util.business
  const { side } = util
  
  // 🎲 Mock user data
  const generateUsers = () => mockjs.mock({
    'list|50': [{
      'id|+1': 1,
      'username': '@word(3,10)',
      'name': '@cname',
      'email': '@email',
      'avatar': '@image("100x100")',
      'role|1': ['admin', 'user', 'guest'],
      'status|1': ['active', 'inactive'],
      'createTime': '@datetime',
      'loginCount|1-100': 1
    }]
  }).list
  
  return {
    api: {
      // 👥 User management API
      'GET /api/users': side({
        alias: ['/api/members', '/api/user-list'],
        action: (req, res) => {
          const { page = 1, size = 10, keyword = '' } = req.query
          let users = generateUsers()
          
          // 🔍 Keyword search
          if (keyword) {
            users = users.filter(user => 
              user.name.includes(keyword) || 
              user.username.includes(keyword)
            )
          }
          
          // 📄 Pagination handling
          const start = (page - 1) * size
          const end = start + parseInt(size)
          const pageData = users.slice(start, end)
          
          res.json(wrapApiData({
            list: pageData,
            pagination: {
              current: parseInt(page),
              pageSize: parseInt(size),
              total: users.length,
              pages: Math.ceil(users.length / size)
            }
          }))
        }
      }),
      
      // 👤 User details
      'GET /api/users/:id': (req, res) => {
        const { id } = req.params
        const user = generateUsers().find(u => u.id == id)
        
        if (!user) {
          return res.status(404).json({
            code: 404,
            message: 'User not found'
          })
        }
        
        res.json(wrapApiData(user))
      },
      
      // 🔐 User authentication
      'POST /api/auth/login': side({
        alias: ['/api/login', '/api/signin'],
        action: (req, res) => {
          const { username, password } = req.body
          
          if (!username || !password) {
            return res.status(400).json({
              code: 400,
              message: 'Username and password cannot be empty'
            })
          }
          
          // 🎭 Mock login verification
          const mockUser = {
            id: 1,
            username,
            name: mockjs.mock('@cname'),
            token: mockjs.mock('@guid'),
            role: 'user'
          }
          
          res.json(wrapApiData(mockUser, {
            message: 'Login successful'
          }))
        }
      })
    }
  }
}
```

## 🚀 Advanced Techniques

### 🔄 Middleware Chain Processing
```js
module.exports = (util) => {
  const { app } = util.server
  
  // 📊 Request logging middleware
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`)
    next()
  })
  
  // ⏱️ Response time middleware
  app.use((req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
      console.log(`⏱️ ${req.path} took ${Date.now() - start}ms`)
    })
    next()
  })
  
  return {}
}
```

### 🎯 Dynamic Configuration Updates
```js
module.exports = (util) => {
  const { toolObj } = util
  
  return {
    api: {
      // 🔄 Hot reload configuration
      'POST /api/config/reload': (req, res) => {
        // Configuration reload logic
        res.json({
          message: 'Configuration updated',
          timestamp: Date.now()
        })
      }
    }
  }
}
```

## 🎓 Best Practices

1. **🎨 Reasonable use of toolkit**: Import as needed, avoid over-encapsulation
2. **🔒 Security first**: Validate input data, prevent injection attacks  
3. **📊 Performance monitoring**: Use utility functions to monitor API performance
4. **🧪 Thorough testing**: Use MockJS to generate various test data
5. **📝 Clear documentation**: Write clear comments for custom APIs

> 💡 **Pro Tip**: The util toolkit upgrades your MockM configuration from simple data mocking to a fully functional development server!
