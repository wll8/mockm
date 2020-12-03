# 预览

[运行](../use/run.md)成功后, 使用浏览器打开 http://localhost:9000/ip 你会看到如下信息:
``` json
{
  "res": "127.0.0.1"
}
```

**查看刚刚请求的记录详情**
再打开 http://localhost:9005/#/get/ip , 你会看到`类似`下图的界面, 它记录着刚刚访问的请求详情.

![请求列表](~@doc/image/mockm_api_list_2020-09-21_100140.png)

界面详情参考: [web 界面](../use/webui.md#web-界面).

::: details FQA
**无法访问 http://localhost:9000/ip**
- localhost 服务被系统禁用, 尝试使用 http://127.0.0.1:9000/ip 访问.
- 你覆盖了 api 的 [默认配置](../config/option.md#config-api), `/ip` 这个接口已经不存在.
- 注意参考 [运行](../use/run.md).

::: 
