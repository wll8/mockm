const util = require('./util.js')
const http = util.http

describe('config.proxy', () => {
  it(`代理到原始服务器`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/': `http://www.httpbin.org`,
        },
      }),
      okFn: async ({arg, str}) => {
        const get = (await http.get(`http://127.0.0.1:${arg.port}/get?a=1&b=2`)).data
        const post = (await http.post(`http://127.0.0.1:${arg.port}/post`, {a: 1, b: 2})).data
        const bin = (await http.get(`http://127.0.0.1:${arg.port}/image/png`)).data
        const form = (await util.upload(`http://127.0.0.1:${arg.port}/post`, {a: 1, b: 2})).data
        const upload = (await util.upload(`http://127.0.0.1:${arg.port}/post`, {f1: require(`fs`).createReadStream(__filename)})).data
        return (
          get.args.a === `1`
          && post.json.a === 1
          && bin.match(`PNG`)
          && form.form.a === `1`
          && util.getType(upload.files.f1, `string`)
        )
      },
    }))
  })
  it(`拦截请求`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/get': {
            onProxyReq (proxyReq, req, res) {
              proxyReq.setHeader(`x-added`, `req`)
            },
          },
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = await http.get(`http://127.0.0.1:${arg.port}/get`)
        return httpData.data.headers[`X-Added`] === `req`
      },
    }))
  })
  it(`拦截响应`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => ({
        proxy: {
          '/get': {
            onProxyRes (proxyRes, req, res) {
              util.libObj.midResJson({proxyRes, res, key: `origin`, val: `127.0.0.1`}) // 修改 body
              proxyRes.headers[`x-added`] = `res` // 修改 headers
            },
          },
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = await http.get(`http://127.0.0.1:${arg.port}/get`)
        return (
          httpData.headers[`x-added`] === `res`
          && httpData.data.origin === `127.0.0.1`
        )
      },
    }))
  })
  it(`延时 - 在进行代理之前添加中间件`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/get': {
            mid (req, res, next) {
              setTimeout(next, 2000)
            },
          },
        },
      }),
      okFn: async ({arg, str}) => {
        const time1 = Date.now()
        await http.get(`http://127.0.0.1:${arg.port}/get`)
        return (Date.now() - time1) > 2000
      },
    }))
  })
  it(`是否包含后缀 / 的情况`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/any/proxy/test/slashSuffix1/': `/anything/proxy/test/slashSuffix1/`,
          '/any/proxy/test/slashSuffix2': `/anything/proxy/test/slashSuffix2`,
          '/any/proxy/test/slashSuffix3': `/anything/proxy/test/slashSuffix3/`,
        },
      }),
      okFn: async ({arg, str}) => {
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix1/1`)).data.url
        const res2 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix2/2`)).data.url
        const res3 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix3/3`)).data.url
        return (
          res1.match(`slashSuffix1`)
          && res2.match(`slashSuffix2`)
          && res3.match(`slashSuffix3`)
        )
      },
    }))
  })
  it(`[fn] 使用函数处理内容 /proxy/fn`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/anything/proxy/fn':[({req, json}) => {
            return (json.method + req.method).toLowerCase()
          }],
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn`)).data
        return httpData === `getget`
      },
    }))
  })
  it(`[fn, fn] 函数1完成后, 传给函数2 /proxy/fn_fn`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/anything/proxy/fn_fn':[({req, json}) => {
            return json.method
          }, ({req, json}) => {
            return json.toLowerCase() // get
          }],
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn_fn`)).data
        return httpData === `get`
      },
    }))
  })
  it(`[fn, string] 函数处理后值, 通过路径再进入获取 /proxy/fn_string`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/anything/proxy/fn_string':[({req, json}) => {
            return json
          }, `method`], // GET
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn_string`)).data
        return httpData === `GET`
      },
    }))
  })
  it(`[string, fn] 把路径对应的值取出来, 传给后面的函数 /proxy/string_fn`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/anything/proxy/string_fn':[`method`, ({req, json}) => {
            return json.toLowerCase() // get
          }],
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/string_fn`)).data
        return httpData === `get`
      },
    }))
  })
  it(`子路径优先`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/any': `http://www.httpbin.org/anything`,
          '/any/first': `http://www.httpbin.org/anything/sub`,
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData1 = (await http.get(`http://127.0.0.1:${arg.port}/any/x`)).data
        const httpData2 = (await http.get(`http://127.0.0.1:${arg.port}/any/first/x`)).data
        return (
          httpData1.url.includes(`/anything/x`) &&
          httpData2.url.includes(`/anything/sub/x`)
        )
      },
    }))
  })
})
