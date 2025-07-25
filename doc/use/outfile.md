# 文件系统 📁

了解 MockM 生成的文件结构，便于数据管理和问题排查。

## 📊 目录结构

运行 MockM 后，会在 [dataDir](../config/option.md#config-datadir) 目录下生成以下文件：

```
httpData/                    # 📁 数据根目录
├── db.json                  # 🗃️ RESTful API 数据存储
├── httpHistory.json         # 📜 请求历史记录索引
├── store.json              # ⚙️ 应用状态信息
├── apiWeb.json             # 🌐 Web界面创建的API配置
├── log.err.txt             # 📝 错误日志
└── request/                # 📂 请求详情存储目录
    ├── api_users_1001/     # 📁 按接口路径分组
    │   ├── get_1001_req.json    # 📤 请求详情
    │   ├── get_1001_res.json    # 📥 响应详情
    │   └── get_1001_info.json   # ℹ️ 请求元信息
    └── api_posts_1002/
        ├── post_1002_req.json
        ├── post_1002_res.json
        └── post_1002_info.json
```

## 🗃️ 核心文件说明

### `db.json` - RESTful 数据库
存储通过 [config.db](../config/option.md#config-db) 定义的数据。

**用途**：
- 🔄 RESTful API 的数据源
- 📝 支持 CRUD 操作的持久化
- 🔍 搜索和分页功能的数据基础

**示例结构**：
```json
{
  "users": [
    { "id": 1, "name": "张三", "email": "zhang@example.com" },
    { "id": 2, "name": "李四", "email": "li@example.com" }
  ],
  "posts": [
    { "id": 1, "title": "第一篇文章", "userId": 1 }
  ]
}
```

### `httpHistory.json` - 请求索引
记录所有请求的基础信息，用于 Web 界面显示。

**包含信息**：
- 📋 请求 ID、方法、路径
- ⏰ 时间戳、状态码
- 📊 请求/响应大小
- 🔗 关联的详细文件路径

### `apiWeb.json` - Web API 配置  
存储通过 Web 界面创建的 API 定义。

**功能**：
- ✏️ 在线编辑的 API 配置
- 🔄 表格模式和代码模式的数据
- 🎛️ 接口开关状态
- 📋 自定义响应头设置

### `request/` - 请求详情目录
按接口路径分组存储每个请求的完整信息。

**文件命名规则**：
- `{method}_{id}_req.json` - 请求详情（Headers、Body、Query等）
- `{method}_{id}_res.json` - 响应详情（Status、Headers、Body等）
- `{method}_{id}_info.json` - 元信息（时间、处理耗时等）

## ⚙️ 自定义存储路径

可以通过配置调整文件存储位置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| [dataDir](../config/option.md#config-datadir) | 数据根目录 | `./httpData` |
| [dbJsonPath](../config/option.md#config-dbjsonpath) | RESTful 数据文件 | `${dataDir}/db.json` |
| [apiWeb](../config/option.md#config-apiweb) | Web API 配置文件 | `${dataDir}/apiWeb.json` |

**示例配置**：
```javascript
module.exports = {
  dataDir: './my-mock-data',
  dbJsonPath: './database/api-data.json',
  apiWeb: './config/web-apis.json'
}
```
