# config.api 作为函数
这时候会向函数传入一个 util 对象:

util 目前包含以下内容:

## util.run.curl
- 功能: 运行 curl 命令, 并返回结果, 会把响应头绑定到自定义 api 上.
- 示例:
``` js
module.exports = {
  api (util) => {
    const { run } = util
    return {
      'get /curl' (req, res, next) {
        // 示例 curl/bash 命令
        const cmd = `
          curl 'http://www.httpbin.org/ip' \
            -H 'Connection: keep-alive' \
            -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36' \
            -H 'Accept: */*' \
            -H 'Origin: http://localhost:8080' \
            -H 'Referer: http://localhost:8080/' \
            -H 'Accept-Language: zh-CN,zh;q=0.9' \
            --compressed \
            --insecure
        `
        run.curl({req, res, cmd}).then(curRes => {
          res.send(curRes.body)
        })
      },
    }
  }
}
```

## util.run.fetch
- 功能: 运行 fetch 方法并返回结果, 会把响应头绑定到自定义 api 上, 它是对 node-fetch 的一个封装.
- 示例:

``` js
module.exports = {
  api (util) => {
    const { run } = util
    return {
      'get /fetch' (req, res, next) { // 运行 fetch 方法并获取执行结果
        // 示例 fetch 方法
        const fetchRes = fetch("http://www.httpbin.org/ip", {
          "headers": {
            "accept": "*/*",
            "accept-language": "zh-CN,zh;q=0.9"
          },
          "referrer": "http://localhost:8080/",
          "referrerPolicy": "strict-origin-when-cross-origin",
          "body": null,
          "method": "GET",
          "mode": "cors",
          "credentials": "omit"
        });
        run.fetch({
          req,
          res,
          fetchRes,
        }).then(async thenRes => {
          const thenResOk = await thenRes.buffer()
          res.send(thenResOk)
        }).catch(err => console.log(`err`, err))
      },
    }
  }
}
```

::: details FQA
**与 config.fn 有什么不同**
config.fn 中的传入的工具不需要先读取 config 中的选项, 但是 config.api.fn 需要.

:::
