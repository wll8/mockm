# 最佳实践
推荐的使用经验. 这里假设你所开发的项目是一个基于版本控制的, 多人协作, 前后端分离的项目.

## 使用局部安装
``` sh
cnpm i -S mockm
```

运行上面的命令安装后 mockm 和版本会保存到 package.json 中, 这样初始化项目时就会自动安装 mockm.

全局安装只是方便在任何位置直接使用.

## 配置启动脚本
在 package.json 的 script 中添加启动命令:

``` json
{
  "scripts": {
    "mockm": "./node_modules/.bin/mockm"
  }
}
```

以后启动 mockm 的方式就变成:

``` sh
npm run mockm
```

## 添加 mockm 配置
在项目中创建 `mm.config.js` 文件, 初始内容建议为:

``` js
/**
 * 文档: https://www.hongqiye.com/doc/mockm
 */
module.exports = util => {
  const {
    libObj: { mockjs },
  } = util
  return {
    guard: true, // 异常崩溃是否自动重启
    port: 9000, // http://127.0.0.1:9000 可以打开经过代理的接口
    testPort: 9005, // http://127.0.0.1:9005 可以进行 mockm 的界面式操作
    replayPort: 9001, // http://127.0.0.1:9001 可以返回历史的接口响应
    watch: [],
    proxy: {
      '/': `http://www.httpbin.org/`, // 要代理的后端接口地址
    },
    api(util) {
      return {
        // 创建接口并使用 mockjs 生成数据
        'get /api/test': mockjs.mock({ // http://127.0.0.1:9000/api/test 可以访问这个接口
          success: true,
          'data|3-7': [{
            userId: `@id`,
            userName: `@cname`,
          }]
        }),
      }
    },
  }
}

```

配置中列出了一些常用的选项, 例如端口可能被占用, 写在配置中方便别人修改. 

如果配置文件中的 api 编写较多时, 可以分文件来写. 这时候可以配置 [watch](../config/option.md#config-watch) 参数, 当某文件变更后 mockm 自动重载.

## 配置版本控制系统
在 `.gitignore` 中添加 `httpData`, 因为 mockm 会把请求记录放在这个目录, 每请求一次这个目录都会产生数据. 这个目录一般是不需要提交到版本控制系统中的.

- 需要忽略的目录
  - httpData

- 需要提交的文件
  - apiWeb.json
  - mm.config.js
