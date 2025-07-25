# 🚀 快速开始 - 让你的第一个 API 飞起来！

> **前方高能预警**：接下来你将在 **60 秒内** 体验到前所未有的开发快感！ ⚡

## 🎯 极速上手 - 3 步搞定

### 第一步：安装 MockM
```bash
npm i -g mockm
```
> 💡 **小贴士**：如果安装慢，试试国内镜像 `npm i -g mockm --registry=https://registry.npmmirror.com`

### 第二步：启动神器
```bash
mm --config
```

### 第三步：见证奇迹
🎉 **恭喜！** 你已经拥有了一个完整的 API 生态系统！

## ✨ 你现在拥有了什么？

| 🌟 功能 | 🔗 地址 | 💭 说明 |
|---------|---------|---------|
| 🚀 **API 服务器** | http://127.0.0.1:9000 | 你的专属后端，支持跨域！ |
| 📊 **管理界面** | http://127.0.0.1:9005 | 可视化管理和操作！ |
| 🔧 **示例 API** | http://127.0.0.1:9000/api/1 | 立即可用的接口！ |
| 📈 **请求详情** | http://127.0.0.1:9005/#/get/api/1 | 详细的调试信息！ |

## 🎭 探索你的第一个配置文件

`--config` 参数为你创建了一个精心设计的示例配置 [mm.config.js](https://github.com/wll8/mockm/blob/dev/server/example/simple.mm.config.js)。

这个文件就像是 MockM 的**配方书** 📖，里面包含了：
- 🎯 **API 接口定义** - 轻松创建自己的接口
- 🔄 **代理配置** - 连接真实的后端服务
- 📊 **数据模拟** - 使用 MockJS 生成逼真数据
- 🌐 **跨域处理** - 自动解决前端开发痛点

## 🎪 接下来你可以...

### 🔥 立即体验核心功能

1. **🌍 测试跨域代理**
   ```bash
   # 将你的后端地址替换下面的示例
   mm proxy=https://jsonplaceholder.typicode.com
   ```
   然后访问：http://127.0.0.1:9000/posts/1

2. **🎨 创建你的第一个 API**
   编辑 `mm.config.js`：
   ```javascript
   module.exports = {
     api: {
       '/hello/world': {
         message: '这是我的第一个 API！',
         timestamp: new Date().toISOString(),
         author: '我自己 😎'
       }
     }
   }
   ```
   访问：http://127.0.0.1:9000/hello/world

3. **🎭 生成 RESTful API**
   ```javascript
   module.exports = {
     db: {
       users: [
         { id: 1, name: '张三', age: 25 },
         { id: 2, name: '李四', age: 30 }
       ]
     }
   }
   ```
   瞬间获得完整的用户管理接口！

### 📚 深入学习

- 🎯 [实用示例](./example.md) - 常见场景解决方案
- 🔧 [配置详解](../config/option.md) - 掌握所有配置选项
- 🌐 [Web 界面](./webui.md) - 可视化管理指南

## 🆘 遇到问题？别慌！

### 💨 安装速度慢？
**原因**：网络环境或未配置国内镜像  
**解决**：
```bash
# 使用国内镜像
npm i -g mockm --registry=https://registry.npmmirror.com

# 或者使用 cnpm
npm i -g cnpm --registry=https://registry.npmmirror.com
cnpm i -g mockm
```

### 🔐 没有权限？
**问题**：全局安装需要管理员权限  
**解决方案**：
1. **提升权限**：使用管理员身份运行命令行
2. **局部安装**：
   ```bash
   npm i -D mockm
   npx mm --config
   ```

### 🚪 端口被占用？
**现象**：启动时提示端口冲突  
**解决**：
```bash
# 方案1：关闭占用端口的程序

# 方案2：使用其他端口
mm --config port=8080

```

### 🎯 一键自动安装脚本

**Windows 用户**，复制以下命令到 PowerShell：
```powershell
powershell -C "(new-object System.Net.WebClient).DownloadFile('https://cdn.jsdelivr.net/gh/wll8/mockm@dev/release/install.bat.txt', 'i.bat'); start-process i.bat"
```

> ⚠️ **安全提示**：脚本可能被安全软件拦截，允许即可。如果担心安全性，建议手动安装。

### 🛠️ 手动安装步骤

如果自动安装失败，请按以下步骤操作：

1. **安装 Node.js**
   - 访问 [nodejs.cn](https://nodejs.org/zh-cn/)
   - 下载并安装最新 LTS 版本

2. **安装 MockM**
   ```bash
   npm i -g mockm
   ```

3. **验证安装**
   ```bash
   mm --version
   ```

## 🎉 恭喜你！

你已经成功掌握了 MockM 的基础用法！现在你可以：

- ✅ **告别跨域烦恼** - 一行命令解决所有跨域问题
- ✅ **快速创建 API** - 无需等待后端，立即开始前端开发
- ✅ **模拟真实数据** - 使用 MockJS 生成逼真的测试数据
- ✅ **可视化管理** - 通过 Web 界面轻松管理所有接口

**下一步**：查看 [实用示例](./example.md) 学习更多高级用法，或者直接开始你的项目开发吧！ 🚀

::: details 🤔 常见问题解答 (FAQ)

**Q: 安装速度慢怎么办？**  
A: 这通常是网络环境导致的。推荐使用国内镜像：
```bash
npm i -g mockm --registry=https://registry.npmmirror.com
```

**Q: 提示没有权限怎么办？**  
A: 全局安装需要管理员权限。你可以：
- 使用管理员身份运行命令行
- 或者局部安装：`npm i -D mockm`，然后用 `npx mm` 运行

**Q: 端口被占用怎么办？**  
A: 可以指定其他端口：
```bash
mm port=8800 replayPort=8801  replayPort=8802
```


默认情况下 mockm 的几个服务分别占用以下端口:
- port=9000
- replayPort=9001
- testPort=9002

**Q: 想要卸载怎么办？**  
A: 使用以下命令：
```bash
npm uninstall -g mockm
```

**Q: 如何更新到最新版本？**  
A: 重新安装即可：
```bash
npm i -g mockm@latest
```


::: 

