# Command Line Arguments ⚡

MockM supports quick configuration through command line, allowing you to start services without creating configuration files.

## 🎯 Quick Configuration

### Basic Syntax
```bash
mm [option]=[value]
```

Supported value types: `string`, `boolean`, `number`

### Common Examples
```bash
# Start proxy service
mm proxy=https://api.example.com

# Specify port
mm port=8080

# Enable process guard
mm guard=true

# Combined configuration
mm proxy=https://api.example.com port=8080 guard=true
```

**Priority**: Command line arguments > Configuration file > Default values

## 🛠️ Special Arguments

The following arguments can only be used in command line:

### `--config` Configuration File
Specify configuration file path, supports auto-creation.

```bash
# Use specified configuration file
mm --config=my-config.js

# Auto-generate example configuration (recommended for beginners)
mm --config

# Generate to specified path
mm --config=test/mm.config.js
```

### `--template` Project Template
Generate MockM project template in current directory.

```bash
mm --template
```

**Generated content**:
- 📝 Add MockM dependency and scripts to `package.json`
- 📁 Create `mm/` directory and configuration files
- 🚀 Use `npm run mm` to start afterwards

### `--cwd` Working Directory
Set the working directory for program execution.

```bash
# Use relative path
mm --cwd=./mock

# Use absolute path
mm --cwd=/path/to/mock
```

### Other Useful Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--version` | Show version and exit | `mm --version` |
| `--no-update` | Disable automatic update check | `mm --no-update` |
| `--log-line` | Show log line numbers | `mm --log-line` |
| `--node-options` | Pass Node.js arguments | `mm --node-options="--inspect"` |

## 🌍 Environment Variables

### `MOCKM_REGISTRY`
Specify mirror address for on-demand dependency installation.

```bash
# Use local mirror
export MOCKM_REGISTRY=https://registry.npmmirror.com/
mm --config
```

**Default behavior**:
1. First use `MOCKM_REGISTRY` environment variable
2. Then use current npm configured mirror
3. Finally use `https://registry.npmmirror.com/`

::: tip Why not use NPM_CONFIG_REGISTRY directly?
To avoid conflicts with package managers. For example, when running `yarn dev`, yarn automatically sets `NPM_CONFIG_REGISTRY=https://registry.yarnpkg.com/`, which may cause installation failures.
:::

## 💡 Practical Tips

### Quick Start Common Configurations
```bash
# Create alias (Linux/macOS)
alias mmp="mm proxy=https://api.example.com port=8080"

# Windows PowerShell
function mmp { mm proxy=https://api.example.com port=8080 }
```

### Debug Mode
```bash
# Node.js debug mode
mm --node-options="--inspect-brk" --config

# Show detailed logs
mm --log-line --config
```

### Multi-Environment Configuration
```bash
# Development environment
mm --config=dev.config.js

# Test environment  
mm --config=test.config.js

# Production environment (proxy)
mm --config=prod.config.js
```
