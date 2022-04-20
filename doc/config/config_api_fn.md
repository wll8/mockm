# config.api 作为函数
这时候会向函数传入一个 util 对象:

util 目前包含以下内容:

## util.run.curl
- 功能: 运行 curl 命令, 并返回结果, 会把响应头绑定到自定义 api 上.
- 示例:

@[code transcludeWith=curl-snippet](@/../test/config.api.test.js)

## util.run.fetch
- 功能: 运行 fetch 方法并返回结果, 会把响应头绑定到自定义 api 上, 它是对 node-fetch 的一个封装.
- 示例:

@[code transcludeWith=fetch-snippet](@/../test/config.api.test.js)

::: details FQA
**与 config.fn 有什么不同**
config.fn 中的传入的工具不需要先读取 config 中的选项, 但是 config.api.fn 需要.

:::
