const util = require('./util.js')
const http = util.http

describe('config.bodyParser', () => {
  it(`1kb`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        bodyParser: {
          json: {
            limit: `1kb`
          },
        },
        api: {
          '/post' (req, res, next) {
            res.json(`ok`)
          },
        },
      }),
      okFn: async ({arg, str}) => {
        const size2e3 = await new Promise((resolve) => {
          http.post(`http://127.0.0.1:${arg.port}/post`, {
            str: `x`.padEnd(2e3, `x`)
          }).then(() => resolve(true)).catch(() => resolve(false))
        })
        const size1e3 = await new Promise((resolve) => {
          http.post(`http://127.0.0.1:${arg.port}/post`, {
            str: `x`.padEnd(1e3, `x`)
          }).then(() => resolve(true)).catch(() => resolve(false))
        })
        return (
          size2e3 === false &&
          size1e3 === true
        )
      },
    }))
  })
})
