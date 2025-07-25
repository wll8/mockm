# 📁 Output Files - Understanding MockM's File System

MockM generates various files to support its operation. Understanding these files helps you better use and manage your MockM instances.

## 🏗️ File Structure Overview

```
httpData/                    # 📂 Main data directory
├── db.json                  # 🗄️ API data storage
├── httpHistory.json         # 📜 Request history
├── store.json               # ⚙️ Configuration persistence
├── log.err.txt             # ❌ Error logs
├── openApiHistory/         # 📋 OpenAPI import history
│   └── [timestamp].json    
└── request/                # 📨 Request record storage
    ├── [hash]/
    │   ├── req.json        # Request data
    │   └── res.json        # Response data
    └── ...
```

## 🗄️ Core Data Files

### 📊 db.json - Your Data Warehouse

The `db.json` file is MockM's primary data storage, automatically generated based on your API configurations:

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createTime": "2023-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Smith", 
      "email": "jane@example.com",
      "createTime": "2023-01-02T00:00:00.000Z"
    }
  ],
  "posts": [
    {
      "id": 1,
      "title": "Hello World",
      "content": "This is my first post",
      "authorId": 1
    }
  ]
}
```

**🎯 Key Features:**
- **📝 RESTful Support**: Automatically supports CRUD operations
- **🔗 Relations**: Handle associations between data entities
- **🎲 MockJS Integration**: Generate data using MockJS syntax
- **💾 Persistence**: Data persists across server restarts

### 📜 httpHistory.json - Request Chronicle

Records all HTTP requests processed by MockM for debugging and analysis:

```json
{
  "history": [
    {
      "id": "req-1642501234567",
      "method": "GET",
      "url": "/api/users",
      "query": { "page": "1", "limit": "10" },
      "headers": {
        "user-agent": "Mozilla/5.0...",
        "accept": "application/json"
      },
      "body": null,
      "response": {
        "status": 200,
        "headers": { "content-type": "application/json" },
        "data": { "users": [...] }
      },
      "timestamp": "2023-01-01T10:20:34.567Z",
      "duration": 25
    }
  ]
}
```

**🔍 Use Cases:**
- **🐛 Debugging**: Track request flow and responses
- **📊 Analytics**: Analyze API usage patterns
- **🧪 Testing**: Verify API behavior
- **📈 Performance**: Monitor response times

### ⚙️ store.json - Configuration Memory

Stores runtime configuration and state information:

```json
{
  "config": {
    "port": 9000,
    "host": "0.0.0.0",
    "dataDir": "./httpData/",
    "openApi": "https://petstore.swagger.io/v2/swagger.json"
  },
  "state": {
    "lastStartTime": "2023-01-01T10:00:00.000Z",
    "requestCount": 1250,
    "errorCount": 3
  },
  "cache": {
    "openApiSpecs": {
      "petstore": { "lastFetch": "2023-01-01T09:00:00.000Z" }
    }
  }
}
```

## 📋 OpenAPI Integration

### 📁 openApiHistory/ - Import Records

When importing OpenAPI specifications, MockM saves them for future reference:

```
openApiHistory/
├── 1642501234567.json      # Timestamp-based filename
├── 1642587634567.json      # Another import
└── petstore-latest.json    # Named import
```

**🎯 Structure of Import Records:**
```json
{
  "importTime": "2023-01-01T10:20:34.567Z",
  "source": "https://petstore.swagger.io/v2/swagger.json",
  "spec": {
    "swagger": "2.0",
    "info": { "title": "Petstore", "version": "1.0.0" },
    "paths": { ... },
    "definitions": { ... }
  },
  "generatedApis": [
    { "path": "/pets", "method": "GET" },
    { "path": "/pets", "method": "POST" },
    { "path": "/pets/{id}", "method": "GET" }
  ]
}
```

## 📨 Request Storage System

### 📂 request/ - Detailed Request Archive

Each HTTP request can be stored with complete details:

```
request/
├── a1b2c3d4/               # Hash-based directory
│   ├── req.json           # Request details
│   └── res.json           # Response details
├── e5f6g7h8/
│   ├── req.json
│   └── res.json
└── ...
```

**📝 req.json Example:**
```json
{
  "method": "POST",
  "url": "/api/users",
  "headers": {
    "content-type": "application/json",
    "authorization": "Bearer token123"
  },
  "query": {},
  "body": {
    "name": "Alice Johnson",
    "email": "alice@example.com"
  },
  "timestamp": "2023-01-01T10:30:00.000Z",
  "userAgent": "PostmanRuntime/7.29.0"
}
```

**📤 res.json Example:**
```json
{
  "status": 201,
  "headers": {
    "content-type": "application/json",
    "x-response-time": "15ms"
  },
  "body": {
    "id": 3,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "createTime": "2023-01-01T10:30:00.000Z"
  },
  "timestamp": "2023-01-01T10:30:00.015Z"
}
```

## 📊 Log Files

### ❌ log.err.txt - Error Tracking

Captures errors and exceptions for troubleshooting:

```
[2023-01-01 10:45:23] ERROR: Failed to parse JSON in request body
Request: POST /api/users
Error: Unexpected token } in JSON at position 42
Stack: SyntaxError: Unexpected token } in JSON...

[2023-01-01 11:20:15] WARN: OpenAPI spec fetch timeout
URL: https://slow-api.example.com/swagger.json
Timeout: 30000ms

[2023-01-01 12:00:01] ERROR: Database write failed
File: httpData/db.json
Error: EACCES: permission denied
```

## 🛠️ Configuration Options

### 📍 Custom Data Directory

You can customize where MockM stores its files:

```js
// mm.config.js
module.exports = {
  dataDir: './my-mock-data/',    // Custom directory
  // or absolute path
  dataDir: '/var/mockm/data/'
}
```

### 🎛️ File Generation Control

Control which files MockM generates:

```js
module.exports = {
  // Disable request history
  record: false,
  
  // Disable error logging
  logLevel: 'silent',
  
  // Custom database file
  database: './custom-db.json'
}
```

### 🔄 File Rotation

For high-traffic scenarios, enable file rotation:

```js
module.exports = {
  logRotate: {
    enabled: true,
    maxSize: '10MB',
    maxFiles: 5
  },
  historyLimit: 1000  // Keep last 1000 requests
}
```

## 🎯 Best Practices

### 📋 Data Management
- **🔄 Regular Backups**: Back up `db.json` regularly for important data
- **🧹 Cleanup History**: Periodically clean old request history
- **📊 Monitor Size**: Watch file sizes in high-traffic environments

### 🔒 Security Considerations
- **🚫 Sensitive Data**: Don't store sensitive information in plain text
- **📁 File Permissions**: Set appropriate file system permissions
- **🔐 Log Sanitization**: Ensure logs don't contain sensitive data

### 🚀 Performance Tips
- **💾 Memory vs Disk**: Balance between memory caching and disk storage
- **🗂️ Archive Old Data**: Move old data to archive directories
- **⚡ Indexing**: Use database indexes for large datasets

## 🔧 Troubleshooting

### Common File Issues

**❌ Permission Denied**
```bash
# Fix file permissions
chmod 755 httpData/
chmod 644 httpData/*.json
```

**📂 Missing Directories**
```bash
# MockM auto-creates directories, but you can pre-create:
mkdir -p httpData/request httpData/openApiHistory
```

**💾 Disk Space**
```bash
# Check space usage
du -sh httpData/
```

### File Corruption Recovery

If files become corrupted:

1. **🗄️ db.json**: MockM can regenerate from API definitions
2. **📜 httpHistory.json**: Safe to delete, will recreate
3. **⚙️ store.json**: Contains runtime state, can be regenerated

```js
// Emergency reset
const fs = require('fs')
const path = require('path')

// Backup first
fs.copyFileSync('./httpData/db.json', './httpData/db.json.backup')

// Reset corrupted file
fs.writeFileSync('./httpData/db.json', '{}')
```

## 🎓 Advanced Usage

### Custom File Handlers

Create custom processors for output files:

```js
// mm.config.js
module.exports = (util) => {
  const fs = require('fs')
  
  // Custom history processor
  util.server.app.use((req, res, next) => {
    const originalJson = res.json
    res.json = function(data) {
      // Custom logging logic
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        response: data
      }
      
      fs.appendFileSync(
        './httpData/custom.log', 
        JSON.stringify(logEntry) + '\n'
      )
      
      return originalJson.call(this, data)
    }
    next()
  })
  
  return {}
}
```

> 💡 **Pro Tip**: Understanding MockM's file system helps you debug issues, optimize performance, and integrate with external tools!
