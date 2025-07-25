# 🛠️ 函数式配置工具库

当配置文件采用[函数形式](./config_file.md)时，MockM 会向你提供一个超级强大的 `util` 工具库！这就像是给你的 API Mock 服务装上了涡轮增压器。

## 🎯 工具库概览

```js
module.exports = (util) => {
  console.log('🎉 欢迎来到 MockM 工具库世界！')
  
  // 🚀 服务器实例
  const { app } = util.server
  
  // 📚 第三方库
  const { mockjs, axios, mime } = util.libObj
  
  // 🔧 工具函数
  const tools = util.toolObj
  
  // 💼 业务函数
  const business = util.business
  
  // 🌟 API 扩展
  const { side } = util
  
  return { /* 你的配置 */ }
}
```

## 🚀 util.server - 服务器核心

### 🌐 Express 应用实例 (util.server.app)

直接访问底层 Express 应用，让你拥有完全的控制权：

```js
module.exports = (util) => {
  const { app } = util.server
  
  // 🎨 自定义路由
  app.get('/custom/hello', (req, res) => {
    res.json({ 
      message: '👋 Hello from MockM!',
      timestamp: new Date().toISOString()
    })
  })
  
  // 🔒 添加认证中间件
  app.use('/api/protected/*', (req, res, next) => {
    const token = req.headers.authorization
    if (!token) {
      return res.status(401).json({ error: '🚫 Token required' })
    }
    next()
  })
  
  // 📊 自定义状态监控
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

## 📚 util.libObj - 第三方库集合

### 🎲 MockJS - 数据生成神器

[🔗 更多示例](https://wll8.github.io/mockjs-examples/)

```js
module.exports = (util) => {
  const { mockjs } = util.libObj
  
  return {
    api: {
      // 👥 生成用户列表
      'GET /api/users': mockjs.mock({
        'code': 200,
        'message': 'success',
        'data|10-20': [{
          'id|+1': 1,
          'name': '@cname',              // 中文姓名
          'email': '@email',             // 邮箱
          'avatar': '@image("200x200")', // 头像
          'age|18-65': 1,               // 年龄
          'city': '@city',              // 城市
          'createTime': '@datetime'      // 创建时间
        }]
      }),
      
      // 📊 生成统计数据
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
<summary>🎨 MockJS 语法速查表</summary>

#### 📝 字符串模板
```js
'name|min-max': 'string'  // 重复字符串
'name|count': 'string'    // 重复指定次数
```

#### 🔢 数字模板
```js
'name|+1': number         // 自增数字
'name|min-max': number    // 随机整数
'name|min-max.dmin-dmax': number  // 随机浮点数
```

#### 📋 数组模板
```js
'name|1': array          // 随机选择一个元素
'name|+1': array         // 顺序选择元素
'name|min-max': array    // 重复数组元素
'name|count': array      // 重复指定次数
```

#### 🎯 常用占位符
- **🧑 姓名**: `@name` (英文) / `@cname` (中文)
- **📧 联系**: `@email` / `@phone` / `@url`
- **📍 地址**: `@province` / `@city` / `@county`
- **⏰ 时间**: `@date` / `@time` / `@datetime` / `@now`
- **🎨 颜色**: `@color` / `@hex` / `@rgb`
- **🖼️ 图片**: `@image` / `@dataImage`
- **📝 文本**: `@sentence` / `@paragraph` / `@title`

</details>

### 🌐 Axios - HTTP 请求利器

```js
module.exports = (util) => {
  const { axios } = util.libObj
  
  // ⚙️ 全局配置
  axios.defaults.timeout = 5000
  axios.defaults.baseURL = 'https://api.example.com'
  
  // 🔧 请求拦截器
  axios.interceptors.request.use(config => {
    console.log('📤 发送请求:', config.url)
    config.headers['X-Request-ID'] = Date.now()
    return config
  })
  
  // 📨 响应拦截器
  axios.interceptors.response.use(
    response => {
      console.log('📥 收到响应:', response.status)
      return response
    },
    error => {
      console.error('❌ 请求失败:', error.message)
      return Promise.reject(error)
    }
  )
  
  return {
    api: {
      // 🔄 代理并增强外部 API
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
            message: '天气服务暂时不可用',
            error: error.message
          })
        }
      }
    }
  }
}
```

### 📎 MIME - 文件类型识别

```js
module.exports = (util) => {
  const { mime } = util.libObj
  
  return {
    api: {
      // 📁 文件上传处理
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

## 🔧 util.toolObj - 实用工具集

[🔗 完整源码参考](https://github.com/wll8/mockm/blob/master/server/util/tool.js)

MockM 提供了丰富的工具函数，让你的开发更加高效：

```js
module.exports = (util) => {
  const tools = util.toolObj
  
  return {
    api: {
      // 🔄 数组操作示例
      'GET /api/array-demo': (req, res) => {
        const data = [1, 2, 3, 4, 5]
        res.json({
          original: data,
          processed: tools.array.shuffle(data),
          unique: tools.array.unique([1, 1, 2, 2, 3])
        })
      },
      
      // 📝 字符串处理示例
      'GET /api/string-demo': (req, res) => {
        const text = 'hello world'
        res.json({
          original: text,
          camelCase: tools.string.toCamelCase(text),
          kebabCase: tools.string.toKebabCase(text),
          hash: tools.string.md5(text)
        })
      },
      
      // ⏰ 时间工具示例
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

### 🛠️ 工具类别概览

| 类别 | 功能描述 | 典型用途 |
|------|----------|----------|
| 🔄 **array** | 数组操作 | 去重、排序、洗牌 |
| 📝 **string** | 字符串处理 | 格式转换、加密、验证 |
| 📦 **npm** | 包管理 | 依赖检查、版本比较 |
| 🎮 **control** | 流程控制 | 防抖、节流、重试 |
| 💾 **cache** | 缓存管理 | 内存缓存、持久化 |
| 🎲 **generate** | 生成器 | ID生成、随机数据 |
| 🌐 **url** | URL处理 | 解析、构建、验证 |
| 📁 **file** | 文件操作 | 读写、上传、压缩 |
| 💻 **cli** | 命令行 | 参数解析、颜色输出 |
| 🔤 **hex** | 进制转换 | 十六进制处理 |
| 🌊 **middleware** | 中间件 | Express中间件 |
| 🌍 **httpClient** | HTTP客户端 | 请求封装 |
| ⚡ **fn** | 函数工具 | 函数式编程 |
| 🎯 **obj** | 对象操作 | 深拷贝、合并 |
| 💻 **os** | 系统信息 | 平台检测 |
| 🏷️ **type** | 类型检测 | 类型判断 |
| ⏰ **time** | 时间处理 | 格式化、计算 |

## 💼 util.business - 业务逻辑助手

[🔗 完整源码参考](https://github.com/wll8/mockm/blob/master/server/util/business.js)

```js
module.exports = (util) => {
  const { wrapApiData, listToData, strReMatch } = util.business
  
  return {
    api: {
      // 📦 统一包装 API 响应
      'GET /api/products': (req, res) => {
        const products = [
          { id: 1, name: '苹果', price: 5.5 },
          { id: 2, name: '香蕉', price: 3.2 }
        ]
        
        res.json(wrapApiData(products, {
          code: 200,
          message: 'success',
          total: products.length
        }))
      },
      
      // 🗂️ Schema 数据转换
      'GET /api/schema-demo': (req, res) => {
        const schema = [
          { key: 'name', type: 'string', example: '张三' },
          { key: 'age', type: 'number', example: 25 }
        ]
        
        res.json(listToData(schema))
      },
      
      // 🔍 正则匹配处理
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

## 🌟 util.side - API 扩展魔法

让你的 API 拥有超能力！一个接口，多个别名，轻松搞定：

```js
module.exports = (util) => {
  const { side } = util
  
  return {
    api: {
      // 🎯 基础别名使用
      '/api/users': side({
        alias: ['/api/members', 'POST /api/user-list'],
        action: [
          { id: 1, name: '张三' },
          { id: 2, name: '李四' }
        ]
      }),
      
      // 🚀 高级功能组合
      '/api/products': side({
        alias: [
          '/api/goods',           // 商品别名
          '/api/items',           // 物品别名  
          'POST /api/product-search' // 支持不同HTTP方法
        ],
        action: (req, res) => {
          res.json({
            message: '🎉 这个接口有多个入口！',
            method: req.method,
            path: req.path,
            timestamp: Date.now()
          })
        }
      }),
      
      // 📚 RESTful API 快速创建
      '/api/articles': side({
        alias: [
          'GET /api/posts',        // 文章列表
          'GET /api/blogs',        // 博客列表
          'POST /api/content'      // 内容创建
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

### 💡 Side 函数的威力

```js
// 🔄 传统方式 - 重复定义
config = {
  api: {
    '/api/users': userData,
    '/api/members': userData,      // 重复！
    'POST /api/user-list': userData // 重复！
  }
}

// ✨ Side 函数 - 一次定义，多处使用
config = (util) => ({
  api: {
    '/api/users': util.side({
      alias: ['/api/members', 'POST /api/user-list'],
      action: userData
    })
  }
})
```

## 🎯 实战案例：构建完整的用户系统

```js
module.exports = (util) => {
  const { mockjs, axios } = util.libObj
  const { wrapApiData } = util.business
  const { side } = util
  
  // 🎲 模拟用户数据
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
      // 👥 用户管理 API
      'GET /api/users': side({
        alias: ['/api/members', '/api/user-list'],
        action: (req, res) => {
          const { page = 1, size = 10, keyword = '' } = req.query
          let users = generateUsers()
          
          // 🔍 关键词搜索
          if (keyword) {
            users = users.filter(user => 
              user.name.includes(keyword) || 
              user.username.includes(keyword)
            )
          }
          
          // 📄 分页处理
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
      
      // 👤 用户详情
      'GET /api/users/:id': (req, res) => {
        const { id } = req.params
        const user = generateUsers().find(u => u.id == id)
        
        if (!user) {
          return res.status(404).json({
            code: 404,
            message: '用户不存在'
          })
        }
        
        res.json(wrapApiData(user))
      },
      
      // 🔐 用户认证
      'POST /api/auth/login': side({
        alias: ['/api/login', '/api/signin'],
        action: (req, res) => {
          const { username, password } = req.body
          
          if (!username || !password) {
            return res.status(400).json({
              code: 400,
              message: '用户名和密码不能为空'
            })
          }
          
          // 🎭 模拟登录验证
          const mockUser = {
            id: 1,
            username,
            name: mockjs.mock('@cname'),
            token: mockjs.mock('@guid'),
            role: 'user'
          }
          
          res.json(wrapApiData(mockUser, {
            message: '登录成功'
          }))
        }
      })
    }
  }
}
```

## 🚀 进阶技巧

### 🔄 中间件链式处理
```js
module.exports = (util) => {
  const { app } = util.server
  
  // 📊 请求日志中间件
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`)
    next()
  })
  
  // ⏱️ 响应时间中间件
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

### 🎯 动态配置更新
```js
module.exports = (util) => {
  const { toolObj } = util
  
  return {
    api: {
      // 🔄 热更新配置
      'POST /api/config/reload': (req, res) => {
        // 重新加载配置逻辑
        res.json({
          message: '配置已更新',
          timestamp: Date.now()
        })
      }
    }
  }
}
```

## 🎓 最佳实践

1. **🎨 合理使用工具库**: 按需引入，避免过度封装
2. **🔒 安全第一**: 验证输入数据，防止注入攻击  
3. **📊 性能监控**: 使用工具函数监控 API 性能
4. **🧪 充分测试**: 利用 MockJS 生成各种测试数据
5. **📝 清晰文档**: 为自定义 API 编写清晰的注释

> 💡 **专业提示**: util 工具库让你的 MockM 配置从简单的数据 Mock 升级为功能完整的开发服务器！