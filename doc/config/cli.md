# 命令行参数
某些情况下, 通过命令行传入可能更简便, 支持 [配置选项](../config/option.md) 中的以下值类型:
- string
- boolean
- number

示例:
``` sh
mm proxy=https://example.com/
```

上面的参数对应的选项是 [config.proxy](../config/option.md#config-proxy):

与下列配置文件的效果是一样的:

``` js
module.exports = {
  proxy: `https://example.com/`,
}
```

当命令行参数与文件配置冲突时, 命令行参数优先.

命令行有一些额外的参数来实现配置文件之外的功能:
- config 指定配置文件地址.
- --no-update 禁用更新检查

::: tip
命令行上传入 config 却没有给出具体值时(`mm config`), 如果当前目录不存在配置文件, 会以默认参数生成 `mm.config.js` 作为模板供你使用. 然后按你的需求修改此文件即可.
:::
