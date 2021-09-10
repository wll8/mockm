const http = require(`axios`)
const util = require('./util.js')
const assert = require('assert')

describe('基本功能', () => {
  describe('显示版本号', () => {
    it(`获取版本号`, () => {
      const version = require(util.pkgPath('../dist/package/package.json')).version
      assert.ok(global.cmdRef.out.match(version))
    })
  })

  describe('服务启动', () => {
    it(`port`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000`)).data
      assert.ok(global.cmdRef.out.match(`127.0.0.1:9000`) && httpData.match(`html`))
    })
    it(`replayPort`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9001`)).data
      assert.ok(httpData.match(`html`))
    })
    it(`testPort`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9005`)).data
      assert.ok(global.cmdRef.out.match(`127.0.0.1:9005`) && httpData.match(`html`))
    })
  })

  describe('config.proxy', () => {
    const time1 = Date.now()
    let httpData
    before(async () => {
      httpData = await http.get(`http://127.0.0.1:9000/get`)
    })
    it(`拦截请求`, async () => {
      assert.ok(httpData.data.headers[`X-Added`] === `req`)
    })
    it(`在进行代理之前添加中间件 - 实现延时功能`, async () => {
      assert.ok((Date.now() - time1) > 2000)
    })
    it(`拦截响应`, async () => {
      assert.ok(
        httpData.headers[`x-added`] === `res`
        && httpData.data.origin === `127.0.0.1`
      )
    })
    it(`/proxy/fn`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/anything/proxy/fn`)).data
      assert.ok(httpData === `getget`)
    })
    it(`/proxy/fn_fn`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/anything/proxy/fn_fn`)).data
      assert.ok(httpData === `get`)
    })
    it(`/proxy/fn_string`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/anything/proxy/fn_string`)).data
      assert.ok(httpData === `GET`)
    })
    it(`/proxy/string_fn`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/anything/proxy/string_fn`)).data
      assert.ok(httpData === `get`)
    })
  })

  describe('config.dataDir', () => {
    it(`httpData`, async () => {
      assert.ok(util.hasFile(util.pkgPath(`../httpData`)))
    })
  })

  describe('config.dbJsonPath', () => {
    it(`dbJsonPath`, async () => {
      assert.ok(util.hasFile(util.pkgPath(`../httpData/db.json`)))
    })
  })

  describe('config.db', () => {
    it(`获取列表`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/books`)).data
      assert.ok(httpData.data.length > 1)
    })
    it(`路由重定向 config.route`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/db/api/books`)).data
      assert.ok(httpData.data.length > 1)
    })
    it(`创建数据`, async () => {
      const title = util.uuid()
      const httpData = (await http.post(`http://127.0.0.1:9000/db/api/books`, {title})).data
      assert.ok(httpData.data.title === title)
    })
  })
  describe('config.api', () => {
    it(`* 号代表处理此路径的所有方法`, async () => {
      const get = (await http.get(`http://127.0.0.1:9000/all/method`)).data.msg
      const post = (await http.post(`http://127.0.0.1:9000/all/method`)).data.msg
      const put = (await http.put(`http://127.0.0.1:9000/all/method`)).data.msg
      assert.ok(
        get === `GET`
        && post === `POST`
        && put === `PUT`
      )
    })
    it(`模拟原有接口`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/ip`)).data
      assert.ok(httpData.res === `127.0.0.1`)
    })
    it(`使用 mock 功能`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/name`)).data
      assert.ok(httpData.name.length >= 2)
    })
    it(`发送文件`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/file`)).data
      assert.ok(httpData.match(`mockm`))
    })
    it(`获取 url 上的 params, query 以及 body 参数`, async () => {
      const paramsId = `202`
      const queryId = util.uuid()
      const bodyId = util.uuid()
      const httpData = (await http.post(`http://127.0.0.1:9000/status/${paramsId}?queryId=${queryId}`, {bodyId})).data
      assert.ok(
        httpData.params.code === paramsId
        && httpData.query.queryId === queryId
        && httpData.body.bodyId === bodyId
      )
    })
    it.skip(`运行 curl/bash 命令并获取执行结果`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/curl`)).data
      assert.ok(httpData.origin)
    })
    it.skip(`获取客户端上传的文件`, async () => {
      // todo
    })
    it(`运行 fetch 方法并获取执行结果`, async () => {
      const httpData = (await http.get(`http://127.0.0.1:9000/fetch`)).data
      assert.ok(httpData.origin)
    })
    it(`WebSocket 消息收发`, async () => {
      const id = util.uuid()
      const WebSocket = require(`ws`)
      const ws = new WebSocket('ws://localhost:9000/wsecho');
      const msgList = []
      ws.on('open', () => {
        ws.send(id)
      })
      ws.on('message', (msg) => {
        msgList.push(msg)
      })
      await util.sleep()
      assert.ok(msgList.length >=2 && msgList.includes(id))
    })
  })

})
describe('命令行', () => {
  it(`配置文件`, async () => {
    const {fullCmd: cmd} = await util.craeteMockmCmdInfo({
      '--config': util.uuid(`-`), // 故意找不到配置文件
    })
    const testCliTextRes = await util.testCliText({cmd, fn(str) {
      return (
        str.match(`Error: Cannot find module`) 
      )
    }}).catch(res => false)
    assert.ok(testCliTextRes)
  })
  it(`配置端口号`, async () => {
    const {
      fullCmd: cmd,
      arg,
    } = await util.craeteMockmCmdInfo()
    const testCliTextRes = await util.testCliText({cmd, fn(str) {
      return (
        str.match(`:${arg.port}/`) 
        && str.match(`:${arg.testPort}/`) 
      )
    }}).catch(res => false)
    console.log(`testCliTextRes`, testCliTextRes)
    assert.ok(testCliTextRes)
  })
  it(`--cwd`, async () => {
    const {
      fullCmd: cmd,
      arg,
    } = await util.craeteMockmCmdInfo()
    
    const testCliTextRes = await util.testCliText({cmd, fn(str) {
      return (
        str.match(`:${arg.port}/`) 
        && str.match(`:${arg.testPort}/`) 
      )
    }}).catch(res => false)
    const hasFileRes = (
      util.hasFile(`${arg[`--cwd`]}/mm.config.js`)
      && util.hasFile(`${arg[`--cwd`]}/httpData`)
      && util.hasFile(`${arg[`--cwd`]}/apiWeb.json`)
    )
    assert.ok(hasFileRes)
  })
  it(`--template`, async () => {
    const {
      fullCmd: cmd,
      arg,
    } = await util.craeteMockmCmdInfo({
      '--template': true,
    })
    const testCliTextRes = await util.testCliText({cmd, fn(str) {
      return (
        str.match(`:${arg.port}/`) 
        && str.match(`:${arg.testPort}/`) 
      )
    }}).catch(res => false)
    await util.sleep()
    const hasFileRes = (
      util.hasFile(`${arg[`--cwd`]}/mm/mm.config.js`)
      && util.hasFile(`${arg[`--cwd`]}/mm/httpData`)
      && util.hasFile(`${arg[`--cwd`]}/mm/apiWeb.json`)
    )
    assert.ok(hasFileRes)
  })
})