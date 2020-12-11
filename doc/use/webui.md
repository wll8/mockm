# web 界面
访问 testPort 指定的地址, 例如 http://localhost:9005, 你会看到如下界面:

## 请求列表
所有被拦截的请求都会实时出现在这里.

![请求列表](~@doc/image/mockm_api_list_2020-09-21_100140.png)

表头列内容含义:

表头 | 含义
- | -
id | 请求 id
code | 响应状态码
type | 响应的内容类型
method | 请求文件
api | 请求地址

表头可进行排序功能.

- [ ] 请求内容搜索功能正在规划中

## 请求详情
### 简要信息区
包含了 api 请求方法, 以及 url 地址.

### 功能区

- **replay**
![replay](~@doc/image/mockm_replay_2020-11-10-11-21-51.png)

重放, 使用当前请求的参数再重新请求一次接口.

后台可以使用这个功能来快速重现错误, 而不必登录账号, 不必重新构造接口数据.

- **capture**
![capture](~@doc/image/mockm_capture_2020-11-10-11-29-22.png)

获取当前页面截图, 作为简单的 `留证` .

如果你只需要别人能远程访问, 可使用[远程选项](../config/option.md#config-remote).

- **swagger**
![swagger](~@doc/image/mockm_swagger_2020-11-10-11-32-18.png)

配置 openApi 后, 会自动查找 api 对应的 swagger 视图供使用. 例如 `Try it out` 进行请求调试, 查看 module 定义.

请求时, 会自动添加最新 token, 意味着你不需要手动登录就能调试接口.

- **history**
![history](~@doc/image/mockm_history_2020-11-10-11-33-26.png)

查看当前 api 的所有请求历史列表, 点击某条历史, 跳转到对应的请求详情.

如果多次请求有某次出错, 可以使用这个功能对比请求的参数, 方便确定是由于什么参数导致的错误.

表头 | 含义
- | -
code | 状态码
req | 请求体中 query + body 的内容长度
res | 响应体中 body 的内容长度

可以对 req 或 res 排序.

::: details FQA
**重放时当面页面不是最新的结果**
重新发起请求的时候, 就产生新的请求记录页面, 你可以打开 history 查看新完成的请求记录.

**capture 有时不能截图**
- 页面内容过多时会导致截图失败
- 截图内容不全, 如果响应部分在 iframe 中呈现时, 不支持 iframe 窗体内截图
- T_T 如果没满足到你的需求, 你先使用专业的第三方截图功能吧~

**swagger 按钮有时候不显示**
- 检查 openApi 有没有正确配置
- 检查当前 api 是否有在 openApi 中存在, 或在完整的 swagger ui 中存在
- 如果存在, 那么可能是解析对应关系失败, 欢迎 [提 bug](https://github.com/wll8/mockm/issues).

:::


### 详情区

- req 请求
  - lineHeaders
    - line 请求 url
      - query 从 url 中解析出的 query 参数
    - headers  请求头
  - body 请求体
    
- res 响应
  - lineHeaders
    - line 响应码
    - headers 响应头
  - body 响应体

![请求详情](~@doc/image/mockm_api_detail_2020-09-21_100052.png)

::: details 参考
![请求](~@doc/image/HTTP_ReqExample.png)

![响应](~@doc/image/HTTP_ResExample.png)

<center>来自 ntu.edu.sg </center>

:::

## 接口列表
显示 mockm 中存在的接口, 仅允许 apiWeb 可以在界面上编辑.
- 点击表头上的 `+` 按钮进入接口详情, 创建 webApi 接口
- 点击表头上 `+` 按钮旁边的开关, 可以禁用所有 webApi 接口
- 点击列表中的单个开关, 可以禁用单个接口

## 接口编辑
![apiWebEdit](~@doc/image/mockm_apiWebEdit_2020-11-10-14-03-22.png)

如果还没有真实的接口, 可以通过此功能创建便于前后端参考的 `接口|文档` , 它描述了请求的地址, 方法, 参数的位置, 类型, 响应, 并且可以生成供前端调用的接口.

这里创建的接口称为 webApi 接口, 与 [config.api](../config/option.md#config-api) 中编写的接口进行合并, 重复时会被后者覆盖.

mockm 会根据填写的 `字段名, 示例值, 类型` 转换为对应的响应数据, 支持 mockjs 语法.
::: details 转换规则

- 字段名: 即字段的名称, 可使用 mockjs 的生成规则.
- 示例值: 字段的示例值, 支持 mockjs 语法, 如 @cname 生成随机中文名字.
  - `/.*/` - 被视为正则表达式, 会进行 `new RegExp(example)` 转换
- 类型: 即值的类型, 默认为 string. 由于输入框中的值都是 string 的, 所以建议设置供类型确定.
  - string - 生成值为 string
  - boolean - 会自动把示例值 `false`, `0`, `假`, `T`, `t` 都转换成 false , 其他值使用 `Boolean(example)` 转换
  - number - 会把示例值进行 `Number(example)` 转换
  - object - 会把父字段名作为对象, 子字段名作为对象的键
  - array - 会把父字段名作为数组, 子字段名数组中的对象的键
  - eval - 以 js 代码自定义示例值
    - 例 `[1,2,3]` - 表示数组中有数字 1 2 3
    - 例 ``Mock.mock(`@cname`)`` - 表示调用 mockjs 生成 @cname
    - 例 `Date.now()` - 生成时间戳

注: 含有 mockjs 占位符标志时, 不会进行 `regexp/number/boolean` 类型转换

:::

快捷键 `ctrl+s` 或点击 method 区域的 `action -> save` 保存.

默认情况下, 生成的整个数据是一个对象. 如果要精确控制返回值, 可以使用快捷键 `ctrl+e` 或点击 `action -> example` 打开的窗口中操作.

### 使用表格中的数据作为响应
![apiWebEdit](~@doc/image/mockm_apiWebEdit_2020-11-10-14-05-27.png)

则根据你在表中录入情况生成数据, 你可以修改返回值为 `object` 或 `array`. 为 object 时, 生成规则表示从单个对象中随机取几个字段, 为 array 时, 表示返回的数组中有多少个对象.

示例数据是根据表格中录入的内容配合生成规则形成的, 仅供预览. 

支持自定义响应头, 以 `key:value` 形式编写即可.

注: 表格形式生成的数据 content-type 为 `application/json` .

### 以编程方式自定义接口响应
![apiWebEdit](~@doc/image/mockm_apiWebEdit_2020-11-10-14-07-10.png)

你可使用 js 编写该接口的逻辑, 例如响应数据根据请求的不同而不同.

与 [config.api](../config/option.md#config-api) 的编写方式对应, 由于需要考虑安全性, web 界面上不支持直接使用某些方法, 例如 fs 模块. 作为函数使用的时候, 为了方便提供了 `tool` 全局变量.

- tool 这是一个全局对象
  - libObj - 函数接收到的工具, 例如 mockjs, axios
  - wrapApiData - config.js 数据统一处理函数
  - listToData - 可转换 table 为数据的函数
  - cur - 当前接口信息

::: details 示例
``` js
(req, res) => {
  // 获取工具函数
  const {wrapApiData, listToData, cur, libObj: {mockjs, axios}} = tool
  // 获取当前表格 api 的内容
  const {table, example} = cur.responses['200']
  const {rule, type} = example
  const data = {
    arg: {
      // 获取请求携带的参数
      body: req.body,
      query: req.query,
    },
    // 转换当前表格 api 为数据
    table: listToData(table, {rule, type}).data,
    // 使用 mockjs 模拟数据
    name: mockjs.mock('@cname'),
  }
  // 设置响应头
  res.set({'My-Header': `header`})
  // 使用公用结构包裹数据
  res.json(wrapApiData({data, code: 200}))
}
```
:::

### 使用历史记录作为响应
![apiWebEdit](~@doc/image/mockm_apiWebEdit_2020-12-03-10-44-49.png)

输入请求ID, 请求当前接口时, 总是返回所输入请求ID的响应, 包括 headers 以及其中的测试链接也总是一样的.

