const util = require('./util.js')
const getPort = require(`get-port`)
const http = util.http
const httpConfig = { httpsAgent: new require(`https`).Agent({ rejectUnauthorized: false }) }
describe('config.https', () => {
  it(`相同端口, http 跳转到 https`, async () => {
    const getHttpsKeyRes = await util.getHttpsKey()
    const uuid = util.uuid()
    util.ok(await util.runMockm({
      INJECT: {
        https: {
          key: getHttpsKeyRes.ceFile.key,
          cert: getHttpsKeyRes.ceFile.cert,
        },
        api: {
          '/test': uuid,
        },
      },
      okFn: async ({arg, str}) => {
        const portHttpRes = await http.get(`http://127.0.0.1:${arg.port}/test`, { maxRedirects: 0, }).catch((err) => err.response)
        const portHttpsRes = await http.get(`https://127.0.0.1:${arg.port}/test`, httpConfig)
        const testPortHttpRes = await http.get(`http://127.0.0.1:${arg.testPort}/api/studio/`, { maxRedirects: 0, }).catch((err) => err.response)
        const testPortHttpsRes = await http.get(`https://127.0.0.1:${arg.testPort}/api/studio/`, httpConfig)
        const replayPortHttpRes = await http.get(`http://127.0.0.1:${arg.replayPort}/test`, { maxRedirects: 0, }).catch((err) => err.response)
        const replayPortHttpsRes = await http.get(`https://127.0.0.1:${arg.replayPort}/test`, httpConfig)
        return (
          portHttpRes.status === 301 &&
          portHttpsRes.data === uuid &&
          testPortHttpRes.status === 301 &&
          testPortHttpsRes.data.api &&
          replayPortHttpRes.status === 301 &&
          replayPortHttpsRes.data === uuid
        )
      },
    }))
  })
  it(`相同端口, http 不跳转到 https`, async () => {
    const getHttpsKeyRes = await util.getHttpsKey()
    const uuid = util.uuid()
    util.ok(await util.runMockm({
      INJECT: {
        https: {
          key: getHttpsKeyRes.ceFile.key,
          cert: getHttpsKeyRes.ceFile.cert,
          redirect: false,
        },
        api: {
          '/test': uuid,
        },
      },
      okFn: async ({arg, str}) => {
        const portHttpRes = await http.get(`http://127.0.0.1:${arg.port}/test`, { maxRedirects: 0, })
        const portHttpsRes = await http.get(`https://127.0.0.1:${arg.port}/test`, httpConfig)
        const testPortHttpRes = await http.get(`http://127.0.0.1:${arg.testPort}/api/studio/`, { maxRedirects: 0, })
        const testPortHttpsRes = await http.get(`https://127.0.0.1:${arg.testPort}/api/studio/`, httpConfig)
        const replayPortHttpRes = await http.get(`http://127.0.0.1:${arg.replayPort}/test`, { maxRedirects: 0, })
        const replayPortHttpsRes = await http.get(`https://127.0.0.1:${arg.replayPort}/test`, httpConfig)
        return (
          portHttpRes.data === uuid &&
          portHttpsRes.data === uuid &&
          testPortHttpRes.data.api &&
          testPortHttpsRes.data.api &&
          replayPortHttpRes.data === uuid &&
          replayPortHttpsRes.data === uuid
        )
      },
    }))
  })
  it(`不相同端口, http 不跳转到 https`, async () => {
    const getHttpsKeyRes = await util.getHttpsKey()
    const uuid = util.uuid()
    const portHttps = await getPort()
    const testPortHttps = await getPort()
    const replayPortHttps = await getPort()
    util.ok(await util.runMockm({
      INJECT: {
        https: {
          key: getHttpsKeyRes.ceFile.key,
          cert: getHttpsKeyRes.ceFile.cert,
          redirect: false,
          port: portHttps,
          testPort: testPortHttps,
          replayPort: replayPortHttps,
        },
        api: {
          '/test': uuid,
        },
      },
      okFn: async ({arg, str}) => {
        const portHttpRes = await http.get(`http://127.0.0.1:${arg.port}/test`, { maxRedirects: 0, })
        const portHttpsRes = await http.get(`https://127.0.0.1:${portHttps}/test`, httpConfig)
        const testPortHttpRes = await http.get(`http://127.0.0.1:${arg.testPort}/api/studio/`, { maxRedirects: 0, })
        const testPortHttpsRes = await http.get(`https://127.0.0.1:${testPortHttps}/api/studio/`, httpConfig)
        const replayPortHttpRes = await http.get(`http://127.0.0.1:${arg.replayPort}/test`, { maxRedirects: 0, })
        const replayPortHttpsRes = await http.get(`https://127.0.0.1:${replayPortHttps}/test`, httpConfig)
        return (
          portHttpRes.data === uuid &&
          portHttpsRes.data === uuid &&
          testPortHttpRes.data.api &&
          testPortHttpsRes.data.api &&
          replayPortHttpRes.data === uuid &&
          replayPortHttpsRes.data === uuid
        )
      },
    }))
  })
  it(`不相同端口, http 跳转到 https`, async () => {
    const getHttpsKeyRes = await util.getHttpsKey()
    const uuid = util.uuid()
    const portHttps = await getPort()
    const testPortHttps = await getPort()
    const replayPortHttps = await getPort()
    util.ok(await util.runMockm({
      INJECT: {
        https: {
          key: getHttpsKeyRes.ceFile.key,
          cert: getHttpsKeyRes.ceFile.cert,
          port: portHttps,
          testPort: testPortHttps,
          replayPort: replayPortHttps,
        },
        api: {
          '/test': uuid,
        },
      },
      okFn: async ({arg, str}) => {
        const portHttpRes = await http.get(`http://127.0.0.1:${arg.port}/test`, { maxRedirects: 0, }).catch((err) => err.response )
        const portHttpsRes = await http.get(`https://127.0.0.1:${portHttps}/test`, httpConfig)
        const testPortHttpRes = await http.get(`http://127.0.0.1:${arg.testPort}/api/studio/`, { maxRedirects: 0, }).catch((err) => err.response )
        const testPortHttpsRes = await http.get(`https://127.0.0.1:${testPortHttps}/api/studio/`, httpConfig)
        const replayPortHttpRes = await http.get(`http://127.0.0.1:${arg.replayPort}/test`, { maxRedirects: 0, }).catch((err) => err.response )
        const replayPortHttpsRes = await http.get(`https://127.0.0.1:${replayPortHttps}/test`, httpConfig)
        return (
          portHttpRes.status === 301 &&
          portHttpsRes.data === uuid &&
          testPortHttpRes.status === 301 &&
          testPortHttpsRes.data.api &&
          replayPortHttpRes.status === 301 &&
          replayPortHttpsRes.data === uuid
        )
      },
    }))
  })
})
