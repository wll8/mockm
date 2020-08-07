访问测试链接时, 如果客户端页面没有生成, 需要编译生成一下:

``` sh
cd client # 进入客户端项目
npm i # 安装客户端项目所需依赖
npm run build # 打包生成页面
open http://localhost:9005 # 访问测试链接
```
