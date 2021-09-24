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
指定配置文件地址, 命令行上传入 config 却没有给出具体值时, 如果当前目录不存在配置文件, 会包含大多数配置的 `mm.config.js` 文件供你使用. 然后按你的需求修改此文件即可.

### --no-update
禁用更新检查.

### --log-line
显示 console.log 所在的行.

## 环境变量
### MOCKM_REGISTRY
MOCKM_REGISTRY 或 NPM_CONFIG_REGISTRY 可以指定按需安装依赖时的镜像地址, 默认 https://registry.npm.taobao.org/.
