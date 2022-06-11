const util = require('./util.js')
const http = util.http

describe('config.api', () => {
  it(`覆盖 config.proxy 的同级路径`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {},
        api: {
          '/anything/overrideProxy': `ok`,
        },
      }),
      okFn: async ({arg, str}) => {
        const id = util.uuid()
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/anything/overrideProxy`)).data
        const res2 = (await http.get(`http://127.0.0.1:${arg.port}/anything/${id}`)).data
        debugger
        return (
          res1 === `ok`
          && res2.url.match(id)
        )
      },
    }))
  })
  it(`覆盖 config.proxy 的子路径`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/any/proxy/test/proxyAndApiQuery': `/anything/proxyAndApiQuery`,
        },
        api: {
          '/any/proxy/test/proxyAndApiQuery/myApi': `ok`,
        },
      }),
      okFn: async ({arg, str}) => {
        const id = util.uuid()
        const res3 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/proxyAndApiQuery/myApi`)).data
        const res4 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/proxyAndApiQuery/myApi?q=${id}`)).data
        return (
          res3 === `ok`
          && res4 === `ok`
        )
      },
    }))
  })
  it(`覆盖 config.proxy 全路径匹配`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        proxy: {
          '/any/proxy/test/byConfigAPICoverage': `/anything/proxy/test/byConfigAPICoverage`,
        },
        api: {
          '/any/proxy/test/byConfigAPICoverage': `ok`,
        },
      }),
      okFn: async ({arg, str}) => {
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/byConfigAPICoverage`)).data
        return (
          res1 === `ok`
        )
      },
    }))
  })
  it(`拦截 config.db`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            'get /books/:id' (req, res, next) { // 拦截 config.db
              res.json(req.params)
            },
            'patch /books/:id' (req, res, next) { // 拦截 config.db
              req.body.a = `111` // 修改用户传入的数据
              next()
              res.mm.resHandleJsonApi = (arg) => {
                arg.data.a = `222` // 修改响应, 不会存储到 db.json
                return arg.resHandleJsonApi(arg)
              }
            },
          },
          db: util.libObj.mockjs.mock({
            'books|40-60': [
              {
                'id|+1': 1,
                title: `@ctitle`,
              },
            ],
          }),
        }
      },
      okFn: async ({arg, str}) => {
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/books/111`)).data
        const res2 = (await http.patch(`http://127.0.0.1:${arg.port}/books/1`, {a: 1})).data
        return res1.id === `111` && res2.data.a === `222`
      },
    }))
  })
  it(`* 号代表处理此路径的所有方法`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        api: {
          '* /all/method' (req, res, next) { // * 号代表处理此路径的所有方法
            res.json({msg: req.method, url: req.url})
          },
        },
      }),
      okFn: async ({arg, str}) => {
        const get = (await http.get(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
        const post = (await http.post(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
        const put = (await http.put(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
        return (
          get === `GET`
          && post === `POST`
          && put === `PUT`
        )
      },
    }))
  })
  it(`模拟原有接口`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        api: {
          'get /ip': {res: `127.0.0.1`},
        },
      }),
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/ip`)).data
        return (httpData.res === `127.0.0.1`)
      },
    }))
  })
  it(`使用 mock 功能`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            'get /name': {name: util.libObj.mockjs.mock(`@cname`)},
          },
        }
      },
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/name`)).data
        return (httpData.name.length >= 2)
      },
    }))
  })
  it(`发送文件`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            'get /file' (req, res) { // 发送文件
              res.sendFile(__filename)
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/file`)).data
        return (httpData.match(`get /file`))
      },
    }))
  })
  it(`获取 url 上的 params, query 以及 body 参数`, async () => {
    const paramsId = `202`
    const queryId = util.uuid()
    const bodyId = util.uuid()
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            'post /status/:code' (req, res) {
              const {params, query, body} = req
              res.status(params.code).json({params, query, body})
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        const httpData = (await http.post(`http://127.0.0.1:${arg.port}/status/${paramsId}?queryId=${queryId}`, {bodyId})).data
        return (
          httpData.params.code === paramsId
          && httpData.query.queryId === queryId
          && httpData.body.bodyId === bodyId
        )
      },
    }))
  })
  it(`运行 curl/bash 命令并获取执行结果`, async () => {
    util.ok(await util.runMockm({
      // curl-snippet
      mockm: (util) => {
        return {
          api: ({run}) => {
            return {
              'get /curl' (req, res, next) { // 运行 curl/bash 命令并获取执行结果
                // 示例 curl/bash 命令
                const cmd = `
                  curl 'http://www.httpbin.org/ip' \
                    -H 'Accept: */*' \
                    -H 'Accept-Language: zh-CN,zh;q=0.9' \
                    --compressed \
                    --insecure
                `
                run.curl({req, res, cmd}).then(curRes => {
                  res.send(curRes.body)
                })
              },
            }
          },
        }
      },
      // curl-snippet
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/curl`)).data
        return (httpData.origin)
      },
    }))
  })
  it(`获取客户端上传的文件`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            async 'post /test/upload' (req, res) {
              const multiparty = await util.toolObj.generate.initPackge(`multiparty`)
              const form = new multiparty.Form()
              form.parse(req, (err, fields = [], formData) => {
                const data = {fields, formData, err}
                res.json(data)
              })
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        const formData = (await util.upload(`http://127.0.0.1:${arg.port}/test/upload`, {
          files: require(`fs`).createReadStream(__filename),
        })).data.formData.files[0]
        return util.hasFile(formData.path)
      },
    }))
  })
  it(`运行 fetch 方法并获取执行结果`, async () => {
    util.ok(await util.runMockm({
      // fetch-snippet
      mockm: (util) => {
        return {
          api: ({run}) => {
            return {
              async 'get /fetch' (req, res, next) { // 运行 fetch 方法并获取执行结果
                const fetch = await util.toolObj.generate.initPackge(`node-fetch`)
                // 示例 fetch 方法
                const fetchRes = fetch(`http://www.httpbin.org/ip`, {
                  "headers": {
                    "accept": `*/*`,
                    "accept-language": `zh-CN,zh;q=0.9`,
                  },
                })
                run.fetch({
                  req,
                  res,
                  fetchRes,
                }).then(async thenRes => {
                  const thenResOk = await thenRes.buffer()
                  res.send(thenResOk)
                }).catch(err => console.log(`err`, err))
              },
            }
          },
        }
      },
      // fetch-snippet
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/fetch`)).data
        return (httpData.origin)
      },
    }))
  })
  it(`WebSocket 消息收发`, async () => {
    const WebSocket = require(`ws`)
    util.ok(await util.runMockm({
      timeout: 20 * 1e3,
      mockm: () => {
        return {
          api: {
            'ws /wsecho' (ws, req) { // 创建 websocket API
              ws.send(`连接成功`)
              ws.on(`message`, (msg) => {
                ws.send(msg)
              })
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep(500)
        const id = util.uuid()
        const ws = new WebSocket(`ws://127.0.0.1:${arg.port}/wsecho`);
        const msgList = []
        ws.on('open', () => {
          ws.send(id)
        })
        ws.on('message', (msg) => {
          msgList.push(msg)
        })
        await util.sleep(500)
        return (msgList.length >=2 && msgList.includes(id))
      }
    }))
  })
})