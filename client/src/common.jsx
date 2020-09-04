// 本文件用于全局方法配置
import axios from 'axios'
import * as icons from '@ant-design/icons'
import './common.scss'
const common = {}

common.IconFont = icons.createFromIconfontCN({
  scriptUrl: 'font/iconfont.js',
});

common.cfg = {
  baseURL: window.location.origin,
  // baseURL: `http://localhost:9005`,
}

common.http = axios.create({
  baseURL: common.cfg.baseURL,
  timeout: 0,
  headers: {'X-Custom-Header': 'foobar'}
})

common.http.interceptors.request.use(
  config => {
    const { url } = config
    const [, apiId = ``] = window.location.hash.match(/#\/history,(\w+)/) || []
    const origin = (new URL(url)).origin
    const re = new RegExp(`(${origin}\\/api\\/)(\\w+)`)
    let newUrl = url
    if(url.match(re)) { // 当 `/api/有方法但无参数/` 时, 默认添加请求的 id
      newUrl = url.replace(re, `$1$2${apiId ? `,${apiId}` : ``}`)
    }
    config.url = newUrl
   return config
  }
)

common.http.interceptors.response.use(
  response => {
    const res = response.data
    return Promise.resolve(res)
  },
  error => {
    return Promise.reject(error)
  }
)

export default common
