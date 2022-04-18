const util = require('./util.js')

describe('config.dataDir', () => {
  it(`httpData`, async () => {
    util.ok(await util.runMockm({
      okFn: async ({arg, str}) => {
        return util.hasFile(`${arg[`--cwd`]}/httpData`)
      },
    }))
  })
})
