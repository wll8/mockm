const axios = require(`axios`).default
const http = axios.create({
  proxy: false,
})

// 请求拦截器
http.interceptors.request.use(async (config) => {
  return config
}, (err) => Promise.reject(err))

// 响应拦截器
http.interceptors.response.use((res) => res.data, (err) => Promise.reject(err))

module.exports = http