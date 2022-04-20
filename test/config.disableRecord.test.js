const util = require('./util.js')
const http = util.http

describe('config.disableRecord', () => {
  it(`默认不禁用 boolean/false`, async () => {
    util.ok(await util.runMockm({
      okFn: async ({arg, str}) => {
        const t1 = (await http({
          method: `get`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t2 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        return t1 && t2
      },
    }))
  })
  it(`不记录所有请求 boolean/true`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        disableRecord: true,
      }),
      okFn: async ({arg, str}) => {
        const t1 = (await http({
          method: `get`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t2 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        return t1 === undefined && t2 === undefined
      },
    }))
  })
  it(`不记录匹配的请求 string, 不限定 method`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        disableRecord: `^/anything/disableRecord/$`,
      }),
      okFn: async ({arg, str}) => {
        const t1 = (await http({
          method: `get`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t2 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t3 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/record/`,
        })).headers[`x-test-api`]
        return t1 === undefined && t2 === undefined && t3
      },
    }))
  })
  it.skip(`不记录匹配的请求 object, 不限定 method`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        disableRecord: {
          path: `^/anything/disableRecord/$`
        },
      }),
      okFn: async ({arg, str}) => {
        const t1 = (await http({
          method: `get`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t2 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t3 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/record/`,
        })).headers[`x-test-api`]
        return t1 === undefined && t2 === undefined && t3
      },
    }))
  })
  it.skip(`不记录匹配的请求 object, 限定 method`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        disableRecord: {
          path: `^/anything/disableRecord/$`,
          method: `get`,
        },
      }),
      okFn: async ({arg, str}) => {
        const t1 = (await http({
          method: `get`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t2 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/`,
        })).headers[`x-test-api`]
        const t3 = (await http({
          method: `post`,
          url: `http://127.0.0.1:${arg.port}/anything/disableRecord/record/`,
        })).headers[`x-test-api`]
        return t1 === undefined && t2 && t3
      },
    }))
  })
})
