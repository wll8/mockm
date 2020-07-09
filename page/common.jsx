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

window.http.interceptors.request.use(
  config => {
    const { url } = config
    const [, histryId = ``] = window.location.hash.match(/\#\/histry,(\w+)/) || []
    let newUrl = url
    if(url.match(/^\/api\/\w+\//)) { // 当 `/api/有方法但无参数/` 时, 默认添加请求的 id
      newUrl = url.replace(/(^\/api\/)(\w+)/, `$1$2${histryId ? `,${histryId}` : ``}`)
    }
    config.url = newUrl
   return config
  },
)

window.http.interceptors.response.use(
  response => {
    const res = response.data
    return Promise.resolve(res)
  },
  error => {
    return Promise.reject(error)
  }
)
