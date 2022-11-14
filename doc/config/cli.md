# 命令行参数
## 从命令行传入配置项
某些情况下, 通过命令行传入可能更简便, 支持 [配置选项](../config/option.md) 中的以下值类型:
- string
- boolean
- number

示例:
``` sh
mm proxy=https://httpbin.org/
```

上面的参数对应的选项是 [config.proxy](../config/option.md#config-proxy):

与下列配置文件的效果是一样的:

``` js
module.exports = {
  proxy: `https://httpbin.org/`,
}
```

当命令行参数与文件配置冲突时, 命令行参数优先.

## 仅有命令行可用的参数
以下参数仅可以在命令行上使用, 写在配置文件中是无效的:
### --cwd
设置程序的工作目录, 默认为当前运行命令的目录, 支持相对路径和绝对路径.

### --template
生成常用 mockm 配置, 此操作在运行目录下做了以下几件事:
- 在 package.json 中添加命令 `"mm": "npx mockm --cwd=mm"` 和自身版本的开发依赖
- 创建名为 mm 的目录并在其中放置 mockm 配置文件

推荐将 mockm 安装到项目中, 之后应使用 `npm run mm` 来启动 mockm.

注: 不会覆盖已存在的配置和文件.

### --config
指定配置文件地址. 

例如传入 `--config=test/mm.config.js` 则表示使用 test 目录下的 mm.config.js 文件作为配置.

当命令行上仅传入 `--config` 或 `--config=true` 值时, 如果当前目录不存在配置文件, 则会自动生成一份较为完整的, 然后按自己的需求修改即可.

### --no-update
禁用更新检查.

### --log-line
显示 console.log 所在的行.

### --version
仅查看版本号, 然后退出程序, 不启动服务.

### --node-options
指定 node 的运行参数, 例如 `--node-options="--inspect-brk"` 可以进入调试模式.

## 环境变量
### MOCKM_REGISTRY
MOCKM_REGISTRY 可以指定按需安装依赖时的镜像地址, 默认跟随当前 npm 配置, 不存在时使用 https://registry.npm.taobao.org/.

::: details 为什么不使用默认的 NPM_CONFIG_REGISTRY? 
- 1 假设你通过修改了 npm 的默认镜像地址, 例如 `nrm use taobao`, 
- 2 你没有指定 NPM_CONFIG_REGISTRY 环境变量,
- 3 package.json 中有以下 scripts `"dev": "mockm"`,
- 4 当你运行 `yarn dev` 时, yarn 会自动把 NPM_CONFIG_REGISTRY 值设置为 `https://registry.yarnpkg.com/`, 这与第 2 步冲突了.
:::


