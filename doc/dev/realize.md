# 实现
本文档详细叙述 mockm 工具的技术实现原理、架构设计和核心模块。

## 项目概述

mockm 是一个基于 Node.js 和 Express 的 API 模拟和调试工具，集成了模拟数据生成、接口代理、请求记录重放、Web UI 管理等功能。项目采用前后端分离架构，后端提供 API 服务，前端提供可视化管理界面。

## 技术栈

### 后端技术栈
- **Node.js**: 运行时环境，支持 v10.12.0 以上版本
- **Express**: Web 应用框架，基于 `@wll8/json-server` 扩展
- **http-proxy-middleware**: HTTP 代理中间件，用于请求转发
- **chokidar**: 文件监听，支持配置文件热重载
- **vm2**: 安全的 JavaScript 沙箱，用于执行用户自定义代码
- **@wll8/better-mock**: Mock.js 增强版，用于生成模拟数据
- **WebSocket**: 基于 `@wll8/express-ws` 实现实时通信
- **body-parser**: 请求体解析中间件
- **compression**: HTTP 压缩中间件
- **morgan**: HTTP 请求日志中间件

### 前端技术栈
- **React**: 用户界面框架 (v17.0.1)
- **Ant Design**: UI 组件库 (v4.10.0)
- **Axios**: HTTP 客户端库
- **React Router**: 前端路由管理
- **React JSON View**: JSON 数据可视化组件
- **SCSS**: CSS 预处理器

### 构建和部署工具
- **Webpack**: 模块打包工具
- **Babel**: JavaScript 编译器
- **Gulp**: 自动化构建工具
- **VuePress**: 文档站点生成器
- **Nodemon**: 开发环境自动重启工具

## 核心架构

### 整体架构图

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

### 进程管理架构

mockm 采用多进程架构，通过 `pm2` 管理进程生命周期：

1. **主进程 (run.js)**: 负责配置解析、进程管理、文件监听
2. **服务进程 (server.js)**: 负责启动各种服务器和业务逻辑
3. **子服务**: Proxy Server、Test Server、Replay Server

## 开发环境
若出现问题, 可以使用相近于以下的环境试试.

- win10 x64
- chrome v100.0.4896.127 x64
- vscode v1.64.2
- node v14.15.5 x64 (或 v20.19.4)
  - yarn v1.22.18
  - npm v6.14.11
  - pnpm v10.13.1

## 核心模块实现

### 1. 启动流程 (run.js)

启动流程是 mockm 的入口点，负责：

- **命令行参数解析**: 使用 `cross-argv` 处理跨平台命令行参数
- **配置文件处理**: 动态加载和解析配置文件
- **进程管理**: 使用 `ProcessManager` 管理服务进程
- **文件监听**: 监听配置文件变化，自动重启服务
- **插件系统**: 加载和初始化插件

```javascript
// 核心启动逻辑
const cp = new ProcessManager([nodeArg, serverPath, ...process.argv.slice(2)])
cp.on('message', ({action, data}) => {
  if(action === 'reboot') {
    cp.reboot(0) // 自动重启
  }
})
```

### 2. 服务器核心 (server.js)

服务器核心负责初始化各种服务和中间件：

- **配置加载**: 加载全局配置到 `global.config`
- **端口检查**: 确保所需端口可用
- **Host 文件管理**: 在 hostMode 下自动修改系统 hosts 文件
- **服务启动**: 启动 Proxy、Test、Replay 三个服务器
- **历史记录初始化**: 加载 HTTP 请求历史记录

```javascript
// 服务启动流程
global.config = await require('./config.js')
const {allRoute, allRouteTest} = await customApi()
global.HTTPHISTORY = util.tool.file.fileStore(global.config._httpHistory).get()
global.STORE = tool.file.fileStore(global.config._store)

// 启动各个服务
require('./proxy.js')({allRoute})
require('./test.js')()
require('./replay.js')({allRoute, allRouteTest})
```

### 3. 代理服务器 (proxy.js)

代理服务器是 mockm 的核心功能，实现请求拦截和转发：

**主要功能**:
- HTTP/HTTPS 代理
- WebSocket 支持
- 请求/响应拦截和修改
- 跨域处理
- 请求历史记录
- 自定义中间件支持

**实现原理**:
```javascript
// 代理配置
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

### 4. 测试服务器 (test.js)

测试服务器提供 API 管理和调试功能：

**主要功能**:
- API 接口管理
- 请求历史查看
- 数据生成和转换
- OpenAPI 文档解析
- 接口测试和调试

**关键接口**:
- `GET /api/history`: 获取请求历史
- `POST /api/listToData`: 数据生成
- `GET /api/openApi`: OpenAPI 文档解析
- `PATCH /api/studio`: API 配置更新

### 5. 重放服务器 (replay.js)

重放服务器用于重放历史请求：

**实现逻辑**:
```javascript
// 重放决策逻辑
const proxy = createProxyMiddleware((pathname, req) => {
  const method = req.method.toLowerCase()
  const fullApi = `${method} ${req.originalUrl}`
  const history = getHistory({fullApi}).data

  if(history || config.hostMode) {
    return false // 使用历史记录，不代理
  } else if(allRouteTest({allRoute, method, pathname})) {
    return true // 匹配自定义 API，进行代理
  } else {
    return config.replayProxy // 根据配置决定
  }
})
```

## 业务逻辑实现

### 1. 路由处理系统 (business.js)

路由处理是 mockm 的核心业务逻辑，负责将各种类型的 API 配置转换为 Express 路由：

**路由类型**:
- **API 路由**: 用户自定义的 API 接口
- **DB 路由**: 基于 JSON 数据的 RESTful API
- **静态文件路由**: 静态资源服务
- **代理路由**: 请求转发规则

**实现原理**:
```javascript
// 路由解析和注册
const allRoute = [
  ...obj.api,      // 自定义 API
  ...obj.db,       // 数据库 API
  ...obj.resetUrl, // URL 重置中间件
  ...obj.static,   // 静态文件
  ...obj.apiWeb,   // Web UI API
  ...obj.proxy,    // 代理规则
]

// 路由匹配测试
function allRouteTest({allRoute, method, pathname}) {
  return allRoute.find(item => {
    if(item.method === 'use') {
      return pathname.startsWith(item.route) && !item.disable
    }
    return item.re.exec(pathname) && item.method === method && !item.disable
  })
}
```

### 2. 数据生成系统

mockm 提供强大的数据生成功能，基于 Mock.js 和自定义规则：

**数据类型支持**:
- 基础类型: string, number, boolean
- 复合类型: object, array
- Mock.js 规则: @name, @email, @date 等
- 自定义函数: 支持 JavaScript 代码执行

**实现机制**:
```javascript
function listToData(list, options = {}) {
  const Mock = require('@wll8/better-mock')

  function processItem(item) {
    if(typeof item === 'string' && item.startsWith('@')) {
      return Mock.mock(item) // Mock.js 规则
    }
    if(typeof item === 'object') {
      return processObject(item) // 递归处理对象
    }
    return item
  }
}
```

### 3. 请求历史管理

请求历史功能记录所有通过 mockm 的 HTTP 请求：

**存储结构**:
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

**实现逻辑**:
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

### 4. 中间件系统

mockm 使用中间件模式处理请求：

**中间件类型**:
- **CORS 中间件**: 处理跨域请求
- **Body Parser**: 解析请求体
- **Logger**: 请求日志记录
- **Compression**: 响应压缩
- **Static**: 静态文件服务

**中间件注册顺序**:
```javascript
app.use(corsMiddleware)           // 跨域处理
app.use(bodyParser.json())        // JSON 解析
app.use(bodyParser.urlencoded())  // 表单解析
app.use(logger)                   // 日志记录
app.use(compression())            // 响应压缩
// ... 用户自定义中间件
app.use(proxyMiddleware)          // 代理中间件
```

## 插件系统

### 1. 插件架构

mockm 提供了灵活的插件系统，支持功能扩展：

**插件生命周期**:
- `hostFileCreated`: 宿主文件创建完成
- `serverCreated`: 服务器创建完成
- `useCreated`: Express 应用初始化完成
- `parseCreated`: 解析器初始化完成
- `routeCreated`: 路由创建完成

**插件结构**:
```javascript
module.exports = {
  key: 'plugin-name',           // 插件唯一标识
  hostVersion: ['1.1.0'],       // 支持的宿主版本
  async main({hostInfo, pluginConfig, config, util}) {
    return {
      async hostFileCreated() {
        // 宿主文件创建后的处理逻辑
      },
      async serverCreated(info) {
        // 服务器创建后的处理逻辑
      },
      async useCreated(app) {
        // Express 应用初始化后的处理逻辑
      }
    }
  }
}
```

### 2. 内置插件

**base 插件**: 提供基础功能
**api-doc 插件**: API 文档生成
**validate 插件**: 请求参数验证

### 3. 插件加载机制

```javascript
async function pluginRun(eventName, ...args) {
  for(const plugin of loadedPlugins) {
    if(plugin[eventName]) {
      await plugin[eventName](...args)
    }
  }
}
```

## 安全机制

### 1. 代码执行安全

mockm 使用 vm2 提供安全的代码执行环境：

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

### 2. 文件访问控制

- 限制文件访问路径
- 防止目录遍历攻击
- 文件名安全处理

### 3. 请求验证

- 参数类型验证
- 请求大小限制
- 恶意请求过滤

## 配置系统

### 1. 配置文件结构

mockm 支持多种配置方式：

```javascript
module.exports = {
  port: 9005,                    // 主服务端口
  testPort: 9006,               // 测试服务端口
  replayPort: 9007,             // 重放服务端口
  proxy: 'http://localhost:3000', // 代理目标
  api: {                        // 自定义 API
    '/api/users': {
      get: {
        data: [{id: 1, name: 'John'}]
      }
    }
  },
  db: {                         // 数据库配置
    users: [{id: 1, name: 'John'}]
  },
  route: {                      // 路由重写
    '/old-api/*': '/new-api/$1'
  }
}
```

### 2. 配置热重载

使用 chokidar 监听配置文件变化：

```javascript
tool.file.fileChange([global.config._configFile, ...global.config.watch],
  (files) => process.send({action: 'reboot', data: files})
)
```

## 前端实现

### 1. React 应用架构

前端采用 React + Ant Design 构建，提供可视化管理界面：

**主要页面**:
- API 列表页面: 显示所有可用的 API 接口
- 请求历史页面: 查看和管理 HTTP 请求历史
- API 编辑器: 可视化编辑 API 配置
- 数据生成器: 生成模拟数据
- 设置页面: 系统配置管理

**技术实现**:
```javascript
// HTTP 客户端配置
const http = axios.create({
  baseURL: common.cfg.baseURL,
  timeout: 0,
  headers: {'X-Custom-Header': 'foobar'}
})

// 路由配置
import { Route, Switch } from 'react-router-dom'
<Switch>
  <Route path="/api" component={ApiList} />
  <Route path="/history" component={History} />
  <Route path="/editor" component={ApiEditor} />
</Switch>
```

### 2. 状态管理

使用 React Hooks 和 Context API 进行状态管理：

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

### 3. 构建和部署

前端构建流程：

```bash
# 开发环境
npm start  # 启动开发服务器

# 生产构建
npm run build  # 构建并复制到 server/page 目录
```

## 性能优化

### 1. 请求处理优化

- **连接池管理**: 复用 HTTP 连接
- **响应缓存**: 缓存静态资源和 API 响应
- **压缩传输**: 启用 gzip 压缩
- **异步处理**: 使用 Promise 和 async/await

### 2. 内存管理

- **历史记录限制**: 限制内存中的历史记录数量
- **定期清理**: 定期清理过期数据
- **流式处理**: 大文件使用流式处理

### 3. 文件系统优化

- **文件监听优化**: 使用 chokidar 高效监听文件变化
- **批量写入**: 批量写入历史记录
- **文件名优化**: 使用 filenamify 处理文件名

## 部署方案

### 1. 本地开发部署

```bash
# 全局安装
npm install -g mockm

# 启动服务
mockm --config
```

### 2. Docker 部署

mockm 提供了完整的 Docker 化解决方案，支持开发和生产环境的容器化部署。

#### 2.1 Docker 镜像

项目提供了两个 Docker 镜像：

- **mockm-client**: 前端 React 应用 (Node.js 14.15.5 + Yarn 1.22.18)
- **mockm-dev**: 后端服务和工具 (Node.js 20.19.4 + pnpm 10.13.1)

**设计理念**: 所有镜像都挂载项目根目录到 `/workspace`，遵循源码的原生设计，减少理解成本。

#### 2.2 快速开始

```bash
# 构建镜像
docker build -f Dockerfile.client -t mockm-client .
docker build -f Dockerfile.dev -t mockm-dev .

# 使用 Docker Compose 启动服务
docker-compose up -d
```

#### 2.3 构建内容

**构建前端 dist 内容**:
```bash
# 使用 client 镜像构建前端（依赖已预装）
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/client/node_modules \
  mockm-client sh -c "cd client && npm run build"

# 构建产物将在 client/build 和 server/page 目录中
```

**构建 mockm tgz 内容**:
```bash
# 使用 dev 镜像构建发布包（依赖已预装）
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/node_modules \
  -v /workspace/release/node_modules \
  mockm-dev sh -c "
    git config --global --add safe.directory /workspace
    cd release && pnpm run build
  "

# 构建产物将在 dist 目录中，包含 mockm-{version}.tgz 文件
```

**构建文档内容**:
```bash
# 使用 dev 镜像构建 VuePress 文档（依赖已预装）
docker run --rm \
  -v $(pwd):/workspace:delegated \
  -v /workspace/doc/node_modules \
  mockm-dev sh -c "cd doc && pnpm run build"

# 构建产物将在 doc/.vuepress/dist 目录中

# 启动文档开发服务器（依赖已预装）
docker run --rm -p 8080:8080 \
  -v $(pwd):/workspace:delegated \
  -v /workspace/doc/node_modules \
  mockm-dev sh -c "cd doc && pnpm run start -- --host 0.0.0.0 --port 8080"

# 文档开发服务器: http://localhost:8080/doc/mockm/
```

#### 2.4 开发模式

在开发模式下，项目根目录被映射到容器的 `/workspace`，支持热重载。

**设计说明**:
- 所有镜像都挂载项目根目录到 `/workspace`
- client 镜像在 `/workspace/client` 中工作
- dev 镜像在 `/workspace/server` 中工作
- 遵循源码的原生设计，client 构建时会自动将产物复制到 `../server/page`

```bash
# 启动开发环境
docker-compose up -d

# 启动文档服务
docker-compose up -d mockm-doc

# 启动所有服务（包括文档）
docker-compose up -d mockm-client mockm-dev mockm-doc

# 进入容器调试
docker exec -it mockm-dev sh
docker exec -it mockm-client sh
docker exec -it mockm-doc sh
```

#### 2.5 端口映射

- **3000**: mockm-client 开发服务器
- **8080**: 文档开发服务器
- **9000**: mockm 主服务端口
- **9005**: mockm 管理界面端口

#### 2.6 访问地址

- 前端开发服务器: http://localhost:3000
- 文档开发服务器: http://localhost:8080/doc/mockm/
- mockm 服务: http://localhost:9000
- mockm 管理界面: http://localhost:9005

