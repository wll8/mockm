# config 作为函数
当 [配置](./config_file.md#js) 为函数的时候, 会向函数传入一个 util 对象:.
util 目前包含以下内容:

## util.libObj 第三方库
### util.libObj.mockjs 数据生成库
- 参考: http://wll8.gitee.io/mockjs-examples/

::: details 模板格式
- String
  - 'name|min-max': string
  - 'name|count': string
- Number
  - 'name|+1': number
  - 'name|min-max': number
  - 'name|min-max.dmin-dmax': number
- Boolean
  - 'name|1': boolean
  - 'name|min-max': boolean
- Object
  - 'name|count': object
  - 'name|min-max': object
- Array
  - 'name|1': array
  - 'name|+1': array
  - 'name|min-max': array
  - 'name|count': array
- Function
  - 'name': function
- RegExp
  - 'name': regexp
- Path
  - Absolute Path
  - Relative Path
:::

::: details 占位符
- Basic
  - boolean 
  - natural
  - integer
  - float
  - character
  - string
  - range
- Date
  - date
  - time
  - datetime
  - now
- Image
  - image
  - dataImage
- Color
  - color
  - hex
  - rgb
  - rgba
  - hsl
- Text
  - paragraph
  - sentence
  - word
  - title
  - cparagraph
  - csentence
  - cword
  - ctitle
- Name
  - first
  - last
  - name
  - cfirst
  - clast
  - cname
- Web
  - url
  - domain
  - protocol
  - tld
  - email
  - ip
- Address
  - region
  - province
  - city
  - county
  - zip
- Helper
  - capitalize
  - upper
  - lower
  - pick
  - shuffle
- Miscellaneous
  - guid
  - id
  - increment
:::

### util.libObj.fetch 请求库
- 参考: https://github.com/bitinn/node-fetch
### util.libObj.axios 请求库
- 参考: https://github.com/axios/axios

### util.libObj.mime 文件类型识别
- 参考: https://github.com/broofa/mime

