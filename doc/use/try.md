# 尝试
1. **安装**: 命令行输入 `npm i -g mockm`
2. **启动**: 命令行输入 `mm --config`

所有工作已经结束了, 并且你还创建了一个自己的 api, 拥有了后端接口允许跨域的功能, 接口记录功能和重放功能...


为了让你更快的找到感觉, `--config` 这个参数创建了一个简单的示例配置 [mm.config.js](https://github.com/wll8/mockm/blob/dev/server/example/simple.mm.config.js), 你可以查看它窥探天机！
- 浏览器访问 http://127.0.0.1:9000/api/1 查看效果.
- 浏览器访问 http://127.0.0.1:9005/#/get/api/1 查看请求详情.
- 想了解更多功能请继续...

::: details FQA

**安装速度慢**
由个人网络环境或未配置国内镜像导致.
可以尝试:
- 配置国内镜像
- 使用 cnpm
  
``` sh
npm i -g mockm --registry=https://registry.npm.taobao.org
```

**如何自动安装**
复制以下代码到命令行窗口运行, 将安装相关环境, 例如 node/cnpm, 由于脚本的自动性, 可能会受到安全软件拦截, 允许即可.

windows:
``` sh
powershell -C "(new-object System.Net.WebClient).DownloadFile('https://cdn.jsdelivr.net/gh/wll8/mockm@dev/release/install.bat.txt', 'i.bat'); start-process i.bat"
```

**自动安装出错**
不同系统的安全策略不相同, 兼容性也不同.
可能一些用户没有脚本执行策略, 或者安全软件禁止脚本远程安装程序而导致失败.

建议使用管理员身份重试或手动按部就班的安装.
- 先从 [nodejs.cn](https://nodejs.org/zh-cn/) 下载 node 并安装
- 再运行 `npm i -g mockm` 命令

**没有权限**
如果你安装到全局, 可能会需要较高的用户权限.

你有几种选择:
1. 提高用户权限, 重新安装
2. 使用 `npm i -D mockm` 安装到局部, 再使用 `npx mm` 运行.

**端口被占用**
- 关闭占用端口的程序, 再重新运行命令.
- 或者告诉 mockm 使用其他端口

``` sh
# 告诉 mockm 使用其他端口
mm port=8800 replayPort=8801  replayPort=8802
```

默认情况下 mockm 的几个服务分别占用以下端口:
- port=9000
- replayPort=9001
- testPort=9002

**node 版本过低**
mockm 支持 node v10.12.0 以上的版本, 请更新 node 版本.

**无法访问接口**
- json 语法错误
- 访问的路径不是自己添加的路径

::: 


下面简单演示 mockm 的部分功能, 你可以选择感兴趣的部分尝试.
