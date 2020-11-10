# config 作为函数
当 [配置](./配置文件.md#js) 为函数的时候, 会向函数传入一个 util 对象:.
util 目前包含以下内容:

| 键名          | 描述                         | 参考链接                                      |
| ------------- | ---------------------------- | --------------------------------------------- |
| mockjs        | 数据生成库                   | https://github.com/nuysoft/Mock               |
| fetch         | 请求库                       | https://github.com/bitinn/node-fetch          |
| axios         | 请求库                       | https://github.com/axios/axios                |
| curlconverter | 转换 curl 命令为其他请求代码 | https://github.com/NickCarneiro/curlconverter |
| mime          | 文档类型识别                 | https://github.com/broofa/mime                |
| multiparty    | 上传文件解析器               | https://github.com/pillarjs/multiparty        |
