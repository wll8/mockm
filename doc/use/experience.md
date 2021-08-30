# 最佳实践
推荐的使用经验. 这里假设你所开发的项目是一个基于版本控制的, 多人协作, 前后端分离的项目.

## 安装工具到项目中
``` sh
cnpm i mockm -D
```

运行上面的命令之后 mockm 会保存到 package.json 中, 这样初始化项目时就会自动安装.

全局安装只是方便在任何位置直接使用.

## 自动初始化配置
运行命令 [npx mockm --template](../config/cli.md#template) 自动配置 npm 脚本以及初始化目录:

```
mm/
  - api/ -- 手动创建的 api
  - httpData/ -- 请求记录, 一般不提交到版本库
  - apiWeb.json -- 从 UI 界面上创建的接口信息
  - util.js -- 一些公用方法
  - mm.config.js -- mockm 的配置文件
```

以后启动 mockm 的方式就变成:

``` sh
npm run mockm
```
