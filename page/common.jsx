// 本文件用于全局方法配置

window.IconFont = icons.createFromIconfontCN({
  scriptUrl: 'font/iconfont.js',
});

window.http = axios.create({
  // baseURL: `http://localhost:9005/`,
  baseURL: `/`,
  timeout: 0,
  headers: {'X-Custom-Header': 'foobar'}
})

window.http.interceptors.response.use(
  response => {
    const res = response.data
    return Promise.resolve(res)
  },
  error => {
    return Promise.reject(error)
  }
)
