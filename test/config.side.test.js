const util = require('./util.js')
const http = util.http

describe('config.side', () => {
  it(`alias config.api 路由别名`, async () => {
    util.ok(await util.runMockm({
      mockm: ({side}) => ({
        api: {
          'use /use/test': side({
            alias: [`use /use/alias1/test`, `use /use/alias2/test`],
            action (req, res, next) {
              res.setHeader(`use1`, `111`)
              next()
            },
          }),
          async 'use /use/test2' (req, res, next) {
            res.setHeader(`use2`, `222`)
            next()
          },
          'get /use/test': side({
            alias: [`get /use/alias1/test`, `post /use/alias2/test`],
            action: `test`,
          }),
          'get /use/test2': `test2`,
        },
      }),
      okFn: async ({arg, str}) => {
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/use/test`))
        const alias1 = (await http.get(`http://127.0.0.1:${arg.port}/use/alias1/test`))
        const alias2 = (await http.post(`http://127.0.0.1:${arg.port}/use/alias2/test`))
        const res2 = (await http.get(`http://127.0.0.1:${arg.port}/use/test2`))
        return (
          (res1.headers.use1 === `111` && res1.data === `test`)
          && (alias1.headers.use1 === `111` && alias1.data === `test`)
          && (alias2.headers.use1 === `111` && alias2.data === `test`)
          && (res2.headers.use2 === `222` && res2.data === `test2`)
        )
      },
    }))
  })
})