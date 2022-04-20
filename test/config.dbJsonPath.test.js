const util = require('./util.js')

describe('config.dbJsonPath', () => {
  it(`dbJsonPath`, async () => {
    util.ok(await util.runMockm({
      okFn: async ({arg, str}) => {
        return util.hasFile(`${arg[`--cwd`]}/httpData/db.json`)
      },
    }))
  })
})