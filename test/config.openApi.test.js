const util = require('./util.js')
const shelljs = require('shelljs')
const http = util.http

describe('config.openApi', () => {
  it(`string`, async () => {
    const port = process.env.port = (await util.newMockmPort()).port
    util.ok(await util.runMockm({
      cli: {
        port,
      },
      mockm: () => {
        const port = process.env.port
        return {
          openApi: `http://127.0.0.1:${port}/oa`,
          dbCover: true,
          backOpenApi: 0.01,
          db: {
            oa: {
              a: `0`,
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `1`})
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `2`})
        await util.sleep()
        const oaPath = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa`
        const list = shelljs.ls(oaPath)
        return (
          list.length === 3
          && require(`${oaPath}/${list[0]}`).data.a === `0`
          && require(`${oaPath}/${list[2]}`).data.a === `2`
        )
      },
    }))
  })
  it(`string[]`, async () => {
    const port = process.env.port = (await util.newMockmPort()).port
    util.ok(await util.runMockm({
      cli: {
        port,
      },
      mockm: () => {
        const port = process.env.port
        return {
          openApi: [
            `http://127.0.0.1:${port}/oa`,
            `http://127.0.0.1:${port}/oa1`,
          ],
          dbCover: true,
          backOpenApi: 0.01,
          db: {
            oa: {
              a: `0`,
            },
            oa1: {
              a: `0`,
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `1`})
        await http.patch(`http://127.0.0.1:${arg.port}/oa1`, {a: `1`})
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa1`, {a: `2`})
        await util.sleep()
        const oaPath = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa`
        const oaPath1 = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa1`
        const list = shelljs.ls(oaPath1)
        return (
          shelljs.ls(oaPath).length === 2
          && list.length === 3
          && require(`${oaPath1}/${list[0]}`).data.a === `0`
          && require(`${oaPath1}/${list[2]}`).data.a === `2`
        )
      },
    }))
  })
  it(`openApi`, async () => {
    const port = process.env.port = (await util.newMockmPort()).port
    util.ok(await util.runMockm({
      cli: {
        port,
      },
      mockm: () => {
        const port = process.env.port
        return {
          openApi: {
            spec: `http://127.0.0.1:${port}/oa`,
          },
          dbCover: true,
          backOpenApi: 0.01,
          db: {
            oa: {
              a: `0`,
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `1`})
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `2`})
        await util.sleep()
        const oaPath = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa`
        const list = shelljs.ls(oaPath)
        return (
          list.length === 3
          && require(`${oaPath}/${list[0]}`).data.a === `0`
          && require(`${oaPath}/${list[2]}`).data.a === `2`
        )
      },
    }))
  })
  it(`openApi.reqPrefix && openApi.resPrefix`, async () => {
    const port = process.env.port = (await util.newMockmPort()).port
    util.ok(await util.runMockm({
      cli: {
        port,
      },
      mockm: () => {
        const port = process.env.port
        return {
          proxy: {
            '/': `http://httpbin.org/`,
            '/test/hb': `http://www.httpbin.org/`,
            '/png': `http://www.httpbin.org/image/png`,
          },
          openApi: [
            {
              // /test/hb 和 /png 之外的请求都会与此 openApi 匹配
              spec: `http://httpbin.org/spec.json`,
            },
            {
              // 请求 /test/hb/status/203 时相当于请求 /status/203
              resPrefix: `/test/hb`,
              spec: `http://httpbin.org/spec.json`,
            },
            {
              // 请求 /png 时相当于请求 /image/png, openapi 在返回到前端之前会把 /image 删除, 以便于匹配
              reqPrefix: `/image`,
              spec: `http://httpbin.org/spec.json`,
            },
          ],
          backOpenApi: 0.01,
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        const resPrefix = await http.get(`http://127.0.0.1:${arg.testPort}/api/getOpenApi/?api=/test/hb/status/203`)
        const reqPrefix = await http.get(`http://127.0.0.1:${arg.testPort}/api/getOpenApi/?api=/png`)
        const normal = await http.get(`http://127.0.0.1:${arg.testPort}/api/getOpenApi/?api=/image/png`)
        return (
          reqPrefix.data.info._matchInfo.hasMatch
          && resPrefix.data.info._matchInfo.hasMatch
          && normal.data.info._matchInfo.hasMatch
        )
      },
    }))
  })
  it(`openApi[]`, async () => {
    const port = process.env.port = (await util.newMockmPort()).port
    util.ok(await util.runMockm({
      cli: {
        port,
      },
      mockm: () => {
        const port = process.env.port
        return {
          openApi: [
            {
              spec: `http://127.0.0.1:${port}/oa`,
            },
            {
              spec: `http://127.0.0.1:${port}/oa1`,
            },
          ],
          dbCover: true,
          backOpenApi: 0.01,
          db: {
            oa: {
              a: `0`,
            },
            oa1: {
              a: `0`,
            },
          },
        }
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa`, {a: `1`})
        await http.patch(`http://127.0.0.1:${arg.port}/oa1`, {a: `1`})
        await util.sleep()
        await http.patch(`http://127.0.0.1:${arg.port}/oa1`, {a: `2`})
        await util.sleep()
        const oaPath = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa`
        const oaPath1 = `${arg[`--cwd`]}/httpData/openApiHistory/http_127.0.0.1_${arg.port}_oa1`
        const list = shelljs.ls(oaPath1)
        return (
          shelljs.ls(oaPath).length === 2
          && list.length === 3
          && require(`${oaPath1}/${list[0]}`).data.a === `0`
          && require(`${oaPath1}/${list[2]}`).data.a === `2`
        )
      },
    }))
  })
})