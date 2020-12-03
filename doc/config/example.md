# 综合示例
## 如何应对同一项目多个接口域
如果某个项目需要用到两个接口, 例如分别在 `192.168.1.13:8098` 和 `192.168.1.13:8099`, 启动多个 mm 实例即可.

如果想要使用同一份配置文件, 只是接口地址不同, 那么只需要从命令行传入不同的部分即可:

``` sh
mm dataDir=./httpData/8081/ port=8081 replayPort=8181  testPort=8281 proxy=http://192.168.1.13:8081
mm dataDir=./httpData/8082/ port=8082 replayPort=8182  testPort=8282 proxy=http://192.168.1.13:8082
```

如果要使用不同的配置, 那么启动 mm 时传入配置文件路径即可, 然后再从配置文件中编写不同的部分:
``` sh
mm config=./8081.config.js
mm config=./8082.config.js
```

如果需要把两个接口合并为一个接口:
``` sh
# todo
```

## 示例配置文件 config.js:
这是通过 `mm config` 生成的配置文件, 包含了 mockm 的大部分选项及在各种业务场景下的示例, 不要被这么多配置吓到, 记住所有选项都可以不需要.

@[code](@doc/../server/example.config.js)
