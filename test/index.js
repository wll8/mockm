const util = require('./util.js')

with (util) {
  allTestBefore()

  after(() => {
    console.log('测试完成')
    allTestAfter()
  })
  describe('基本功能', () => {
    console.log(`服务启动中...`)
    startApp()
    asyncTosync(sleep)(2000)
    console.log(`服务启动完成...`)
    
    describe('显示版本号', () => {
      const version = require(absPath('../dist/package/package.json')).version
      it(`获取版本号`, () => {
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
        assert.ok(global.cmdRef.out.match(`127.0.0.1:9001`) && httpData.match(`html`))
      })
      it(`testPort`, async () => {
        const httpData = (await http.get(`http://127.0.0.1:9005`)).data
        assert.ok(global.cmdRef.out.match(`127.0.0.1:9005`) && httpData.match(`html`))
      })
    })

    describe('config.proxy', () => {
      const fn = () => {
        const http = require(`axios`)
        return new Promise((resolve) => {
          http.get(`http://127.0.0.1:9000/get`).then(res => {
            resolve(JSON.stringify({
              headers: res.headers,
              data: res.data,
            }))
          })
        })
      }
      const time1 = Date.now()
      let {res: httpData} = asyncTosync(fn)()
      httpData = JSON.parse(httpData || null)
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
        assert.ok(hasFile(absPath(`../httpData`)))
      })
    })

    describe('config.dbJsonPath', () => {
      it(`dbJsonPath`, async () => {
        assert.ok(hasFile(absPath(`../httpData/db.json`)))
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
        const title = uuid()
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
        const queryId = uuid()
        const bodyId = uuid()
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
        const id = uuid()
        const WebSocket = require(`ws`)
        const ws = new WebSocket('ws://localhost:9000/wsecho');
        const msgList = []
        ws.on('open', () => {
          ws.send(id)
        })
        ws.on('message', (msg) => {
          msgList.push(msg)
        })
        await sleep()
        assert.ok(msgList.length >=2 && msgList.includes(id))
      })
    })

  })
  describe('命令行', () => {
    it(`配置端口号`, async () => {
      const cfg = startApp({run: false})
      const cmd = `node ${cfg.runPath.replace(`../`, `./`)} port=9100 testPort=9105 replayPort=9101`
      const testCliTextRes = await testCliText({cmd, fn(str) {
        return (
          str.match(`:9100/`) 
          && str.match(`:9105/`) 
          && str.match(`:9101/`)
        )
      }}).catch(res => false)
      assert.ok(testCliTextRes)
    })
  })

}
