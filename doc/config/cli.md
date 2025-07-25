# 命令行参数 ⚡

MockM 支持通过命令行快速配置，让你无需创建配置文件即可启动服务。

## 🎯 快速配置

### 基本语法
```bash
mm [配置项]=[值]
```

支持的值类型：`string`、`boolean`、`number`

### 常用示例
```bash
# 启动代理服务
mm proxy=https://api.example.com

# 指定端口
mm port=8080

# 启用进程守护
mm guard=true

# 组合配置
mm proxy=https://api.example.com port=8080 guard=true
```

**优先级**：命令行参数 > 配置文件 > 默认值

## 🛠️ 专用参数

以下参数仅能在命令行使用：

### `--config` 配置文件
指定配置文件路径，支持自动创建。

```bash
# 使用指定配置文件
mm --config=my-config.js

# 自动生成示例配置（推荐新手）
mm --config

# 生成到指定路径
mm --config=test/mm.config.js
```

### `--template` 项目模板
在当前目录生成 MockM 项目模板。

```bash
mm --template
```

**生成内容**：
- 📝 `package.json` 中添加 MockM 依赖和脚本
- 📁 创建 `mm/` 目录和配置文件
- 🚀 之后使用 `npm run mm` 启动

### `--cwd` 工作目录
设置程序运行的工作目录。

```bash
# 使用相对路径
mm --cwd=./mock

# 使用绝对路径
mm --cwd=/path/to/mock
```

### 其他实用参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `--version` | 显示版本号并退出 | `mm --version` |
| `--no-update` | 禁用自动更新检查 | `mm --no-update` |
| `--log-line` | 显示日志所在行号 | `mm --log-line` |
| `--node-options` | 传递 Node.js 参数 | `mm --node-options="--inspect"` |

## 🌍 环境变量

### `MOCKM_REGISTRY`
指定按需安装依赖时的镜像地址。

```bash
# 使用国内镜像
export MOCKM_REGISTRY=https://registry.npmmirror.com/
mm --config
```

**默认行为**：
1. 优先使用 `MOCKM_REGISTRY` 环境变量
2. 其次使用当前 npm 配置的镜像
3. 最后使用 `https://registry.npmmirror.com/`

::: tip 为什么不直接使用 NPM_CONFIG_REGISTRY？
避免与包管理器冲突。例如运行 `yarn dev` 时，yarn 会自动设置 `NPM_CONFIG_REGISTRY=https://registry.yarnpkg.com/`，可能导致安装失败。
:::

## 💡 实用技巧

### 快速启动常用配置
```bash
# 创建别名（Linux/macOS）
alias mmp="mm proxy=https://api.example.com port=8080"

# Windows PowerShell
function mmp { mm proxy=https://api.example.com port=8080 }
```

### 调试模式
```bash
# Node.js 调试模式
mm --node-options="--inspect-brk" --config

# 显示详细日志
mm --log-line --config
```

### 多环境配置
```bash
# 开发环境
mm --config=dev.config.js

# 测试环境  
mm --config=test.config.js

# 生产环境（代理）
mm --config=prod.config.js
```


