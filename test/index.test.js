const util = require('./util.js')
const http = util.http
const getPort = require(`get-port`)
const assert = require('assert')

describe('基本功能', () => {
  describe('显示版本号', () => {
    it(`获取版本号`, async () => {
      const version = require(util.pkgPath('./package.json')).version
      util.ok(await util.runMockm({
        runOk: false,
        okFn: ({arg, str}) => {
          return str.match(version)
        }
      }))
    })
  })

  describe('服务启动', () => {
    it(`port`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`replayPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.replayPort}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`testPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.testPort}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
  })

  describe('config.proxy', () => {
    it(`拦截请求`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = await http.get(`http://127.0.0.1:${arg.port}/get`)
          return httpData.data.headers[`X-Added`] === `req`
        }
      ))
    })
    it(`是否包含后缀 / 的情况`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const res1 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix1/1`)).data.url
          const res2 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix2/2`)).data.url
          const res3 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/slashSuffix3/3`)).data.url
          return (
            res1.match(`slashSuffix1`)
            && res2.match(`slashSuffix2`)
            && res3.match(`slashSuffix3`)
          )
        }
      ))
    })
    it(`在进行代理之前添加中间件 - 实现延时功能`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const time1 = Date.now()
          await http.get(`http://127.0.0.1:${arg.port}/get`)
          return (Date.now() - time1) > 2000
        }
      ))
    })
    it(`拦截响应`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = await http.get(`http://127.0.0.1:${arg.port}/get`)
          return (
            httpData.headers[`x-added`] === `res`
            && httpData.data.origin === `127.0.0.1`
          )
        }
      ))
    })
    it(`/proxy/fn`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn`)).data
          return httpData === `getget`
        }
      ))
    })
    it(`/proxy/fn_fn`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn_fn`)).data
          return httpData === `get`
        }
      ))
    })
    it(`/proxy/fn_string`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/fn_string`)).data
          return httpData === `GET`
        }
      ))
    })
    it(`/proxy/string_fn`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/anything/proxy/string_fn`)).data
          return httpData === `get`
        }
      ))
    })
  })

  describe('config.dataDir', () => {
    it(`httpData`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          return util.hasFile(`${arg[`--cwd`]}/httpData`)
        }
      ))
    })
  })

  describe('config.dbJsonPath', () => {
    it(`dbJsonPath`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          return util.hasFile(`${arg[`--cwd`]}/httpData/db.json`)
        }
      ))
    })
  })

  describe('config.db', () => {
    it(`获取列表`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/books`)).data
          return httpData.data.length > 1
        }
      ))
    })
    it(`路由重定向 config.route`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/db/api/books`)).data
          return httpData.data.length > 1
        }
      ))
    })
    it(`创建数据`, async () => {
      const title = util.uuid()
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.post(`http://127.0.0.1:${arg.port}/db/api/books`, {title})).data
          return httpData.data.title === title
        }
      ))
    })
  })
  describe('config.api', () => {
    describe('config.api 覆盖 config.proxy', () => {
      it(`某部分路径`, async () => {
        util.ok(await util.runMockm(
          async ({arg, str}) => {
            const id = util.uuid()
            const res1 = (await http.get(`http://127.0.0.1:${arg.port}/anything/overrideProxy`)).data
            const res2 = (await http.get(`http://127.0.0.1:${arg.port}/anything/${id}`)).data

            // config.api 是 config.proxy 的子路径
            const res3 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/proxyAndApiQuery/myApi`)).data
            const res4 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/proxyAndApiQuery/myApi?q=${id}`)).data
            return (
              res1 === `ok`
              && res2.url.match(id)
              && res3 === `ok`
              && res4 === `ok`
            )
          }
        ))
      })
      it(`全路径匹配`, async () => {
        util.ok(await util.runMockm(
          async ({arg, str}) => {
            const res1 = (await http.get(`http://127.0.0.1:${arg.port}/any/proxy/test/byConfigAPICoverage`)).data
            return (
              res1 === `ok`
            )
          }
        ))
      })
    })
    it(`拦截 config.db`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const res1 = (await http.get(`http://127.0.0.1:${arg.port}/books/111`)).data
          const res2 = (await http.patch(`http://127.0.0.1:${arg.port}/books/1`, {a: 1})).data
          return res1.id === `111` && res2.data.a === `222`
        }
      ))
    })
    it(`* 号代表处理此路径的所有方法`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const get = (await http.get(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
          const post = (await http.post(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
          const put = (await http.put(`http://127.0.0.1:${arg.port}/all/method`)).data.msg
          return (
            get === `GET`
            && post === `POST`
            && put === `PUT`
          )
        }
      ))
    })
    it(`模拟原有接口`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/ip`)).data
          return (httpData.res === `127.0.0.1`)
        }
      ))
    })
    it(`使用 mock 功能`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/name`)).data
          return (httpData.name.length >= 2)
        }
      ))
    })
    it(`发送文件`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/file`)).data
          return (httpData.match(`mockm`))
        }
      ))
    })
    it(`获取 url 上的 params, query 以及 body 参数`, async () => {
      const paramsId = `202`
      const queryId = util.uuid()
      const bodyId = util.uuid()
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.post(`http://127.0.0.1:${arg.port}/status/${paramsId}?queryId=${queryId}`, {bodyId})).data
          return (
            httpData.params.code === paramsId
            && httpData.query.queryId === queryId
            && httpData.body.bodyId === bodyId
          )
        }
      ))
    })
    it.skip(`运行 curl/bash 命令并获取执行结果`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/curl`)).data
          return (httpData.origin)
        }
      ))
    })
    it.skip(`获取客户端上传的文件`, async () => {
      // todo
    })
    it(`运行 fetch 方法并获取执行结果`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/fetch`)).data
          return (httpData.origin)
        }
      ))
    })
    it(`WebSocket 消息收发`, async () => {
      const WebSocket = require(`ws`)
      util.ok(await util.runMockm({
        timeout: 20 * 1e3,
        okFn: async ({arg, str}) => {
          {
            new WebSocket(`ws://127.0.0.1:${arg.port}/wsecho`); // 先让服务器知道要使用 ws
            await util.sleep(10*1000) // 等待服务器初始化 ws 相关依赖
          }
          const id = util.uuid()
          const ws = new WebSocket(`ws://127.0.0.1:${arg.port}/wsecho`);
          const msgList = []
          ws.on('open', () => {
            ws.send(id)
          })
          ws.on('message', (msg) => {
            msgList.push(msg)
          })
          await util.sleep()
          return (msgList.length >=2 && msgList.includes(id))
        }
      }))
    })
  })
  describe('config.updateToken', () => {
    it(`禁用 boolean/false`, async () => {
      util.ok(await util.runMockm({
        mockm: {
          updateToken: true,
        },
        okFn: async ({arg, str}) => {
          // 第一次请求 旧的 authorization
          const {authorization: authorization1} = (await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {authorization: `old`},
          })).data.headers
          
          // 第二次请求 使用新 authorization
          await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {authorization: `new`},
          })
          
          // 重放第一次请求而产生的第三次请求
          await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/replay,1/post/test/boolean`,
          })
          const {authorization: authorization2} = (await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/getBodyFileRes,3/post/test/boolean`,
          })).data.headers
          console.log({authorization1, authorization2})
          return (authorization1 === `old`) && (authorization2 === `new`)
        },
      }))
    })
    it(`启用 boolean/true`, async () => {
      util.ok(await util.runMockm({
        mockm: {
          updateToken: false,
        },
        okFn: async ({arg, str}) => {
          // 第一次请求 旧的 authorization
          const {authorization: authorization1} = (await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {authorization: `old`},
          })).data.headers
          
          // 第二次请求 使用新 authorization
          await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {authorization: `new`},
          })
          
          // 重放第一次请求而产生的第三次请求
          await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/replay,1/post/test/boolean`,
          })
          const {authorization: authorization2} = (await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/getBodyFileRes,3/post/test/boolean`,
          })).data.headers
          return (authorization1 === `old`) && (authorization2 === `old`)
        },
      }))
    })
    it(`指定字段 string`, async () => {
      util.ok(await util.runMockm({
        mockm: {
          updateToken: `auth`,
        },
        okFn: async ({arg, str}) => {
          const {auth: authorization1, abc} = (await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {abc: `123`, auth: `old`},
          })).data.headers
          
          await http({
            method: `post`,
            url: `http://127.0.0.1:${arg.port}/test/boolean`,
            headers: {abc: `123`, auth: `new`},
          })
          
          await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/replay,1/post/test/boolean`,
          })
          const {auth: authorization2} = (await http({
            method: `get`,
            url: `http://127.0.0.1:${arg.testPort}/api/getBodyFileRes,3/post/test/boolean`,
          })).data.headers
          return (abc === `123`) && (authorization1 === `old`) && (authorization2 === `new`)
        },
      }))
    })
  })

})
describe.skip('性能', () => {
  describe('接口服务', () => {
    it(`存在较多历史时造成的影响情况`, async () => {
      util.ok(await util.runMockm({
        timeout: 1e9,
        okFn: async ({arg, str}) => {
          let repeat = 10 // 共测试多少次
          let length = 200 // 每次并发数
          let headersSize = 10e3 // header 体积
          let index = 0
          for(let repeatIndex=0; repeatIndex<repeat; repeatIndex++){
            console.time()
            await Promise.all(Array.from({length}).map((item, lengthIndex) => {
              index = index + 1
              return http({
                method: `post`,
                url: `http://127.0.0.1:${arg.port}/test/${index}`,
                headers: {
                  repeatIndex,
                  lengthIndex,
                  index,
                  xxx: `x`.repeat(headersSize),
                }, // 请求头
                data: {
                  index,
                  data: Number(Math.random()).toFixed(50).repeat(2e3),
                },
              })
            }))
            console.timeEnd()
          }
          return true
          /**
          repeat = 10; length = 200; headersSize = 10e3;
          优化前
          7.445s => 44.646s
          8.648s => 41.989s
          
          优化后
          9.493s => 11.239s
          9.259s => 11.760s
           */
        },
      }))
    })
  })
})
describe('命令行', () => {
  it(`配置文件`, async () => {
    util.ok(await util.runMockm({
      runOk: false,
      mockm: {
        '--config': util.uuid(`-`), // 故意找不到配置文件
      },
      okFn: async ({arg, str}) => {
        return str.match(`Error: Cannot find module`) 
      }
    }))
  })
  it(`配置端口号`, async () => {
    util.ok(await util.runMockm(async ({arg, str}) => {
      return (
        str.match(`:${arg.port}/`) 
        && str.match(`:${arg.testPort}/`) 
      )
    }))
  })
  it(`--cwd`, async () => {
    util.ok(await util.runMockm(async ({arg, str}) => {

      return (
        util.hasFile(`${arg[`--cwd`]}/mm.config.js`)
        && util.hasFile(`${arg[`--cwd`]}/httpData`)
        && util.hasFile(`${arg[`--cwd`]}/apiWeb.json`)
      )
    }))
  })
  it(`--template`, async () => {
    util.ok(await util.runMockm({
      mockm: {
        '--template': true,
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        return (
          util.hasFile(`${arg[`--cwd`]}/mm/mm.config.js`)
          && util.hasFile(`${arg[`--cwd`]}/mm/httpData`)
          && util.hasFile(`${arg[`--cwd`]}/mm/apiWeb.json`)
        )
      }
    }))
  })
  it(`--version`, async function () {
    util.ok(await util.runMockm({
      runOk: false,
      mockm: {
        '--version': true,
      },
      okFn: async ({arg, str}) => {
        const version = require(util.pkgPath('./package.json')).version
        return version === str.trim()
      }
    }))
  })
  it(`--node-options`, async function () {
    util.ok(await util.runMockm({
      runOk: false,
      mockm: {
        '--node-options': `--inspect-brk="${await getPort()}"`,
      },
      okFn: async ({arg, str}) => {
        return str.match(`ws://`)
      }
    }))
  })
})