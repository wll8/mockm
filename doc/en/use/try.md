# 🚀 Quick Start - Get Your First API Flying!

> **High Energy Alert**: You're about to experience unprecedented development pleasure in **60 seconds**! ⚡

## 🎯 Lightning Fast Setup - 3 Steps

### Step 1: Install MockM
```bash
npm i -g mockm
```
> 💡 **Pro Tip**: If installation is slow, try a local mirror `npm i -g mockm --registry=https://registry.npmmirror.com`

### Step 2: Launch the Magic
```bash
mm --config
```

### Step 3: Witness the Miracle
🎉 **Congratulations!** You now have a complete API ecosystem!

## ✨ What Do You Have Now?

| 🌟 Feature | 🔗 Address | 💭 Description |
|------------|------------|----------------|
| 🚀 **API Server** | http://127.0.0.1:9000 | Your personal backend with CORS support! |
| 📊 **Management Interface** | http://127.0.0.1:9005 | Visual management and operations! |
| 🔧 **Sample API** | http://127.0.0.1:9000/api/1 | Ready-to-use interface! |
| 📈 **Request Details** | http://127.0.0.1:9005/#/get/api/1 | Detailed debugging information! |

## 🎭 Explore Your First Configuration File

The `--config` parameter creates a carefully designed sample configuration [mm.config.js](https://github.com/wll8/mockm/blob/dev/server/example/simple.mm.config.js).

This file is like MockM's **recipe book** 📖, containing:
- 🎯 **API Interface Definitions** - Easily create your own interfaces
- 🔄 **Proxy Configuration** - Connect to real backend services
- 📊 **Data Mocking** - Generate realistic data with MockJS
- 🌐 **CORS Handling** - Automatically solve frontend development pain points

## 🎪 What You Can Do Next...

### 🔥 Try Core Features Immediately

1. **🌍 Test CORS Proxy**
   ```bash
   # Replace the backend address with your own
   mm proxy=https://jsonplaceholder.typicode.com
   ```
   Then visit: http://127.0.0.1:9000/posts/1

2. **🎨 Create Your First API**
   Edit `mm.config.js`:
   ```javascript
   module.exports = {
     api: {
       '/hello/world': {
         message: 'This is my first API!',
         timestamp: new Date().toISOString(),
         author: 'Myself 😎'
       }
     }
   }
   ```
   Visit: http://127.0.0.1:9000/hello/world

3. **🎭 Generate RESTful API**
   ```javascript
   module.exports = {
     db: {
       users: [
         { id: 1, name: 'John', age: 25 },
         { id: 2, name: 'Jane', age: 30 }
       ]
     }
   }
   ```
   Instantly get complete user management interfaces!

### 📚 Deep Learning

- 🎯 [Practical Examples](./example.md) - Common scenario solutions
- 🔧 [Configuration Details](../config/option.md) - Master all configuration options
- 🌐 [Web Interface](./webui.md) - Visual management guide

## 🆘 Having Problems? Don't Panic!

### 💨 Slow Installation?
**Reason**: Network environment or no local mirror configured  
**Solution**:
```bash
# Use local mirror
npm i -g mockm --registry=https://registry.npmmirror.com

# Or use cnpm
npm i -g cnpm --registry=https://registry.npmmirror.com
cnpm i -g mockm
```

### 🔐 No Permission?
**Issue**: Global installation requires administrator privileges  
**Solutions**:
1. **Elevate Privileges**: Run command line as administrator
2. **Local Installation**:
   ```bash
   npm i -D mockm
   npx mm --config
   ```

### 🚪 Port Occupied?
**Symptom**: Port conflict during startup  
**Solution**:
```bash
# Option 1: Close the program occupying the port

# Option 2: Use different ports
mm --config port=8080
```

### 🎯 One-Click Auto Installation Script

**Windows users**, copy the following command to PowerShell:
```powershell
powershell -C "(new-object System.Net.WebClient).DownloadFile('https://cdn.jsdelivr.net/gh/wll8/mockm@dev/release/install.bat.txt', 'i.bat'); start-process i.bat"
```

> ⚠️ **Security Note**: The script may be blocked by security software, just allow it. If you're concerned about security, manual installation is recommended.

### 🛠️ Manual Installation Steps

If automatic installation fails, follow these steps:

1. **Install Node.js**
   - Visit [nodejs.org](https://nodejs.org/)
   - Download and install the latest LTS version

2. **Install MockM**
   ```bash
   npm i -g mockm
   ```

3. **Verify Installation**
   ```bash
   mm --version
   ```

## 🎉 Congratulations!

You've successfully mastered the basics of MockM! Now you can:

- ✅ **Say Goodbye to CORS Issues** - One command solves all CORS problems
- ✅ **Quickly Create APIs** - Start frontend development without waiting for backend
- ✅ **Mock Realistic Data** - Generate realistic test data with MockJS
- ✅ **Visual Management** - Easily manage all interfaces through Web UI

**Next Step**: Check out [Practical Examples](./example.md) to learn more advanced usage, or start your project development right away! 🚀

::: details 🤔 Frequently Asked Questions (FAQ)

**Q: What if installation is slow?**  
A: This is usually due to network environment. Recommend using local mirror:
```bash
npm i -g mockm --registry=https://registry.npmmirror.com
```

**Q: What if it says no permission?**  
A: Global installation requires administrator privileges. You can:
- Run command line as administrator
- Or install locally: `npm i -D mockm`, then run with `npx mm`

**Q: What if port is occupied?**  
A: You can specify other ports:
```bash
mm port=8800 replayPort=8801 testPort=8802
```

By default, mockm services occupy the following ports:
- port=9000
- replayPort=9001
- testPort=9002

**Q: How to uninstall?**  
A: Use the following command:
```bash
npm uninstall -g mockm
```

**Q: How to update to the latest version?**  
A: Just reinstall:
```bash
npm i -g mockm@latest
```

:::
