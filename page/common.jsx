// 本文件用于全局方法配置

window.IconFont = icons.createFromIconfontCN({
  scriptUrl: 'font/iconfont.js',
});

window.http = axios.create({
  baseURL: `http://localhost:9005/`,
  timeout: 0,
  headers: {'X-Custom-Header': 'foobar'}
})


