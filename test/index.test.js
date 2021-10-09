const http = require(`axios`)
const util = require('./util.js')
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
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/`).catch(err => ({}))).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`replayPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.replayPort}/`).catch(err => ({}))).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`testPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.testPort}/`).catch(err => ({}))).data || ``
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
})