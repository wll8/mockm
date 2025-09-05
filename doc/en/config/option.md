# Configuration Options

## config.disable
Type: `boolean`  
Default: `false`

🚀 **One-click Production Mode Switch** - Quickly disable all custom APIs and let requests go directly to real servers

Want to test the real backend immediately? No need to delete code, just toggle with one click:

```javascript
module.exports = {
  disable: true  // All custom APIs instantly disabled
}
```

**Use Cases:**
- 🧪 **Comparison Testing**: Quickly switch between Mock and real data
- 🚀 **Pre-launch Verification**: Ensure real interfaces work properly  
- 🔄 **Progressive Development**: Gradually switch as partial interfaces are completed

::: details 💡 Pro Tip: How to disable individual interfaces
No configuration needed, flexible options:
- **Path Method** - Modify path to prevent interface matching: `/api/user` → `/api/user-disabled`
- **Comment Method** - Simply comment out interface definitions
- **Conditional Logic** - Dynamically enable based on environment variables:
  ```javascript
  api: {
    ...(process.env.NODE_ENV !== 'production' && {
      '/api/test': { msg: 'development only' }
    })
  }
  ```
:::

## config.osIp
Type: `string`  
Default: First IPv4 address of local network interface

🌐 **Smart IP Binding** - Automatically adapt debug links to specified IP, supporting intranet penetration and remote access

When your service runs in special environments (like Docker, intranet penetration, cloud servers), automatically adjust the IP address of debug links:

```javascript
module.exports = {
  osIp: '192.168.1.100'  // Bind to intranet IP
}
```

**Magic Effect:**
```bash
# 🔧 Debug link before configuration
x-test-api: http://127.0.0.1:9005/#/history,get/api/users

# ✨ Debug link after configuration  
x-test-api: http://192.168.1.100:9005/#/history,get/api/users
```

**Practical Scenarios:**
- 🏠 **Intranet Development** - Let colleagues access your Mock service via intranet IP
- ☁️ **Cloud Deployment** - Automatically adapt to public IP when deployed on servers
- 🔗 **Intranet Penetration** - Work with tools like ngrok for external access
- 📱 **Mobile Debugging** - Phone connects to computer's service via WiFi

::: details 🌟 Advanced Usage: Dynamic IP Acquisition
```javascript
const os = require('os')

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (let name in interfaces) {
    for (let iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

module.exports = {
  osIp: getLocalIP()  // Automatically get local intranet IP
}
```
::: 

## config.port
Type: `number | string`  
Default: `9000`

🚪 **Main Service Entry** - Core port for API calls, the gateway for frontend requests

This is the port where your Mock server provides services externally, all API requests go through here:

```javascript
module.exports = {
  port: 8080  // Use familiar port number
}
```

**Port Selection Recommendations:**
- `3000` - React developers' favorite
- `8080` - Java developers' habit
- `9000` - MockM's default choice (avoids conflicts)
- `80` - Production standard (requires administrator privileges)

## config.testPort
Type: `number | string`  
Default: `9005`

🎛️ **Debug Console** - Dedicated port for visual management interface

This is your Mock server management backend, providing powerful visualization features:

```javascript
module.exports = {
  testPort: 3001  // Separate from main port
}
```

**Feature Highlights:**
- 📊 **API Overview** - View call statistics for all interfaces
- 🔍 **Request History** - Detailed record of every API call
- ✏️ **Online Editing** - Directly modify interface return data
- 🔄 **Replay Testing** - One-click reproduction of historical requests
- 📋 **Interface Documentation** - Auto-generated API documentation

**Access URL:** `http://localhost:3001`

::: tip 💡 Best Practice
Recommend setting test port as main port +5 for easy memory:
- Main service: `port: 9000` → Test console: `testPort: 9005`
- Main service: `port: 8080` → Test console: `testPort: 8085`
:::

## config.replayPort
Type: `number | string`  
Default: `9001`

⏪ **Time Travel Port** - Request replay service based on historical data

This is a magical port that allows your application to "travel through time," using previously recorded real request-response data:

```javascript
module.exports = {
  replayPort: 8001
}
```

**How It Works:**
1. 📝 **Recording Phase** - MockM automatically records while proxying requests through main port
2. 💾 **Data Storage** - Save requests and responses to local files
3. ⏪ **Replay Service** - Provide historical data through replay port

**Use Cases:**
- 🚀 **Offline Development** - Get real data even in disconnected environments
- 🧪 **Stable Testing** - Use fixed data for repeatable tests
- 🔄 **Data Rollback** - Reproduce interface state at specific time points
- 📊 **Performance Comparison** - Compare interface responses across different versions

**Switching Method:**
```javascript
// Use real interface during development
const apiBase = 'http://localhost:9000'

// Use historical data during testing  
const apiBase = 'http://localhost:8001'
```

## config.replayProxy
Type: `boolean`  
Default: `true`

🔄 **Smart Fallback Mechanism** - Whether to automatically forward to real server when historical records are not found

```javascript
module.exports = {
  replayProxy: true   // Enable smart fallback (recommended)
  // replayProxy: false  // Strict mode, only return historical data
}
```

**Mode Comparison:**

| Mode | Historical Data Found | Historical Data Not Found |
|------|----------------------|---------------------------|
| `true` | ✅ Return historical data | 🔄 Forward to real server |
| `false` | ✅ Return historical data | ❌ Return 404 or empty data |

**Selection Recommendations:**
- 🌟 **Development Phase** - Use `true`, ensure interfaces are always available
- 🧪 **Testing Phase** - Use `false`, ensure data consistency
- 📱 **Demo Environment** - Use `true`, handle various unexpected situations

## config.replayProxyFind
Type: `function`  
Default: See code below

🎯 **Smart Request Matching** - Customize how to find the best historical record during replay

When multiple historical records match the same request, this function determines which one to use:

```javascript
// Default implementation: Prioritize records with status code 200
module.exports = {
  replayProxyFind(item) {
    const bodyPath = item.data.res.bodyPath
    if (bodyPath && bodyPath.match(/\.json$/)) {
      const bodyPathCwd = require('path').join(process.cwd(), bodyPath)
      const body = require(bodyPathCwd)
      return body.status === 200 || body.status === '200'
    }
    return false
  }
}
```

**Parameter Description:**
- `item` - Historical record item containing complete request-response data
- `item.data.res.bodyPath` - Response body file path
- Return `true` to select this record

**Custom Matching Strategies:**

```javascript
module.exports = {
  // 💡 Strategy 1: Select the latest record
  replayProxyFind: (item) => {
    return item.timestamp > Date.now() - 3600000  // Records within 1 hour
  },

  // 💡 Strategy 2: Select based on response size
  replayProxyFind: (item) => {
    const bodySize = item.data.res.contentLength || 0
    return bodySize > 100  // Select responses with rich content
  },

  // 💡 Strategy 3: Match based on request parameters
  replayProxyFind: (item) => {
    const hasUserId = item.data.req.url.includes('userId=')
    return hasUserId  // Prioritize records containing user ID
  }
}
```

**Advanced Example: Multi-condition Judgment**
```javascript
module.exports = {
  replayProxyFind(item) {
    const res = item.data.res
    const req = item.data.req
    
    // Priority 1: Success status code
    if (res.statusCode === 200) return true
    
    // Priority 2: Recent records
    if (Date.now() - item.timestamp < 300000) return true  // Within 5 minutes
    
    // Priority 3: Records from specific environment
    if (req.headers['x-env'] === 'production') return true
    
    return false
  }
}
```

@[code transcludeWith=snippet-replayProxyFind](@/../server/config.js)

## config.hostMode

::: details ⚠️ Experimental Support 
**Must-read precautions before enabling:**

🚨 **Port Limitations**  
- `port` configuration will be ignored, automatically consistent with target server port
- hosts file doesn't support port mapping (like `127.0.0.1:9000 api.com:8080`)

💥 **Abnormal Exit Risk**  
- Program abnormal exit may fail to restore hosts file
- May cause inability to access real domain names, requires manual cleanup

🎯 **Domain Limitations**  
- Only supports domain proxy, not IP addresses
- Because IP requests don't go through hosts file resolution

🔄 **Feature Limitations**  
- Forwarding functionality in proxy will be disabled
- Avoid circular references (pointing to itself)

**Safe Operation Recommendations:**
```bash
# Backup hosts file before starting
cp /etc/hosts /etc/hosts.backup

# Windows users
copy C:\Windows\System32\drivers\etc\hosts hosts.backup
```
:::

Type: `boolean`  
Default: `false`

🎭 **Zero-intrusion Code Mode** - Achieve completely transparent request interception by modifying the hosts file

This is a "black magic" level feature that allows your code to enjoy Mock services without any modifications:

```javascript
module.exports = {
  hostMode: true,
  proxy: {
    '/': 'https://api.example.com'  // Must be a domain name
  }
}
```

**How It Works:**
1. 🔧 Automatically modify system hosts file: `127.0.0.1 api.example.com`
2. 🌐 Your code continues to access: `https://api.example.com/users`
3. ✨ Requests are automatically intercepted and handled by MockM

**Perfect Scenarios:**
- 📱 **App Development** - No need to modify client code
- 🧪 **Third-party Integration Testing** - Intercept external API calls
- 🔒 **Production Environment Debugging** - Temporarily replace online interfaces
- 🚀 **Microservice Development** - Mock other services

## config.updateToken
Type: `boolean | string | string[] | object`  
Default: `true`

🔑 **Smart Token Passing** - Automatically extract authentication information from real requests for subsequent debugging and replay

Solve the hassle of debugging interfaces after login, automatically sync authentication state:

```javascript
module.exports = {
  updateToken: true  // Auto-sync Authorization header
}
```

**Configuration Type Comparison:**

| Config Type | Example | Effect |
|-------------|---------|--------|
| `boolean` | `false` | 🚫 Don't use token sync |
| `boolean` | `true` | ✅ Auto-sync `Authorization` |
| `string` | `'auth'` | ✅ Sync specified header: `auth` |
| `string[]` | `['auth', 'token']` | ✅ Sync multiple headers |
| `object` | See below | ✅ Custom mapping rules |

```javascript
module.exports = {
  updateToken: {
    // 🔄 Direct mapping: pass as-is
    'req.headers.authorization': 'req.headers.authorization',
    
    // 🔄 Field rename: auth -> token  
    'req.headers.auth': 'req.headers.token',
    
    // 🎯 Dynamic generation: set value based on last request
    'req.headers.user-id': ({req, value}) => {
      // value is the value from the last request
      const userId = extractUserIdFromToken(value)
      return ['req.headers.user-id', userId]
    },
    
    // 🔐 Complex logic: handle based on environment and user
    'req.headers.env-token': ({req, value}) => {
      const env = process.env.NODE_ENV
      const token = env === 'dev' ? 'dev-token' : value
      return ['req.headers.env-token', token]
    }
  }
}
```

**Practical Application Scenarios:**

```javascript
// Scenario 1: WeChat Mini Program Development
module.exports = {
  updateToken: {
    'req.headers.authorization': 'req.headers.authorization',
    'req.headers.session-key': 'req.headers.session-key',
    'req.headers.openid': 'req.headers.openid'
  }
}

// Scenario 2: JWT Token + User ID
module.exports = {
  updateToken: {
    'req.headers.authorization': ({req, value}) => {
      // Parse user ID from JWT
      const payload = JSON.parse(atob(value.split('.')[1]))
      return ['req.headers.user-id', payload.userId]
    }
  }
}

// Scenario 3: Multi-tenant System
module.exports = {
  updateToken: ['authorization', 'tenant-id', 'org-id']
}
```

::: tip 💡 Usage Tips
**Workflow:**
1. 🔐 User logs in through real interface to get token
2. 📝 MockM automatically records authentication info
3. 🎯 Subsequent debugging/replay automatically carries authentication info
4. ✨ No need to manually copy-paste tokens

**Best Practices:**
- Use `true` during development for simplicity
- Use detailed configuration in production for security
- Regularly clean up expired authentication info
:::

## config.apiInHeader
Type: `boolean | string`  
Default: `true`

🔗 **Debug Link Injection** - Automatically add test page address in response headers, one-click access to debug interface

After each API call, automatically inject debug link in response headers, click to view detailed information:

```javascript
module.exports = {
  apiInHeader: true        // Use default header: x-test-api
  // apiInHeader: 'debug-url'  // Custom header name
  // apiInHeader: false       // Disable this feature
}
```

**Effect Demo:**
```bash
# Make request
curl http://localhost:9000/api/users

# Response headers will contain
x-test-api: http://localhost:9005/#/history,get/api/users
```

**Clicking the link shows:**
- 📋 Complete request parameters
- 📊 Response data and status codes
- ⏱️ Request timing statistics
- 🔄 One-click replay functionality
- 📝 Historical call records

**Custom header name:**
```javascript
module.exports = {
  apiInHeader: 'my-debug-link'  // Custom name
}
```

**Using in browser:**
```javascript
// Frontend code can read debug links
fetch('/api/users')
  .then(response => {
    const debugUrl = response.headers.get('x-test-api')
    console.log('🔧 Debug link:', debugUrl)
    // Auto-open debug page in development
    if (process.env.NODE_ENV === 'development') {
      window.open(debugUrl)
    }
  })
```

- false: don't add debug address
- true: use `x-test-api`
- string: custom header field

## config.proxy
Type: `string | object`  
Default: `http://www.httpbin.org/`

🌉 **Proxy Bridge** - MockM's core functionality, intelligent proxy connecting frontend and backend

This is the magic tool for solving CORS issues and intercepting/modifying requests, supporting all scenarios from simple forwarding to complex interception.

> 💡 **Tip**: Search for `config.proxy` in [test cases](https://wll8.github.io/mockm/case/) to see more feature demos

### 🚀 Basic Usage

**String form: One-click proxy**
```javascript
module.exports = {
  proxy: 'https://api.github.com'  // Forward all requests to GitHub API
}
```

**Object form: Fine control**  
```javascript
module.exports = {
  proxy: {
    '/': 'https://api.github.com',        // Default proxy target
    '/api/v1': 'https://api.example.com', // Specific path proxy
    '/upload': 'https://upload.cdn.com'   // File upload separate proxy
  }
}
```

### ⚡ Quick Response Data Modification

Use array syntax `[A, B]` to easily modify JSON responses without complex middleware:

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // 🎯 Directly replace entire response
    '/api/simple': [{ success: true, message: 'Modified successfully' }],
    
    // 🔧 Modify specific fields in response
    '/api/user': ['data.name', 'John Doe'],
    '/api/status': ['status', 'success'],
    
    // 🧩 Shallow merge object (replace fields)
    '/api/merge': [{ newField: 'added', status: 'updated' }, '...'],
    
    // 🔄 Deep merge object (preserve existing fields)
    '/api/deep': [{ extra: { info: 'new' } }, 'deep']
  }
}
```

**Modification Methods Comparison:**

| Array Length | [A, B] Type | Processing | Input Example | Operation | Output Example |
|--------------|-------------|------------|---------------|-----------|----------------|
| 0-1 | `[any]` | 🔄 Direct replace | `{a: 1}` | `[123]` | `123` |
| 2 | `[string, any]` | 🎯 Path replace | `{a: 1}` | `['a', 2]` | `{a: 2}` |
| 2 | `[object, '...']` | 🧩 Shallow merge | `{a: {x: 1}, b: 2}` | `[{a: {y: 2}}, '...']` | `{a: {y: 2}, b: 2}` |
| 2 | `[object, 'deep']` | 🔄 Deep merge | `{a: {x: 1}, b: 2}` | `[{a: {y: 2}}, 'deep']` | `{a: {x: 1, y: 2}, b: 2}` |

### 🎯 Advanced Interception and Modification

**Using functions for complex processing:**
```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // 📊 Data statistics and formatting
    '/api/stats': [({req, json}) => {
      return {
        ...json,
        timestamp: Date.now(),
        userAgent: req.headers['user-agent'],
        processed: true
      }
    }],
    
    // 🔐 Filter data based on user permissions
    '/api/sensitive': [({req, json}) => {
      const isAdmin = req.headers.role === 'admin'
      if (isAdmin) return json
      
      // Remove sensitive info for regular users
      delete json.secretData
      return json
    }],
    
    // 🌍 Internationalization handling
    '/api/i18n': [({req, json}) => {
      const lang = req.headers['accept-language'] || 'zh-CN'
      return {
        ...json,
        message: lang.includes('en') ? 'Hello' : '你好'
      }
    }]
  }
}
```

### 🛠️ Middleware-style Interception

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // ⏱️ Add delay to simulate slow network
    '/api/slow': {
      target: 'https://api.example.com',
      mid(req, res, next) {
        setTimeout(next, 2000)  // 2 second delay
      }
    },
    
    // 🔒 Pre-request permission verification
    '/api/protected': {
      target: 'https://api.example.com',  
      mid(req, res, next) {
        if (!req.headers.authorization) {
          return res.status(401).json({ error: 'Login required' })
        }
        next()
      }
    },
    
    // 📝 Request and response logging
    '/api/logged': {
      target: 'https://api.example.com',
      mid(req, res, next) {
        console.log(`🚀 Request: ${req.method} ${req.url}`)
        next()
      },
      res(req, res, data) {
        console.log(`✅ Response: ${res.statusCode}`)
        return data
      }
    }
  }
}
```

### 🌍 Path Routing: Precise Forwarding

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',          // Default proxy
    '/api/v1': 'https://v1.api.com',        // API v1 version
    '/api/v2': 'https://v2.api.com',        // API v2 version  
    '/upload': 'https://cdn.upload.com',     // File upload service
    '/payment': 'https://pay.gateway.com'   // Payment gateway
  }
}
```

**Practical Application Scenarios:**
- 🏗️ **Microservice Architecture** - Different paths correspond to different services
- 🔄 **Version Management** - Support multiple API versions simultaneously
- ⚡ **Load Balancing** - Distribute requests by business modules
- 🧪 **A/B Testing** - Route partial traffic to test environment

::: tip 🚀 Performance Optimization Tips

**Reference Configuration:** 
Similar to webpack's `devServer.proxy`, implemented based on [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#http-proxy-options)
:::

---

::: details 🎯 Data Processing Practical Training
Master these practical skills to make data operations smooth as silk!

**🗑️ Direct Clear - One-click Reset**

```javascript
// 📥 Original data
{
  "userInfo": { "name": "John Doe", "age": 25 }
}

// 🔧 Operation: Completely clear response
[] or [undefined]

// 📤 Processing result
undefined  // Interface returns empty response
```

**🔄 Complete Replacement - Brand New**

```javascript
// 📥 Original data  
{
  "status": "pending"
}

// 🔧 Operation: Return new status code
[200]

// 📤 Processing result
200  // Directly return number status
```

**🎯 Precise Modification - Targeted Update**

```javascript
// 📥 Original data
{
  "user": {
    "name": "John Doe",
    "status": "offline"  
  }
}

// 🔧 Operation: Only modify user status
['user.status', 'online']

// 📤 Processing result
{
  "user": {
    "name": "John Doe",
    "status": "online"  // ✨ Only this changed
  }
}
```

**🗑️ Selective Deletion - Precise Removal**

```javascript
// 📥 Original data
{
  "profile": {
    "name": "Jane Smith",
    "password": "secret123",  // Sensitive info
    "email": "test@example.com"
  }
}

// 🔧 Operation: Remove sensitive field
['profile.password', undefined]

// 📤 Processing result
{
  "profile": {
    "name": "Jane Smith",
    "email": "test@example.com"  // password field removed
  }
}
```

**🤝 Shallow Merge - Direct Object Replacement**

```javascript
// 📥 Original data
{
  "userSettings": {
    "theme": "dark",
    "language": "zh-CN"
  },
  "version": "1.0"
}

// 🔧 Operation: Replace entire settings object
[
  {
    "userSettings": {
      "theme": "light"  // New settings completely replace old ones
    },
    "version": "2.0"
  },
  "..."  // Shallow merge marker
]

// 📤 Processing result
{
  "userSettings": {
    "theme": "light"  // ⚠️ language is lost
  },
  "version": "2.0"
}
```

**🔗 Deep Merge - Smart Fusion**

```javascript
// 📥 Original data
{
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 14
    }
  }
}

// 🔧 Operation: Deep merge configuration
[
  {
    "config": {
      "ui": {
        "theme": "light"  // Only update theme
      },
      "api": {
        "timeout": 5000   // Add new API config  
      }
    }
  },
  "deep"  // Deep merge marker
]

// 📤 Processing result
{
  "config": {
    "ui": {
      "theme": "light",  // ✨ Theme updated
      "fontSize": 14     // ✅ Font size preserved
    },
    "api": {
      "timeout": 5000    // 🆕 New configuration added
    }
  }
}
```
:::

## config.remote

::: details ⚠️ Experimental Support & Free Service Reminder

MockM uses ngrok's free service to provide intranet penetration, which means enjoying convenience while understanding some limitations:

**💫 Random Domain**
- Get different `xxx.ngrok.io` domain each startup
- Cannot fix domain (registered users can configure fixed subdomains)

**⏱️ Time Limit**  
- Single connection has duration limit
- Need to restart service after timeout

**🚦 Traffic Limit**
- Limited requests per minute
- Suitable for development/testing, not production

**🐌 Network Latency**
- Free nodes are relatively slow
- Domestic access may have network fluctuations

**🆙 Forced Updates**
- ngrok may require updating to latest version
- Update failure will cause service startup failure

---

**🚨 Version Compatibility Notice**

If you're using a version before `v1.1.25-alpha.15`, you might encounter startup failures due to ngrok forced updates.

**Solutions:**

**Solution 1: Upgrade MockM (Recommended)**
```bash
npm update -g mockm  # Upgrade to latest version
```

**Solution 2: Manually Update ngrok**
```bash
# Navigate to MockM installation directory
cd node_modules/mockm
npx ngrok update
```

Registering an ngrok account and configuring authtoken can unlock more benefits, see `config.remoteToken` configuration.

:::

Type: `boolean`  
Default: `false`

🌍 **Intranet Penetration Black Technology** - One-click enable external access, instantly give your local Mock service global reach!

Want remote colleagues, mobile devices, or even overseas users to access your local Mock service? Just one line of configuration:

```javascript
module.exports = {
  remote: true  // ✨ Magic activated! Local service becomes global interface
}
```

**🔥 Application Scenarios:**
- 📱 **Mobile Debugging** - iPhone, Android test interfaces anytime, anywhere
- 👥 **Remote Collaboration** - Remote colleagues directly access your Mock data
- 🌐 **Cross-platform Testing** - WeChat Mini Programs, H5 apps seamlessly connect
- 🧪 **Demo Tool** - Client demos without complex environment setup

## config.remoteToken
Type: `string | string[]`  
Default: `[]`

🔑 **ngrok Authentication Token** - Use registered account's authtoken to unlock more features

Free users can only open 1 tunnel, registered users get more benefits:

```javascript
module.exports = {
  remote: true,
  remoteToken: 'your_ngrok_authtoken_here'
}
```

**Multi-port Configuration:**
```javascript
module.exports = {
  remoteToken: [
    'token_for_main_port',    // Main service port (port)
    'token_for_test_port',    // Test port (testPort)  
    'token_for_replay_port'   // Replay port (replayPort)
  ]
}
```

**If your token supports 3 tunnels:**
```javascript
module.exports = {
  remoteToken: ['your_token', 'your_token', 'your_token']
}
```

**Steps to Get Token:**
1. 🌐 Visit [ngrok.com](https://ngrok.com) to register a free account
2. 🔑 Get authtoken from console
3. ⚙️ Configure in MockM to enjoy more stable service

**Registered User Benefits:**
- 🔗 **Fixed Domain** - Configure fixed subdomains
- ⏱️ **Longer Duration** - More relaxed connection time limits
- 🚀 **Higher Speed** - Better network quality
- 📊 **Statistics Panel** - View traffic and connection statistics

## config.openApi
Type: `string | array | object`  
Default: `http://httpbin.org/spec.json`

📋 **Smart Documentation Integration** - Automatically match OpenAPI/Swagger docs for professional API debugging

Perfectly combine your Mock service with OpenAPI documentation for professional-grade API debugging experience:

```javascript
module.exports = {
  openApi: 'https://petstore.swagger.io/v2/swagger.json'
}
```

**Configuration Overview:**

| Type | Configuration Example | Use Case |
|------|----------------------|----------|
| `string` | `'http://api.com/spec.json'` | 🎯 Single API documentation |
| `array` | `['doc1.json', 'doc2.json']` | 🔄 Multi-doc smart matching |
| `object` | `{'/api/v1': 'v1.json'}` | 🎨 Precise path matching |

**Advanced Configuration: Multi-service Management**
```javascript
module.exports = {
  openApi: {
    '/api/user': 'https://user-service.com/swagger.json',
    '/api/order': 'https://order-service.com/swagger.json',
    '/api/payment': 'https://payment.com/openapi.json'
  }
}
```

**Authentication Support:**
```javascript
module.exports = {
  // 🔐 Basic Auth authentication
  openApi: 'http://username:password@api.com/spec.json'
}
```

**Smart Matching Rules:**
- 📊 **Array Mode** - Automatically select documentation with highest match
- 🎯 **Object Mode** - Precise matching based on regex: `new RegExp(key, 'i').test(pathname)`
- 📂 **Priority** - Deeper directory paths have higher matching priority

**Practical Application Scenarios:**
```javascript
// 🏢 Enterprise microservice architecture
module.exports = {
  openApi: {
    '/api/user-service': 'http://user.internal/swagger.json',
    '/api/order-service': 'http://order.internal/swagger.json',
    '/api/notification': 'http://notify.internal/openapi.json'
  }
}

// 📱 Mobile + Web separation
module.exports = {
  openApi: {
    '/mobile/api': 'https://mobile-api.com/swagger.json',
    '/web/api': 'https://web-api.com/swagger.json'
  }
}
```

**Capabilities You Get:**
- 📋 **Auto Documentation** - Complete interface docs based on OpenAPI specs
- 🧪 **Parameter Validation** - Automatically validate request parameter formats
- 🎨 **UI Debugging** - Built-in Swagger UI style debug interface
- 🔄 **Smart Matching** - Automatically select corresponding docs based on request path

## config.cors
Type: `boolean`  
Default: `true`

🌍 **Cross-origin Free Pass** - One-click solution to the most troublesome CORS issues in frontend development

```javascript
module.exports = {
  cors: true   // ✅ Automatically handle all cross-origin requests (recommended)
  // cors: false  // ❌ Keep browser default CORS policy
}
```

**How It Works:** 
Automatically add necessary CORS headers to all responses:
```bash
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

**Use Cases:**
- 🎯 **Development Debugging** - Frontend directly calls APIs from any domain
- 🧪 **Local Testing** - No need to configure complex proxy rules
- 📱 **Cross-platform Development** - Web and mobile share the same Mock service

**When to Disable:**
- 🔒 Need to test real cross-origin restrictions
- 🧪 Simulate production environment security policies
- 🔐 Special enterprise security requirements

## config.dataDir
Type: `string`  
Default: `${os.homedir()}/.mockm/${configPathByName}/httpData/`

📁 **Data Warehouse** - Dedicated storage space for HTTP request records and cache data

```javascript
module.exports = {
  dataDir: './my-api-data'  // Custom data directory
}
```

**Directory Structure Preview:**
```
httpData/
├── db.json              # RestAPI database file
├── httpHistory.json     # Request history records  
├── apiWeb.json         # Web UI created interfaces
├── store.json          # User configuration storage
└── request/            # Detailed request-response data
    ├── req-123.json    # Request details
    └── res-123.json    # Response details
```

**Custom Path Examples:**
```javascript
// 🏠 Project internal directory
dataDir: './mock-data'

// 📂 Absolute path
dataDir: '/Users/username/mock-storage'

// 💼 Enterprise configuration
dataDir: `/data/mockm/${process.env.PROJECT_NAME}`
```

## config.dbJsonPath
Type: `string`  
Default: `${config.dataDir}/db.json`

🗄️ **Database File Path** - Persistent storage location for RestAPI data

```javascript
module.exports = {
  dbJsonPath: './database/api-data.json'
}
```

This file stores all RestAPI data generated through `config.db`, supporting full CRUD operations.

## config.dbCover
Type: `boolean`  
Default: `false`

🔄 **Data Reload Strategy** - Control how to handle existing data when service restarts

```javascript
module.exports = {
  dbCover: false  // ✅ Keep existing data, only supplement new data (recommended)
  // dbCover: true   // 🔄 Completely regenerate, discard user data
}
```

**Mode Comparison:**

| Mode | Existing Data | New Data | User Changes | Use Case |
|------|---------------|----------|--------------|----------|
| `false` | ✅ Keep | ✅ Supplement | ✅ Keep | 🏃‍♂️ Development debugging |
| `true` | ❌ Clear | ✅ Rebuild | ❌ Lost | 🧪 Test reset |

::: warning 💡 Common Issue Solutions

**Q: Modified deep properties in `config.db` but they don't take effect?**

A: This is because object data already exists, MockM won't overwrite existing data.

**Solutions:**
```bash
# Method 1: Delete specific objects (recommended)
# Manually edit db.json, delete objects to update

# Method 2: Complete rebuild (data will be lost)
# Set dbCover: true or delete entire db.json

# Method 3: Use different data keys
# Change books to books2, force regeneration
```
:::

## config.db
Type: `object | function`  
Default: `{}`

🎭 **Data Magician** - Powerful RestAPI data generator based on json-server

One configuration, instantly get complete RestAPI service with all CRUD, pagination, search, sorting features!

### 🚀 Quick Start

**Static Data:**
```javascript
module.exports = {
  db: {
    users: [
      { id: 1, name: 'John Doe', age: 25 },
      { id: 2, name: 'Jane Smith', age: 30 }
    ],
    posts: [
      { id: 1, title: 'First Article', userId: 1 },
      { id: 2, title: 'Second Article', userId: 2 }
    ]
  }
}
```

**Dynamic Data:**
```javascript
module.exports = util => ({
  db: {
    // 📊 Generate random data using MockJS
    products: util.libObj.mockjs.mock({
      'data|50-100': [{
        'id|+1': 1,
        name: '@ctitle(5,10)',
        price: '@integer(100,9999)',
        'category|1': ['Electronics', 'Clothing', 'Food', 'Books'],
        description: '@cparagraph(1,3)',
        image: '@image("200x200")',
        createdAt: '@datetime',
        'status|1': ['active', 'inactive']
      }]
    }).data
  }
})
```

### 🎯 Auto-generated API Endpoints

After configuring the `products` data above, automatically get:

**Basic CRUD:**
```bash
GET    /products     # Get all products
POST   /products     # Create new product
GET    /products/1   # Get specific product  
PUT    /products/1   # Complete update product
PATCH  /products/1   # Partial update product
DELETE /products/1   # Delete product
```

**Advanced Queries:**
```bash
# 🔍 Field filtering
GET /products?category=Electronics&status=active

# 🔍 Multi-value query
GET /products?id=1&id=2&id=3

# 🔍 Deep query
GET /products?user.profile.age=25

# 📄 Pagination query
GET /products?_page=2&_limit=10

# 📊 Sorting
GET /products?_sort=price&_order=desc
GET /products?_sort=name,price&_order=asc,desc

# 📐 Range query
GET /products?price_gte=100&price_lte=500

# 🔍 Fuzzy search
GET /products?name_like=phone
GET /products?category_like=^Electronics  # Regex support

# 🔍 Full-text search
GET /products?q=apple
```

### 🏗️ Real-world Case: Blog System

```javascript
module.exports = util => ({
  db: util.libObj.mockjs.mock({
    // 📚 Article data
    'posts|20-50': [{
      'id|+1': 1,
      title: '@ctitle(5,15)',
      content: '@cparagraph(5,10)',
      summary: '@cparagraph(1,2)',
      'categoryId|1-5': 1,
      'authorId|1-10': 1,
      'status|1': ['draft', 'published', 'archived'],
      viewCount: '@integer(0,9999)',
      likeCount: '@integer(0,999)',
      createdAt: '@datetime',
      updatedAt: '@datetime',
      tags: '@shuffle(["JavaScript","Vue","React","Node.js","TypeScript"], 1, 3)'
    }],
    
    // 👥 Author data
    'authors|10': [{
      'id|+1': 1,
      name: '@cname',
      email: '@email',
      avatar: '@image("100x100")',
      bio: '@cparagraph(1,2)',
      'role|1': ['admin', 'editor', 'writer']
    }],
    
    // 📂 Category data
    'categories|5': [{
      'id|+1': 1,
      name: '@pick(["Frontend","Backend","Mobile","AI","Design"])',
      description: '@cparagraph(1)',
      color: '@color'
    }]
  })
})
```

**Ready-to-use Endpoints:**
```bash
# 📚 Get published articles
GET /posts?status=published&_sort=createdAt&_order=desc

# 🔍 Search articles containing "JavaScript"
GET /posts?q=JavaScript

# 👤 Get articles by specific author
GET /posts?authorId=1

# 📊 Paginated article list
GET /posts?_page=1&_limit=5&_expand=author&_expand=category
```

### 💡 Professional Tips

**Related Data Queries:**
```bash
# 🔗 Expand related data
GET /posts?_expand=author        # Expand author info
GET /posts?_expand=category      # Expand category info  
GET /authors?_embed=posts        # Embed all posts by author
```

**Custom ID Fields:**
```javascript
// Use uuid as primary key
db: {
  products: Array.from({length: 10}, (_, i) => ({
    uuid: `product-${Date.now()}-${i}`,
    name: `Product ${i+1}`
  }))
}
```

Based on powerful [json-server](https://github.com/typicode/json-server), all changes are saved to data files in real-time, just like a real database!

### 🎯 Complete Data Query Guide

Master these query techniques to make data retrieval smooth as silk!

**📈 Smart Sorting - Ordered Data Presentation**
```http
# 📊 Single field sort: by view count ascending
GET /books?_sort=view&_order=asc

# 🎯 Multi-field sort: first by user, then by view count  
GET /books?_sort=user,view&_order=desc,asc
```

**✂️ Precise Slicing - Get Exactly What You Want**
```http
# 📌 Range slice: get records 3-5
GET /books?_start=2&_end=5

# 📄 Paginated slice: from record 21, take 10 records
GET /books?_start=20&_limit=10
```

**🧮 Conditional Operations - Precise Data Filtering**
```http
# 📊 Range query: view count between 3000-7000
GET /books?view_gte=3000&view_lte=7000

# ❌ Exclusion filter: exclude records with ID 1
GET /books?id_ne=1

# 🔍 Fuzzy match: books with type containing css or js (regex support)
GET /books?type_like=css|js
```

**🔍 Full-text Search - Find All Related Content with One Click**
```http
# 🎯 Global search: find "John Doe" in all fields
GET /books?q=John Doe
```

::: tip 💡 Query Parameters Quick Reference

| Parameter | Function | Example |
|-----------|----------|---------|
| `_sort` | Sort field | `_sort=name,age` |
| `_order` | Sort direction | `_order=asc,desc` |
| `_start` | Start index | `_start=10` |
| `_end` | End index | `_end=20` |
| `_limit` | Limit count | `_limit=5` |
| `_gte` | Greater than or equal | `price_gte=100` |
| `_lte` | Less than or equal | `price_lte=500` |
| `_ne` | Not equal | `status_ne=deleted` |
| `_like` | Fuzzy match | `name_like=^John` |
| `q` | Full-text search | `q=keyword` |

:::

## config.route
Type: `object`  
Default: `{}`

🛣️ **Route Rewriting Magic** - Make API paths flexible, supporting complex path mappings

Want to add prefixes to RestAPI interfaces or reorganize path structure? One configuration does it all:

```javascript
module.exports = {
  route: {
    // 🎯 Add unified prefix
    '/api/v1/*': '/$1',           // /api/v1/books/1 → /books/1
    '/test/db/api/*': '/$1',      // /test/db/api/users → /users
    
    // 🔄 Path remapping
    '/old-api/*': '/new-api/$1',  // Backward compatibility for old API
    '/mobile/*': '/api/$1',       // Mobile-specific paths
    
    // 📱 Multi-version support
    '/v2/users': '/users',        // v2 version maps to default version
    '/legacy/*': '/deprecated/$1' // Legacy interface migration
  }
}
```

**Practical Application Scenarios:**

```javascript
// 🏢 Enterprise API unified management
module.exports = {
  db: {
    users: [...],    // Generates /users endpoint
    orders: [...],   // Generates /orders endpoint
    products: [...] // Generates /products endpoint
  },
  route: {
    // Provide unified API prefix externally
    '/api/v1/*': '/$1',
    
    // Different clients use different prefixes
    '/mobile/api/*': '/$1',
    '/web/api/*': '/$1',
    '/admin/api/*': '/$1',
    
    // Special business module mappings
    '/crm/customers': '/users',
    '/ecommerce/items': '/products'
  }
}
```

**Wildcard Syntax:**
- `*` - Match any characters (excluding `/`)
- `$1, $2, ...` - Reference matched group content

**Based on [json-server routing](https://github.com/typicode/json-server#add-custom-routes)**

## config.apiWeb
Type: `string`  
Default: `./webApi.json`

🎨 **Visual Interface Storage** - Storage location for interface data created through Web UI

Interfaces created through MockM's Web interface are saved in this file:

```javascript
module.exports = {
  apiWeb: './my-web-apis.json'  // Custom storage path
}
```

**Priority Explanation:**
- 🥇 `config.api` - Code-defined interfaces (highest priority)
- 🥈 `config.apiWeb` - Web UI created interfaces
- 🥉 `config.db` - RestAPI auto-generated interfaces

**Use Cases:**
- 👥 **Team Collaboration** - Product managers create interface prototypes through Web UI
- 🎯 **Quick Testing** - Create temporary interfaces without writing code
- 📊 **Data Collection** - Collect interface requirements from frontend developers

## config.apiWebWrap
Type: `boolean | function`  
Default: `wrapApiData`

🎁 **Response Data Wrapper** - Uniformly add data structure to interfaces created by Web UI

The default wrapper function wraps raw data into standard format:

```javascript
// 🔧 Default wrapper function
function wrapApiData({data, code = 200}) {
  code = String(code)
  return {
    code,
    success: Boolean(code.match(/^[2]/)), // 2xx status codes are true
    data,
  }
}
```

**Custom Wrapper:**
```javascript
module.exports = {
  // 🎯 Custom response format
  apiWebWrap: ({data, code = 200}) => ({
    status: code,
    message: code === 200 ? 'Success' : 'Error',
    result: data,
    timestamp: Date.now()
  }),
  
  // 🚫 Disable wrapping (return raw data)
  apiWebWrap: false,
  
  // 📊 Dynamic wrapping based on status code
  apiWebWrap: ({data, code = 200}) => {
    if (code >= 400) {
      return { error: true, message: data, code }
    }
    return { success: true, data, code }
  }
}
```

**Effect Comparison:**
```javascript
// 🎨 Interface return created in Web UI
{ message: 'Hello World' }

// ✨ After default wrapping
{
  code: 200,
  success: true,
  data: { message: 'Hello World' }
}
```

## config.api
Type: `object | function`  
Default: `{}`

🚀 **Custom Interface Core** - MockM's most powerful feature, create API interfaces of any complexity

This is MockM's soul feature, supporting all scenarios from simple data returns to complex business logic!

> 💡 **Tip**: Search for `config.api` in [test cases](https://wll8.github.io/mockm/case/) to see more feature demos

### 🎯 Basic Usage

**Static Data Returns:**
```javascript
module.exports = {
  api: {
    // 🎯 Simple data return (supports all HTTP methods)
    '/api/status': { status: 'ok', message: 'Service normal' },
    
    // 🎯 Specify HTTP method
    'GET /api/users': [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ],
    
    // 🎯 Different methods return different data
    'POST /api/users': { message: 'User created successfully' },
    'DELETE /api/users/:id': { message: 'User deleted successfully' }
  }
}
```

**Functional Interfaces:**

Used for dynamic interface data support.

```javascript
module.exports = {
  api: {
    // 📊 Dynamic data processing
    'GET /api/time': (req, res) => {
      res.json({
        timestamp: Date.now(),
        datetime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    },
    
    // 🔐 Request parameter processing
    'POST /api/login': (req, res) => {
      const { username, password } = req.body
      if (username === 'admin' && password === '123456') {
        res.json({
          success: true,
          token: 'jwt-token-here',
          user: { id: 1, name: 'Admin' }
        })
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        })
      }
    }
  }
}
```

### 🌐 WebSocket Support

Use ws flag to implement WebSocket.

```javascript
module.exports = {
  api: {
    // 💬 WebSocket chat room
    'ws /chat': (ws, req) => {
      console.log('New user connected')
      
      // Welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Welcome to the chat room!'
      }))
      
      // Message handling
      ws.on('message', (data) => {
        const message = JSON.parse(data)
        console.log('Received message:', message)
        
        // Echo service
        ws.send(JSON.stringify({
          type: 'echo',
          original: message,
          timestamp: Date.now()
        }))
      })
      
      // Disconnect
      ws.on('close', () => {
        console.log('User disconnected')
      })
    },
    
    // 📊 Real-time data push
    'ws /realtime': (ws, req) => {
      const interval = setInterval(() => {
        ws.send(JSON.stringify({
          type: 'data',
          value: Math.random() * 100,
          timestamp: Date.now()
        }))
      }, 1000)
      
      ws.on('close', () => {
        clearInterval(interval)
      })
    }
  }
}
```

### 🛠️ Middleware Mode

You can directly write Express middleware.

```javascript
module.exports = {
  api: {
    // 🔧 Global middleware
    'use /': (req, res, next) => {
      // Add CORS headers
      res.header('Access-Control-Allow-Origin', '*')
      
      // Add custom headers
      res.header('X-Powered-By', 'MockM')
      
      // Log requests
      console.log(`${req.method} ${req.url}`)
      
      next()
    },
    
    // 🔐 Authentication middleware
    'use /api/protected': (req, res, next) => {
      const token = req.headers.authorization
      if (!token) {
        return res.status(401).json({ error: 'Login required' })
      }
      
      // Mock token validation
      if (token !== 'Bearer valid-token') {
        return res.status(403).json({ error: 'Invalid token' })
      }
      
      next()
    },
    
    // 📁 Static file serving
    'use /static': require('serve-static')(`${__dirname}/public`),
    
    // 📁 Multiple static directories
    'use /assets': [
      require('serve-static')(`${__dirname}/images`),
      require('serve-static')(`${__dirname}/documents`)
    ]
  }
}
```

### 🎯 Intercepting RestAPI

You can intercept and process interfaces generated by config.db.

```javascript
module.exports = {
  db: {
    books: [
      { id: 1, title: 'Book 1', price: 100 },
      { id: 2, title: 'Book 2', price: 200 }
    ]
  },
  api: {
    // 🔧 Intercept and modify RestAPI requests
    '/books/:id': (req, res, next) => {
      // Modify request data
      if (req.body) {
        req.body.updatedAt = new Date().toISOString()
      }
      
      // Continue with original RestAPI logic
      next()
      
      // Modify response data
      res.mm.resHandleJsonApi = (arg) => {
        const { data, resHandleJsonApi } = arg
        
        // Add extra information
        if (data) {
          data.viewCount = Math.floor(Math.random() * 1000)
          data.isPopular = data.price > 150
        }
        
        // Call default handler
        return resHandleJsonApi(arg)
      }
    },
    
    // 🎯 Completely override RestAPI interface
    'GET /books/special': {
      message: 'This is a special books interface',
      books: []
    }
  }
}
```

### 🧩 Functional Configuration

Refer to [config.api.fn](../config/config_api_fn.md), function should return an object.

### 📋 Routing Rules

| Format | Description | Example |
|--------|-------------|---------|
| `/path` | 🌐 All HTTP methods | `/api/users` |
| `GET /path` | 🎯 Specific HTTP method | `GET /api/users` |
| `ws /path` | 🔌 WebSocket interface | `ws /chat` |
| `use /path` | 🔧 Middleware mode | `use /api` |

**Path Parameters Support:**
```javascript
module.exports = {
  api: {
    '/users/:id': (req, res) => {
      const userId = req.params.id
      res.json({ userId, name: `User ${userId}` })
    },
    
    '/posts/:category/:id': (req, res) => {
      const { category, id } = req.params
      res.json({ category, id, title: `Article ${id} in ${category} category` })
    }
  }
}
```

**Priority Explanation:**
1. 🥇 `config.api` - Custom interfaces (highest priority)
2. 🥈 `config.proxy` - Proxy interfaces
3. 🥉 `config.db` - RestAPI auto-generated interfaces

Based on [Express.js](https://expressjs.com/en/guide/using-middleware.html) middleware system, supports complete Express API!

## config.resHandleReplay
Type: `function`  
Default: `({req, res}) => wrapApiData({code: 200, data: {}})`

🔄 **Replay Exception Handler** - Fallback strategy when historical records cannot satisfy replay requests

When no corresponding historical record is found in replay mode, this function determines how to respond:

```javascript
module.exports = {
  // 🎯 Friendly error message (recommended)
  resHandleReplay: ({req, res}) => ({
    code: 200,
    success: true,
    data: {},
    message: 'No historical data available, returning empty result'
  }),
  
  // 🚨 Clear error status
  resHandleReplay: ({req, res}) => ({
    code: 404,
    success: false,
    error: 'No corresponding historical record found',
    path: req.path
  }),
  
  // 🎭 Mock real data
  resHandleReplay: ({req, res}) => {
    const mockData = generateMockData(req.path)
    return {
      code: 200,
      success: true,
      data: mockData,
      source: 'generated'
    }
  }
}
```

::: tip 💡 Design Philosophy

**Why return 200 instead of 404 by default?**

Returning 404 might cause frequent error prompts on frontend pages, affecting user experience. The default strategy is to tell the frontend "interface is normal", return empty data, allowing pages to run normally.

**Use Cases:**
- 🧪 **Test Environment** - Ensure page functionality works normally
- 🎭 **Demo Scenarios** - Avoid showing error messages
- 🔄 **Progressive Development** - Fallback when some interfaces aren't recorded
:::

## config.resHandleJsonApi
Type: `function`  
Default: `({req, res: { statusCode: code }, data}) => wrapApiData({code, data})`

🎁 **RestAPI Response Wrapper** - Uniformly process all interface response formats generated by config.db

This is the final processing stage for RestAPI data, used to unify data structure:

```javascript
module.exports = {
  // 🎯 Custom response format
  resHandleJsonApi: ({req, res: { statusCode: code }, data}) => ({
    status: code,
    result: data,
    timestamp: Date.now(),
    server: 'MockM'
  }),

  // 📊 Pagination data processing
  resHandleJsonApi: ({req, res, data}) => {
    // Check if it's a pagination request
    if (req.query._page) {
      return {
        code: res.statusCode,
        success: true,
        data: {
          items: data,
          pagination: {
            page: parseInt(req.query._page) || 1,
            limit: parseInt(req.query._limit) || 10,
            total: res.get('X-Total-Count') || 0
          }  
        }
      }
    }
    
    // Regular request
    return {
      code: res.statusCode,
      success: res.statusCode < 400,
      data
    }
  }
}
```

**Actual effect:**
```javascript
// 🔧 Original RestAPI response
[
  { id: 1, name: 'Zhang San' },
  { id: 2, name: 'Li Si' }
]

// ✨ After wrapping
{
  code: 200,
  success: true,
  data: [
    { id: 1, name: 'Zhang San' },
    { id: 2, name: 'Li Si' }
  ]
}
```

## config.watch
Type: `string | string[]`  
Default: `[]`

👀 **File monitoring hot reload** - Monitor specified file changes and automatically restart service

Make your Mock service as smart as front-end development servers, with changes taking effect immediately:

```javascript
module.exports = {
  // 🎯 Monitor single file
  watch: './data.json',
  
  // 📂 Monitor multiple files/directories
  watch: [
    './mock-data',           // Monitor entire directory
    './config.json',         // Monitor configuration file
    '../shared/constants.js', // Monitor shared files
    '/abs/path/to/file.js'   // Support absolute paths
  ]
}
```

**Practical scenarios:**
```javascript
module.exports = {
  watch: [
    // 📊 Data file changes auto-update
    './mock-data.json',
    
    // 🔧 Business logic file changes restart
    './business-logic.js',
    
    // 🎯 Environment configuration changes take effect
    './.env',
    
    // 📋 Documentation changes sync
    './api-docs.md'
  ]
}
```

**Path descriptions:**
- ✅ **Relative paths** - Relative to configuration file location
- ✅ **Absolute paths** - Complete file system paths
- ✅ **Files and directories** - Both are supported for monitoring

## config.clearHistory
Type: `boolean | object | function`  
Default: `false`

🧹 **History record cleaner** - Intelligently clean redundant request records to keep database clean

Avoid unlimited growth of history records affecting performance and storage:

```javascript
module.exports = {
  clearHistory: true  // Use default strategy for cleaning
}
```

**Detailed configuration:**
```javascript
module.exports = {
  clearHistory: {
    // ⏰ Retention time: only clean records from 3 days ago
    retentionTime: 60 * 24 * 3,  // in minutes
    
    // 📊 Retention count: keep 1 latest record for same request
    num: 1  // positive number keeps new records, negative keeps old records
  }
}
```

**Custom cleaning strategy:**
```javascript
module.exports = {
  clearHistory: (historyList) => {
    const toDelete = []
    
    // 🎯 Custom cleaning logic
    historyList.forEach(item => {
      // Clean test interface records
      if (item.url.includes('/test/')) {
        toDelete.push(item.id)
      }
      
      // Clean error request records
      if (item.statusCode >= 400) {
        toDelete.push(item.id)  
      }
      
      // Clean oversized response records
      if (item.responseSize > 1024 * 1024) { // 1MB
        toDelete.push(item.id)
      }
    })
    
    return toDelete  // Return list of record IDs to delete
  }
}
```

**Default cleaning rules:**
Criteria for judging if requests are "identical":
- 🌐 Request URL 
- 🎯 Request method (GET/POST/...)
- 📊 Status code
- 🔐 Request body MD5
- 📦 Response body MD5

## config.guard
Type: `boolean`  
Default: `false`

🛡️ **Process daemon mode** - Automatically restart when service exits abnormally, ensuring service stability

```javascript
module.exports = {
  guard: true  // Enable daemon process
}
```

**Applicable scenarios:**
- 🏢 **Production environment** - Ensure service high availability
- 🧪 **Long-term testing** - Avoid test interruptions
- 📱 **Demo environment** - Ensure smooth demonstrations
- 🔄 **Unattended** - Server automation operations

**Working principle:**
1. 🔍 Monitor main process status
2. 💥 Detect abnormal exit
3. 📝 Log error information  
4. 🚀 Automatically restart service
5. 🔔 Optional notification mechanism

::: warning ⚠️ Precautions
- Ensure exit cause is not configuration error, otherwise infinite restart may occur
- Recommend with log monitoring to detect issues promptly
:::

## config.backOpenApi
Type: `boolean | number`  
Default: `10`

📋 **OpenAPI document backup** - Periodically backup OpenAPI document changes, track interface evolution history

```javascript
module.exports = {
  backOpenApi: 5,    // Check for updates every 5 minutes
  // backOpenApi: true,  // Use default interval (10 minutes)
  // backOpenApi: false  // Disable automatic backup
}
```

**Features:**
- 📅 **Periodic checking** - Detect document updates at set intervals
- 💾 **Version storage** - Save to `${config.dataDir}/openApiHistory` 
- 🔍 **Change tracking** - Compare document differences
- 📊 **History retrospective** - View interface change history

**Use cases:**
- 📈 **Interface evolution tracking** - Record API change history
- 🔄 **Version comparison** - Compare interface definitions from different periods
- 📋 **Document auditing** - API governance and compliance checking
- 🧪 **Compatibility testing** - Test based on historical versions

**Storage location:**
```
${dataDir}/openApiHistory/
├── 2024-01-15_10-30-00.json
├── 2024-01-15_10-40-00.json  
└── latest.json
```

## config.static
Type: `string | object | array`  
Default: `undefined`

📁 **Static file server** - Transform MockM into a powerful static resource server, supporting SPA applications

Let your Mock server not only provide APIs but also host front-end applications:

### 🚀 Quick start

**Simple mode:**
```javascript
module.exports = {
  static: 'public'  // Access http://localhost:9000/ to access public directory
}
```

**SPA application support:**
```javascript
module.exports = {
  static: {
    fileDir: 'dist',      // Vue/React build output directory
    mode: 'history'       // Support HTML5 History mode
  }
}
```

::: details Example

``` js
{
  static: `public`, // Access http://127.0.0.1:9000/ to access static files in public, default index file is index.html
  static: { // Access history mode project in dist directory
    fileDir: `dist`,
    mode: `history`,
  },
  static: [ // Different paths access different static file directories
    {
      path: `/web1`,
      fileDir: `/public1`,
    },
    {
      path: `/web2`,
      fileDir: `/public2`,
    },
    {
      path: `/web3`,
      fileDir: `/public3`,
      mode: `history`,
    },
  ],
}
```
::: 

## config.disableRecord
Type: `boolean | string | string[] | DisableRecord | DisableRecord[]`  
Default: `false`

🧹 **Request record filter** - Precisely control which requests are not recorded, keeping history data clean and focused

Some requests you might not want to record: test interfaces, sensitive data, or noise requests. This configuration lets you filter easily:

### 🚀 Quick start

**Global control:**
```javascript
module.exports = {
  disableRecord: false,  // ✅ Record all requests (default)
  // disableRecord: true     // ❌ Don't record any requests
}
```

**Path filtering:**
```javascript
module.exports = {
  // 🎯 Don't record test interfaces
  disableRecord: '^/api/test/',
  
  // 📂 Don't record multiple paths
  disableRecord: [
    '^/api/debug/',
    '^/health-check$',
    '/temp/'
  ]
}
```

### 🎯 Precise control

**Object configuration:**
```javascript
module.exports = {
  disableRecord: {
    path: '^/api/sensitive/',  // Regular expression matching paths
    method: 'POST',           // Only filter POST requests
    num: 0                    // 0 = don't record, positive number = keep latest n records
  }
}
```

**Multiple rule combination:**
```javascript
module.exports = {
  disableRecord: [
    // 🔐 Don't record login-related POST requests
    { path: '/auth/', method: 'POST' },
    
    // 📊 Health check interfaces completely unrecorded
    { path: '^/health' },
    
    // 📝 Log interfaces keep only recent 5 records
    { path: '/logs/', num: 5 },
    
    // 🚀 Upload interfaces keep only latest 1 record
    { path: '/upload', method: 'POST', num: 1 }
  ]
}
```

### 🏆 Practical application scenarios

**Development environment cleanup:**
```javascript
module.exports = {
  disableRecord: [
    // 🧪 Test interfaces not recorded
    '^/api/test/',
    '^/debug/',
    '/mock/',
    
    // 📊 Monitoring interfaces not recorded
    '/metrics',
    '/health',
    
    // 🔄 Heartbeat detection not recorded
    '/ping',
    '/status'
  ]
}
```

**Production environment protection:**
```javascript
module.exports = {
  disableRecord: [
    // 🔐 Sensitive interfaces not recorded
    { path: '/api/password', method: 'POST' },
    { path: '/api/token', method: 'POST' },
    
    // 📊 High-frequency interfaces limit record count
    { path: '/api/analytics', num: 10 },
    { path: '/api/tracking', num: 5 }
  ]
}
```

**Performance optimization:**
```javascript
module.exports = {
  disableRecord: [
    // 🎯 Static resources not recorded
    '\\.(css|js|png|jpg|gif|ico)$',
    
    // 📱 Mobile tracking not recorded
    '/api/mobile/track',
    
    // 🔄 WebSocket connections not recorded
    '/socket.io/'
  ]
}
```

### 📋 Configuration parameter details

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | 🎯 Regular expression for request paths |
| `method` | `string` | 🎯 HTTP method, matches all if not specified |
| `num` | `number` | 📊 Number of records to keep, 0=don't record |

**TypeScript type definition:**
```typescript
interface DisableRecord {
  path: string     // Request address, will be converted to regex
  method?: Method  // Request method, optional
  num?: number     // Only record last n entries, 0 means don't record
}
```

::: tip 💡 Regular expression tips

**Common patterns:**
- `^/api/test/` - Paths starting with `/api/test/`
- `/temp/$` - Paths ending with `/temp/`  
- `\\.(png|jpg)$` - Image files
- `/api/(login|logout)` - Login/logout interfaces

**Testing regex:**
```javascript
// Test in browser console
const pattern = '^/api/test/'
const url = '/api/test/user'
console.log(url.match(new RegExp(pattern))) // Has match result
```
:::

::: warning ⚠️ Precautions

**Performance impact:**
- Each request executes regex matching, complex rules affect performance
- Recommend placing most frequently matched rules first

**Debugging tips:**
- Filtered requests won't appear in Web UI history records
- If certain requests aren't recorded, check this configuration
:::

### 🔧 Common configuration templates

**Front-end developers:**
```javascript
disableRecord: [
  '\\.(css|js|map|png|jpg|gif|ico|svg)$',  // Static resources
  '/api/analytics',                        // Tracking data
  { path: '/api/debug', method: 'GET' }    // Debug interfaces
]
```

**Back-end developers:** 
```javascript
disableRecord: [
  '^/health',           // Health checks
  '/metrics',           // Monitoring metrics
  { path: '/logs', num: 20 }  // Log interfaces keep 20 records
]
```

**Test engineers:**
```javascript
disableRecord: [
  '^/test/',            // Test interfaces
  '/mock/',             // Mock data
  { path: '/api/.*', method: 'OPTIONS' }  // Preflight requests
]
```

## config.bodyParser
Type: `Object`  
Default: See configuration below

🔧 **Request body parser** - Control how to parse different formats of request data, supporting large files and complex data structures

MockM uses Express's bodyParser middleware to parse request bodies. You can fine-tune through this configuration:

### 🎯 Default configuration

```javascript
// MockM's default settings
config.bodyParser = {
  json: {
    limit: '100mb',        // JSON data size limit
    extended: false,       // Don't use extended parsing
    strict: false         // Allow non-strict JSON
  },
  urlencoded: {
    extended: false        // Use querystring library for parsing
  }
}
```

### 🛠️ Custom configuration

**Handle large file uploads:**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '500mb',      // Support 500MB JSON data
      strict: true         // Strict JSON mode
    },
    urlencoded: {
      limit: '200mb',      // Form data limit
      extended: true       // Use qs library, support nested objects
    }
  }
}
```

**Strict security mode:**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '1mb',        // Limit smaller data size
      strict: true,        // Strict JSON parsing
      type: 'application/json'  // Only parse specified Content-Type
    },
    urlencoded: {
      limit: '100kb',      // Form data limit
      extended: false,     // Use simple parser
      parameterLimit: 20   // Limit parameter count
    }
  }
}
```

### 📊 Configuration parameter details

**JSON parsing options:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `string` | `'100mb'` | 🚀 Request body size limit |
| `strict` | `boolean` | `false` | 🔒 Whether to strictly parse JSON |
| `type` | `string` | `'*/json'` | 📝 Matching Content-Type |
| `verify` | `function` | - | 🔍 Custom verification function |

**URL encoding parsing options:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `string` | `'100mb'` | 🚀 Request body size limit |
| `extended` | `boolean` | `false` | 🧩 Whether to support nested objects |
| `parameterLimit` | `number` | `1000` | 📊 Maximum parameter count |
| `type` | `string` | `'*/x-www-form-urlencoded'` | 📝 Matching Content-Type |

### 🏆 Practical application scenarios

**File upload service:**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '1gb',        // Support very large JSON files
      verify: (req, res, buf) => {
        // Custom verification logic
        if (buf.length > 1024 * 1024 * 500) {
          console.log('Large file upload:', buf.length, 'bytes')
        }
      }
    }
  }
}
```

**Form processing system:**
```javascript
module.exports = {
  bodyParser: {
    urlencoded: {
      extended: true,      // Support complex form structures
      limit: '50mb',       // Accommodate large forms
      parameterLimit: 10000  // Support more fields
    }
  }
}
```

**API gateway scenario:**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '10mb',       // Reasonable data size
      strict: true,        // Strict mode improves security
      type: ['*/json', 'application/csp-report']  // Support multiple types
    },
    urlencoded: {
      extended: false,     // Simple parsing improves performance
      limit: '5mb'
    }
  }
}
```

### 💡 Performance optimization suggestions

**Adjust limits according to business:**
```javascript
// Small applications
bodyParser: {
  json: { limit: '1mb' },
  urlencoded: { limit: '500kb' }
}

// Document systems  
bodyParser: {
  json: { limit: '50mb' },
  urlencoded: { limit: '10mb' }
}

// File services
bodyParser: {
  json: { limit: '1gb' },
  urlencoded: { limit: '100mb' }
}
```

**extended parameter selection:**
```javascript
// extended: false (recommended)
// Form: user[name]=zhang&user[age]=25
// Parsed: { 'user[name]': 'zhang', 'user[age]': '25' }

// extended: true  
// Form: user[name]=zhang&user[age]=25
// Parsed: { user: { name: 'zhang', age: '25' } }
```

::: tip 🚀 Performance tips

**Best practices:**
- Set `limit` according to actual needs, too large will consume memory
- Development environment can set larger values, production environment should be cautious
- `extended: false` has better performance, `extended: true` has more features

**Debugging techniques:**
```javascript
bodyParser: {
  json: {
    verify: (req, res, buf) => {
      console.log('JSON data size:', buf.length)
      console.log('Content-Type:', req.headers['content-type'])
    }
  }
}
```
:::

::: warning ⚠️ Security notes

**Prevent attacks:**
- Set reasonable `limit` to prevent denial of service attacks
- Use `parameterLimit` to limit parameter count
- Enable `strict` mode in production environments

**Common issues:**
- Oversized request bodies return `413 Payload Too Large`
- JSON format errors return `400 Bad Request` 
- Exceeding parameter limits will truncate parsing
:::

### 🔧 Troubleshooting

**Request body parsing failed?**
```javascript
// 1. Check if Content-Type matches
bodyParser: {
  json: {
    type: ['application/json', 'text/plain']  // Extend supported types
  }
}

// 2. Check data size limits
bodyParser: {
  json: { limit: '200mb' }  // Increase limit
}

// 3. Add debug information
bodyParser: {
  json: {
    verify: (req, res, buf) => {
      console.log('Parsing JSON:', {
        size: buf.length,
        type: req.headers['content-type']
      })
    }
  }
}
```

Based on Express [body-parser](https://expressjs.com/en/resources/middleware/body-parser.html) middleware implementation, supports complete configuration options.

## config.https
Type: `configHttps`  
Default: `{ redirect: true }`

🔐 **HTTPS secure connection** - Enable SSL/TLS encryption with one click, supporting HTTP/HTTPS mixed service on same port

Transform your Mock service to HTTPS instantly, supporting security requirements of modern web applications:

### 🚀 Quick enable

**Basic configuration:**
```javascript
module.exports = {
  https: {
    key: './certificates/server.key',   // Private key file
    cert: './certificates/server.crt'   // Certificate file
  }
}
```

**Immediate benefits:**
- 🔐 **HTTPS access** - `https://localhost:9000`
- 🔄 **Mixed mode** - Support both HTTP and HTTPS simultaneously
- ⚡ **Auto redirect** - HTTP requests automatically redirect to HTTPS

### 🏗️ Complete configuration

```typescript
interface configHttps {
  key: string          // Private key file address, e.g. *.key
  cert: string         // Public key file address, e.g. *.crt, *.cer
  redirect?: boolean   // Whether to redirect to HTTPS (default: true)
  port?: number        // HTTPS port (default: same as config.port)
  testPort?: number    // HTTPS version of test port
  replayPort?: number  // HTTPS version of replay port
}
```

### 🎯 Advanced applications

**Nginx-like 80/443 port configuration:**
```javascript
module.exports = {
  port: 80,              // HTTP port
  https: {
    key: './certs/https.key',
    cert: './certs/https.crt', 
    port: 443,           // HTTPS port
    redirect: true       // Port 80 auto redirects to 443
  }
}
```

**Enterprise multi-port configuration:**
```javascript
module.exports = {
  port: 9000,
  testPort: 9001,
  replayPort: 9002,
  https: {
    key: './ssl/server.key',
    cert: './ssl/server.crt',
    port: 9443,          // Main service HTTPS port
    testPort: 9444,      // Test service HTTPS port  
    replayPort: 9445,    // Replay service HTTPS port
    redirect: false      // No auto redirect, let users choose freely
  }
}
```

**Development environment self-signed certificate:**
```javascript
module.exports = {
  https: {
    key: './dev-certs/localhost.key',
    cert: './dev-certs/localhost.crt',
    // Turn off redirect during development for easier debugging
    redirect: process.env.NODE_ENV !== 'development'
  }
}
```

### 🛠️ Certificate acquisition guide

**Method 1: Self-signed certificate (for development)**
```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr

# Generate self-signed certificate
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

**Method 2: Let's Encrypt (for production)**
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificate location
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

**Method 3: Commercial certificate**
- 🏢 Purchase from CA institutions (recommended for production)
- 🔐 Usually includes: `domain.key` and `domain.crt`
- 📋 Some also include intermediate certificates that need merging

### 🏆 Practical application scenarios

**Front-end development environment:**
```javascript
module.exports = {
  port: 3000,
  https: {
    key: './https-dev/localhost.key', 
    cert: './https-dev/localhost.crt',
    redirect: false  // Don't force HTTPS during development
  },
  cors: true,
  // Support modern browser security policies
  api: {
    'use /': (req, res, next) => {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000')
      next()
    }
  }
}
```

**API gateway mode:**
```javascript
module.exports = {
  https: {
    key: './certs/api-gateway.key',
    cert: './certs/api-gateway.crt', 
    port: 443,
    redirect: true
  },
  proxy: {
    '/api/v1/': 'https://api1.internal.com',
    '/api/v2/': 'https://api2.internal.com'
  }
}
```

**Demo environment configuration:**
```javascript
module.exports = {
  https: {
    key: './demo-certs/demo.key',
    cert: './demo-certs/demo.crt',
    // Demo environment forces HTTPS for professionalism
    redirect: true
  },
  // Provide professional response headers
  api: {
    'use /': (req, res, next) => {
      res.setHeader('X-Powered-By', 'MockM-HTTPS')
      next()
    }
  }
}
```

### 💡 Professional tips

**Certificate path handling:**
```javascript
const path = require('path')

module.exports = {
  https: {
    // Support relative paths, absolute paths
    key: path.join(__dirname, 'certs/server.key'),
    cert: path.join(__dirname, 'certs/server.crt'),
    
    // Environment variable configuration
    // key: process.env.HTTPS_KEY_PATH,
    // cert: process.env.HTTPS_CERT_PATH
  }
}
```

**Dynamic port allocation:**
```javascript
module.exports = {
  port: process.env.HTTP_PORT || 8080,
  https: {
    key: './certs/server.key',
    cert: './certs/server.crt',
    port: process.env.HTTPS_PORT || 8443,
    redirect: process.env.FORCE_HTTPS === 'true'
  }
}
```

### 🔧 Troubleshooting

**Common errors and solutions:**

```javascript
// Error: Certificate file doesn't exist
// Error: ENOENT: no such file or directory
https: {
  key: require('path').resolve('./certs/server.key'),  // Use absolute path
  cert: require('path').resolve('./certs/server.crt')
}

// Error: Incorrect certificate format
// Error: error:0906D06C:PEM routines
// Check certificate file format, ensure it's PEM format

// Error: Private key and certificate don't match
// Error: error:0B080074:x509 certificate routines
// Regenerate matching key pair
```

**Debug configuration:**
```javascript
module.exports = {
  https: {
    key: './certs/server.key',
    cert: './certs/server.crt',
    // View detailed information during debugging
    secureOptions: require('constants').SSL_OP_NO_TLSv1,
    ciphers: 'HIGH:!aNULL:!MD5',
    honorCipherOrder: true
  }
}
```

::: tip 🚀 Best practices

**Certificate management:**
- Development environment can use self-signed certificates
- Production environment recommended to use Let's Encrypt or commercial certificates
- Add certificate files to `.gitignore`, don't commit to version control

**Port planning:**
- Development: `3000` (HTTP) + `3443` (HTTPS) 
- Testing: `8000` (HTTP) + `8443` (HTTPS)
- Production: `80` (HTTP) + `443` (HTTPS)

**Security configuration:**
```javascript
https: {
  redirect: true,  // Recommended to enable in production
  // Add security response headers
  secureHeaders: true
}
```
:::

::: warning ⚠️ Security reminders

**Certificate security:**
- 🔐 Set private key file permissions to 600: `chmod 600 server.key`
- 📁 Don't commit certificate files to public repositories
- ⏰ Regularly update certificates to avoid expiration

**Self-signed certificates:**
- Browsers will show "insecure" warnings
- During development can add exceptions or use `--ignore-certificate-errors`
- Not suitable for production environments

**Mixed Content:**
- HTTPS pages cannot load HTTP resources
- Ensure all resources use relative paths or HTTPS
:::

### 📊 Port configuration reference table

| Service Type | HTTP Default Port | HTTPS Config Port | Description |
|--------------|-------------------|-------------------|-------------|
| Main Service | `config.port` | `https.port` | 🌐 Main API service |
| Test Service | `config.testPort` | `https.testPort` | 🧪 Test management interface |
| Replay Service | `config.replayPort` | `https.replayPort` | ⏪ Historical data replay |

Based on Node.js native HTTPS module implementation, supports complete SSL/TLS configuration options.

## config.plugin
Type: `Plugin[]`  
Default: `[]`

🔌 **Plugin ecosystem** - Extend MockM's unlimited possibilities through plugins, from simple tools to complex business logic

MockM provides a powerful plugin mechanism that allows you to inject custom logic at various service lifecycle stages:

### 🚀 Plugin basic structure

```javascript
module.exports = {
  // 🆔 Unique identifier for the plugin
  key: 'my-awesome-plugin',
  
  // 📦 Supported MockM versions (optional)
  hostVersion: ['1.1.0', '1.2.0'],
  
  // 🎯 Plugin entry function
  async main({hostInfo, pluginConfig, config, util} = {}) {
    return {
      // 🏗️ Various lifecycle hooks
      async hostFileCreated() {},
      async serverCreated(info) {},
      async useCreated(app) {},
      async useParserCreated(app) {},
      async apiParsed(api, apiUtil) {},
      async apiListParsed(serverRouterList) {}
    }
  }
}
```

### 🎯 Lifecycle hooks explained

| Hook Name | Execution Timing | Available Features | Typical Usage |
|-----------|------------------|-------------------|---------------|
| `hostFileCreated` | 📁 Directory structure creation complete | File system operations | Create plugin config files |
| `serverCreated` | 🚀 Server startup successful | HTTP server instance | Add additional port listeners |
| `useCreated` | 🔧 Application initialization complete | Express app | Register high-priority middleware |
| `useParserCreated` | 📊 Parser initialization complete | req.body available | Data preprocessing and logging |
| `apiParsed` | 🎭 API configuration parsing complete | API object | Inject new interfaces |
| `apiListParsed` | 📋 API list generation complete | Complete routing information | Generate docs or statistics |

### 🏆 Practical plugin examples

#### 1️⃣ User authentication plugin

**Create plugin file:** `auth-plugin.js`
```javascript
module.exports = {
  key: 'user-auth',
  async main({config, util}) {
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          const token = req.header('Authorization') || ''
          
          // 🔍 Parse JWT Token
          try {
            const payload = parseJWT(token)
            req.userId = payload.userId
            req.userRole = payload.role
            req.userName = payload.name
          } catch (err) {
            req.userId = null
          }
          
          next()
        })
      }
    }
  }
}

function parseJWT(token) {
  if (!token.startsWith('Bearer ')) return null
  const jwt = token.slice(7)
  // Simplified JWT parsing logic
  const [, payload] = jwt.split('.')
  return JSON.parse(Buffer.from(payload, 'base64').toString())
}
```

**Use plugin:** `mm.config.js`
```javascript
const authPlugin = require('./auth-plugin.js')

module.exports = {
  plugin: [authPlugin],
  api: {
    // 🎯 Any API can get user information
    'GET /api/profile': (req, res) => {
      if (!req.userId) {
        return res.status(401).json({ error: 'Please login first' })
      }
      
      res.json({
        userId: req.userId,
        name: req.userName,
        role: req.userRole
      })
    }
  }
}
```

#### 2️⃣ Data transformation plugin

**Create plugin:** `data-transform.js`
```javascript
module.exports = {
  key: 'data-transformer',
  async main({config}) {
    // 🔄 Modify RestAPI response format
    config.resHandleJsonApi = ({req, res: {statusCode: code}, data}) => {
      return {
        code,
        success: code < 400,
        data,
        timestamp: Date.now(),
        server: 'MockM-Enhanced'
      }
    }
    
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          // 🎯 Transform pagination parameters
          if (req.query.page) req.query._page = req.query.page
          if (req.query.size) req.query._limit = req.query.size
          if (req.query.current) req.query._page = req.query.current
          next()
        })
      }
    }
  }
}
```

#### 3️⃣ API documentation generation plugin

```javascript
module.exports = {
  key: 'api-doc-generator',
  async main({config, util}) {
    const apiDocs = []
    
    return {
      apiListParsed(serverRouterList) {
        // 📋 Collect all API information
        serverRouterList.forEach(route => {
          apiDocs.push({
            path: route.route,
            method: route.method,
            description: route.description || 'No description',
            type: route.type
          })
        })
        
        // 📄 Generate documentation page
        config.api = {
          ...config.api,
          'GET /docs': (req, res) => {
            res.json({
              title: 'API Interface Documentation',
              version: '1.0.0',
              apis: apiDocs
            })
          }
        }
      }
    }
  }
}
```

#### 4️⃣ Request logging plugin

```javascript
module.exports = {
  key: 'request-logger',
  async main({config, util}) {
    const fs = require('fs')
    const logFile = './api-requests.log'
    
    return {
      useParserCreated(app) {
        app.use((req, res, next) => {
          const start = Date.now()
          
          // 📝 Record request information
          const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            body: req.body
          }
          
          // 🎯 Intercept response
          const originalSend = res.send
          res.send = function(data) {
            logEntry.duration = Date.now() - start
            logEntry.status = res.statusCode
            logEntry.response = data
            
            // 💾 Write to log file
            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n')
            
            return originalSend.call(this, data)
          }
          
          next()
        })
      }
    }
  }
}
```

### 🧩 Plugin combination application

**Complete enterprise-level configuration:**
```javascript
const authPlugin = require('./plugins/auth.js')
const logPlugin = require('./plugins/logger.js') 
const docPlugin = require('./plugins/docs.js')

module.exports = async (util) => {
  // 🔧 Dynamically load plugin dependencies
  const joi = await util.tool.generate.initPackge('joi')
  
  return {
    plugin: [
      authPlugin,
      logPlugin, 
      docPlugin,
      util.plugin.validate,  // Built-in validation plugin
      util.plugin.apiDoc     // Built-in documentation plugin
    ],
    
    api: {
      'POST /api/login': util.side({
        group: 'auth',
        desc: 'User login interface',
        request: joi.object({
          username: joi.string().required(),
          password: joi.string().min(6).required()
        }),
        
        fn: (req, res) => {
          const {username, password} = req.body
          
          // 🔐 Simulate login verification
          if (username === 'admin' && password === '123456') {
            const token = generateToken({
              userId: 1,
              name: 'Administrator',
              role: 'admin'
            })
            
            res.json({
              success: true,
              token,
              user: {
                id: 1,
                name: 'Administrator',
                role: 'admin'
              }
            })
          } else {
            res.status(401).json({
              success: false,
              message: 'Username or password incorrect'
            })
          }
        }
      })
    }
  }
}

function generateToken(payload) {
  // Simplified JWT generation
  const header = Buffer.from(JSON.stringify({typ: 'JWT', alg: 'HS256'})).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.signature`
}
```

### 🎯 Built-in plugins

MockM provides some built-in plugins:

```javascript
module.exports = {
  plugin: [
    util.plugin.validate,  // 🔍 Parameter validation plugin
    util.plugin.apiDoc     // 📚 API documentation plugin
  ]
}
```

Visit `http://127.0.0.1:9000/doc/` to view generated interface documentation.

### 💡 Plugin development tips

**Get plugin configuration:**
```javascript
module.exports = {
  key: 'configurable-plugin',
  async main({pluginConfig}) {
    const {apiKey, timeout} = pluginConfig
    
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          req.pluginApiKey = apiKey
          next()
        })
      }
    }
  }
}

// Pass configuration when using
module.exports = {
  plugin: [
    [myPlugin, {apiKey: 'abc123', timeout: 5000}]
  ]
}
```

**Error handling:**
```javascript
module.exports = {
  key: 'safe-plugin',
  async main({config, util}) {
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          try {
            // 🛡️ Plugin logic
            performSomeOperation(req)
            next()
          } catch (error) {
            console.error('Plugin error:', error)
            next() // Don't interrupt request chain
          }
        })
      }
    }
  }
}
```

**Performance monitoring:**
```javascript 
module.exports = {
  key: 'performance-monitor',
  async main() {
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          const start = process.hrtime.bigint()
          
          res.on('finish', () => {
            const duration = Number(process.hrtime.bigint() - start) / 1000000
            console.log(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`)
          })
          
          next()
        })
      }
    }
  }
}
```

### 🔧 Plugin debugging

**Enable debug information:**
```javascript
module.exports = {
  key: 'debug-plugin', 
  async main({hostInfo, config}) {
    console.log('🔌 Plugin startup:', {
      hostVersion: hostInfo.version,
      configKeys: Object.keys(config)
    })
    
    return {
      serverCreated(info) {
        console.log('🚀 Server started:', info)
      },
      
      apiParsed(api) {
        console.log('📋 API count:', Object.keys(api).length)
      }
    }
  }
}
```

::: tip 🚀 Best practices

**Plugin design principles:**
- 🎯 **Single responsibility** - Each plugin focuses on one function
- 🛡️ **Error isolation** - Plugin errors shouldn't affect main service
- 📝 **Clear naming** - Use meaningful keys and descriptions
- ⚡ **Performance first** - Avoid blocking request processing

**Plugin organization:**
```
plugins/
├── auth/
│   ├── index.js       # Authentication plugin main file
│   ├── jwt.js         # JWT utilities
│   └── config.js      # Configuration file
├── logger/
│   ├── index.js       # Logging plugin main file
│   └── formatters.js  # Log formatting utilities
└── docs/
    ├── index.js       # Documentation plugin main file
    └── templates/     # Documentation templates
```

**Version compatibility:**
```javascript
module.exports = {
  key: 'my-plugin',
  hostVersion: ['>=1.1.0', '<2.0.0'],  // Semantic version range
  async main({hostInfo}) {
    if (hostInfo.version < '1.2.0') {
      console.warn('Recommend upgrading MockM to 1.2.0+ for best experience')
    }
  }
}
```
:::

::: warning ⚠️ Precautions

**Performance impact:**
- Plugins execute on every request, avoid complex computations
- Handle Promises correctly when using async operations
- Many plugins will affect startup speed

**Memory leaks:**
- Clean up timers and event listeners promptly
- Avoid creating many closures in plugins
- Be careful with global variable usage

**Debugging tips:**
- Use `console.log` to debug plugin execution flow
- Plugin errors may not display directly, check console output
- Can interrupt request processing by throwing errors in plugins
:::

### 📦 Plugin ecosystem

**Recommended plugin template:**

```javascript
// plugin-template.js
module.exports = {
  key: 'plugin-name',
  hostVersion: ['>=1.1.0'],
  
  async main({hostInfo, pluginConfig, config, util}) {
    // Plugin initialization logic
    const options = {
      enabled: true,
      ...pluginConfig
    }
    
    return {
      async hostFileCreated() {
        // File system ready
      },
      
      async serverCreated(info) {
        // Server startup complete
      },
      
      async useCreated(app) {
        // Express app initialization complete
        if (options.enabled) {
          app.use(createMiddleware(options))
        }
      },
      
      async useParserCreated(app) {
        // Request parser ready
      },
      
      async apiParsed(api, apiUtil) {
        // API configuration parsing complete
      },
      
      async apiListParsed(serverRouterList) {
        // API list generation complete
      }
    }
  }
}

function createMiddleware(options) {
  return (req, res, next) => {
    // Middleware logic
    next()
  }
}
```

Through the plugin system, you can transform MockM into a powerful API development platform suitable for your own projects! 🚀
