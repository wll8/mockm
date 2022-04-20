const util = require('./util.js')
const http = util.http

describe('config.updateToken', () => {
  it(`boolean true`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        updateToken: true,
        api: {
          '* /test/:pathArg' (req, res, next) {
            res.json({
              method: req.method,
              params: req.params,
              query: req.query,
              headers: req.headers,
              body: req.body,
            })
          },
        },
      }),
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
  it(`boolean false`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        updateToken: false,
        api: {
          '* /test/:pathArg' (req, res, next) {
            res.json({
              method: req.method,
              params: req.params,
              query: req.query,
              headers: req.headers,
              body: req.body,
            })
          },
        },
      }),
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
      mockm: () => ({
        updateToken: `auth`,
        api: {
          '* /test/:pathArg' (req, res, next) {
            res.json({
              method: req.method,
              params: req.params,
              query: req.query,
              headers: req.headers,
              body: req.body,
            })
          },
        },
      }),
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
