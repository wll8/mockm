# 输出
本节讲解默认配置下生成的目录或文件, 以及 web 界面的用处.

## 文件结构
当运行 mm 的时候, 默认会在当前目录生成以下内容:

``` sh {6-8}
./httpData # 这个目录用来放置所有 mm 产生的文件, 一般不需要理睬他们
│  db.json # 用来存储用户声明的数据
│  httpHistory.json # 用来记录请求的关联信息
│  store.json # 用来记录一些简要信息
│
└─request # 用来保存请求记录的文件夹, 产生请求时才会生成
    └─start # 对应的 api 地址, 用来放置请求内容
            get_1_res.json # 例如 get 请求的响应体
            
```

可以修改文件的存储路径:
- [config.dataDir](../config/option.md#config-datadir) -- mm 数据保存目录
- [config.dbJsonPath](../config/option.md#config-dbjsonpath) -- Restful 数据存储文件
- [config.apiWeb](../config/option.md#config-apiweb) -- web 界面上创建的 api 数据
