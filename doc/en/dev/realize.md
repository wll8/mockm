# Implementation
This document provides a detailed description of the technical implementation principles, architectural design, and core modules of the mockm tool.

## Project Overview

mockm is an API mocking and debugging tool based on Node.js and Express, integrating features such as mock data generation, interface proxying, request recording and replay, and Web UI management. The project adopts a front-end and back-end separation architecture, with the backend providing API services and the frontend providing a visual management interface.

## Technology Stack

### Backend Technology Stack
- **Node.js**: Runtime environment, supporting v10.12.0 and above
- **Express**: Web application framework, based on `@wll8/json-server` extension
- **http-proxy-middleware**: HTTP proxy middleware for request forwarding
- **chokidar**: File watching, supporting configuration file hot reload
- **vm2**: Secure JavaScript sandbox for executing user-defined code
- **@wll8/better-mock**: Enhanced version of Mock.js for generating mock data
- **WebSocket**: Real-time communication implemented based on `@wll8/express-ws`
- **body-parser**: Request body parsing middleware
- **compression**: HTTP compression middleware
- **morgan**: HTTP request logging middleware

### Frontend Technology Stack
- **React**: User interface framework (v17.0.1)
- **Ant Design**: UI component library (v4.10.0)
- **Axios**: HTTP client library
- **React Router**: Frontend routing management
- **React JSON View**: JSON data visualization component
- **SCSS**: CSS preprocessor

### Build and Deployment Tools
- **Webpack**: Module bundling tool
- **Babel**: JavaScript compiler
- **Gulp**: Automated build tool
- **VuePress**: Documentation site generator
- **Nodemon**: Development environment auto-restart tool

## Core Architecture

### Overall Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Web UI (React + Ant Design)  │  CLI Tool  │  IDE Plugins   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Proxy Server│  │ Test Server │  │ Replay Server       │   │
│  │ (port)      │  │ (testPort)  │  │ (replayPort)        │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                     Business Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ API Handler │  │ DB Handler  │  │ Static Handler      │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Middleware  │  │ Plugin Sys  │  │ History Manager     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Config File │  │ HTTP History│  │ Mock Data Store     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Process Management Architecture

mockm adopts a multi-process architecture, managing process lifecycle through `@wll8/process-manager`:

1. **Main Process (run.js)**: Responsible for configuration parsing, process management, and file watching
2. **Service Process (server.js)**: Responsible for starting various servers and business logic
3. **Child Services**: Proxy Server, Test Server, Replay Server

## Development Environment
If you encounter issues, you can try using an environment similar to the following:

- win10 x64
- chrome v100.0.4896.127 x64
- vscode v1.64.2
- node v14.15.5 x64 (or v20.19.4)
  - yarn v1.22.18
  - npm v6.14.11
  - pnpm v10.13.1

## Core Module Implementation

### 1. Startup Process (run.js)

The startup process is the entry point of mockm, responsible for:

- **Command Line Argument Parsing**: Using `cross-argv` to handle cross-platform command line arguments
- **Configuration File Processing**: Dynamic loading and parsing of configuration files
- **Process Management**: Using `ProcessManager` to manage service processes
- **File Watching**: Monitoring configuration file changes and automatically restarting services
- **Plugin System**: Loading and initializing plugins

```javascript
// Core startup logic
const cp = new ProcessManager([nodeArg, serverPath, ...process.argv.slice(2)])
cp.on('message', ({action, data}) => {
  if(action === 'reboot') {
    cp.reboot(0) // Auto restart
  }
})
```

### 2. Server Core (server.js)

The server core is responsible for initializing various services and middleware:

- **Configuration Loading**: Loading global configuration to `global.config`
- **Port Checking**: Ensuring required ports are available
- **Host File Management**: Automatically modifying system hosts file in hostMode
- **Service Startup**: Starting Proxy, Test, and Replay servers
- **History Initialization**: Loading HTTP request history

```javascript
// Service startup process
global.config = await require('./config.js')
const {allRoute, allRouteTest} = await customApi()
global.HTTPHISTORY = util.tool.file.fileStore(global.config._httpHistory).get()
global.STORE = tool.file.fileStore(global.config._store)

// Start various services
require('./proxy.js')({allRoute})
require('./test.js')()
require('./replay.js')({allRoute, allRouteTest})
```

### 3. Proxy Server (proxy.js)

The proxy server is the core functionality of mockm, implementing request interception and forwarding:

**Main Features**:
- HTTP/HTTPS proxy
- WebSocket support
- Request/response interception and modification
- CORS handling
- Request history recording
- Custom middleware support

**Implementation Principle**:
```javascript
// Proxy configuration
const proxy = require('http-proxy-middleware').createProxyMiddleware
const proxyConfig = getProxyConfig({
  target: rootTarget,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    allowCors({req: proxyReq, proxyConfig: userConfig})
    reqHandle().injectionReq({req, res, type: 'get'})
  },
  onProxyRes: (proxyRes, req, res) => {
    allowCors({res: proxyRes, req, proxyConfig: userConfig})
    setHttpHistoryWrap({req, res: proxyRes})
  }
})
```

### 4. Test Server (test.js)

The test server provides API management and debugging functionality:

**Main Features**:
- API interface management
- Request history viewing
- Data generation and transformation
- OpenAPI document parsing
- Interface testing and debugging

**Key Endpoints**:
- `GET /api/history`: Get request history
- `POST /api/listToData`: Data generation
- `GET /api/openApi`: OpenAPI document parsing
- `PATCH /api/studio`: API configuration updates

### 5. Replay Server (replay.js)

The replay server is used for replaying historical requests:

**Implementation Logic**:
```javascript
// Replay decision logic
const proxy = createProxyMiddleware((pathname, req) => {
  const method = req.method.toLowerCase()
  const fullApi = `${method} ${req.originalUrl}`
  const history = getHistory({fullApi}).data

  if(history || config.hostMode) {
    return false // Use history, don't proxy
  } else if(allRouteTest({allRoute, method, pathname})) {
    return true // Match custom API, perform proxy
  } else {
    return config.replayProxy // Decide based on configuration
  }
})
```

## Business Logic Implementation

### 1. Route Processing System (business.js)

Route processing is the core business logic of mockm, responsible for converting various types of API configurations into Express routes:

**Route Types**:
- **API Routes**: User-defined API interfaces
- **DB Routes**: RESTful APIs based on JSON data
- **Static File Routes**: Static resource services
- **Proxy Routes**: Request forwarding rules

**Implementation Principle**:
```javascript
// Route parsing and registration
const allRoute = [
  ...obj.api,      // Custom APIs
  ...obj.db,       // Database APIs
  ...obj.resetUrl, // URL reset middleware
  ...obj.static,   // Static files
  ...obj.apiWeb,   // Web UI APIs
  ...obj.proxy,    // Proxy rules
]

// Route matching test
function allRouteTest({allRoute, method, pathname}) {
  return allRoute.find(item => {
    if(item.method === 'use') {
      return pathname.startsWith(item.route) && !item.disable
    }
    return item.re.exec(pathname) && item.method === method && !item.disable
  })
}
```

### 2. Data Generation System

mockm provides powerful data generation functionality based on Mock.js and custom rules:

**Supported Data Types**:
- Basic types: string, number, boolean
- Composite types: object, array
- Mock.js rules: @name, @email, @date, etc.
- Custom functions: Support for JavaScript code execution

**Implementation Mechanism**:
```javascript
function listToData(list, options = {}) {
  const Mock = require('@wll8/better-mock')

  function processItem(item) {
    if(typeof item === 'string' && item.startsWith('@')) {
      return Mock.mock(item) // Mock.js rules
    }
    if(typeof item === 'object') {
      return processObject(item) // Recursively process objects
    }
    return item
  }
}
```

### 3. Request History Management

The request history feature records all HTTP requests passing through mockm:

**Storage Structure**:
```javascript
{
  "GET /api/users": {
    "req": {
      "method": "GET",
      "url": "/api/users",
      "headers": {...},
      "body": {...}
    },
    "res": {
      "statusCode": 200,
      "headers": {...},
      "body": {...}
    },
    "timestamp": 1640995200000
  }
}
```

**Implementation Logic**:
```javascript
function setHttpHistoryWrap({req, res}) {
  const method = req.method.toLowerCase()
  const fullApi = `${method} ${req.originalUrl}`

  if(!ignoreHttpHistory({config, req})) {
    const historyData = {
      req: extractReqData(req),
      res: extractResData(res),
      timestamp: Date.now()
    }
    global.HTTPHISTORY[fullApi] = historyData
    saveHistoryToFile()
  }
}
```

### 4. Middleware System

mockm uses a middleware pattern to handle requests:

**Middleware Types**:
- **CORS Middleware**: Handle cross-origin requests
- **Body Parser**: Parse request bodies
- **Logger**: Request logging
- **Compression**: Response compression
- **Static**: Static file service

**Middleware Registration Order**:
```javascript
app.use(corsMiddleware)           // CORS handling
app.use(bodyParser.json())        // JSON parsing
app.use(bodyParser.urlencoded())  // Form parsing
app.use(logger)                   // Logging
app.use(compression())            // Response compression
// ... User custom middleware
app.use(proxyMiddleware)          // Proxy middleware
```

## Plugin System

### 1. Plugin Architecture

mockm provides a flexible plugin system that supports feature extensions:

**Plugin Lifecycle**:
- `hostFileCreated`: Host file creation completed
- `serverCreated`: Server creation completed
- `useCreated`: Express application initialization completed
- `parseCreated`: Parser initialization completed
- `routeCreated`: Route creation completed

**Plugin Structure**:
```javascript
module.exports = {
  key: 'plugin-name',           // Plugin unique identifier
  hostVersion: ['1.1.0'],       // Supported host versions
  async main({hostInfo, pluginConfig, config, util}) {
    return {
      async hostFileCreated() {
        // Processing logic after host file creation
      },
      async serverCreated(info) {
        // Processing logic after server creation
      },
      async useCreated(app) {
        // Processing logic after Express application initialization
      }
    }
  }
}
```

### 2. Built-in Plugins

**base plugin**: Provides basic functionality
**api-doc plugin**: API documentation generation
**validate plugin**: Request parameter validation

### 3. Plugin Loading Mechanism

```javascript
async function pluginRun(eventName, ...args) {
  for(const plugin of loadedPlugins) {
    if(plugin[eventName]) {
      await plugin[eventName](...args)
    }
  }
}
```

## Security Mechanisms

### 1. Code Execution Security

mockm uses vm2 to provide a secure code execution environment:

```javascript
const { NodeVM } = require('vm2')
const vm = new NodeVM({
  sandbox: {
    tool: {
      libObj: lib,
      wrapApiData,
      listToData,
      cur,
    },
  },
})

try {
  const code = vm.run(`module.exports = ${custom}`, 'vm.js')
  if(typeof code === 'function') {
    code(req, res, next)
  } else {
    res.json(code)
  }
} catch (err) {
  res.status(403).json({msg: err.message})
}
```

### 2. File Access Control

- Restrict file access paths
- Prevent directory traversal attacks
- Secure file name handling

### 3. Request Validation

- Parameter type validation
- Request size limits
- Malicious request filtering

## Configuration System

### 1. Configuration File Structure

mockm supports multiple configuration methods:

```javascript
module.exports = {
  port: 9005,                    // Main service port
  testPort: 9006,               // Test service port
  replayPort: 9007,             // Replay service port
  proxy: 'http://localhost:3000', // Proxy target
  api: {                        // Custom APIs
    '/api/users': {
      get: {
        data: [{id: 1, name: 'John'}]
      }
    }
  },
  db: {                         // Database configuration
    users: [{id: 1, name: 'John'}]
  },
  route: {                      // Route rewriting
    '/old-api/*': '/new-api/$1'
  }
}
```

### 2. Configuration Hot Reload

Using chokidar to monitor configuration file changes:

```javascript
tool.file.fileChange([global.config._configFile, ...global.config.watch],
  (files) => process.send({action: 'reboot', data: files})
)
```

## Frontend Implementation

### 1. React Application Architecture

The frontend is built with React + Ant Design, providing a visual management interface:

**Main Pages**:
- API List Page: Display all available API interfaces
- Request History Page: View and manage HTTP request history
- API Editor: Visual editing of API configurations
- Data Generator: Generate mock data
- Settings Page: System configuration management

**Technical Implementation**:
```javascript
// HTTP client configuration
const http = axios.create({
  baseURL: common.cfg.baseURL,
  timeout: 0,
  headers: {'X-Custom-Header': 'foobar'}
})

// Route configuration
import { Route, Switch } from 'react-router-dom'
<Switch>
  <Route path="/api" component={ApiList} />
  <Route path="/history" component={History} />
  <Route path="/editor" component={ApiEditor} />
</Switch>
```

### 2. State Management

Using React Hooks and Context API for state management:

```javascript
const AppContext = createContext()

function AppProvider({children}) {
  const [config, setConfig] = useState({})
  const [history, setHistory] = useState([])

  return (
    <AppContext.Provider value={{config, setConfig, history, setHistory}}>
      {children}
    </AppContext.Provider>
  )
}
```

### 3. Build and Deployment

Frontend build process:

```bash
# Development environment
npm start  # Start development server

# Production build
npm run build  # Build and copy to server/page directory
```

## Performance Optimization

### 1. Request Processing Optimization

- **Connection Pool Management**: Reuse HTTP connections
- **Response Caching**: Cache static resources and API responses
- **Compression Transfer**: Enable gzip compression
- **Asynchronous Processing**: Use Promise and async/await

### 2. Memory Management

- **History Record Limits**: Limit the number of history records in memory
- **Periodic Cleanup**: Regularly clean up expired data
- **Stream Processing**: Use stream processing for large files

### 3. File System Optimization

- **File Watching Optimization**: Use chokidar for efficient file change monitoring
- **Batch Writing**: Batch write history records
- **Filename Optimization**: Use filenamify to handle filenames

## Deployment Solutions

### 1. Local Development Deployment

```bash
# Global installation
npm install -g mockm

# Start service
mockm --config
```

### 2. Docker Deployment

mockm provides a complete Docker solution, supporting containerized deployment for both development and production environments.

#### 2.1 Docker Images

The project provides two Docker images:

- **mockm-client**: Frontend React application (Node.js 14.15.5 + Yarn 1.22.18)
- **mockm-dev**: Backend services and tools (Node.js 20.19.4 + pnpm 10.13.1)

**Design Philosophy**: All images mount the project root directory to `/workspace`, following the native design of the source code to reduce understanding costs.

#### 2.2 Quick Start

```bash
# Build images
docker build -f Dockerfile.client -t mockm-client .
docker build -f Dockerfile.dev -t mockm-dev .

# Start services using Docker Compose
docker-compose up -d
```

#### 2.3 Build Content

**Build frontend dist content**:
```bash
# Use client image to build frontend (dependencies pre-installed)
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/client/node_modules \
  mockm-client sh -c "cd client && npm run build"

# Build artifacts will be in client/build and server/page directories
```

**Build mockm tgz content**:
```bash
# Use dev image to build release package (dependencies pre-installed)
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/node_modules \
  -v /workspace/release/node_modules \
  mockm-dev sh -c "
    git config --global --add safe.directory /workspace
    cd release && pnpm run build
  "

# Build artifacts will be in dist directory, including mockm-{version}.tgz file
```

**Build documentation content**:
```bash
# Use dev image to build VuePress documentation (dependencies pre-installed)
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/doc/node_modules \
  mockm-dev sh -c "cd doc && pnpm run build"

# Build artifacts will be in doc/.vuepress/dist directory

# Start documentation development server (dependencies pre-installed)
docker run --rm -p 8080:8080 \
  -v $(pwd):/workspace:delegated \
  -v /workspace/doc/node_modules \
  mockm-dev sh -c "cd doc && pnpm run start -- --host 0.0.0.0 --port 8080"

# Documentation development server: http://localhost:8080/doc/mockm/
```

#### 2.4 Development Mode

In development mode, the project root directory is mapped to the container's `/workspace`, supporting hot reload.

**Design Notes**:
- All images mount the project root directory to `/workspace`
- Client image works in `/workspace/client`
- Dev image works in `/workspace/server`
- Follows the native design of the source code, client build automatically copies artifacts to `../server/page`

```bash
# Start development environment
docker-compose up -d

# Start documentation service
docker-compose up -d mockm-doc

# Start all services (including documentation)
docker-compose up -d mockm-client mockm-dev mockm-doc

# Enter container for debugging
docker exec -it mockm-dev sh
docker exec -it mockm-client sh
docker exec -it mockm-doc sh
```

#### 2.5 Port Mapping

- **3000**: mockm-client development server
- **8080**: Documentation development server
- **9000**: mockm main service port
- **9005**: mockm management interface port

#### 2.6 Access Addresses

- Frontend development server: http://localhost:3000
- Documentation development server: http://localhost:8080/doc/mockm/
- mockm service: http://localhost:9000
- mockm management interface: http://localhost:9005
