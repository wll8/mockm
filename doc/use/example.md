# 实战示例 - 让开发更高效 🚀

> 从小白到专家，一篇文章掌握 MockM 核心技能！

这里汇集了最实用的开发场景解决方案，每个示例都是开发中的真实需求。跟着做，立即上手！

**📘 约定说明**
- 后端接口地址统一使用：`http://192.168.1.18:8080`
- 更多高级功能演示请查看 → [测试用例](https://wll8.github.io/mockm/case/)

---

## 🌍 解决跨域问题 - 告别开发环境的头号烦恼

### 🎯 痛点
前端开发时最怕看到的错误：
```
Access to fetch at 'http://192.168.1.18:8080/api/users' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

### ✅ 解决方案

**方式一：命令行启动（超快）**
```bash
mm proxy=http://192.168.1.18:8080
```

**方式二：配置文件（推荐）**
创建 `mm.config.js`：
```javascript
module.exports = {
  proxy: 'http://192.168.1.18:8080'
}
```

然后运行：
```bash
mm
```

### 🎉 效果
原来的跨域请求：
- ❌ `http://192.168.1.18:8080/api/users` → CORS错误
- ✅ `http://127.0.0.1:9000/api/users` → 完美运行

> 💡 **原理**：MockM 作为代理服务器，自动添加跨域头，让浏览器认为这是同源请求

---

## 🎭 创建自定义接口 - 3秒搞定API

### 🎯 场景
- 后端接口还没开发完成
- 需要临时模拟某个接口
- 想要覆盖后端现有接口

### 📝 基础版本
```javascript
module.exports = {
  api: {
    '/my/api': {
      msg: '我的第一个API',
      success: true,
      timestamp: Date.now()
    }
  }
}
```

**立即访问**： http://127.0.0.1:9000/my/api

### 🚀 进阶版本 - 动态响应
```javascript
module.exports = {
  api: {
    '/user/profile' (req, res) {
      const { userId } = req.query
      res.json({
        code: 200,
        data: {
          userId: userId || 'anonymous',
          username: `用户${userId || '游客'}`,
          loginTime: new Date().toLocaleString()
        },
        message: '获取用户信息成功'
      })
    }
  }
}
```

**测试一下**：
- http://127.0.0.1:9000/user/profile
- http://127.0.0.1:9000/user/profile?userId=123

> 💡 **优先级**：当路由与 `config.proxy` 冲突时，`config.api` 优先生效
> 
> 📚 **更多功能**：参考 [config.api 详细文档](../config/option.md#config-api) 和 [接口编辑器](../use/webui.md#接口编辑)

---


## 📊 获取请求参数 - 构建动态接口

### 🎯 需求
根据用户传入的不同参数，返回不同的内容

### 💡 实现方案
```javascript
module.exports = {
  api: {
    '/search' (req, res) {
      // 🔍 获取各类参数
      const { keyword, page = 1 } = req.query      // URL查询参数
      const { category } = req.params              // 路径参数
      const { filters } = req.body                 // 请求体参数
      
      res.json({
        message: '搜索成功',
        query: { keyword, page },
        params: { category },
        body: { filters },
        results: `找到 ${keyword} 相关结果 ${Math.floor(Math.random() * 100)} 条`
      })
    }
  }
}
```

### 🧪 测试效果
访问：http://127.0.0.1:9000/search?keyword=MockM&page=2

**返回结果：**
```json
{
  "message": "搜索成功",
  "query": {
    "keyword": "MockM",
    "page": "2"
  },
  "results": "找到 MockM 相关结果 42 条"
}
```

> 🎓 **参数说明**：
> - `req.query` - URL 中 `?` 后面的查询参数
> - `req.params` - 路径中的动态参数（如 `/user/:id` 中的 id）
> - `req.body` - POST/PUT 请求体中的数据

---

## 🔄 一键生成 RESTful API - 博客系统5分钟搭建

### 🎯 需求
快速搭建一个具备增删改查功能的博客系统后端

### 🚀 超简配置
```javascript
module.exports = {
  db: {
    blogs: [
      {
        id: 1,
        title: '认识 MockM 的第一天',
        content: 'MockM 是一款便于使用，功能灵活的接口工具。看起来不错~',
        author: '开发者小王',
        createTime: '2024-01-15',
        tags: ['工具', '开发']
      },
      {
        id: 2,
        title: 'RESTful API 设计最佳实践',
        content: '良好的 API 设计能让前后端协作更加高效...',
        author: '架构师老李',
        createTime: '2024-01-16',
        tags: ['API', '架构']
      }
    ]
  }
}
```

### 🎉 立即拥有完整API系统

| HTTP方法 | 接口地址 | 功能 | 示例 |
|---------|---------|------|------|
| **GET** | `/blogs` | 获取所有文章 | 支持分页、搜索 |
| **GET** | `/blogs/1` | 获取指定文章 | 根据ID查询 |
| **POST** | `/blogs` | 创建新文章 | 自动分配ID |
| **PUT** | `/blogs/1` | 更新文章 | 全量更新 |
| **PATCH** | `/blogs/1` | 部分更新 | 只更新指定字段 |
| **DELETE** | `/blogs/1` | 删除文章 | 物理删除 |

### 🧪 实战演练

**1. 创建文章**
```bash
curl -X POST http://127.0.0.1:9000/blogs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的新文章",
    "content": "这是文章内容",
    "author": "我"
  }'
```

**2. 搜索文章**
```bash
# 搜索标题包含"MockM"的文章
curl "http://127.0.0.1:9000/blogs?q=MockM"

# 分页获取文章（第2页，每页5条）
curl "http://127.0.0.1:9000/blogs?_page=2&_limit=5"
```

**3. 获取单篇文章**
```bash
curl http://127.0.0.1:9000/blogs/1
```

### 📊 响应格式预览
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": 1,
    "title": "认识 MockM 的第一天",
    "content": "MockM 是一款便于使用，功能灵活的接口工具...",
    "author": "开发者小王",
    "createTime": "2024-01-15",
    "tags": ["工具", "开发"]
  }
}
```

> 🎯 **核心优势**：
> - ✅ 零代码实现完整 CRUD
> - ✅ 自动支持分页、搜索、排序
> - ✅ 符合 RESTful 设计规范
> - ✅ 数据持久化存储

---


## 🎨 生成逼真数据 - MockJS 深度集成

### 🎯 需求
生成大量真实的用户数据进行前端开发和测试

### 🔥 智能数据生成

```javascript
module.exports = util => {
  return {
    db: {
      users: util.libObj.mockjs.mock({
        'data|50-100': [  // 随机生成 50-100 条用户数据
          {
            'id|+1': 1001,                    // ID从1001开始自增
            username: '@cname',               // 随机中文姓名
            email: '@email',                  // 随机邮箱
            phone: /^1[385][1-9]\d{8}/,      // 手机号正则
            avatar: '@image("200x200", "@color", "@cname")', // 随机头像
            'age|18-65': 1,                  // 年龄18-65随机
            'gender|1': ['男', '女', '保密'], // 性别随机选择
            address: '@county(true)',         // 详细地址
            company: '@ctitle(5,10)',         // 公司名称
            position: '@ctitle(2,4)',         // 职位
            'salary|5000-30000': 1,          // 薪资范围
            bio: '@cparagraph(1,3)',          // 个人简介
            'tags|2-5': ['@cword(2,4)'],     // 标签数组
            'isVip|1': true,                 // 50%概率为VIP
            createTime: '@datetime',          // 注册时间
            lastLogin: '@datetime("yyyy-MM-dd HH:mm:ss")'  // 最后登录
          }
        ]
      }).data,
      
      // 文章数据
      articles: util.libObj.mockjs.mock({
        'data|20-30': [
          {
            'id|+1': 1,
            title: '@ctitle(10,25)',
            content: '@cparagraph(5,15)',
            author: '@cname',
            'viewCount|100-9999': 1,
            'likeCount|10-999': 1,
            'category|1': ['技术', '生活', '娱乐', '学习', '工作'],
            publishTime: '@datetime',
            'status|1': ['published', 'draft', 'deleted']
          }
        ]
      }).data
    }
  }
}
```

### 🎉 立即拥有丰富数据

**访问用户列表**：http://127.0.0.1:9000/users

**数据预览**：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1001,
      "username": "王秀英",
      "email": "c.anderson@miller.gov",
      "phone": "13845678901",
      "avatar": "http://dummyimage.com/200x200/79f279&text=王秀英",
      "age": 28,
      "gender": "女",
      "address": "山东省济南市历下区",
      "company": "创新科技有限公司",
      "position": "前端工程师",
      "salary": 18000,
      "isVip": true,
      "createTime": "2023-05-15 14:30:22"
    }
  ]
}
```

### 🎭 高级数据模式

```javascript
// 关联数据模式
module.exports = util => {
  const mockjs = util.libObj.mockjs
  return {
    db: {
      // 用户表
      users: mockjs.mock({
        'data|10': [{
          'id|+1': 1,
          name: '@cname',
          'departmentId|1-3': 1  // 关联部门ID
        }]
      }).data,
      
      // 部门表
      departments: [
        { id: 1, name: '技术部', manager: '张三' },
        { id: 2, name: '产品部', manager: '李四' },
        { id: 3, name: '设计部', manager: '王五' }
      ]
    }
  }
}
```

> 🎨 **MockJS 语法**：
> - `@cname` - 中文姓名
> - `@email` - 邮箱地址  
> - `@datetime` - 日期时间
> - `@image(尺寸)` - 随机图片
> - `@cparagraph` - 中文段落
> - `'字段|min-max': 值` - 数值范围
> - `'字段|数量': [数组]` - 随机选择
> 
> 📚 **完整语法**：查看 [MockJS 示例大全](https://wll8.github.io/mockjs-examples/)

---

## 🛠️ 拦截修改后端数据 - 无需后端配合

### 🎯 场景
- 后端返回的数据格式不符合前端需求
- 需要临时修改某个字段的值
- 想要测试不同的数据情况

### 📊 原始后端数据
假设 `http://192.168.1.18:8080/api/user` 返回：
```json
{
  "code": 200,
  "data": {
    "name": "张三",
    "books": [
      { "page": 52, "type": "css" },
      { "page": 26, "type": "js" }
    ]
  },
  "success": true
}
```

### 🔧 修改指定字段
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    // 修改第二本书的类型为 html
    '/api/user': ['data.books[1].type', 'html']
  }
}
```

**结果**：`books[1].type` 从 "js" 变成 "html"

### 🎭 完全替换响应
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    // 直接返回新的响应
    '/api/user': ['success']  // 整个接口直接返回 "success"
  }
}
```

### 🚀 高级用法 - 函数式处理
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/user': [
      // 自定义处理函数
      ({req, json}) => {
        // 添加用户等级
        json.data.level = json.data.books.length > 1 ? 'VIP' : 'Normal'
        // 添加服务器时间
        json.serverTime = new Date().toISOString()
        return json
      }
    ]
  }
}
```

> 🎯 **使用技巧**：
> - 路径格式：`data.user.name` 或 `data.books[0].title`
> - 单参数 = 完全替换响应
> - 双参数 = 修改指定路径的值
> - 函数参数 = 自定义处理逻辑
> 
> 📚 **详细语法**：查看 [config.proxy 完整文档](../config/option.md#config-proxy)

---

## ⏱️ 接口延时模拟 - 测试弱网环境

### 🎯 应用场景
- 测试前端 Loading 效果
- 模拟网络延迟情况
- 验证超时处理逻辑

### 🐌 基础延时
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/user': {
      mid(req, res, next) {
        setTimeout(next, 3000)  // 延时 3 秒
      }
    }
  }
}
```

### 🎲 随机延时 - 更真实的网络体验
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/slow': {
      mid(req, res, next) {
        // 随机延时 1-5 秒
        const delay = Math.random() * 4000 + 1000
        console.log(`🐌 接口延时: ${Math.round(delay)}ms`)
        setTimeout(next, delay)
      }
    }
  }
}
```

### 📊 条件延时 - 智能模拟
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/search': {
      mid(req, res, next) {
        const { keyword } = req.query
        // 搜索关键词越长，延时越久（模拟复杂查询）
        const delay = keyword ? keyword.length * 200 : 500
        setTimeout(next, delay)
      }
    }
  }
}
```

> 💡 **最佳实践**：
> - 短延时（100-500ms）：模拟正常网络
> - 中延时（1-3秒）：模拟慢网络
> - 长延时（5秒+）：测试超时处理
> 
> 🔧 **调试技巧**：在控制台会看到延时日志，方便调试

---
## 📁 文件下载接口 - 秒建下载服务

### 🎯 需求
创建文件下载功能，支持各种文件类型

### 📝 基础下载
```javascript
module.exports = {
  api: {
    '/download/report' (req, res) {
      const filePath = './reports/monthly-report.pdf'
      res.download(filePath, '月度报告.pdf')  // 第二个参数是下载时的文件名
    }
  }
}
```

### 🎯 动态文件下载
```javascript
module.exports = {
  api: {
    '/download/:type' (req, res) {
      const { type } = req.params
      const { filename } = req.query
      
      const fileMap = {
        pdf: './files/document.pdf',
        excel: './files/data.xlsx', 
        image: './files/avatar.jpg'
      }
      
      const filePath = fileMap[type]
      if (!filePath) {
        return res.status(404).json({ error: '文件类型不支持' })
      }
      
      res.download(filePath, filename || `download.${type}`)
    }
  }
}
```

### 🔐 权限控制下载
```javascript
module.exports = {
  api: {
    '/secure/download' (req, res) {
      const { token, fileId } = req.query
      
      // 简单的权限验证
      if (token !== 'valid-token') {
        return res.status(401).json({ error: '无下载权限' })
      }
      
      const filePath = `./secure-files/${fileId}.zip`
      
      // 检查文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文件不存在' })
      }
      
      res.download(filePath, `secure-file-${fileId}.zip`)
    }
  }
}
```

### 🧪 测试下载
```bash
# 基础下载
curl -O http://127.0.0.1:9000/download/report

# 动态下载
curl -O "http://127.0.0.1:9000/download/pdf?filename=我的文档.pdf"

# 权限下载
curl -O "http://127.0.0.1:9000/secure/download?token=valid-token&fileId=123"
```

> 📋 **支持格式**：PDF、Excel、Word、图片、压缩包等所有文件类型
> 
> 🛡️ **安全提醒**：生产环境请加强权限验证和路径检查

---

## 🕸️ WebSocket 实时通信 - 聊天室5分钟搭建

### 🎯 应用场景
- 实时聊天系统
- 消息推送服务
- 实时数据更新

### 💬 基础聊天室
```javascript
module.exports = {
  api: {
    'ws /chat' (ws, req) {
      console.log('🎉 新用户加入聊天室')
      
      // 欢迎消息
      ws.send(JSON.stringify({
        type: 'welcome',
        message: '欢迎加入聊天室！',
        timestamp: Date.now()
      }))
      
      // 监听消息
      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg)
          console.log('📨 收到消息:', data)
          
          // 回声消息（实际场景可以广播给所有用户）
          ws.send(JSON.stringify({
            type: 'message',
            content: `回音: ${data.content}`,
            sender: 'System',
            timestamp: Date.now()
          }))
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error', 
            message: '消息格式错误'
          }))
        }
      })
      
      // 连接关闭
      ws.on('close', () => {
        console.log('👋 用户离开聊天室')
      })
    }
  }
}
```

### 🌐 客户端测试代码
在浏览器控制台运行：
```javascript
// 连接 WebSocket
function startChat() {
  const ws = new WebSocket('ws://127.0.0.1:9000/chat')
  
  ws.onopen = () => {
    console.log('✅ 连接成功')
    // 发送测试消息
    ws.send(JSON.stringify({
      content: '大家好，我是新来的！',
      sender: '访客' + Math.floor(Math.random() * 1000)
    }))
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('📨 收到消息:', data)
    
    // 显示消息
    if (data.type === 'welcome') {
      console.log('🎉', data.message)
    } else if (data.type === 'message') {
      console.log(`💬 ${data.sender}: ${data.content}`)
    }
  }
  
  ws.onclose = () => {
    console.log('❌ 连接断开，5秒后重连...')
    setTimeout(startChat, 5000)  // 自动重连
  }
  
  ws.onerror = (error) => {
    console.error('❌ 连接错误:', error)
  }
  
  // 全局变量，方便发送消息
  window.chatWs = ws
  
  return ws
}

// 启动聊天
const ws = startChat()

// 发送消息的便捷方法
function sendMessage(content) {
  if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
    window.chatWs.send(JSON.stringify({
      content: content,
      sender: '我'
    }))
  } else {
    console.log('❌ 连接未建立')
  }
}

// 使用示例
// sendMessage('Hello, World!')
```

### 📊 实时数据推送
```javascript
module.exports = {
  api: {
    'ws /monitor' (ws, req) {
      ws.send('📊 开始监控系统状态...')
      
      // 每秒推送一次系统状态
      const interval = setInterval(() => {
        const status = {
          cpu: Math.floor(Math.random() * 100),
          memory: Math.floor(Math.random() * 100),
          disk: Math.floor(Math.random() * 100),
          timestamp: Date.now()
        }
        
        ws.send(JSON.stringify({
          type: 'system-status',
          data: status
        }))
      }, 1000)
      
      // 清理定时器
      ws.on('close', () => {
        clearInterval(interval)
        console.log('🔚 停止监控')
      })
    }
  }
}
```

> 🚀 **高级特性**：
> - ✅ 支持消息广播（多客户端）
> - ✅ 自动重连机制
> - ✅ 消息类型区分
> - ✅ 错误处理完善
> 
> 💡 **调试技巧**：打开浏览器开发者工具 → Network → WS 标签，可以看到所有 WebSocket 消息

---

## 📤 文件上传接口 - 支持多文件上传

### 🎯 应用场景
- 用户头像上传
- 批量文档上传
- 图片相册功能

### 📷 单文件上传
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/avatar' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multiparty')
        const form = new multiparty.Form()
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ error: '上传失败', details: err.message })
          }
          
          const file = files.avatar[0]  // 获取上传的文件
          res.json({
            message: '头像上传成功',
            data: {
              originalName: file.originalFilename,
              size: file.size,
              type: file.headers['content-type'],
              tempPath: file.path,
              uploadTime: new Date().toISOString()
            }
          })
        })
      }
    }
  }
}
```

### 📁 多文件上传
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/documents' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multiparty')
        const form = new multiparty.Form()
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ error: '上传失败' })
          }
          
          // 处理多个文件
          const uploadedFiles = []
          for (let fieldName in files) {
            files[fieldName].forEach(file => {
              uploadedFiles.push({
                fieldName,
                originalName: file.originalFilename,
                size: file.size,
                type: file.headers['content-type'],
                tempPath: file.path
              })
            })
          }
          
          res.json({
            message: `成功上传 ${uploadedFiles.length} 个文件`,
            data: uploadedFiles,
            uploadTime: new Date().toISOString()
          })
        })
      }
    }
  }
}
```

### 🔍 带验证的上传
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/secure' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multiparty')
        const form = new multiparty.Form()
        
        // 设置上传限制
        form.maxFilesSize = 10 * 1024 * 1024  // 最大10MB
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ 
              error: '上传失败', 
              reason: err.message 
            })
          }
          
          const file = files.document[0]
          
          // 文件类型验证
          const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
          const fileType = file.headers['content-type']
          
          if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({
              error: '文件类型不支持',
              allowed: allowedTypes,
              received: fileType
            })
          }
          
          // 文件大小验证
          if (file.size > 5 * 1024 * 1024) {  // 5MB
            return res.status(400).json({
              error: '文件太大',
              maxSize: '5MB',
              fileSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
            })
          }
          
          res.json({
            message: '文件上传并验证成功',
            data: {
              originalName: file.originalFilename,
              size: file.size,
              type: fileType,
              tempPath: file.path,
              validated: true
            }
          })
        })
      }
    }
  }
}
```

### 🧪 前端测试代码
```html
<!-- HTML 表单测试 -->
<form action="http://127.0.0.1:9000/upload/avatar" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" accept="image/*" required>
  <button type="submit">上传头像</button>
</form>

<!-- JavaScript 测试 -->
<script>
async function uploadFile() {
  const fileInput = document.querySelector('input[type="file"]')
  const file = fileInput.files[0]
  
  if (!file) {
    alert('请选择文件')
    return
  }
  
  const formData = new FormData()
  formData.append('avatar', file)
  
  try {
    const response = await fetch('http://127.0.0.1:9000/upload/avatar', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    console.log('✅ 上传成功:', result)
  } catch (error) {
    console.error('❌ 上传失败:', error)
  }
}
</script>
```

> 📋 **支持特性**：
> - ✅ 单文件/多文件上传
> - ✅ 文件类型验证
> - ✅ 文件大小限制
> - ✅ 上传进度追踪
> - ✅ 错误处理完善
> 
> 🔧 **生产提醒**：实际项目中需要将临时文件移动到永久存储位置

---

## 🎯 动态路径参数 - RESTful 路由设计

### 🎯 应用场景
- 用户详情页面：`/user/:userId`
- 商品分类：`/category/:categoryId/products/:productId`  
- 文件操作：`/files/:fileId/download`

### 👤 用户系统示例
```javascript
module.exports = {
  api: {
    // 获取用户信息
    'get /user/:userId' (req, res) {
      const { userId } = req.params
      const { includeProfile } = req.query
      
      res.json({
        code: 200,
        data: {
          id: userId,
          username: `user_${userId}`,
          email: `user${userId}@example.com`,
          profile: includeProfile === 'true' ? {
            age: 25,
            city: '北京',
            bio: '这是一个用户简介'
          } : null
        }
      })
    },
    
    // 更新用户信息
    'put /user/:userId' (req, res) {
      const { userId } = req.params
      const updateData = req.body
      
      res.json({
        code: 200,
        message: `用户${userId}信息更新成功`,
        data: {
          id: userId,
          ...updateData,
          updateTime: new Date().toISOString()
        }
      })
    },
    
    // 删除用户
    'delete /user/:userId' (req, res) {
      const { userId } = req.params
      
      res.json({
        code: 200,
        message: `用户${userId}已删除`,
        deletedAt: new Date().toISOString()
      })
    }
  }
}
```



---

## 🚀 高级功能 - 让协作更高效

### 📤 智能接口分享 - 告别截图传参

#### 🎯 痛点解决
- ❌ 传统方式：截图 → 微信发送 → 参数手动输入
- ✅ MockM方式：一个链接 → 完整参数 → 一键调试

#### 💡 使用方法

**方式1：命令行查看**
启动 MockM 后，每次 API 请求都会在控制台显示分享链接

**方式2：管理界面查看**  
访问 http://127.0.0.1:9005 → 找到对应请求 → 复制分享链接

**方式3：开发者工具查看**
Chrome DevTools → Network → 找到请求 → Response Headers → `x-test-api`

#### ✨ 分享链接特性
- 🔗 包含完整请求参数
- 🎭 支持在线调试
- 📊 展示响应结果
- 🕐 永久有效

---

### 🌐 远程调试 - 突破局域网限制

#### 🎯 应用场景
- 微信公众号开发
- 移动端真机测试
- 远程团队协作
- 客户演示

#### ⚡ 一键开启
```javascript
module.exports = {
  remote: true,  // 开启远程访问
  api: {
    '/hello': { message: '远程访问成功！' }
  }
}
```

#### 🎉 立即拥有
- 🌍 公网域名（HTTPS）
- 🔒 SSL证书自动配置
- 📱 移动端直接访问
- 🔗 分享到任何地方

#### 📱 微信开发集成
```javascript
module.exports = {
  remote: true,
  api: {
    // 微信消息推送验证
    '/wechat/verify' (req, res) {
      const token = '123'  // 设置你的 Token
      const crypto = require('crypto')
      const { signature, timestamp, nonce, echostr } = req.query
      
      const sha = crypto.createHash('sha1')
        .update([token, timestamp, nonce].sort().join(''))
        .digest('hex')
      
      if (sha === signature) {
        res.send(echostr)  // 验证通过
      } else {
        res.json({ error: '验证失败' })
      }
    },
    
    // 微信消息处理
    'post /wechat/message' (req, res) {
      console.log('📨 收到微信消息:', req.body)
      res.json({ success: true })
    }
  }
}
```

> 💡 **配置说明**：
> - 控制台会显示远程访问地址
> - 所有接口自动支持 HTTPS
> - 分享链接也会生成远程版本

---

### 🔄 接口恢复 - 后端故障不用慌

#### 🎯 问题场景
- 后端接口突然出错
- 数据库连接失败  
- 服务器临时下线
- 版本发布出问题

#### 💡 解决方案

**步骤1：找到历史记录**
1. 访问 http://127.0.0.1:9005
2. 找到该接口之前的正常请求
3. 点击 `webApi` → `使用此记录`

**步骤2：接口立即恢复**
MockM 会自动用历史数据创建临时接口，前端页面立即恢复正常

#### 🎭 应急模式
```javascript
// 切换到应急模式
module.exports = {
  // 使用历史数据提供服务
  port: 9001,  // 应急端口
  proxy: false // 关闭代理，完全使用本地数据
}
```

**前端切换**：
```javascript
// 原始请求地址
const API_BASE = 'http://127.0.0.1:9000'

// 应急模式地址（使用历史数据）
const API_BASE = 'http://127.0.0.1:9001'
```

> 🛟 **应急预案**：
> - 开发环境：切换到历史数据模式
> - 测试环境：使用备份数据服务
> - 生产环境：联系运维快速恢复

---

### 🎛️ 多服务集成 - 统一代理管理

#### 🎯 复杂场景
企业项目通常有多个后端服务：
- 用户服务：`192.168.1.18:8081`
- 订单服务：`192.168.1.18:8082`  
- 支付服务：`192.168.1.18:8083`

#### 🔧 统一代理配置
```javascript
module.exports = {
  proxy: {
    // 基础服务
    '/': 'http://www.httpbin.org/',
    
    // 用户相关接口
    '/api/user/': 'http://192.168.1.18:8081/api/',
    '/api/auth/': 'http://192.168.1.18:8081/api/',
    
    // 订单相关接口  
    '/api/order/': 'http://192.168.1.18:8082/api/',
    '/api/cart/': 'http://192.168.1.18:8082/api/',
    
    // 支付相关接口
    '/api/payment/': 'http://192.168.1.18:8083/api/',
  },
  
  // 对应的 API 文档
  openApi: {
    '/': 'http://httpbin.org/spec.json',
    '/api/user/': 'http://192.168.1.18:8081/v3/api-docs',
    '/api/order/': 'http://192.168.1.18:8082/v3/api-docs', 
    '/api/payment/': 'http://192.168.1.18:8083/v3/api-docs',
  }
}
```

#### 🚀 多实例部署
```bash
# 用户服务代理
mm dataDir=./data/user port=8081 replayPort=8181 testPort=8281 proxy=http://192.168.1.18:8081

# 订单服务代理  
mm dataDir=./data/order port=8082 replayPort=8182 testPort=8282 proxy=http://192.168.1.18:8082

# 支付服务代理
mm dataDir=./data/payment port=8083 replayPort=8183 testPort=8283 proxy=http://192.168.1.18:8083
```

#### 📋 配置文件分离
```bash
# 不同服务使用不同配置
mm --config=./config/user.config.js
mm --config=./config/order.config.js  
mm --config=./config/payment.config.js
```

> 🎯 **最佳实践**：
> - 按业务模块分离服务
> - 使用不同端口避免冲突
> - 统一日志和监控管理
> - 配置文件版本控制

---

## 💡 实战技巧总结

### 🎯 开发阶段
1. **跨域代理** - 一行命令解决CORS
2. **数据模拟** - MockJS生成真实数据  
3. **接口调试** - 可视化管理界面

### 🧪 测试阶段
1. **延时模拟** - 测试Loading和超时
2. **数据拦截** - 模拟各种异常情况
3. **批量测试** - RESTful接口全覆盖

### 🚀 协作阶段  
1. **链接分享** - 告别截图传参
2. **远程调试** - 突破网络限制
3. **版本管理** - 配置文件Git化

### 🛟 应急阶段
1. **历史恢复** - 接口故障快速修复
2. **数据备份** - 自动保存请求历史
3. **多环境切换** - 灵活应对各种情况

> 🎉 **恭喜！** 你已经掌握了 MockM 的核心技能，可以在实际项目中大展身手了！
> 
> 📚 **进阶学习**：
> - [配置参考手册](../config/option.md) - 深入了解所有配置项
> - [Web界面使用](../use/webui.md) - 可视化操作指南  
> - [测试用例集合](https://wll8.github.io/mockm/case/) - 更多功能演示

