# 配置文件
mockm 支持 js 类型的配置文件.

**mm.config.js**
``` js
module.exports = {
  port: 9000
}
```

作为函数使用的时候, 可以获取 mm 提供的 [工具库](../config/config_fn.md).

``` js
module.exports = util => {
  return {
    port: 9000
  }
}
```

上面的文件中, 将 mockm 接口服务的端口号配置为 9000, 更多的配置请参考 [配置项](../config/option.md#config-port).
