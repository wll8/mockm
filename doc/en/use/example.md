# Practical Examples - Making Development More Efficient 🚀

> From beginner to expert, master MockM core skills in one article!

This collection features the most practical development scenario solutions, with each example addressing real development needs. Follow along and get started immediately!

**📘 Convention Notes**
- Backend API address consistently uses: `http://192.168.1.18:8080`
- For more advanced feature demonstrations, see → [Test Cases](https://wll8.github.io/mockm/case/)

---

## 🌍 Solving CORS Issues - Goodbye to Development Environment's Top Headache

### 🎯 Pain Point
The error developers fear most during frontend development:
```
Access to fetch at 'http://192.168.1.18:8080/api/users' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

### ✅ Solution

**Method 1: Command Line Start (Super Fast)**
```bash
mm proxy=http://192.168.1.18:8080
```

**Method 2: Configuration File (Recommended)**
Create `mm.config.js`:
```javascript
module.exports = {
  proxy: 'http://192.168.1.18:8080'
}
```

Then run:
```bash
mm
```

### 🎉 Result
Original CORS requests:
- ❌ `http://192.168.1.18:8080/api/users` → CORS error
- ✅ `http://127.0.0.1:9000/api/users` → Perfect execution

> 💡 **Principle**: MockM acts as a proxy server, automatically adding CORS headers, making the browser treat this as a same-origin request

---

## 🎭 Creating Custom APIs - Complete API in 3 Seconds

### 🎯 Scenarios
- Backend API not yet developed
- Need to temporarily mock certain APIs
- Want to override existing backend APIs

### 📝 Basic Version
```javascript
module.exports = {
  api: {
    '/my/api': {
      msg: 'My first API',
      success: true,
      timestamp: Date.now()
    }
  }
}
```

**Access immediately**: http://127.0.0.1:9000/my/api

### 🚀 Advanced Version - Dynamic Response
```javascript
module.exports = {
  api: {
    '/user/profile' (req, res) {
      const { userId } = req.query
      res.json({
        code: 200,
        data: {
          userId: userId || 'anonymous',
          username: `User${userId || 'Guest'}`,
          loginTime: new Date().toLocaleString()
        },
        message: 'User information retrieved successfully'
      })
    }
  }
}
```

**Test it out**:
- http://127.0.0.1:9000/user/profile
- http://127.0.0.1:9000/user/profile?userId=123

> 💡 **Priority**: When routes conflict with `config.proxy`, `config.api` takes precedence
> 
> 📚 **More Features**: See [config.api detailed documentation](../config/option.md#config-api) and [API Editor](../use/webui.md#api-editor)

---

## 📊 Getting Request Parameters - Building Dynamic APIs

### 🎯 Requirements
Return different content based on different parameters passed by users

### 💡 Implementation
```javascript
module.exports = {
  api: {
    '/search' (req, res) {
      // 🔍 Get various parameters
      const { keyword, page = 1 } = req.query      // URL query parameters
      const { category } = req.params              // Path parameters
      const { filters } = req.body                 // Request body parameters
      
      res.json({
        message: 'Search successful',
        query: { keyword, page },
        params: { category },
        body: { filters },
        results: `Found ${Math.floor(Math.random() * 100)} results for ${keyword}`
      })
    }
  }
}
```

### 🧪 Test Results
Visit: http://127.0.0.1:9000/search?keyword=MockM&page=2

**Response**:
```json
{
  "message": "Search successful",
  "query": {
    "keyword": "MockM",
    "page": "2"
  },
  "results": "Found 42 results for MockM"
}
```

> 🎓 **Parameter Explanation**:
> - `req.query` - Query parameters after `?` in URL
> - `req.params` - Dynamic parameters in path (like id in `/user/:id`)
> - `req.body` - Data in POST/PUT request body

---

## 🔄 One-Click RESTful API Generation - Blog System in 5 Minutes

### 🎯 Requirements
Quickly build a blog system backend with CRUD functionality

### 🚀 Super Simple Configuration
```javascript
module.exports = {
  db: {
    blogs: [
      {
        id: 1,
        title: 'First Day with MockM',
        content: 'MockM is an easy-to-use, flexible API tool. Looks pretty good~',
        author: 'Developer Wang',
        createTime: '2024-01-15',
        tags: ['tools', 'development']
      },
      {
        id: 2,
        title: 'RESTful API Design Best Practices',
        content: 'Good API design makes frontend-backend collaboration more efficient...',
        author: 'Architect Li',
        createTime: '2024-01-16',
        tags: ['API', 'architecture']
      }
    ]
  }
}
```

### 🎉 Instantly Have Complete API System

| HTTP Method | API Endpoint | Function | Example |
|-------------|-------------|----------|---------|
| **GET** | `/blogs` | Get all articles | Supports pagination, search |
| **GET** | `/blogs/1` | Get specific article | Query by ID |
| **POST** | `/blogs` | Create new article | Auto-assign ID |
| **PUT** | `/blogs/1` | Update article | Full update |
| **PATCH** | `/blogs/1` | Partial update | Update specific fields only |
| **DELETE** | `/blogs/1` | Delete article | Physical delete |

### 🧪 Practical Exercise

**1. Create Article**
```bash
curl -X POST http://127.0.0.1:9000/blogs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Article",
    "content": "This is the article content",
    "author": "Me"
  }'
```

**2. Search Articles**
```bash
# Search articles with "MockM" in title
curl "http://127.0.0.1:9000/blogs?q=MockM"

# Paginated articles (page 2, 5 per page)
curl "http://127.0.0.1:9000/blogs?_page=2&_limit=5"
```

**3. Get Single Article**
```bash
curl http://127.0.0.1:9000/blogs/1
```

### 📊 Response Format Preview
```json
{
  "code": 200,
  "success": true,
  "data": {
    "id": 1,
    "title": "First Day with MockM",
    "content": "MockM is an easy-to-use, flexible API tool...",
    "author": "Developer Wang",
    "createTime": "2024-01-15",
    "tags": ["tools", "development"]
  }
}
```

> 🎯 **Core Advantages**:
> - ✅ Zero-code complete CRUD implementation
> - ✅ Automatic support for pagination, search, sorting
> - ✅ RESTful design compliance
> - ✅ Persistent data storage

---

## 🎨 Generating Realistic Data - Deep MockJS Integration

### 🎯 Requirements
Generate large amounts of realistic user data for frontend development and testing

### 🔥 Smart Data Generation

```javascript
module.exports = util => {
  return {
    db: {
      users: util.libObj.mockjs.mock({
        'data|50-100': [  // Randomly generate 50-100 user records
          {
            'id|+1': 1001,                    // ID starts from 1001, auto-increment
            username: '@cname',               // Random Chinese name
            email: '@email',                  // Random email
            phone: /^1[385][1-9]\d{8}/,      // Phone number regex
            avatar: '@image("200x200", "@color", "@cname")', // Random avatar
            'age|18-65': 1,                  // Age 18-65 random
            'gender|1': ['Male', 'Female', 'Private'], // Random gender selection
            address: '@county(true)',         // Detailed address
            company: '@ctitle(5,10)',         // Company name
            position: '@ctitle(2,4)',         // Position
            'salary|5000-30000': 1,          // Salary range
            bio: '@cparagraph(1,3)',          // Personal bio
            'tags|2-5': ['@cword(2,4)'],     // Tag array
            'isVip|1': true,                 // 50% chance of VIP
            createTime: '@datetime',          // Registration time
            lastLogin: '@datetime("yyyy-MM-dd HH:mm:ss")'  // Last login
          }
        ]
      }).data,
      
      // Article data
      articles: util.libObj.mockjs.mock({
        'data|20-30': [
          {
            'id|+1': 1,
            title: '@ctitle(10,25)',
            content: '@cparagraph(5,15)',
            author: '@cname',
            'viewCount|100-9999': 1,
            'likeCount|10-999': 1,
            'category|1': ['Technology', 'Life', 'Entertainment', 'Study', 'Work'],
            publishTime: '@datetime',
            'status|1': ['published', 'draft', 'deleted']
          }
        ]
      }).data
    }
  }
}
```

### 🎉 Instantly Have Rich Data

**Access user list**: http://127.0.0.1:9000/users

**Data Preview**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1001,
      "username": "Wang Xiuying",
      "email": "c.anderson@miller.gov",
      "phone": "13845678901",
      "avatar": "http://dummyimage.com/200x200/79f279&text=Wang Xiuying",
      "age": 28,
      "gender": "Female",
      "address": "Lixia District, Jinan City, Shandong Province",
      "company": "Innovation Technology Co., Ltd.",
      "position": "Frontend Engineer",
      "salary": 18000,
      "isVip": true,
      "createTime": "2023-05-15 14:30:22"
    }
  ]
}
```

### 🎭 Advanced Data Patterns

```javascript
// Relational data pattern
module.exports = util => {
  const mockjs = util.libObj.mockjs
  return {
    db: {
      // User table
      users: mockjs.mock({
        'data|10': [{
          'id|+1': 1,
          name: '@cname',
          'departmentId|1-3': 1  // Related department ID
        }]
      }).data,
      
      // Department table
      departments: [
        { id: 1, name: 'Technology Department', manager: 'Zhang San' },
        { id: 2, name: 'Product Department', manager: 'Li Si' },
        { id: 3, name: 'Design Department', manager: 'Wang Wu' }
      ]
    }
  }
}
```

> 🎨 **MockJS Syntax**:
> - `@cname` - Chinese name
> - `@email` - Email address  
> - `@datetime` - Date time
> - `@image(size)` - Random image
> - `@cparagraph` - Chinese paragraph
> - `'field|min-max': value` - Numeric range
> - `'field|count': [array]` - Random selection
> 
> 📚 **Complete Syntax**: See [MockJS Examples Collection](https://wll8.github.io/mockjs-examples/)

---

## 🛠️ Intercepting and Modifying Backend Data - No Backend Cooperation Required

### 🎯 Scenarios
- Backend returned data format doesn't meet frontend requirements
- Need to temporarily modify certain field values
- Want to test different data situations

### 📊 Original Backend Data
Assume `http://192.168.1.18:8080/api/user` returns:
```json
{
  "code": 200,
  "data": {
    "name": "Zhang San",
    "books": [
      { "page": 52, "type": "css" },
      { "page": 26, "type": "js" }
    ]
  },
  "success": true
}
```

### 🔧 Modify Specific Fields
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    // Change the second book's type to html
    '/api/user': ['data.books[1].type', 'html']
  }
}
```

**Result**: `books[1].type` changes from "js" to "html"

### 🎭 Complete Response Replacement
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    // Directly return new response
    '/api/user': ['success']  // Entire API directly returns "success"
  }
}
```

### 🚀 Advanced Usage - Functional Processing
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/user': [
      // Custom processing function
      ({req, json}) => {
        // Add user level
        json.data.level = json.data.books.length > 1 ? 'VIP' : 'Normal'
        // Add server time
        json.serverTime = new Date().toISOString()
        return json
      }
    ]
  }
}
```

> 🎯 **Usage Tips**:
> - Path format: `data.user.name` or `data.books[0].title`
> - Single parameter = complete response replacement
> - Double parameter = modify value at specified path
> - Function parameter = custom processing logic
> 
> 📚 **Detailed Syntax**: See [config.proxy complete documentation](../config/option.md#config-proxy)

---

## ⏱️ API Delay Simulation - Testing Weak Network Environments

### 🎯 Use Cases
- Test frontend Loading effects
- Simulate network delay situations
- Verify timeout handling logic

### 🐌 Basic Delay
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/user': {
      mid(req, res, next) {
        setTimeout(next, 3000)  // 3 second delay
      }
    }
  }
}
```

### 🎲 Random Delay - More Realistic Network Experience
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/slow': {
      mid(req, res, next) {
        // Random delay 1-5 seconds
        const delay = Math.random() * 4000 + 1000
        console.log(`🐌 API delay: ${Math.round(delay)}ms`)
        setTimeout(next, delay)
      }
    }
  }
}
```

### 📊 Conditional Delay - Smart Simulation
```javascript
module.exports = {
  proxy: {
    '/': 'http://192.168.1.18:8080',
    '/api/search': {
      mid(req, res, next) {
        const { keyword } = req.query
        // Longer keywords = longer delay (simulate complex queries)
        const delay = keyword ? keyword.length * 200 : 500
        setTimeout(next, delay)
      }
    }
  }
}
```

> 💡 **Best Practices**:
> - Short delay (100-500ms): Simulate normal network
> - Medium delay (1-3s): Simulate slow network
> - Long delay (5s+): Test timeout handling
> 
> 🔧 **Debug Tips**: You'll see delay logs in console for easy debugging

---

## 📁 File Download API - Instant Download Service

### 🎯 Requirements
Create file download functionality supporting various file types

### 📝 Basic Download
```javascript
module.exports = {
  api: {
    '/download/report' (req, res) {
      const filePath = './reports/monthly-report.pdf'
      res.download(filePath, 'Monthly Report.pdf')  // Second parameter is download filename
    }
  }
}
```

### 🎯 Dynamic File Download
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
        return res.status(404).json({ error: 'File type not supported' })
      }
      
      res.download(filePath, filename || `download.${type}`)
    }
  }
}
```

### 🔐 Permission-Controlled Download
```javascript
module.exports = {
  api: {
    '/secure/download' (req, res) {
      const { token, fileId } = req.query
      
      // Simple permission verification
      if (token !== 'valid-token') {
        return res.status(401).json({ error: 'No download permission' })
      }
      
      const filePath = `./secure-files/${fileId}.zip`
      
      // Check if file exists
      const fs = require('fs')
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' })
      }
      
      res.download(filePath, `secure-file-${fileId}.zip`)
    }
  }
}
```

### 🧪 Test Downloads
```bash
# Basic download
curl -O http://127.0.0.1:9000/download/report

# Dynamic download
curl -O "http://127.0.0.1:9000/download/pdf?filename=MyDocument.pdf"

# Permission download
curl -O "http://127.0.0.1:9000/secure/download?token=valid-token&fileId=123"
```

> 📋 **Supported Formats**: PDF, Excel, Word, images, archives, and all file types
> 
> 🛡️ **Security Reminder**: Strengthen permission verification and path checking in production

---

## 🕸️ WebSocket Real-time Communication - Chat Room in 5 Minutes

### 🎯 Use Cases
- Real-time chat systems
- Message push services
- Real-time data updates

### 💬 Basic Chat Room
```javascript
module.exports = {
  api: {
    'ws /chat' (ws, req) {
      console.log('🎉 New user joined chat room')
      
      // Welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Welcome to the chat room!',
        timestamp: Date.now()
      }))
      
      // Listen for messages
      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg)
          console.log('📨 Received message:', data)
          
          // Echo message (in real scenarios, broadcast to all users)
          ws.send(JSON.stringify({
            type: 'message',
            content: `Echo: ${data.content}`,
            sender: 'System',
            timestamp: Date.now()
          }))
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error', 
            message: 'Invalid message format'
          }))
        }
      })
      
      // Connection close
      ws.on('close', () => {
        console.log('👋 User left chat room')
      })
    }
  }
}
```

### 🌐 Client Test Code
Run in browser console:
```javascript
// Connect WebSocket
function startChat() {
  const ws = new WebSocket('ws://127.0.0.1:9000/chat')
  
  ws.onopen = () => {
    console.log('✅ Connection successful')
    // Send test message
    ws.send(JSON.stringify({
      content: 'Hello everyone, I\'m new here!',
      sender: 'Guest' + Math.floor(Math.random() * 1000)
    }))
  }
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    console.log('📨 Received message:', data)
    
    // Display message
    if (data.type === 'welcome') {
      console.log('🎉', data.message)
    } else if (data.type === 'message') {
      console.log(`💬 ${data.sender}: ${data.content}`)
    }
  }
  
  ws.onclose = () => {
    console.log('❌ Connection closed, reconnecting in 5 seconds...')
    setTimeout(startChat, 5000)  // Auto reconnect
  }
  
  ws.onerror = (error) => {
    console.error('❌ Connection error:', error)
  }
  
  // Global variable for easy message sending
  window.chatWs = ws
  
  return ws
}

// Start chat
const ws = startChat()

// Convenient method to send messages
function sendMessage(content) {
  if (window.chatWs && window.chatWs.readyState === WebSocket.OPEN) {
    window.chatWs.send(JSON.stringify({
      content: content,
      sender: 'Me'
    }))
  } else {
    console.log('❌ Connection not established')
  }
}

// Usage example
// sendMessage('Hello, World!')
```

### 📊 Real-time Data Push
```javascript
module.exports = {
  api: {
    'ws /monitor' (ws, req) {
      ws.send('📊 Starting system status monitoring...')
      
      // Push system status every second
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
      
      // Clean up timer
      ws.on('close', () => {
        clearInterval(interval)
        console.log('🔚 Stop monitoring')
      })
    }
  }
}
```

> 🚀 **Advanced Features**:
> - ✅ Support message broadcasting (multiple clients)
> - ✅ Auto-reconnect mechanism
> - ✅ Message type differentiation
> - ✅ Comprehensive error handling
> 
> 💡 **Debug Tips**: Open browser DevTools → Network → WS tab to see all WebSocket messages

---

## 📤 File Upload API - Multi-file Upload Support

### 🎯 Use Cases
- User avatar upload
- Batch document upload
- Photo album functionality

### 📷 Single File Upload
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/avatar' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multiparty')
        const form = new multiparty.Form()
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ error: 'Upload failed', details: err.message })
          }
          
          const file = files.avatar[0]  // Get uploaded file
          res.json({
            message: 'Avatar upload successful',
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

### 📁 Multi-file Upload
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/documents' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multipartys')
        const form = new multiparty.Form()
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ error: 'Upload failed' })
          }
          
          // Process multiple files
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
            message: `Successfully uploaded ${uploadedFiles.length} files`,
            data: uploadedFiles,
            uploadTime: new Date().toISOString()
          })
        })
      }
    }
  }
}
```

### 🔍 Upload with Validation
```javascript
module.exports = util => {
  return {
    api: {
      async 'post /upload/secure' (req, res) {
        const multiparty = await util.toolObj.generate.initPackge('multiparty')
        const form = new multiparty.Form()
        
        // Set upload limits
        form.maxFilesSize = 10 * 1024 * 1024  // Max 10MB
        
        form.parse(req, (err, fields, files) => {
          if (err) {
            return res.status(400).json({ 
              error: 'Upload failed', 
              reason: err.message 
            })
          }
          
          const file = files.document[0]
          
          // File type validation
          const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
          const fileType = file.headers['content-type']
          
          if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({
              error: 'File type not supported',
              allowed: allowedTypes,
              received: fileType
            })
          }
          
          // File size validation
          if (file.size > 5 * 1024 * 1024) {  // 5MB
            return res.status(400).json({
              error: 'File too large',
              maxSize: '5MB',
              fileSize: `${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`
            })
          }
          
          res.json({
            message: 'File uploaded and validated successfully',
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

### 🧪 Frontend Test Code
```html
<!-- HTML form test -->
<form action="http://127.0.0.1:9000/upload/avatar" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" accept="image/*" required>
  <button type="submit">Upload Avatar</button>
</form>

<!-- JavaScript test -->
<script>
async function uploadFile() {
  const fileInput = document.querySelector('input[type="file"]')
  const file = fileInput.files[0]
  
  if (!file) {
    alert('Please select a file')
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
    console.log('✅ Upload successful:', result)
  } catch (error) {
    console.error('❌ Upload failed:', error)
  }
}
</script>
```

> 📋 **Supported Features**:
> - ✅ Single/multi-file upload
> - ✅ File type validation
> - ✅ File size limits
> - ✅ Upload progress tracking
> - ✅ Comprehensive error handling
> 
> 🔧 **Production Reminder**: In actual projects, temporary files need to be moved to permanent storage locations

---

## 🎯 Dynamic Path Parameters - RESTful Route Design

### 🎯 Use Cases
- User detail pages: `/user/:userId`
- Product categories: `/category/:categoryId/products/:productId`  
- File operations: `/files/:fileId/download`

### 👤 User System Example
```javascript
module.exports = {
  api: {
    // Get user information
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
            city: 'Beijing',
            bio: 'This is a user bio'
          } : null
        }
      })
    },
    
    // Update user information
    'put /user/:userId' (req, res) {
      const { userId } = req.params
      const updateData = req.body
      
      res.json({
        code: 200,
        message: `User ${userId} information updated successfully`,
        data: {
          id: userId,
          ...updateData,
          updateTime: new Date().toISOString()
        }
      })
    },
    
    // Delete user
    'delete /user/:userId' (req, res) {
      const { userId } = req.params
      
      res.json({
        code: 200,
        message: `User ${userId} deleted`,
        deletedAt: new Date().toISOString()
      })
    }
  }
}
```

---

## 🚀 Advanced Features - Making Collaboration More Efficient

### 📤 Smart API Sharing - Goodbye to Screenshot Parameter Passing

#### 🎯 Pain Point Solution
- ❌ Traditional way: Screenshot → WeChat send → Manual parameter input
- ✅ MockM way: One link → Complete parameters → One-click debugging

#### 💡 Usage Methods

**Method 1: Command Line View**
After starting MockM, each API request will display a share link in the console

**Method 2: Management Interface View**  
Visit http://127.0.0.1:9005 → Find corresponding request → Copy share link

**Method 3: Developer Tools View**
Chrome DevTools → Network → Find request → Response Headers → `x-test-api`

#### ✨ Share Link Features
- 🔗 Contains complete request parameters
- 🎭 Supports online debugging
- 📊 Shows response results
- 🕐 Permanently valid

---

### 🌐 Remote Debugging - Breaking Local Network Limitations

#### 🎯 Use Cases
- WeChat official account development
- Mobile device real machine testing
- Remote team collaboration
- Client demonstrations

#### ⚡ One-Click Enable
```javascript
module.exports = {
  remote: true,  // Enable remote access
  api: {
    '/hello': { message: 'Remote access successful!' }
  }
}
```

#### 🎉 Instantly Have
- 🌍 Public domain (HTTPS)
- 🔒 SSL certificate auto-configuration
- 📱 Direct mobile access
- 🔗 Share anywhere

#### 📱 WeChat Development Integration
```javascript
module.exports = {
  remote: true,
  api: {
    // WeChat message push verification
    '/wechat/verify' (req, res) {
      const token = '123'  // Set your Token
      const crypto = require('crypto')
      const { signature, timestamp, nonce, echostr } = req.query
      
      const sha = crypto.createHash('sha1')
        .update([token, timestamp, nonce].sort().join(''))
        .digest('hex')
      
      if (sha === signature) {
        res.send(echostr)  // Verification passed
      } else {
        res.json({ error: 'Verification failed' })
      }
    },
    
    // WeChat message handling
    'post /wechat/message' (req, res) {
      console.log('📨 Received WeChat message:', req.body)
      res.json({ success: true })
    }
  }
}
```

> 💡 **Configuration Notes**:
> - Console will show remote access address
> - All APIs automatically support HTTPS
> - Share links will also generate remote versions

---

### 🔄 API Recovery - Don't Panic When Backend Fails

#### 🎯 Problem Scenarios
- Backend API suddenly errors
- Database connection failure  
- Server temporarily down
- Version release issues

#### 💡 Solution

**Step 1: Find History**
1. Visit http://127.0.0.1:9005
2. Find previous normal request for that API
3. Click `webApi` → `Use this record`

**Step 2: API Immediately Restored**
MockM will automatically create a temporary API using historical data, frontend pages immediately return to normal

#### 🎭 Emergency Mode
```javascript
// Switch to emergency mode
module.exports = {
  // Use historical data to provide service
  port: 9001,  // Emergency port
  proxy: false // Turn off proxy, fully use local data
}
```

**Frontend Switch**:
```javascript
// Original request address
const API_BASE = 'http://127.0.0.1:9000'

// Emergency mode address (using historical data)
const API_BASE = 'http://127.0.0.1:9001'
```

> 🛟 **Emergency Plan**:
> - Development environment: Switch to historical data mode
> - Test environment: Use backup data service
> - Production environment: Contact operations for quick recovery

---

### 🎛️ Multi-Service Integration - Unified Proxy Management

#### 🎯 Complex Scenarios
Enterprise projects usually have multiple backend services:
- User service: `192.168.1.18:8081`
- Order service: `192.168.1.18:8082`  
- Payment service: `192.168.1.18:8083`

#### 🔧 Unified Proxy Configuration
```javascript
module.exports = {
  proxy: {
    // Base service
    '/': 'http://www.httpbin.org/',
    
    // User-related APIs
    '/api/user/': 'http://192.168.1.18:8081/api/',
    '/api/auth/': 'http://192.168.1.18:8081/api/',
    
    // Order-related APIs  
    '/api/order/': 'http://192.168.1.18:8082/api/',
    '/api/cart/': 'http://192.168.1.18:8082/api/',
    
    // Payment-related APIs
    '/api/payment/': 'http://192.168.1.18:8083/api/',
  },
  
  // Corresponding API documentation
  openApi: {
    '/': 'http://httpbin.org/spec.json',
    '/api/user/': 'http://192.168.1.18:8081/v3/api-docs',
    '/api/order/': 'http://192.168.1.18:8082/v3/api-docs', 
    '/api/payment/': 'http://192.168.1.18:8083/v3/api-docs',
  }
}
```

#### 🚀 Multi-Instance Deployment
```bash
# User service proxy
mm dataDir=./data/user port=8081 replayPort=8181 testPort=8281 proxy=http://192.168.1.18:8081

# Order service proxy  
mm dataDir=./data/order port=8082 replayPort=8182 testPort=8282 proxy=http://192.168.1.18:8082

# Payment service proxy
mm dataDir=./data/payment port=8083 replayPort=8183 testPort=8283 proxy=http://192.168.1.18:8083
```

#### 📋 Configuration File Separation
```bash
# Different services use different configurations
mm --config=./config/user.config.js
mm --config=./config/order.config.js  
mm --config=./config/payment.config.js
```

> 🎯 **Best Practices**:
> - Separate services by business modules
> - Use different ports to avoid conflicts
> - Unified logging and monitoring management
> - Configuration file version control

---

## 💡 Practical Tips Summary

### 🎯 Development Phase
1. **CORS Proxy** - One command solves CORS
2. **Data Mocking** - MockJS generates realistic data  
3. **API Debugging** - Visual management interface

### 🧪 Testing Phase
1. **Delay Simulation** - Test Loading and timeout
2. **Data Interception** - Simulate various exception scenarios
3. **Batch Testing** - Full RESTful API coverage

### 🚀 Collaboration Phase  
1. **Link Sharing** - Goodbye to screenshot parameter passing
2. **Remote Debugging** - Break network limitations
3. **Version Management** - Git-ize configuration files

### 🛟 Emergency Phase
1. **History Recovery** - Quick API failure fixes
2. **Data Backup** - Automatically save request history
3. **Multi-Environment Switching** - Flexible response to various situations

> 🎉 **Congratulations!** You've mastered MockM's core skills and can now excel in real projects!
> 
> 📚 **Advanced Learning**:
> - [Configuration Reference Manual](../config/option.md) - Deep dive into all configuration options
> - [Web Interface Usage](../use/webui.md) - Visual operation guide  
> - [Test Case Collection](https://wll8.github.io/mockm/case/) - More feature demonstrations
