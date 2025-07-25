# 配置项

## config.disable
类型: `boolean`  
默认: `false`

🚀 **一键切换生产模式** - 快速屏蔽所有自定义 API，让请求直达真实服务器

想要立即测试真实后端？无需删除代码，只需一键切换：

```javascript
module.exports = {
  disable: true  // 所有自定义 API 瞬间失效
}
```

**使用场景：**
- 🧪 对比测试：快速切换 Mock 和真实数据
- 🚀 上线前验证：确保真实接口正常工作  
- 🔄 渐进式开发：部分接口完成后逐步切换

::: details 💡 小技巧：如何禁用单个接口
无需配置，灵活多变：
- **路径大法** - 修改路径让接口不匹配：`/api/user` → `/api/user-disabled`
- **注释大法** - 直接注释掉接口定义
- **条件判断** - 根据环境变量动态启用：
  ```javascript
  api: {
    ...(process.env.NODE_ENV !== 'production' && {
      '/api/test': { msg: 'development only' }
    })
  }
  ```
:::

## config.osIp
类型: `string`  
默认: 本地网卡第一个 IPv4 地址

🌐 **智能 IP 绑定** - 自动将调试链接适配到指定 IP，支持内网穿透和远程访问

当你的服务运行在特殊环境（如 Docker、内网穿透、云服务器）时，自动调整调试链接的 IP 地址：

```javascript
module.exports = {
  osIp: '192.168.1.100'  // 绑定到内网 IP
}
```

**神奇效果：**
```bash
# 🔧 配置前的调试链接
x-test-api: http://127.0.0.1:9005/#/history,get/api/users

# ✨ 配置后的调试链接  
x-test-api: http://192.168.1.100:9005/#/history,get/api/users
```

**实用场景：**
- 🏠 **内网开发** - 让同事通过内网 IP 访问你的 Mock 服务
- ☁️ **云端部署** - 服务器部署时自动适配公网 IP
- 🔗 **内网穿透** - 配合 ngrok 等工具实现外网访问
- 📱 **移动端调试** - 手机通过 WiFi 连接电脑上的服务

::: details 🌟 高级用法：动态 IP 获取
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
  osIp: getLocalIP()  // 自动获取本机内网 IP
}
```
::: 

## config.port
类型: `number | string`  
默认: `9000`

🚪 **主服务入口** - API 调用的核心端口，前端请求的必经之路

这是你的 Mock 服务器对外提供服务的端口，所有 API 请求都通过这里：

```javascript
module.exports = {
  port: 8080  // 使用熟悉的端口号
}
```

**访问方式：**
- 🌐 API 调用：`http://localhost:8080/api/users`
- 🔗 代理请求：`http://localhost:8080/proxy/path`
- 📁 静态资源：`http://localhost:8080/static/file.html`

**端口选择建议：**
- `3000` - React 开发者的最爱
- `8080` - Java 开发者的习惯
- `9000` - MockM 的默认选择（避免冲突）
- `80` - 生产环境的标准（需要管理员权限）

## config.testPort
类型: `number | string`  
默认: `9005`

🎛️ **调试控制台** - 可视化管理界面的专属端口

这里是你的 Mock 服务器管理后台，提供强大的可视化功能：

```javascript
module.exports = {
  testPort: 3001  // 与主端口区分开
}
```

**功能亮点：**
- 📊 **API 总览** - 查看所有接口的调用统计
- 🔍 **请求历史** - 详细记录每次 API 调用
- ✏️ **在线编辑** - 直接修改接口返回数据
- 🔄 **重放测试** - 一键重现历史请求
- 📋 **接口文档** - 自动生成的 API 文档

**访问地址：** `http://localhost:3001`

::: tip 💡 最佳实践
建议将测试端口设置为主端口 +5，便于记忆：
- 主服务：`port: 9000` → 测试控制台：`testPort: 9005`
- 主服务：`port: 8080` → 测试控制台：`testPort: 8085`
:::

## config.replayPort
类型: `number | string`  
默认: `9001`

⏪ **时光回溯端口** - 基于历史数据的请求重放服务

这是一个神奇的端口，它能让你的应用"穿越时空"，使用之前记录的真实请求响应数据：

```javascript
module.exports = {
  replayPort: 8001
}
```

**工作原理：**
1. 📝 **记录阶段** - MockM 通过主端口代理请求时自动记录
2. 💾 **存储数据** - 将请求和响应保存到本地文件
3. ⏪ **回放服务** - 通过重放端口提供历史数据

**使用场景：**
- 🚀 **离线开发** - 断网环境下仍能获得真实数据
- 🧪 **稳定测试** - 使用固定数据进行可重复测试
- 🔄 **数据回溯** - 重现特定时间点的接口状态
- 📊 **性能对比** - 对比不同版本的接口响应

**切换方式：**
```javascript
// 开发时使用真实接口
const apiBase = 'http://localhost:9000'

// 测试时使用历史数据  
const apiBase = 'http://localhost:8001'
```

## config.replayProxy
类型: `boolean`  
默认: `true`

🔄 **智能回退机制** - 当历史记录找不到时，是否自动转发到真实服务器

```javascript
module.exports = {
  replayProxy: true   // 开启智能回退（推荐）
  // replayProxy: false  // 严格模式，只返回历史数据
}
```

**两种模式对比：**

| 模式 | 找到历史数据 | 找不到历史数据 |
|------|------------|-------------|
| `true` | ✅ 返回历史数据 | 🔄 转发到真实服务器 |
| `false` | ✅ 返回历史数据 | ❌ 返回 404 或空数据 |

**选择建议：**
- 🌟 **开发阶段** - 使用 `true`，确保接口始终可用
- 🧪 **测试阶段** - 使用 `false`，确保数据一致性
- 📱 **演示环境** - 使用 `true`，应对各种突发情况

## config.replayProxyFind
类型: `function`  
默认: 见下方代码

🎯 **智能请求匹配** - 自定义重放时如何找到最佳历史记录

当有多条历史记录匹配同一个请求时，通过这个函数决定使用哪一条：

```javascript
// 默认实现：优先选择状态码为 200 的记录
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

**参数说明：**
- `item` - 历史记录项，包含完整的请求响应数据
- `item.data.res.bodyPath` - 响应体文件路径
- 返回 `true` 表示选择这条记录

**自定义匹配策略：**

```javascript
module.exports = {
  // 💡 策略一：选择最新的记录
  replayProxyFind: (item) => {
    return item.timestamp > Date.now() - 3600000  // 1小时内的记录
  },

  // 💡 策略二：根据响应大小选择
  replayProxyFind: (item) => {
    const bodySize = item.data.res.contentLength || 0
    return bodySize > 100  // 选择内容丰富的响应
  },

  // 💡 策略三：根据请求参数匹配
  replayProxyFind: (item) => {
    const hasUserId = item.data.req.url.includes('userId=')
    return hasUserId  // 优先选择包含用户ID的记录
  }
}
```

**高级示例：多重条件判断**
```javascript
module.exports = {
  replayProxyFind(item) {
    const res = item.data.res
    const req = item.data.req
    
    // 优先级1：成功状态码
    if (res.statusCode === 200) return true
    
    // 优先级2：最近的记录
    if (Date.now() - item.timestamp < 300000) return true  // 5分钟内
    
    // 优先级3：特定环境的记录
    if (req.headers['x-env'] === 'production') return true
    
    return false
  }
}
```

@[code transcludeWith=snippet-replayProxyFind](@/../server/config.js)

## config.hostMode

::: details ⚠️ 实验性支持 
**开启前必读的注意事项：**

🚨 **端口限制**  
- `port` 配置会被忽略，自动与目标服务器端口保持一致
- hosts 文件不支持端口映射（如 `127.0.0.1:9000 api.com:8080`）

💥 **异常退出风险**  
- 程序异常退出时可能无法还原 hosts 文件
- 导致无法访问真实域名，需要手动清理

🎯 **域名限制**  
- 仅支持域名代理，不支持 IP 地址
- 因为 IP 请求不会经过 hosts 文件解析

🔄 **功能限制**  
- proxy 中的转发功能会失效
- 避免循环引用（自己指向自己）

**安全操作建议：**
```bash
# 启动前备份 hosts 文件
cp /etc/hosts /etc/hosts.backup

# Windows 用户
copy C:\Windows\System32\drivers\etc\hosts hosts.backup
```
:::

类型: `boolean`  
默认: `false`

🎭 **零侵入代码模式** - 通过修改 hosts 文件实现完全透明的请求拦截

这是一个"黑魔法"级别的功能，让你的代码完全不用修改就能享受 Mock 服务：

```javascript
module.exports = {
  hostMode: true,
  proxy: {
    '/': 'https://api.example.com'  // 必须是域名
  }
}
```

**工作原理：**
1. 🔧 自动修改系统 hosts 文件：`127.0.0.1 api.example.com`
2. 🌐 你的代码继续访问：`https://api.example.com/users`
3. ✨ 请求自动被 MockM 拦截处理

**绝佳场景：**
- 📱 **App 开发** - 无需修改客户端代码
- 🧪 **第三方集成测试** - 拦截外部 API 调用
- 🔒 **生产环境调试** - 临时替换线上接口
- 🚀 **微服务开发** - 模拟其他服务


## config.updateToken
类型: `boolean | string | string[] | object`  
默认: `true`

🔑 **智能令牌传递** - 自动从真实请求中提取认证信息，用于后续的调试和重放

解决登录后调试接口的烦恼，自动同步认证状态：

```javascript
module.exports = {
  updateToken: true  // 自动同步 Authorization header
}
```

**配置方式对比：**

| 配置类型 | 示例 | 效果 |
|---------|------|------|
| `boolean` | `false` | 🚫 不使用令牌同步 |
| `boolean` | `true` | ✅ 自动同步 `Authorization` |
| `string` | `'auth'` | ✅ 同步指定 header：`auth` |
| `string[]` | `['auth', 'token']` | ✅ 同步多个 header |
| `object` | 见下方 | ✅ 自定义映射规则 |

```javascript
module.exports = {
  updateToken: {
    // 🔄 直接映射：原样传递
    'req.headers.authorization': 'req.headers.authorization',
    
    // 🔄 字段重命名：auth -> token  
    'req.headers.auth': 'req.headers.token',
    
    // 🎯 动态生成：根据上次请求动态设置值
    'req.headers.user-id': ({req, value}) => {
      // value 是上一次请求中的值
      const userId = extractUserIdFromToken(value)
      return ['req.headers.user-id', userId]
    },
    
    // 🔐 复杂逻辑：根据环境和用户动态处理
    'req.headers.env-token': ({req, value}) => {
      const env = process.env.NODE_ENV
      const token = env === 'dev' ? 'dev-token' : value
      return ['req.headers.env-token', token]
    }
  }
}
```

**实际应用场景：**

```javascript
// 场景1：微信小程序开发
module.exports = {
  updateToken: {
    'req.headers.authorization': 'req.headers.authorization',
    'req.headers.session-key': 'req.headers.session-key',
    'req.headers.openid': 'req.headers.openid'
  }
}

// 场景2：JWT 令牌 + 用户ID
module.exports = {
  updateToken: {
    'req.headers.authorization': ({req, value}) => {
      // 从 JWT 中解析用户ID
      const payload = JSON.parse(atob(value.split('.')[1]))
      return ['req.headers.user-id', payload.userId]
    }
  }
}

// 场景3：多租户系统
module.exports = {
  updateToken: ['authorization', 'tenant-id', 'org-id']
}
```

::: tip 💡 使用技巧
**工作流程：**
1. 🔐 用户通过真实接口登录获取 token
2. 📝 MockM 自动记录认证信息
3. 🎯 后续调试/重放时自动携带认证信息
4. ✨ 无需手动复制粘贴 token

**最佳实践：**
- 开发阶段使用 `true`，简单快速
- 生产环境使用详细配置，确保安全
- 定期清理过期的认证信息
:::

## config.apiInHeader
类型: `boolean | string`  
默认: `true`

🔗 **调试链接注入** - 在响应头中自动添加测试页面地址，一键直达调试界面

每次 API 调用后，自动在响应头中注入调试链接，点击即可查看详细信息：

```javascript
module.exports = {
  apiInHeader: true        // 使用默认 header: x-test-api
  // apiInHeader: 'debug-url'  // 自定义 header 名称
  // apiInHeader: false       // 禁用此功能
}
```

**效果演示：**
```bash
# 发起请求
curl http://localhost:9000/api/users

# 响应头中会出现
x-test-api: http://localhost:9005/#/history,get/api/users
```

**点击链接后能看到：**
- 📋 完整的请求参数
- 📊 响应数据和状态码
- ⏱️ 请求耗时统计
- 🔄 一键重放功能
- 📝 历史调用记录

**自定义 header 名称：**
```javascript
module.exports = {
  apiInHeader: 'my-debug-link'  // 自定义名称
}
```

**在浏览器中使用：**
```javascript
// 前端代码可以读取调试链接
fetch('/api/users')
  .then(response => {
    const debugUrl = response.headers.get('x-test-api')
    console.log('🔧 调试链接:', debugUrl)
    // 开发环境下自动打开调试页面
    if (process.env.NODE_ENV === 'development') {
      window.open(debugUrl)
    }
  })
```

- false 不添加调试地址
- true 时 `x-test-api`.
- string: 时为自定义 header 字段.

## config.proxy
类型: `string | object`  
默认: `http://www.httpbin.org/`

🌉 **代理桥梁** - MockM 的核心功能，连接前端与后端的智能代理

这是解决跨域问题、拦截修改请求的神器，支持从简单转发到复杂拦截的所有场景。

> 💡 **提示**: 在[测试用例](https://wll8.github.io/mockm/case/)中搜索 `config.proxy` 查看更多功能演示

### 🚀 基础用法

**字符串形式：一键代理**
```javascript
module.exports = {
  proxy: 'https://api.github.com'  // 所有请求转发到 GitHub API
}
```

**对象形式：精细控制**  
```javascript
module.exports = {
  proxy: {
    '/': 'https://api.github.com',        // 默认代理目标
    '/api/v1': 'https://api.example.com', // 特定路径代理
    '/upload': 'https://upload.cdn.com'   // 文件上传单独代理
  }
}
```

### ⚡ 响应数据快速修改

使用数组语法 `[A, B]` 轻松修改 JSON 响应，无需复杂中间件：

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // 🎯 直接替换整个响应
    '/api/simple': [{ success: true, message: '修改成功' }],
    
    // 🔧 修改响应中的特定字段
    '/api/user': ['data.name', '张三'],
    '/api/status': ['status', 'success'],
    
    // 🧩 浅合并对象（替换字段）
    '/api/merge': [{ newField: 'added', status: 'updated' }, '...'],
    
    // 🔄 深合并对象（保留原有字段）
    '/api/deep': [{ extra: { info: 'new' } }, 'deep']
  }
}
```

**修改方式对比表：**

| 数组长度 | [A, B] 类型 | 处理方式 | 示例输入 | 操作 | 示例输出 |
|---------|-------------|----------|----------|------|----------|
| 0-1 | `[any]` | 🔄 直接替换 | `{a: 1}` | `[123]` | `123` |
| 2 | `[string, any]` | 🎯 路径替换 | `{a: 1}` | `['a', 2]` | `{a: 2}` |
| 2 | `[object, '...']` | 🧩 浅合并 | `{a: {x: 1}, b: 2}` | `[{a: {y: 2}}, '...']` | `{a: {y: 2}, b: 2}` |
| 2 | `[object, 'deep']` | 🔄 深合并 | `{a: {x: 1}, b: 2}` | `[{a: {y: 2}}, 'deep']` | `{a: {x: 1, y: 2}, b: 2}` |

### 🎯 高级拦截和修改

**使用函数进行复杂处理：**
```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // 📊 数据统计和格式化
    '/api/stats': [({req, json}) => {
      return {
        ...json,
        timestamp: Date.now(),
        userAgent: req.headers['user-agent'],
        processed: true
      }
    }],
    
    // 🔐 根据用户权限过滤数据
    '/api/sensitive': [({req, json}) => {
      const isAdmin = req.headers.role === 'admin'
      if (isAdmin) return json
      
      // 普通用户移除敏感信息
      delete json.secretData
      return json
    }],
    
    // 🌍 国际化处理
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

### 🛠️ 中间件式拦截

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',
    
    // ⏱️ 添加延时模拟网络慢的情况
    '/api/slow': {
      target: 'https://api.example.com',
      mid(req, res, next) {
        setTimeout(next, 2000)  // 延时 2 秒
      }
    },
    
    // 🔒 请求前的权限验证
    '/api/protected': {
      target: 'https://api.example.com',  
      mid(req, res, next) {
        if (!req.headers.authorization) {
          return res.status(401).json({ error: '需要登录' })
        }
        next()
      }
    },
    
    // 📝 请求和响应日志
    '/api/logged': {
      target: 'https://api.example.com',
      mid(req, res, next) {
        console.log(`🚀 请求: ${req.method} ${req.url}`)
        next()
      },
      res(req, res, data) {
        console.log(`✅ 响应: ${res.statusCode}`)
        return data
      }
    }
  }
}
```

### 🌍 路径路由：精准转发

```javascript
module.exports = {
  proxy: {
    '/': 'https://api.example.com',          // 默认代理
    '/api/v1': 'https://v1.api.com',        // API v1 版本
    '/api/v2': 'https://v2.api.com', // API v2 版本
    '/upload': 'https://cdn.upload.com',     // 文件上传服务
    '/payment': 'https://pay.gateway.com'   // 支付网关
  }
}
```

**实际应用场景：**
- 🏗️ **微服务架构** - 不同路径对应不同服务
- 🔄 **版本管理** - 同时支持多个 API 版本
- ⚡ **负载均衡** - 按业务模块分散请求
- 🧪 **A/B 测试** - 部分流量导向测试环境

::: tip 🚀 性能优化建议

**参考配置：** 
类似 webpack 的 `devServer.proxy`，基于 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#http-proxy-options) 实现
:::

---


::: details 🎯 数据处理实战演练
掌握这些实用技巧，让数据操作如丝般顺滑！

**🗑️ 直接清空 - 一键归零**

```javascript
// 📥 原始数据
{
  "userInfo": { "name": "张三", "age": 25 }
}

// 🔧 操作：完全清空响应
[] 或 [undefined]

// 📤 处理结果
undefined  // 接口返回空响应
```

**🔄 整体替换 - 焕然一新**

```javascript
// 📥 原始数据  
{
  "status": "pending"
}

// 🔧 操作：返回全新的状态码
[200]

// 📤 处理结果
200  // 直接返回数字状态
```

**🎯 精准修改 - 定点更新**

```javascript
// 📥 原始数据
{
  "user": {
    "name": "张三",
    "status": "offline"  
  }
}

// 🔧 操作：只修改用户状态
['user.status', 'online']

// 📤 处理结果
{
  "user": {
    "name": "张三",
    "status": "online"  // ✨ 只有这里变了
  }
}
```

**🗑️ 选择性删除 - 精确移除**

```javascript
// 📥 原始数据
{
  "profile": {
    "name": "李四",
    "password": "secret123",  // 敏感信息
    "email": "test@example.com"
  }
}

// 🔧 操作：移除敏感字段
['profile.password', undefined]

// 📤 处理结果
{
  "profile": {
    "name": "李四",
    "email": "test@example.com"  // password 字段被移除
  }
}
```

**🤝 浅层合并 - 直接替换对象**

```javascript
// 📥 原始数据
{
  "userSettings": {
    "theme": "dark",
    "language": "zh-CN"
  },
  "version": "1.0"
}

// 🔧 操作：替换整个设置对象
[
  {
    "userSettings": {
      "theme": "light"  // 新的设置完全替换旧的
    },
    "version": "2.0"
  },
  "..."  // 浅合并标记
]

// 📤 处理结果
{
  "userSettings": {
    "theme": "light"  // ⚠️ language 丢失了
  },
  "version": "2.0"
}
```

**🔗 深度合并 - 智能融合**

```javascript
// 📥 原始数据
{
  "config": {
    "ui": {
      "theme": "dark",
      "fontSize": 14
    }
  }
}

// 🔧 操作：深度合并配置
[
  {
    "config": {
      "ui": {
        "theme": "light"  // 只更新主题
      },
      "api": {
        "timeout": 5000   // 新增 API 配置  
      }
    }
  },
  "deep"  // 深度合并标记
]

// 📤 处理结果
{
  "config": {
    "ui": {
      "theme": "light",  // ✨ 主题更新了
      "fontSize": 14     // ✅ 字体大小保留了
    },
    "api": {
      "timeout": 5000    // 🆕 新增的配置
    }
  }
}
```

:::

## 🌐 智能请求转发

**一行配置，秒变全能代理** - 支持任意路径转发，让你的 Mock 服务瞬间拥有整个互联网的后端能力！

```javascript {4-6}
module.exports = {
  proxy: {
    '/': 'https://httpbin.org/',              // 🏠 默认转发目标
    '/api/weather': 'https://api.weather.com', // 🌤️ 天气服务
    '/api/news': 'https://newsapi.org',        // 📰 新闻接口
  }
}
```

**🚀 实战场景演示：**

| 路径规则 | 转发目标 | 使用场景 |
|---------|----------|----------|
| `/api/user/*` | `https://user-service.com` | 👤 用户管理服务 |
| `/api/order/*` | `https://order-service.com` | 🛒 订单处理服务 |
| `/upload/*` | `https://cdn.example.com` | 📁 文件上传服务 |
| `/payment/*` | `https://pay.gateway.com` | 💳 支付网关服务 |

::: tip ⚡ 性能优化秘籍
转发功能基于高性能的 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware#http-proxy-options) 实现，与 webpack 的 `devServer.proxy` 配置完全兼容！
:::

## config.remote

::: details ⚠️ 实验性支持 & 免费服务的温馨提醒

MockM 使用 ngrok 的免费服务提供内网穿透，这意味着享受便利的同时也需要了解一些限制：

**💫 随机域名**
- 每次启动获得不同的 `xxx.ngrok.io` 域名
- 无法固定域名（注册用户可配置固定子域名）

**⏱️ 时间限制**  
- 单次连接有时长限制
- 超时后需要重新启动服务

**🚦 流量限制**
- 每分钟请求数有上限
- 适合开发测试，不适合生产环境

**🐌 网络延迟**
- 免费节点速度相对较慢
- 国内访问可能存在网络波动

**🆙 强制更新**
- ngrok 可能要求更新到最新版本
- 更新失败会导致服务无法启动

---

**🚨 版本兼容性说明**

如果你使用的是 `v1.1.25-alpha.15` 之前的版本，可能会遇到 ngrok 强制更新导致的启动失败。

**解决方案：**

**方案 1：升级 MockM（推荐）**
```bash
npm update -g mockm  # 升级到最新版本
```

**方案 2：手动更新 ngrok**
```bash
# 进入 MockM 安装目录
cd node_modules/mockm
npx ngrok update
```

注册 ngrok 账号并配置 authtoken 可以解锁更多权益，详见 `config.remoteToken` 配置项。

:::


类型: `boolean`  
默认: `false`

🌍 **内网穿透黑科技** - 一键开启外网访问，让本地 Mock 服务瞬间拥有全球触达能力！

想让远程同事、移动设备、甚至海外用户都能访问你本地的 Mock 服务？只需要一行配置：

```javascript
module.exports = {
  remote: true  // ✨ 魔法开启！本地服务变身全球接口
}
```

**🔥 应用场景大盘点：**
- 📱 **移动端调试** - iPhone、Android 随时随地测试接口
- 👥 **远程协作** - 异地同事直接访问你的 Mock 数据
- 🌐 **跨平台测试** - 微信小程序、H5 应用无障碍对接
- 🧪 **演示神器** - 客户演示时无需繁琐的环境搭建

## config.remoteToken
类型: `string | string[]`  
默认: `[]`

🔑 **ngrok 认证令牌** - 使用注册账号的 authtoken，解锁更多功能

免费用户只能开启 1 个通道，注册用户可以获得更多权益：

```javascript
module.exports = {
  remote: true,
  remoteToken: 'your_ngrok_authtoken_here'
}
```

**多端口配置：**
```javascript
module.exports = {
  remoteToken: [
    'token_for_main_port',    // 主服务端口 (port)
    'token_for_test_port',    // 测试端口 (testPort)  
    'token_for_replay_port'   // 重放端口 (replayPort)
  ]
}
```

**如果你的 token 支持 3 个通道：**
```javascript
module.exports = {
  remoteToken: ['your_token', 'your_token', 'your_token']
}
```

**获取 Token 步骤：**
1. 🌐 访问 [ngrok.com](https://ngrok.com) 注册免费账号
2. 🔑 在控制台获取 authtoken
3. ⚙️ 配置到 MockM 中享受更稳定的服务

**注册用户权益：**
- 🔗 **固定域名** - 可配置固定的子域名
- ⏱️ **更长时间** - 连接时间限制更宽松
- 🚀 **更高速度** - 更好的网络质量
- 📊 **统计面板** - 查看流量和连接统计

## config.openApi
类型: `string | array | object`  
默认: `http://httpbin.org/spec.json`

📋 **智能文档关联** - 自动匹配 OpenAPI/Swagger 文档，让 API 调试更专业

将你的 Mock 服务与 OpenAPI 文档完美结合，获得专业级的 API 调试体验：

```javascript
module.exports = {
  openApi: 'https://petstore.swagger.io/v2/swagger.json'
}
```

**配置方式全览：**

| 类型 | 配置示例 | 适用场景 |
|------|----------|----------|
| `string` | `'http://api.com/spec.json'` | 🎯 单一 API 文档 |
| `array` | `['doc1.json', 'doc2.json']` | 🔄 多文档智能匹配 |
| `object` | `{'/api/v1': 'v1.json'}` | 🎨 精确路径匹配 |

**高级配置：多服务管理**
```javascript
module.exports = {
  openApi: {
    '/api/user': 'https://user-service.com/swagger.json',
    '/api/order': 'https://order-service.com/swagger.json',
    '/api/payment': 'https://payment.com/openapi.json'
  }
}
```

**身份认证支持：**
```javascript
module.exports = {
  // 🔐 Basic Auth 认证
  openApi: 'http://username:password@api.com/spec.json'
}
```

**智能匹配规则：**
- 📊 **Array 模式** - 自动选择匹配度最高的文档
- 🎯 **Object 模式** - 基于正则表达式精确匹配：`new RegExp(key, 'i').test(pathname)`
- 📂 **优先级** - 目录层级深的路径优先匹配

**实际应用场景：**
```javascript
// 🏢 企业微服务架构
module.exports = {
  openApi: {
    '/api/user-service': 'http://user.internal/swagger.json',
    '/api/order-service': 'http://order.internal/swagger.json',
    '/api/notification': 'http://notify.internal/openapi.json'
  }
}

// 📱 移动端 + Web 端分离
module.exports = {
  openApi: {
    '/mobile/api': 'https://mobile-api.com/swagger.json',
    '/web/api': 'https://web-api.com/swagger.json'
  }
}
```

**获得的能力：**
- 📋 **自动文档** - 基于 OpenAPI 规范的完整接口文档
- 🧪 **参数校验** - 自动验证请求参数格式
- 🎨 **UI 调试** - 内置 Swagger UI 风格的调试界面
- 🔄 **智能匹配** - 根据请求路径自动选择对应文档

## config.cors
类型: `boolean`  
默认: `true`

🌍 **跨域自由通行证** - 一键解决前端开发中最头疼的跨域问题

```javascript
module.exports = {
  cors: true   // ✅ 自动处理所有跨域请求（推荐）
  // cors: false  // ❌ 保持浏览器默认跨域策略
}
```

**工作原理：** 
自动为所有响应添加必要的 CORS 头信息：
```bash
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

**使用场景：**
- 🎯 **开发调试** - 前端直接调用任意域名的 API
- 🧪 **本地测试** - 无需配置复杂的代理规则
- 📱 **跨平台开发** - Web、移动端共享同一套 Mock 服务

**何时关闭：**
- 🔒 需要测试真实的跨域限制
- 🧪 模拟生产环境的安全策略
- 🔐 特殊的企业安全要求

## config.dataDir
类型: `string`  
默认: `${os.homedir()}/.mockm/${configPathByName}/httpData/`

📁 **数据仓库** - HTTP 请求记录和缓存数据的专属存储空间

```javascript
module.exports = {
  dataDir: './my-api-data'  // 自定义数据目录
}
```

**目录结构预览：**
```
httpData/
├── db.json              # RestAPI 数据库文件
├── httpHistory.json     # 请求历史记录  
├── apiWeb.json         # Web UI 创建的接口
├── store.json          # 用户配置存储
└── request/            # 请求响应详细数据
    ├── req-123.json    # 请求详情
    └── res-123.json    # 响应详情
```

**自定义路径示例：**
```javascript
// 🏠 项目内目录
dataDir: './mock-data'

// 📂 绝对路径
dataDir: '/Users/username/mock-storage'

// 💼 企业级配置
dataDir: `/data/mockm/${process.env.PROJECT_NAME}`
```

## config.dbJsonPath
类型: `string`  
默认: `${config.dataDir}/db.json`

🗄️ **数据库文件路径** - RestAPI 数据的持久化存储位置

```javascript
module.exports = {
  dbJsonPath: './database/api-data.json'
}
```

这个文件存储了所有通过 `config.db` 生成的 RestAPI 数据，支持完整的 CRUD 操作。

## config.dbCover
类型: `boolean`  
默认: `false`

🔄 **数据重载策略** - 控制服务重启时如何处理已有数据

```javascript
module.exports = {
  dbCover: false  // ✅ 保留已有数据，仅补充新增（推荐）
  // dbCover: true   // 🔄 完全重新生成，丢弃用户数据
}
```

**模式对比：**

| 模式 | 已有数据 | 新增数据 | 用户修改 | 适用场景 |
|------|----------|----------|----------|----------|
| `false` | ✅ 保留 | ✅ 补充 | ✅ 保留 | 🏃‍♂️ 开发调试 |
| `true` | ❌ 清除 | ✅ 重建 | ❌ 丢失 | 🧪 测试重置 |

::: warning 💡 常见问题解决

**Q: 修改了 `config.db` 中的深层属性但没有生效？**

A: 这是因为对象数据已经存在，MockM 不会覆盖现有数据。

**解决方案：**
```bash
# 方法1：删除特定对象（推荐）
# 手动编辑 db.json，删除要更新的对象

# 方法2：完全重建（数据会丢失）
# 设置 dbCover: true 或删除整个 db.json

# 方法3：使用不同的数据键
# 将 books 改为 books2，强制重新生成
```
:::

## config.db
类型: `object | function`  
默认: `{}`

🎭 **数据魔法师** - 基于 json-server 的强大 RestAPI 数据生成器

一个配置，瞬间获得完整的 RestAPI 服务，包含增删改查、分页、搜索、排序等所有功能！

### 🚀 快速上手

**静态数据：**
```javascript
module.exports = {
  db: {
    users: [
      { id: 1, name: '张三', age: 25 },
      { id: 2, name: '李四', age: 30 }
    ],
    posts: [
      { id: 1, title: '第一篇文章', userId: 1 },
      { id: 2, title: '第二篇文章', userId: 2 }
    ]
  }
}
```

**动态数据：**
```javascript
module.exports = util => ({
  db: {
    // 📊 使用 MockJS 生成随机数据
    products: util.libObj.mockjs.mock({
      'data|50-100': [{
        'id|+1': 1,
        name: '@ctitle(5,10)',
        price: '@integer(100,9999)',
        'category|1': ['电子产品', '服装', '食品', '图书'],
        description: '@cparagraph(1,3)',
        image: '@image("200x200")',
        createdAt: '@datetime',
        'status|1': ['active', 'inactive']
      }]
    }).data
  }
})
```

### 🎯 自动生成的 API 接口

配置上面的 `products` 数据后，自动获得：

**基础 CRUD：**
```bash
GET    /products     # 获取所有商品
POST   /products     # 创建新商品
GET    /products/1   # 获取指定商品  
PUT    /products/1   # 完整更新商品
PATCH  /products/1   # 部分更新商品
DELETE /products/1   # 删除商品
```

**高级查询：**
```bash
# 🔍 字段过滤
GET /products?category=电子产品&status=active

# 🔍 多值查询
GET /products?id=1&id=2&id=3

# 🔍 深层查询
GET /products?user.profile.age=25

# 📄 分页查询
GET /products?_page=2&_limit=10

# 📊 排序
GET /products?_sort=price&_order=desc
GET /products?_sort=name,price&_order=asc,desc

# 📐 范围查询
GET /products?price_gte=100&price_lte=500

# 🔍 模糊搜索
GET /products?name_like=手机
GET /products?category_like=^电子  # 正则支持

# 🔍 全文搜索
GET /products?q=苹果
```

### 🏗️ 实战案例：博客系统

```javascript
module.exports = util => ({
  db: util.libObj.mockjs.mock({
    // 📚 文章数据
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
    
    // 👥 作者数据
    'authors|10': [{
      'id|+1': 1,
      name: '@cname',
      email: '@email',
      avatar: '@image("100x100")',
      bio: '@cparagraph(1,2)',
      'role|1': ['admin', 'editor', 'writer']
    }],
    
    // 📂 分类数据
    'categories|5': [{
      'id|+1': 1,
      name: '@pick(["前端开发","后端技术","移动开发","人工智能","产品设计"])',
      description: '@cparagraph(1)',
      color: '@color'
    }]
  })
})
```

**立即可用的接口：**
```bash
# 📚 获取已发布的文章
GET /posts?status=published&_sort=createdAt&_order=desc

# 🔍 搜索包含"JavaScript"的文章
GET /posts?q=JavaScript

# 👤 获取特定作者的文章
GET /posts?authorId=1

# 📊 分页获取文章列表
GET /posts?_page=1&_limit=5&_expand=author&_expand=category
```

### 💡 专业技巧

**关联数据查询：**
```bash
# 🔗 展开关联数据
GET /posts?_expand=author        # 展开作者信息
GET /posts?_expand=category      # 展开分类信息  
GET /authors?_embed=posts        # 嵌入作者的所有文章
```

**自定义 ID 字段：**
```javascript
// 使用 uuid 作为主键
db: {
  products: Array.from({length: 10}, (_, i) => ({
    uuid: `product-${Date.now()}-${i}`,
    name: `产品${i+1}`
  }))
}
```

基于强大的 [json-server](https://github.com/typicode/json-server) 实现，所有修改都会实时保存到数据文件中，就像真实的数据库一样！

### 🎯 数据查询全攻略

掌握这些查询技巧，让你的数据检索如丝般顺滑！

**📈 智能排序 - 数据有序呈现**
```http
# 📊 单字段排序：按浏览量升序
GET /books?_sort=view&_order=asc

# 🎯 多字段排序：先按用户排序，再按浏览量排序  
GET /books?_sort=user,view&_order=desc,asc
```

**✂️ 精准截取 - 想要多少拿多少**
```http
# 📌 区间截取：获取第3-5条数据
GET /books?_start=2&_end=5

# 📄 分页截取：从第21条开始，取10条数据
GET /books?_start=20&_limit=10
```

**🧮 条件运算 - 精确筛选数据**
```http
# 📊 范围查询：浏览量在3000-7000之间
GET /books?view_gte=3000&view_lte=7000

# ❌ 排除筛选：排除ID为1的记录
GET /books?id_ne=1

# 🔍 模糊匹配：类型包含css或js的书籍（支持正则）
GET /books?type_like=css|js
```

**🔍 全文检索 - 一键找到所有相关内容**
```http
# 🎯 全局搜索：在所有字段中查找"张三"
GET /books?q=张三
```

::: tip 💡 查询参数速查表

| 参数 | 功能 | 示例 |
|------|------|------|
| `_sort` | 排序字段 | `_sort=name,age` |
| `_order` | 排序方向 | `_order=asc,desc` |
| `_start` | 起始索引 | `_start=10` |
| `_end` | 结束索引 | `_end=20` |
| `_limit` | 限制数量 | `_limit=5` |
| `_gte` | 大于等于 | `price_gte=100` |
| `_lte` | 小于等于 | `price_lte=500` |
| `_ne` | 不等于 | `status_ne=deleted` |
| `_like` | 模糊匹配 | `name_like=^张` |
| `q` | 全文搜索 | `q=关键词` |

:::

## config.route
类型: `object`  
默认: `{}`

🛣️ **路由重写魔法** - 让 API 路径随心所欲，支持复杂的路径映射

想要为 RestAPI 接口添加前缀或者重新组织路径结构？一个配置搞定：

```javascript
module.exports = {
  route: {
    // 🎯 添加统一前缀
    '/api/v1/*': '/$1',           // /api/v1/books/1 → /books/1
    '/test/db/api/*': '/$1',      // /test/db/api/users → /users
    
    // 🔄 路径重映射
    '/old-api/*': '/new-api/$1',  // 兼容旧版本 API
    '/mobile/*': '/api/$1',       // 移动端专用路径
    
    // 📱 多版本支持
    '/v2/users': '/users',        // v2 版本映射到默认版本
    '/legacy/*': '/deprecated/$1' // 遗留接口迁移
  }
}
```

**实际应用场景：**

```javascript
// 🏢 企业级 API 统一管理
module.exports = {
  db: {
    users: [...],    // 生成 /users 接口
    orders: [...],   // 生成 /orders 接口
    products: [...] // 生成 /products 接口
  },
  route: {
    // 对外提供统一的 API 前缀
    '/api/v1/*': '/$1',
    
    // 不同客户端使用不同前缀
    '/mobile/api/*': '/$1',
    '/web/api/*': '/$1',
    '/admin/api/*': '/$1',
    
    // 特殊业务模块映射
    '/crm/customers': '/users',
    '/ecommerce/items': '/products'
  }
}
```

**通配符语法：**
- `*` - 匹配任意字符（不包括 `/`）
- `$1, $2, ...` - 引用匹配的分组内容

**基于 [json-server 路由](https://github.com/typicode/json-server#add-custom-routes) 实现**

## config.apiWeb
类型: `string`  
默认: `./webApi.json`

🎨 **可视化接口存储** - Web UI 创建的接口数据存储位置

通过 MockM 的 Web 界面创建的接口会保存在这个文件中：

```javascript
module.exports = {
  apiWeb: './my-web-apis.json'  // 自定义存储路径
}
```

**优先级说明：**
- 🥇 `config.api` - 代码定义的接口（最高优先级）
- 🥈 `config.apiWeb` - Web UI 创建的接口
- 🥉 `config.db` - RestAPI 自动生成的接口

**使用场景：**
- 👥 **团队协作** - 产品经理通过 Web UI 创建接口原型
- 🎯 **快速测试** - 无需写代码即可创建临时接口
- 📊 **数据收集** - 收集前端开发者的接口需求

## config.apiWebWrap
类型: `boolean | function`  
默认: `wrapApiData`

🎁 **响应数据包装器** - 为 Web UI 创建的接口统一添加数据结构

默认的包装函数会将原始数据包装成标准格式：

```javascript
// 🔧 默认包装函数
function wrapApiData({data, code = 200}) {
  code = String(code)
  return {
    code,
    success: Boolean(code.match(/^[2]/)), // 2xx 状态码为 true
    data,
  }
}
```

**自定义包装器：**
```javascript
module.exports = {
  // 🎯 自定义响应格式
  apiWebWrap: ({data, code = 200}) => ({
    status: code,
    message: code === 200 ? 'Success' : 'Error',
    result: data,
    timestamp: Date.now()
  }),
  
  // 🚫 禁用包装（返回原始数据）
  apiWebWrap: false,
  
  // 📊 根据状态码动态包装
  apiWebWrap: ({data, code = 200}) => {
    if (code >= 400) {
      return { error: true, message: data, code }
    }
    return { success: true, data, code }
  }
}
```

**实际效果对比：**
```javascript
// 🎨 Web UI 中创建的接口返回
{ message: 'Hello World' }

// ✨ 经过默认包装后
{
  code: 200,
  success: true,
  data: { message: 'Hello World' }
}
```

## config.api
类型: `object | function`  
默认: `{}`

🚀 **自定义接口核心** - MockM 最强大的功能，创建任意复杂度的 API 接口

这是 MockM 的灵魂功能，支持从简单数据返回到复杂业务逻辑的所有场景！

> 💡 **提示**: 在[测试用例](https://wll8.github.io/mockm/case/)中搜索 `config.api` 查看更多功能演示

### 🎯 基础用法

**静态数据返回：**
```javascript
module.exports = {
  api: {
    // 🎯 简单数据返回（支持所有 HTTP 方法）
    '/api/status': { status: 'ok', message: '服务正常' },
    
    // 🎯 指定 HTTP 方法
    'GET /api/users': [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' }
    ],
    
    // 🎯 不同方法返回不同数据
    'POST /api/users': { message: '用户创建成功' },
    'DELETE /api/users/:id': { message: '用户删除成功' }
  }
}
```

**函数式接口：**

用于动态接口数据支持。

```javascript
module.exports = {
  api: {
    // 📊 动态数据处理
    'GET /api/time': (req, res) => {
      res.json({
        timestamp: Date.now(),
        datetime: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    },
    
    // 🔐 请求参数处理
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
          message: '用户名或密码错误'
        })
      }
    }
  }
}
```

### 🌐 WebSocket 支持

通过 ws 标志即可实现 WebSocket 。

```javascript
module.exports = {
  api: {
    // 💬 WebSocket 聊天室
    'ws /chat': (ws, req) => {
      console.log('新用户连接')
      
      // 欢迎消息
      ws.send(JSON.stringify({
        type: 'welcome',
        message: '欢迎进入聊天室！'
      }))
      
      // 消息处理
      ws.on('message', (data) => {
        const message = JSON.parse(data)
        console.log('收到消息:', message)
        
        // 回声服务
        ws.send(JSON.stringify({
          type: 'echo',
          original: message,
          timestamp: Date.now()
        }))
      })
      
      // 断开连接
      ws.on('close', () => {
        console.log('用户断开连接')
      })
    },
    
    // 📊 实时数据推送
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

### 🛠️ 中间件模式

可以直接写 express 中间件。

```javascript
module.exports = {
  api: {
    // 🔧 全局中间件
    'use /': (req, res, next) => {
      // 添加 CORS 头
      res.header('Access-Control-Allow-Origin', '*')
      
      // 添加自定义头
      res.header('X-Powered-By', 'MockM')
      
      // 记录请求日志
      console.log(`${req.method} ${req.url}`)
      
      next()
    },
    
    // 🔐 权限验证中间件
    'use /api/protected': (req, res, next) => {
      const token = req.headers.authorization
      if (!token) {
        return res.status(401).json({ error: '需要登录' })
      }
      
      // 模拟 token 验证
      if (token !== 'Bearer valid-token') {
        return res.status(403).json({ error: 'token 无效' })
      }
      
      next()
    },
    
    // 📁 静态文件服务
    'use /static': require('serve-static')(`${__dirname}/public`),
    
    // 📁 多个静态目录
    'use /assets': [
      require('serve-static')(`${__dirname}/images`),
      require('serve-static')(`${__dirname}/documents`)
    ]
  }
}
```

### 🎯 拦截 RestAPI

可以对 config.db 生成的接口进行拦截处理。

```javascript
module.exports = {
  db: {
    books: [
      { id: 1, title: '书籍1', price: 100 },
      { id: 2, title: '书籍2', price: 200 }
    ]
  },
  api: {
    // 🔧 拦截并修改 RestAPI 的请求
    '/books/:id': (req, res, next) => {
      // 修改请求数据
      if (req.body) {
        req.body.updatedAt = new Date().toISOString()
      }
      
      // 继续执行原有的 RestAPI 逻辑
      next()
      
      // 修改响应数据
      res.mm.resHandleJsonApi = (arg) => {
        const { data, resHandleJsonApi } = arg
        
        // 添加额外信息
        if (data) {
          data.viewCount = Math.floor(Math.random() * 1000)
          data.isPopular = data.price > 150
        }
        
        // 调用默认处理函数
        return resHandleJsonApi(arg)
      }
    },
    
    // 🎯 完全覆盖 RestAPI 接口
    'GET /books/special': {
      message: '这是一个特殊的书籍接口',
      books: []
    }
  }
}
```

### 🧩 函数式配置

参考 [config.api.fn](../config/config_api_fn.md)，函数应返回一个对象。

### 📋 路由规则说明

| 格式 | 说明 | 示例 |
|------|------|------|
| `/path` | 🌐 所有 HTTP 方法 | `/api/users` |
| `GET /path` | 🎯 指定 HTTP 方法 | `GET /api/users` |
| `ws /path` | 🔌 WebSocket 接口 | `ws /chat` |
| `use /path` | 🔧 中间件模式 | `use /api` |

**路径参数支持：**
```javascript
module.exports = {
  api: {
    '/users/:id': (req, res) => {
      const userId = req.params.id
      res.json({ userId, name: `用户${userId}` })
    },
    
    '/posts/:category/:id': (req, res) => {
      const { category, id } = req.params
      res.json({ category, id, title: `${category}类别的第${id}篇文章` })
    }
  }
}
```

**优先级说明：**
1. 🥇 `config.api` - 自定义接口（最高优先级）
2. 🥈 `config.proxy` - 代理接口
3. 🥉 `config.db` - RestAPI 自动生成接口

基于 [Express.js](https://expressjs.com/en/guide/using-middleware.html) 中间件系统实现，支持完整的 Express API！

## config.resHandleReplay
类型: `function`  
默认: `({req, res}) => wrapApiData({code: 200, data: {}})`

🔄 **重放异常处理器** - 当历史记录无法满足重放请求时的降级策略

当重放模式下找不到对应的历史记录时，这个函数决定如何响应：

```javascript
module.exports = {
  // 🎯 友好的错误提示（推荐）
  resHandleReplay: ({req, res}) => ({
    code: 200,
    success: true,
    data: {},
    message: '暂无历史数据，返回空结果'
  }),
  
  // 🚨 明确的错误状态
  resHandleReplay: ({req, res}) => ({
    code: 404,
    success: false,
    error: '未找到对应的历史记录',
    path: req.path
  }),
  
  // 🎭 模拟真实数据
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

::: tip 💡 设计理念

**为什么默认返回 200 而不是 404？**

返回 404 可能导致前端页面频繁提示错误，影响用户体验。默认策略是告诉前端"接口正常"，返回空数据，让页面能够正常运行。

**适用场景：**
- 🧪 **测试环境** - 确保页面功能正常
- 🎭 **演示场景** - 避免显示错误信息
- 🔄 **渐进开发** - 部分接口未记录时的兜底
:::

## config.resHandleJsonApi
类型: `function`  
默认: `({req, res: { statusCode: code }, data}) => wrapApiData({code, data})`

🎁 **RestAPI 响应包装器** - 统一处理 config.db 生成的所有接口响应格式

这是 RestAPI 数据的最后一道加工环节，用于统一数据结构：

```javascript
module.exports = {
  // 🎯 自定义响应格式
  resHandleJsonApi: ({req, res: { statusCode: code }, data}) => ({
    status: code,
    result: data,
    timestamp: Date.now(),
    server: 'MockM'
  }),
  
  // 📊 分页数据处理
  resHandleJsonApi: ({req, res, data}) => {
    // 检查是否是分页请求
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
    
    // 普通请求
    return {
      code: res.statusCode,
      success: res.statusCode < 400,
      data
    }
  }
}
```

**实际效果：**
```javascript
// 🔧 原始 RestAPI 返回
[
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
]

// ✨ 经过包装后
{
  code: 200,
  success: true,
  data: [
    { id: 1, name: '张三' },
    { id: 2, name: '李四' }
  ]
}
```

## config.watch
类型: `string | string[]`  
默认: `[]`

👀 **文件监控热重载** - 监控指定文件变化，自动重启服务

让你的 Mock 服务像前端开发服务器一样智能，文件一改立即生效：

```javascript
module.exports = {
  // 🎯 监控单个文件
  watch: './data.json',
  
  // 📂 监控多个文件/目录
  watch: [
    './mock-data',           // 监控整个目录
    './config.json',         // 监控配置文件
    '../shared/constants.js', // 监控共享文件
    '/abs/path/to/file.js'   // 支持绝对路径
  ]
}
```

**实用场景：**
```javascript
module.exports = {
  watch: [
    // 📊 数据文件变化自动更新
    './mock-data.json',
    
    // 🔧 业务逻辑文件变化重启
    './business-logic.js',
    
    // 🎯 环境配置变化生效
    './.env',
    
    // 📋 文档变化同步
    './api-docs.md'
  ]
}
```

**路径说明：**
- ✅ **相对路径** - 相对于配置文件位置
- ✅ **绝对路径** - 完整的文件系统路径
- ✅ **文件和目录** - 都支持监控

## config.clearHistory
类型: `boolean | object | function`  
默认: `false`

🧹 **历史记录清理器** - 智能清理冗余的请求记录，保持数据库清洁

避免历史记录无限增长，影响性能和存储：

```javascript
module.exports = {
  clearHistory: true  // 使用默认策略清理
}
```

**详细配置：**
```javascript
module.exports = {
  clearHistory: {
    // ⏰ 保留时间：只清理 3 天前的记录
    retentionTime: 60 * 24 * 3,  // 分钟数
    
    // 📊 保留数量：相同请求保留 1 条最新记录
    num: 1  // 正数保留新记录，负数保留旧记录
  }
}
```

**自定义清理策略：**
```javascript
module.exports = {
  clearHistory: (historyList) => {
    const toDelete = []
    
    // 🎯 自定义清理逻辑
    historyList.forEach(item => {
      // 清理测试接口的记录
      if (item.url.includes('/test/')) {
        toDelete.push(item.id)
      }
      
      // 清理错误请求记录
      if (item.statusCode >= 400) {
        toDelete.push(item.id)  
      }
      
      // 清理过大的响应记录
      if (item.responseSize > 1024 * 1024) { // 1MB
        toDelete.push(item.id)
      }
    })
    
    return toDelete  // 返回要删除的记录 ID 列表
  }
}
```

**默认清理规则：**
判断请求是否"相同"的依据：
- 🌐 请求 URL 
- 🎯 请求方法 (GET/POST/...)
- 📊 状态码
- 🔐 请求体 MD5
- 📦 响应体 MD5

## config.guard
类型: `boolean`  
默认: `false`

🛡️ **进程守护模式** - 服务异常退出时自动重启，确保服务稳定性

```javascript
module.exports = {
  guard: true  // 开启守护进程
}
```

**适用场景：**
- 🏢 **生产环境** - 确保服务高可用性
- 🧪 **长期测试** - 避免测试中断
- 📱 **演示环境** - 保证演示顺利进行
- 🔄 **无人值守** - 服务器自动化运维

**工作原理：**
1. 🔍 监控主进程状态
2. 💥 检测到异常退出
3. 📝 记录错误日志  
4. 🚀 自动重新启动服务
5. 🔔 可选通知机制

::: warning ⚠️ 注意事项
- 确保退出原因不是配置错误，否则会无限重启
- 建议配合日志监控，及时发现问题
- 生产环境建议使用 PM2 等专业进程管理工具
:::

## config.backOpenApi
类型: `boolean | number`  
默认: `10`

📋 **OpenAPI 文档备份** - 定期备份 OpenAPI 文档变更，追踪接口演进历史

```javascript
module.exports = {
  backOpenApi: 5,    // 每 5 分钟检查一次更新
  // backOpenApi: true,  // 使用默认间隔（10分钟）
  // backOpenApi: false  // 禁用自动备份
}
```

**功能特点：**
- 📅 **定期检查** - 按设定间隔检测文档更新
- 💾 **版本存储** - 保存到 `${config.dataDir}/openApiHistory` 
- 🔍 **变更追踪** - 对比文档差异
- 📊 **历史回溯** - 查看接口变更历史

**使用场景：**
- 📈 **接口演进追踪** - 记录 API 变更历史
- 🔄 **版本对比** - 对比不同时期的接口定义
- 📋 **文档审计** - API 治理和合规检查
- 🧪 **兼容性测试** - 基于历史版本进行测试

**存储位置：**
```
${dataDir}/openApiHistory/
├── 2024-01-15_10-30-00.json
├── 2024-01-15_10-40-00.json  
└── latest.json
```

## config.static
类型: `string | object | array`  
默认: `undefined`

📁 **静态文件服务器** - 将 MockM 变身为强大的静态资源服务器，支持 SPA 应用

让你的 Mock 服务器不仅能提供 API，还能托管前端应用：

### 🚀 快速上手

**简单模式：**
```javascript
module.exports = {
  static: 'public'  // 访问 http://localhost:9000/ 即可访问 public 目录
}
```

**SPA 应用支持：**
```javascript
module.exports = {
  static: {
    fileDir: 'dist',      // Vue/React 构建输出目录
    mode: 'history'       // 支持 HTML5 History 模式
  }
}
```

::: details 示例

``` js
{
  static: `public`, // 访问 http://127.0.0.1:9000/ 则表示访问 public 中的静态文件, 默认索引文件为 index.html
  static: { // 访问 dist 目录下 history 模式的项目
    fileDir: `dist`,
    mode: `history`,
  },
  static: [ // 不同的路径访问不同的静态文件目录
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
类型: `boolean | string | string[] | DisableRecord | DisableRecord[]`  
默认: `false`

🧹 **请求记录过滤器** - 精确控制哪些请求不被记录，保持历史数据的清洁与聚焦

有些请求你可能不想记录：测试接口、敏感数据、或者噪音请求。这个配置让你轻松过滤：

### 🚀 快速上手

**全局控制：**
```javascript
module.exports = {
  disableRecord: false,  // ✅ 记录所有请求（默认）
  // disableRecord: true     // ❌ 不记录任何请求
}
```

**路径过滤：**
```javascript
module.exports = {
  // 🎯 不记录测试接口
  disableRecord: '^/api/test/',
  
  // 📂 不记录多个路径
  disableRecord: [
    '^/api/debug/',
    '^/health-check$',
    '/temp/'
  ]
}
```

### 🎯 精确控制

**对象配置：**
```javascript
module.exports = {
  disableRecord: {
    path: '^/api/sensitive/',  // 匹配路径的正则表达式
    method: 'POST',           // 只过滤 POST 请求
    num: 0                    // 0 = 不记录，正数 = 保留最新 n 条
  }
}
```

**多规则组合：**
```javascript
module.exports = {
  disableRecord: [
    // 🔐 不记录登录相关的 POST 请求
    { path: '/auth/', method: 'POST' },
    
    // 📊 健康检查接口完全不记录
    { path: '^/health' },
    
    // 📝 日志接口只保留最近 5 条
    { path: '/logs/', num: 5 },
    
    // 🚀 上传接口只保留最新 1 条
    { path: '/upload', method: 'POST', num: 1 }
  ]
}
```

### 🏆 实际应用场景

**开发环境清理：**
```javascript
module.exports = {
  disableRecord: [
    // 🧪 测试接口不记录
    '^/api/test/',
    '^/debug/',
    '/mock/',
    
    // 📊 监控接口不记录
    '/metrics',
    '/health',
    
    // 🔄 心跳检测不记录
    '/ping',
    '/status'
  ]
}
```

**生产环境保护：**
```javascript
module.exports = {
  disableRecord: [
    // 🔐 敏感接口不记录
    { path: '/api/password', method: 'POST' },
    { path: '/api/token', method: 'POST' },
    
    // 📊 高频接口限制记录数量
    { path: '/api/analytics', num: 10 },
    { path: '/api/tracking', num: 5 }
  ]
}
```

**性能优化：**
```javascript
module.exports = {
  disableRecord: [
    // 🎯 静态资源不记录
    '\\.(css|js|png|jpg|gif|ico)$',
    
    // 📱 移动端埋点不记录
    '/api/mobile/track',
    
    // 🔄 WebSocket 连接不记录
    '/socket.io/'
  ]
}
```

### 📋 配置参数详解

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | `string` | 🎯 请求路径的正则表达式 |
| `method` | `string` | 🎯 HTTP 方法，不指定则匹配所有 |
| `num` | `number` | 📊 保留记录数量，0=不记录 |

**TypeScript 类型定义：**
```typescript
interface DisableRecord {
  path: string     // 请求地址，将被转换为正则
  method?: Method  // 请求方法，可选
  num?: number     // 仅记录后 n 条，0 表示不记录
}
```

::: tip 💡 正则表达式技巧

**常用模式：**
- `^/api/test/` - 以 `/api/test/` 开头的路径
- `/temp/$` - 以 `/temp/` 结尾的路径  
- `\\.(png|jpg)$` - 图片文件
- `/api/(login|logout)` - 登录登出接口

**测试正则：**
```javascript
// 在浏览器控制台测试
const pattern = '^/api/test/'
const url = '/api/test/user'
console.log(url.match(new RegExp(pattern))) // 有匹配结果
```
:::

::: warning ⚠️ 注意事项

**性能影响：**
- 每个请求都会执行正则匹配，复杂规则会影响性能
- 建议将最常匹配的规则放在前面

**调试提示：**
- 被过滤的请求不会出现在 Web UI 的历史记录中
- 如果发现某些请求没有记录，请检查此配置
:::

### 🔧 常见配置模板

**前端开发者：**
```javascript
disableRecord: [
  '\\.(css|js|map|png|jpg|gif|ico|svg)$',  // 静态资源
  '/api/analytics',                        // 埋点数据
  { path: '/api/debug', method: 'GET' }    // 调试接口
]
```

**后端开发者：** 
```javascript
disableRecord: [
  '^/health',           // 健康检查
  '/metrics',           // 监控指标
  { path: '/logs', num: 20 }  // 日志接口保留20条
]
```

**测试工程师：**
```javascript
disableRecord: [
  '^/test/',            // 测试接口
  '/mock/',             // Mock 数据
  { path: '/api/.*', method: 'OPTIONS' }  // 预检请求
]
```

## config.bodyParser
类型: `Object`  
默认: 见下方配置

🔧 **请求体解析器** - 控制如何解析不同格式的请求数据，支持超大文件和复杂数据结构

MockM 使用 Express 的 bodyParser 中间件来解析请求体，你可以通过此配置进行精确调优：

### 🎯 默认配置

```javascript
// MockM 的默认设置
config.bodyParser = {
  json: {
    limit: '100mb',        // JSON 数据大小限制
    extended: false,       // 不使用扩展解析
    strict: false         // 允许非严格 JSON
  },
  urlencoded: {
    extended: false        // 使用 querystring 库解析
  }
}
```

### 🛠️ 自定义配置

**处理超大文件上传：**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '500mb',      // 支持 500MB 的 JSON 数据
      strict: true         // 严格 JSON 模式
    },
    urlencoded: {
      limit: '200mb',      // 表单数据限制
      extended: true       // 使用 qs 库，支持嵌套对象
    }
  }
}
```

**严格安全模式：**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '1mb',        // 限制较小的数据量
      strict: true,        // 严格 JSON 解析
      type: 'application/json'  // 仅解析指定 Content-Type
    },
    urlencoded: {
      limit: '100kb',      // 表单数据限制
      extended: false,     // 使用简单解析器
      parameterLimit: 20   // 限制参数数量
    }
  }
}
```

### 📊 配置参数详解

**JSON 解析选项：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | `string` | `'100mb'` | 🚀 请求体大小限制 |
| `strict` | `boolean` | `false` | 🔒 是否严格解析 JSON |
| `type` | `string` | `'*/json'` | 📝 匹配的 Content-Type |
| `verify` | `function` | - | 🔍 自定义验证函数 |

**URL编码解析选项：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `limit` | `string` | `'100mb'` | 🚀 请求体大小限制 |
| `extended` | `boolean` | `false` | 🧩 是否支持嵌套对象 |
| `parameterLimit` | `number` | `1000` | 📊 最大参数数量 |
| `type` | `string` | `'*/x-www-form-urlencoded'` | 📝 匹配的 Content-Type |

### 🏆 实际应用场景

**文件上传服务：**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '1gb',        // 支持超大 JSON 文件
      verify: (req, res, buf) => {
        // 自定义验证逻辑
        if (buf.length > 1024 * 1024 * 500) {
          console.log('大文件上传:', buf.length, 'bytes')
        }
      }
    }
  }
}
```

**表单处理系统：**
```javascript
module.exports = {
  bodyParser: {
    urlencoded: {
      extended: true,      // 支持复杂表单结构
      limit: '50mb',       // 适应大表单
      parameterLimit: 10000  // 支持更多字段
    }
  }
}
```

**API 网关场景：**
```javascript
module.exports = {
  bodyParser: {
    json: {
      limit: '10mb',       // 合理的数据大小
      strict: true,        // 严格模式提高安全性
      type: ['*/json', 'application/csp-report']  // 支持多种类型
    },
    urlencoded: {
      extended: false,     // 简单解析提高性能
      limit: '5mb'
    }
  }
}
```

### 💡 性能优化建议

**根据业务调整限制：**
```javascript
// 小型应用
bodyParser: {
  json: { limit: '1mb' },
  urlencoded: { limit: '500kb' }
}

// 文档系统  
bodyParser: {
  json: { limit: '50mb' },
  urlencoded: { limit: '10mb' }
}

// 文件服务
bodyParser: {
  json: { limit: '1gb' },
  urlencoded: { limit: '100mb' }
}
```

**extended 参数选择：**
```javascript
// extended: false (推荐)
// 表单: user[name]=zhang&user[age]=25
// 解析: { 'user[name]': 'zhang', 'user[age]': '25' }

// extended: true  
// 表单: user[name]=zhang&user[age]=25
// 解析: { user: { name: 'zhang', age: '25' } }
```

::: tip 🚀 性能提示

**最佳实践：**
- 根据实际需求设置 `limit`，过大会占用内存
- 开发环境可以设置较大值，生产环境要谨慎
- `extended: false` 性能更好，`extended: true` 功能更强

**调试技巧：**
```javascript
bodyParser: {
  json: {
    verify: (req, res, buf) => {
      console.log('JSON 数据大小:', buf.length)
      console.log('Content-Type:', req.headers['content-type'])
    }
  }
}
```
:::

::: warning ⚠️ 安全注意

**防止攻击：**
- 合理设置 `limit` 防止拒绝服务攻击
- 使用 `parameterLimit` 限制参数数量
- 在生产环境启用 `strict` 模式

**常见问题：**
- 请求体过大时会返回 `413 Payload Too Large`
- JSON 格式错误时返回 `400 Bad Request` 
- 超过参数限制时解析会被截断
:::

### 🔧 故障排除

**请求体解析失败？**
```javascript
// 1. 检查 Content-Type 是否匹配
bodyParser: {
  json: {
    type: ['application/json', 'text/plain']  // 扩展支持的类型
  }
}

// 2. 检查数据大小限制
bodyParser: {
  json: { limit: '200mb' }  // 增加限制
}

// 3. 添加调试信息
bodyParser: {
  json: {
    verify: (req, res, buf) => {
      console.log('解析 JSON:', {
        size: buf.length,
        type: req.headers['content-type']
      })
    }
  }
}
```

基于 Express [body-parser](https://expressjs.com/en/resources/middleware/body-parser.html) 中间件实现，支持完整的配置选项。

## config.https
类型: `configHttps`  
默认: `{ redirect: true }`

🔐 **HTTPS 安全连接** - 一键开启 SSL/TLS 加密，支持 HTTP/HTTPS 同端口混合服务

让你的 Mock 服务秒变 HTTPS，支持现代 Web 应用的安全要求：

### 🚀 快速启用

**基础配置：**
```javascript
module.exports = {
  https: {
    key: './certificates/server.key',   // 私钥文件
    cert: './certificates/server.crt'   // 证书文件
  }
}
```

**立即获得：**
- 🔐 **HTTPS 访问** - `https://localhost:9000`
- 🔄 **混合模式** - 同时支持 HTTP 和 HTTPS
- ⚡ **自动重定向** - HTTP 请求自动跳转到 HTTPS

### 🏗️ 完整配置

```typescript
interface configHttps {
  key: string          // 私钥文件地址，例如 *.key
  cert: string         // 公钥文件地址，例如 *.crt, *.cer
  redirect?: boolean   // 是否重定向到 HTTPS (默认: true)
  port?: number        // HTTPS 端口 (默认: 同 config.port)
  testPort?: number    // 测试端口的 HTTPS 版本
  replayPort?: number  // 重放端口的 HTTPS 版本
}
```

### 🎯 高级应用

**类似 Nginx 的 80/443 端口配置：**
```javascript
module.exports = {
  port: 80,              // HTTP 端口
  https: {
    key: './certs/https.key',
    cert: './certs/https.crt', 
    port: 443,           // HTTPS 端口
    redirect: true       // 80 端口自动跳转到 443
  }
}
```

**企业级多端口配置：**
```javascript
module.exports = {
  port: 9000,
  testPort: 9001,
  replayPort: 9002,
  https: {
    key: './ssl/server.key',
    cert: './ssl/server.crt',
    port: 9443,          // 主服务 HTTPS 端口
    testPort: 9444,      // 测试服务 HTTPS 端口  
    replayPort: 9445,    // 重放服务 HTTPS 端口
    redirect: false      // 不自动重定向，让用户自由选择
  }
}
```

**开发环境自签名证书：**
```javascript
module.exports = {
  https: {
    key: './dev-certs/localhost.key',
    cert: './dev-certs/localhost.crt',
    // 开发时关闭重定向，方便调试
    redirect: process.env.NODE_ENV !== 'development'
  }
}
```

### 🛠️ 证书获取指南

**方法一：自签名证书（开发用）**
```bash
# 生成私钥
openssl genrsa -out server.key 2048

# 生成证书签名请求
openssl req -new -key server.key -out server.csr

# 生成自签名证书
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

**方法二：Let's Encrypt（生产用）**
```bash
# 安装 certbot
sudo apt-get install certbot

# 获取证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书位置
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

**方法三：购买商业证书**
- 🏢 从 CA 机构购买（推荐生产环境）
- 🔐 通常包含：`domain.key` 和 `domain.crt`
- 📋 有些还包含中间证书，需要合并

### 🏆 实际应用场景

**前端开发环境：**
```javascript
module.exports = {
  port: 3000,
  https: {
    key: './https-dev/localhost.key', 
    cert: './https-dev/localhost.crt',
    redirect: false  // 开发时不强制 HTTPS
  },
  cors: true,
  // 支持现代浏览器的安全策略
  api: {
    'use /': (req, res, next) => {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000')
      next()
    }
  }
}
```

**API 网关模式：**
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

**演示环境配置：**
```javascript
module.exports = {
  https: {
    key: './demo-certs/demo.key',
    cert: './demo-certs/demo.crt',
    // 演示环境强制使用 HTTPS 增加专业度
    redirect: true
  },
  // 提供专业的响应头
  api: {
    'use /': (req, res, next) => {
      res.setHeader('X-Powered-By', 'MockM-HTTPS')
      next()
    }
  }
}
```

### 💡 专业技巧

**证书路径处理：**
```javascript
const path = require('path')

module.exports = {
  https: {
    // 支持相对路径、绝对路径
    key: path.join(__dirname, 'certs/server.key'),
    cert: path.join(__dirname, 'certs/server.crt'),
    
    // 环境变量配置
    // key: process.env.HTTPS_KEY_PATH,
    // cert: process.env.HTTPS_CERT_PATH
  }
}
```

**动态端口分配：**
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

### 🔧 故障排除

**常见错误及解决方案：**

```javascript
// 错误：证书文件不存在
// Error: ENOENT: no such file or directory
https: {
  key: require('path').resolve('./certs/server.key'),  // 使用绝对路径
  cert: require('path').resolve('./certs/server.crt')
}

// 错误：证书格式不正确
// Error: error:0906D06C:PEM routines
// 检查证书文件格式，确保是 PEM 格式

// 错误：私钥和证书不匹配
// Error: error:0B080074:x509 certificate routines
// 重新生成匹配的密钥对
```

**调试配置：**
```javascript
module.exports = {
  https: {
    key: './certs/server.key',
    cert: './certs/server.crt',
    // 调试时查看详细信息
    secureOptions: require('constants').SSL_OP_NO_TLSv1,
    ciphers: 'HIGH:!aNULL:!MD5',
    honorCipherOrder: true
  }
}
```

::: tip 🚀 最佳实践

**证书管理：**
- 开发环境使用自签名证书即可
- 生产环境建议使用 Let's Encrypt 或商业证书
- 将证书文件加入 `.gitignore`，不要提交到版本控制

**端口规划：**
- 开发：`3000` (HTTP) + `3443` (HTTPS) 
- 测试：`8000` (HTTP) + `8443` (HTTPS)
- 生产：`80` (HTTP) + `443` (HTTPS)

**安全配置：**
```javascript
https: {
  redirect: true,  // 生产环境建议开启
  // 添加安全响应头
  secureHeaders: true
}
```
:::

::: warning ⚠️ 安全提醒

**证书安全：**
- 🔐 私钥文件权限设置为 600：`chmod 600 server.key`
- 📁 证书文件不要提交到公开仓库
- ⏰ 定期更新证书，避免过期

**自签名证书：**
- 浏览器会显示"不安全"警告
- 开发时可以添加例外或使用 `--ignore-certificate-errors`
- 不适用于生产环境

**Mixed Content：**
- HTTPS 页面中不能加载 HTTP 资源
- 确保所有资源都使用相对路径或 HTTPS
:::

### 📊 端口配置对照表

| 服务类型 | HTTP 默认端口 | HTTPS 配置端口 | 说明 |
|----------|--------------|----------------|------|
| 主服务 | `config.port` | `https.port` | 🌐 主 API 服务 |
| 测试服务 | `config.testPort` | `https.testPort` | 🧪 测试管理界面 |
| 重放服务 | `config.replayPort` | `https.replayPort` | ⏪ 历史数据重放 |

基于 Node.js 原生 HTTPS 模块实现，支持完整的 SSL/TLS 配置选项。

## config.plugin
类型: `Plugin[]`  
默认: `[]`

🔌 **插件生态系统** - 通过插件扩展 MockM 的无限可能，从简单工具到复杂业务逻辑

MockM 提供了强大的插件机制，让你可以在服务的各个生命周期中注入自定义逻辑：

### 🚀 插件基础结构

```javascript
module.exports = {
  // 🆔 插件的唯一标识
  key: 'my-awesome-plugin',
  
  // 📦 支持的 MockM 版本（可选）
  hostVersion: ['1.1.0', '1.2.0'],
  
  // 🎯 插件入口函数
  async main({hostInfo, pluginConfig, config, util} = {}) {
    return {
      // 🏗️ 各种生命周期钩子
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

### 🎯 生命周期钩子详解

| 钩子名称 | 执行时机 | 可用功能 | 典型用途 |
|----------|----------|----------|----------|
| `hostFileCreated` | 📁 目录结构创建完成 | 文件系统操作 | 创建插件配置文件 |
| `serverCreated` | 🚀 服务器启动成功 | HTTP 服务器实例 | 添加额外端口监听 |
| `useCreated` | 🔧 应用初始化完成 | Express app | 注册高优先级中间件 |
| `useParserCreated` | 📊 解析器初始化完成 | req.body 可用 | 数据预处理和日志 |
| `apiParsed` | 🎭 API 配置解析完成 | API 对象 | 注入新接口 |
| `apiListParsed` | 📋 API 列表生成完成 | 完整路由信息 | 生成文档或统计 |

### 🏆 实战插件示例

#### 1️⃣ 用户认证插件

**创建插件文件：** `auth-plugin.js`
```javascript
module.exports = {
  key: 'user-auth',
  async main({config, util}) {
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          const token = req.header('Authorization') || ''
          
          // 🔍 解析 JWT Token
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
  // 简化的 JWT 解析逻辑
  const [, payload] = jwt.split('.')
  return JSON.parse(Buffer.from(payload, 'base64').toString())
}
```

**使用插件：** `mm.config.js`
```javascript
const authPlugin = require('./auth-plugin.js')

module.exports = {
  plugin: [authPlugin],
  api: {
    // 🎯 任意接口都可以获取用户信息
    'GET /api/profile': (req, res) => {
      if (!req.userId) {
        return res.status(401).json({ error: '请先登录' })
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

#### 2️⃣ 数据转换插件

**创建插件：** `data-transform.js`
```javascript
module.exports = {
  key: 'data-transformer',
  async main({config}) {
    // 🔄 修改 RestAPI 响应格式
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
          // 🎯 转换分页参数
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

#### 3️⃣ 接口文档生成插件

```javascript
module.exports = {
  key: 'api-doc-generator',
  async main({config, util}) {
    const apiDocs = []
    
    return {
      apiListParsed(serverRouterList) {
        // 📋 收集所有接口信息
        serverRouterList.forEach(route => {
          apiDocs.push({
            path: route.route,
            method: route.method,
            description: route.description || '暂无描述',
            type: route.type
          })
        })
        
        // 📄 生成文档页面
        config.api = {
          ...config.api,
          'GET /docs': (req, res) => {
            res.json({
              title: 'API 接口文档',
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

#### 4️⃣ 请求日志插件

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
          
          // 📝 记录请求信息
          const logEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            body: req.body
          }
          
          // 🎯 拦截响应
          const originalSend = res.send
          res.send = function(data) {
            logEntry.duration = Date.now() - start
            logEntry.status = res.statusCode
            logEntry.response = data
            
            // 💾 写入日志文件
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

### 🧩 插件组合应用

**完整的企业级配置：**
```javascript
const authPlugin = require('./plugins/auth.js')
const logPlugin = require('./plugins/logger.js') 
const docPlugin = require('./plugins/docs.js')

module.exports = async (util) => {
  // 🔧 动态加载插件依赖
  const joi = await util.tool.generate.initPackge('joi')
  
  return {
    plugin: [
      authPlugin,
      logPlugin, 
      docPlugin,
      util.plugin.validate,  // 内置验证插件
      util.plugin.apiDoc     // 内置文档插件
    ],
    
    api: {
      'POST /api/login': util.side({
        group: 'auth',
        desc: '用户登录接口',
        request: joi.object({
          username: joi.string().required(),
          password: joi.string().min(6).required()
        }),
        
        fn: (req, res) => {
          const {username, password} = req.body
          
          // 🔐 模拟登录验证
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
              message: '用户名或密码错误'
            })
          }
        }
      })
    }
  }
}

function generateToken(payload) {
  // 简化的 JWT 生成
  const header = Buffer.from(JSON.stringify({typ: 'JWT', alg: 'HS256'})).toString('base64')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${body}.signature`
}
```

### 🎯 内置插件

MockM 提供了一些内置插件：

```javascript
module.exports = {
  plugin: [
    util.plugin.validate,  // 🔍 参数验证插件
    util.plugin.apiDoc     // 📚 API 文档插件
  ]
}
```

访问 `http://127.0.0.1:9000/doc/` 查看生成的接口文档。

### 💡 插件开发技巧

**获取插件配置：**
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

// 使用时传入配置
module.exports = {
  plugin: [
    [myPlugin, {apiKey: 'abc123', timeout: 5000}]
  ]
}
```

**错误处理：**
```javascript
module.exports = {
  key: 'safe-plugin',
  async main({config, util}) {
    return {
      useCreated(app) {
        app.use((req, res, next) => {
          try {
            // 🛡️ 插件逻辑
            performSomeOperation(req)
            next()
          } catch (error) {
            console.error('Plugin error:', error)
            next() // 不阻断请求链
          }
        })
      }
    }
  }
}
```

**性能监控：**
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

### 🔧 插件调试

**启用调试信息：**
```javascript
module.exports = {
  key: 'debug-plugin', 
  async main({hostInfo, config}) {
    console.log('🔌 插件启动:', {
      hostVersion: hostInfo.version,
      configKeys: Object.keys(config)
    })
    
    return {
      serverCreated(info) {
        console.log('🚀 服务器启动:', info)
      },
      
      apiParsed(api) {
        console.log('📋 API 数量:', Object.keys(api).length)
      }
    }
  }
}
```

::: tip 🚀 最佳实践

**插件设计原则：**
- 🎯 **单一职责** - 每个插件专注一个功能
- 🛡️ **错误隔离** - 插件错误不应影响主服务
- 📝 **清晰命名** - 使用有意义的 key 和描述
- ⚡ **性能优先** - 避免阻塞请求处理

**插件组织：**
```
plugins/
├── auth/
│   ├── index.js       # 认证插件主文件
│   ├── jwt.js         # JWT 工具
│   └── config.js      # 配置文件
├── logger/
│   ├── index.js       # 日志插件主文件
│   └── formatters.js  # 日志格式化工具
└── docs/
    ├── index.js       # 文档插件主文件
    └── templates/     # 文档模板
```

**版本兼容：**
```javascript
module.exports = {
  key: 'my-plugin',
  hostVersion: ['>=1.1.0', '<2.0.0'],  // 语义化版本范围
  async main({hostInfo}) {
    if (hostInfo.version < '1.2.0') {
      console.warn('建议升级 MockM 到 1.2.0+ 以获得最佳体验')
    }
  }
}
```
:::

::: warning ⚠️ 注意事项

**性能影响：**
- 插件在每个请求中都会执行，避免复杂计算
- 使用异步操作时要正确处理 Promise
- 大量插件会影响启动速度

**内存泄漏：**
- 及时清理定时器和事件监听器
- 避免在插件中创建大量闭包
- 注意全局变量的使用

**调试提示：**
- 使用 `console.log` 调试插件执行流程
- 插件错误可能不会直接显示，查看控制台输出
- 可以通过在插件中抛出错误来中断请求处理
:::

### 📦 插件生态

**推荐插件模板：**

```javascript
// plugin-template.js
module.exports = {
  key: 'plugin-name',
  hostVersion: ['>=1.1.0'],
  
  async main({hostInfo, pluginConfig, config, util}) {
    // 插件初始化逻辑
    const options = {
      enabled: true,
      ...pluginConfig
    }
    
    return {
      async hostFileCreated() {
        // 文件系统准备完成
      },
      
      async serverCreated(info) {
        // 服务器启动完成
      },
      
      async useCreated(app) {
        // Express 应用初始化完成
        if (options.enabled) {
          app.use(createMiddleware(options))
        }
      },
      
      async useParserCreated(app) {
        // 请求解析器准备完成
      },
      
      async apiParsed(api, apiUtil) {
        // API 配置解析完成
      },
      
      async apiListParsed(serverRouterList) {
        // API 列表生成完成
      }
    }
  }
}

function createMiddleware(options) {
  return (req, res, next) => {
    // 中间件逻辑
    next()
  }
}
```

通过插件系统，你可以将 MockM 打造成适合自己项目的强大 API 开发平台！🚀