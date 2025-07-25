# API 函数增强工具 - 解锁高级功能 🚀

> **当配置遇上函数，API 创建从此超越想象！**

当你将 `config.api` 设置为函数时，MockM 会向你的函数传入一个强大的 `util` 工具对象，让你拥有调用外部服务、生成动态数据、执行系统命令等超能力！

---

## 🛠️ 工具箱总览

### 📦 传入参数结构
```javascript
module.exports = util => {
  // util 对象包含以下强大工具：
  const {
    run,        // 🚀 执行工具 - curl/fetch 命令执行
    libObj,     // 📚 第三方库 - mockjs/axios/mime 等
    toolObj,    // 🔨 内置工具 - 各种实用函数
    server,     // 🌐 服务器实例 - Express app 等
    // ... 更多工具
  } = util
  
  return {
    api: {
      // 你的超级 API 在这里！
    }
  }
}
```

---

## 🚀 util.run - 外部命令执行器

### 🌐 util.run.curl - cURL 命令神器

#### 🎯 功能特性
- ✅ **无缝集成** - 直接在 API 中执行 cURL 命令  
- ✅ **响应绑定** - 自动将外部响应头绑定到你的 API
- ✅ **错误处理** - 内置异常捕获和处理机制
- ✅ **灵活配置** - 支持所有 cURL 参数和选项

#### 💡 实战示例

**基础用法 - 天气查询 API**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    'get /weather/:city' (req, res) {
      const { city } = req.params
      
      // 调用外部天气 API
      const cmd = `
        curl 'https://wttr.in/${city}?format=j1' \\
          -H 'Accept: application/json' \\
          -H 'User-Agent: MockM-Weather-API' \\
          --connect-timeout 10 \\
          --max-time 30
      `
      
      run.curl({req, res, cmd}).then(result => {
        res.json({
          success: true,
          city: city,
          weather: JSON.parse(result.body),
          timestamp: Date.now()
        })
      }).catch(error => {
        res.status(500).json({
          success: false,
          error: '天气服务暂时不可用',
          message: error.message
        })
      })
    }
  })
})
```

**高级用法 - 代理转发与数据处理**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    'post /proxy/api/:endpoint' (req, res) {
      const { endpoint } = req.params
      const postData = JSON.stringify(req.body)
      
      const cmd = `
        curl 'https://api.example.com/${endpoint}' \\
          -X POST \\
          -H 'Content-Type: application/json' \\
          -H 'Authorization: Bearer ${process.env.API_TOKEN}' \\
          -d '${postData}' \\
          --compressed \\
          --silent
      `
      
      run.curl({req, res, cmd}).then(curlResult => {
        try {
          const data = JSON.parse(curlResult.body)
          
          // 数据处理和增强
          const enhancedData = {
            ...data,
            processedBy: 'MockM-Proxy',
            processedAt: new Date().toISOString(),
            originalHeaders: curlResult.headers
          }
          
          res.json(enhancedData)
        } catch (parseError) {
          res.status(502).json({
            error: '上游服务返回格式错误',
            rawResponse: curlResult.body
          })
        }
      })
    }
  })
})
```

#### 🎭 应用场景
- 🌐 **API 聚合** - 调用多个外部服务，组合返回数据
- 🔄 **数据转换** - 获取外部数据后进行格式转换
- 🛡️ **服务代理** - 为外部 API 添加认证和缓存
- 📊 **监控检查** - 定期检查外部服务状态

---

### 🌊 util.run.fetch - 现代化请求工具

#### 🎯 功能特性  
- ✅ **Promise 友好** - 基于 node-fetch，支持 async/await
- ✅ **流式处理** - 支持大文件和流式数据
- ✅ **请求复用** - 可以复用 fetch Promise 对象
- ✅ **响应绑定** - 自动绑定响应头到 API

#### 💡 实战示例

**基础用法 - IP 地理位置查询**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    async 'get /ip/location/:ip' (req, res) {
      const clientIp = req.params.ip || req.ip
      
      // 使用 fetch 获取 IP 信息
      const fetch = await util.toolObj.generate.initPackge('node-fetch')
      const fetchRes = fetch(`http://ip-api.com/json/${clientIp}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MockM-GeoIP-Service'
        },
        timeout: 5000
      })
      
      run.fetch({req, res, fetchRes}).then(async response => {
        const buffer = await response.buffer()
        const geoData = JSON.parse(buffer.toString())
        
        res.json({
          success: true,
          ip: clientIp,
          location: {
            country: geoData.country,
            city: geoData.city,
            region: geoData.regionName,
            timezone: geoData.timezone,
            coordinates: {
              lat: geoData.lat,
              lon: geoData.lon
            }
          },
          isp: geoData.isp,
          timestamp: Date.now()
        })
      }).catch(error => {
        res.status(500).json({
          success: false,
          error: 'IP 查询服务不可用',
          message: error.message
        })
      })
    }
  })
})
```

**高级用法 - 文件下载与处理**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    async 'get /download/image/:imageId' (req, res) {
      const { imageId } = req.params
      const { size = 'medium', format = 'jpg' } = req.query
      
      const fetch = await util.toolObj.generate.initPackge('node-fetch')
      const imageUrl = `https://picsum.photos/id/${imageId}/800/600.${format}`
      
      const fetchRes = fetch(imageUrl, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'MockM-Image-Proxy'
        }
      })
      
      run.fetch({req, res, fetchRes}).then(async response => {
        const imageBuffer = await response.buffer()
        
        // 设置正确的响应头
        res.set({
          'Content-Type': response.headers.get('content-type'),
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=86400', // 缓存1天
          'X-Image-Source': 'Picsum',
          'X-Image-ID': imageId
        })
        
        res.send(imageBuffer)
      }).catch(error => {
        res.status(404).json({
          success: false,
          error: '图片获取失败',
          imageId: imageId,
          message: error.message
        })
      })
    }
  })
})
```

#### 🎭 应用场景
- 🖼️ **图片代理** - 获取和处理外部图片资源
- 📄 **文档获取** - 下载和转换外部文档
- 🔗 **链接预览** - 获取网页元信息生成预览
- 📊 **数据采集** - 定时获取外部数据进行分析

---

## 🚀 高级应用场景

### 🎯 微服务聚合器
```javascript
module.exports = util => ({
  api: ({run}) => ({
    async 'get /dashboard/:userId' (req, res) {
      const { userId } = req.params
      
      // 并行调用多个微服务
      const services = [
        { name: 'user', cmd: `curl https://user-service/api/users/${userId}` },
        { name: 'orders', cmd: `curl https://order-service/api/users/${userId}/orders` },
        { name: 'payments', cmd: `curl https://payment-service/api/users/${userId}/payments` }
      ]
      
      const results = await Promise.all(
        services.map(service => 
          new Promise(resolve => {
            run.curl({req, res: {}, cmd: service.cmd}).then(result => {
              resolve({
                service: service.name,
                data: JSON.parse(result.body),
                success: true
              })
            }).catch(error => {
              resolve({
                service: service.name,
                error: error.message,
                success: false
              })
            })
          })
        )
      )
      
      // 组合响应
      const dashboard = {
        userId,
        timestamp: Date.now(),
        services: results.reduce((acc, result) => {
          acc[result.service] = result.success ? result.data : { error: result.error }
          return acc
        }, {})
      }
      
      res.json(dashboard)
    }
  })
})
```

### 🔄 智能缓存代理
```javascript
const cache = new Map()

module.exports = util => ({
  api: ({run}) => ({
    async 'get /cache/api/*' (req, res) {
      const apiPath = req.params[0]
      const cacheKey = `${req.method}:${apiPath}:${JSON.stringify(req.query)}`
      
      // 检查缓存
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          res.set('X-Cache', 'HIT')
          return res.json(cached.data)
        }
      }
      
      // 缓存未命中，调用外部 API
      const cmd = `curl 'https://api.external.com/${apiPath}?${new URLSearchParams(req.query)}'`
      
      run.curl({req, res, cmd}).then(result => {
        const data = JSON.parse(result.body)
        
        // 存储到缓存
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        
        res.set('X-Cache', 'MISS')
        res.json(data)
      }).catch(error => {
        res.status(500).json({ error: '外部服务不可用' })
      })
    }
  })
})
```

---

## 🔍 与 config.fn 的区别

| 特性对比 | config.api 函数模式 | config.fn 模式 |
|---------|-------------------|----------------|
| 🎯 **作用范围** | 仅用于 API 定义 | 全局配置函数 |
| ⚡ **执行时机** | API 请求时执行 | 配置读取时执行 |
| 🛠️ **工具可用性** | 需先读取配置选项 | 工具直接可用 |
| 🔧 **专用工具** | 包含 `run.curl/fetch` | 不包含执行工具 |
| 📊 **数据访问** | 可访问请求数据 | 无请求上下文 |
| 🎭 **使用场景** | 动态 API 逻辑 | 静态配置生成 |

### 💡 选择建议

**使用 config.api 函数模式的场景：**
- 🌐 需要调用外部 API 或命令
- 📊 需要根据请求参数动态生成响应
- 🔄 需要实现复杂的业务逻辑
- 🛡️ 需要访问请求上下文（req/res）

**使用 config.fn 模式的场景：**
- ⚙️ 生成静态配置选项
- 📚 初始化数据和资源
- 🔧 设置全局工具和中间件
- 🎯 环境相关的配置逻辑

---

## 💡 最佳实践与技巧

### 🔒 安全考虑
```javascript
// ✅ 安全的命令构建
function buildSafeCurlCommand(endpoint, data) {
  // 转义特殊字符
  const safeEndpoint = endpoint.replace(/[`$"\\]/g, '\\$&')
  const safeData = JSON.stringify(data).replace(/[`$"\\]/g, '\\$&')
  
  return `curl '${safeEndpoint}' -d '${safeData}'`
}

// ❌ 避免直接拼接用户输入
// const cmd = `curl ${userInput}` // 危险！
```

### ⚡ 性能优化
```javascript
// 连接池复用
const agents = new Map()

function getAgent(hostname) {
  if (!agents.has(hostname)) {
    const https = require('https')
    agents.set(hostname, new https.Agent({
      keepAlive: true,
      maxSockets: 10
    }))
  }
  return agents.get(hostname)
}
```

### 🎯 错误处理
```javascript
async function safeApiCall(run, req, res, cmd) {
  try {
    const result = await run.curl({req, res, cmd})
    return JSON.parse(result.body)
  } catch (error) {
    console.error('API 调用失败:', error)
    throw new Error('外部服务暂时不可用')
  }
}
```

---

## 🎉 总结

通过 `config.api` 函数模式，你可以：

- 🚀 **调用外部服务** - 使用 curl/fetch 集成任何 API
- 🔄 **实现数据转换** - 处理和增强外部数据
- 🛡️ **构建代理服务** - 为外部 API 添加认证和缓存
- 📊 **聚合多个服务** - 组合多个微服务的数据
- 🎭 **创建智能 API** - 根据请求动态调用不同服务

这种模式让 MockM 不仅仅是一个 Mock 工具，更是一个强大的 **API 编排和集成平台**！

> 🎯 **进阶学习**：
> - [完整工具 API 参考](../config/config_fn.md) - 探索更多 util 工具
> - [实战示例集合](../use/example.md) - 查看更多应用场景  
> - [测试用例](https://wll8.github.io/mockm/case/) - 深入了解功能演示
