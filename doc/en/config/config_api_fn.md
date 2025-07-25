# API Function Enhancement Tools - Unlock Advanced Features 🚀

> **When configuration meets functions, API creation transcends imagination!**

When you set `config.api` as a function, MockM passes a powerful `util` toolkit object to your function, giving you superpowers to call external services, generate dynamic data, execute system commands, and more!

---

## 🛠️ Toolkit Overview

### 📦 Input Parameter Structure
```javascript
module.exports = util => {
  // The util object contains these powerful tools:
  const {
    run,        // 🚀 Execution tools - curl/fetch command execution
    libObj,     // 📚 Third-party libraries - mockjs/axios/mime etc.
    toolObj,    // 🔨 Built-in tools - various utility functions
    server,     // 🌐 Server instance - Express app etc.
    // ... more tools
  } = util
  
  return {
    api: {
      // Your super APIs go here!
    }
  }
}
```

---

## 🚀 util.run - External Command Executor

### 🌐 util.run.curl - cURL Command Magic

#### 🎯 Key Features
- ✅ **Seamless Integration** - Execute cURL commands directly in APIs  
- ✅ **Response Binding** - Automatically bind external response headers to your API
- ✅ **Error Handling** - Built-in exception catching and handling mechanisms
- ✅ **Flexible Configuration** - Support for all cURL parameters and options

#### 💡 Practical Examples

**Basic Usage - Weather Query API**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    'get /weather/:city' (req, res) {
      const { city } = req.params
      
      // Call external weather API
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
          error: 'Weather service temporarily unavailable',
          message: error.message
        })
      })
    }
  })
})
```

**Advanced Usage - Proxy Forwarding & Data Processing**
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
          
          // Data processing and enhancement
          const enhancedData = {
            ...data,
            processedBy: 'MockM-Proxy',
            processedAt: new Date().toISOString(),
            originalHeaders: curlResult.headers
          }
          
          res.json(enhancedData)
        } catch (parseError) {
          res.status(502).json({
            error: 'Upstream service returned invalid format',
            rawResponse: curlResult.body
          })
        }
      })
    }
  })
})
```

#### 🎭 Use Cases
- 🌐 **API Aggregation** - Call multiple external services and combine returned data
- 🔄 **Data Transformation** - Fetch external data and perform format conversion
- 🛡️ **Service Proxy** - Add authentication and caching to external APIs
- 📊 **Health Monitoring** - Periodically check external service status

---

### 🌊 util.run.fetch - Modern Request Tool

#### 🎯 Key Features  
- ✅ **Promise Friendly** - Based on node-fetch, supports async/await
- ✅ **Stream Processing** - Supports large files and streaming data
- ✅ **Request Reuse** - Can reuse fetch Promise objects
- ✅ **Response Binding** - Automatically bind response headers to API

#### 💡 Practical Examples

**Basic Usage - IP Geolocation Query**
```javascript
module.exports = util => ({
  api: ({run}) => ({
    async 'get /ip/location/:ip' (req, res) {
      const clientIp = req.params.ip || req.ip
      
      // Use fetch to get IP information
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
          error: 'IP lookup service unavailable',
          message: error.message
        })
      })
    }
  })
})
```

**Advanced Usage - File Download & Processing**
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
        
        // Set correct response headers
        res.set({
          'Content-Type': response.headers.get('content-type'),
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
          'X-Image-Source': 'Picsum',
          'X-Image-ID': imageId
        })
        
        res.send(imageBuffer)
      }).catch(error => {
        res.status(404).json({
          success: false,
          error: 'Failed to fetch image',
          imageId: imageId,
          message: error.message
        })
      })
    }
  })
})
```

#### 🎭 Use Cases
- 🖼️ **Image Proxy** - Fetch and process external image resources
- 📄 **Document Retrieval** - Download and convert external documents
- 🔗 **Link Preview** - Fetch webpage metadata to generate previews
- 📊 **Data Collection** - Periodically fetch external data for analysis

---

## 🚀 Advanced Application Scenarios

### 🎯 Microservice Aggregator
```javascript
module.exports = util => ({
  api: ({run}) => ({
    async 'get /dashboard/:userId' (req, res) {
      const { userId } = req.params
      
      // Parallel calls to multiple microservices
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
      
      // Combine response
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

### 🔄 Smart Cache Proxy
```javascript
const cache = new Map()

module.exports = util => ({
  api: ({run}) => ({
    async 'get /cache/api/*' (req, res) {
      const apiPath = req.params[0]
      const cacheKey = `${req.method}:${apiPath}:${JSON.stringify(req.query)}`
      
      // Check cache
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < 300000) { // 5 minute cache
          res.set('X-Cache', 'HIT')
          return res.json(cached.data)
        }
      }
      
      // Cache miss, call external API
      const cmd = `curl 'https://api.external.com/${apiPath}?${new URLSearchParams(req.query)}'`
      
      run.curl({req, res, cmd}).then(result => {
        const data = JSON.parse(result.body)
        
        // Store in cache
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        
        res.set('X-Cache', 'MISS')
        res.json(data)
      }).catch(error => {
        res.status(500).json({ error: 'External service unavailable' })
      })
    }
  })
})
```

---

## 🔍 Differences from config.fn

| Feature Comparison | config.api Function Mode | config.fn Mode |
|-------------------|-------------------------|----------------|
| 🎯 **Scope** | API definition only | Global configuration function |
| ⚡ **Execution Timing** | Executes on API request | Executes on configuration load |
| 🛠️ **Tool Availability** | Must read config options first | Tools directly available |
| 🔧 **Specialized Tools** | Includes `run.curl/fetch` | No execution tools |
| 📊 **Data Access** | Can access request data | No request context |
| 🎭 **Use Cases** | Dynamic API logic | Static configuration generation |

### 💡 Selection Guidelines

**Use config.api function mode when:**
- 🌐 Need to call external APIs or commands
- 📊 Need to dynamically generate responses based on request parameters
- 🔄 Need to implement complex business logic
- 🛡️ Need access to request context (req/res)

**Use config.fn mode when:**
- ⚙️ Generating static configuration options
- 📚 Initializing data and resources
- 🔧 Setting up global tools and middleware
- 🎯 Environment-related configuration logic

---

## 💡 Best Practices & Tips

### 🔒 Security Considerations
```javascript
// ✅ Safe command building
function buildSafeCurlCommand(endpoint, data) {
  // Escape special characters
  const safeEndpoint = endpoint.replace(/[`$"\\]/g, '\\$&')
  const safeData = JSON.stringify(data).replace(/[`$"\\]/g, '\\$&')
  
  return `curl '${safeEndpoint}' -d '${safeData}'`
}

// ❌ Avoid direct concatenation of user input
// const cmd = `curl ${userInput}` // Dangerous!
```

### ⚡ Performance Optimization
```javascript
// Connection pool reuse
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

### 🎯 Error Handling
```javascript
async function safeApiCall(run, req, res, cmd) {
  try {
    const result = await run.curl({req, res, cmd})
    return JSON.parse(result.body)
  } catch (error) {
    console.error('API call failed:', error)
    throw new Error('External service temporarily unavailable')
  }
}
```

---

## 🎉 Summary

Through `config.api` function mode, you can:

- 🚀 **Call External Services** - Use curl/fetch to integrate any API
- 🔄 **Implement Data Transformation** - Process and enhance external data
- 🛡️ **Build Proxy Services** - Add authentication and caching to external APIs
- 📊 **Aggregate Multiple Services** - Combine data from multiple microservices
- 🎭 **Create Smart APIs** - Dynamically call different services based on requests

This mode makes MockM not just a Mock tool, but a powerful **API orchestration and integration platform**!

> 🎯 **Advanced Learning**:
> - [Complete Tool API Reference](../config/config_fn.md) - Explore more util tools
> - [Practical Example Collection](../use/example.md) - See more use cases  
> - [Test Cases](https://wll8.github.io/mockm/case/) - Deep dive into feature demonstrations
