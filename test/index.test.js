const util = require('./util.js')
const http = util.http
const getPort = require(`get-port`)

describe('基本功能', () => {
  describe('显示版本号', () => {
    it(`获取版本号`, async () => {
      const version = require(util.pkgPath('./package.json')).version
      util.ok(await util.runMockm({
        runOk: false,
        okFn: ({arg, str}) => {
          return str.match(version)
        }
      }))
    })
  })

  describe('服务启动', () => {
    it(`port`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.port}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`replayPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.replayPort}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
    it(`testPort`, async () => {
      util.ok(await util.runMockm(
        async ({arg, str}) => {
          const httpData = (await http.get(`http://127.0.0.1:${arg.testPort}/`)).data || ``
          return httpData.match(`html`)
        }
      ))
    })
  })

})
describe.skip('性能', () => {
  describe('接口服务', () => {
    it(`存在较多历史时造成的影响情况`, async () => {
      util.ok(await util.runMockm({
        timeout: 1e9,
        mockm: () => ({
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
          let repeat = 10 // 共测试多少次
          let length = 200 // 每次并发数
          let headersSize = 10e3 // header 体积
          let index = 0
          for(let repeatIndex=0; repeatIndex<repeat; repeatIndex++){
            console.time()
            await Promise.all(Array.from({length}).map((item, lengthIndex) => {
              index = index + 1
              return http({
                method: `post`,
                url: `http://127.0.0.1:${arg.port}/test/${index}`,
                headers: {
                  repeatIndex,
                  lengthIndex,
                  index,
                  xxx: `x`.repeat(headersSize),
                }, // 请求头
                data: {
                  index,
                  data: Number(Math.random()).toFixed(50).repeat(2e3),
                },
              })
            }))
            console.timeEnd()
          }
          return true
          /**
          repeat = 10; length = 200; headersSize = 10e3;
          优化前
          7.445s => 44.646s
          8.648s => 41.989s
          
          优化后
          9.493s => 11.239s
          9.259s => 11.760s
           */
        },
      }))
    })
  })
})
describe('命令行', () => {
  it(`配置文件 故意找不到配置文件`, async () => {
    util.ok(await util.runMockm({
      runOk: false,
      cli: {
        '--config': util.uuid(`-`),
      },
      okFn: async ({arg, str}) => {
        return str.match(`Error: Cannot find module`) 
      }
    }))
  })
  it(`配置端口号`, async () => {
    util.ok(await util.runMockm(async ({arg, str}) => {
      return (
        str.match(`:${arg.port}/`) 
        && str.match(`:${arg.testPort}/`) 
      )
    }))
  })
  it(`--cwd`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        apiWeb: `./apiWeb.json`,
      }),
      okFn: async ({arg, str}) => {
        return (
          util.hasFile(`${arg[`--cwd`]}/httpData`)
          && util.hasFile(`${arg[`--cwd`]}/apiWeb.json`)
        )
      },
    }))
  })
  it(`--template`, async () => {
    util.ok(await util.runMockm({
      cli: {
        '--template': true,
      },
      okFn: async ({arg, str}) => {
        await util.sleep()
        return (
          util.hasFile(`${arg[`--cwd`]}/mm/mm.config.js`)
          && util.hasFile(`${arg[`--cwd`]}/mm/httpData`)
          && util.hasFile(`${arg[`--cwd`]}/mm/apiWeb.json`)
        )
      }
    }))
  })
  it(`--version`, async function () {
    util.ok(await util.runMockm({
      runOk: false,
      cli: {
        '--version': true,
      },
      okFn: async ({arg, str}) => {
        const version = require(util.pkgPath('./package.json')).version
        return version === str.trim()
      }
    }))
  })
  it(`--node-options`, async function () {
    util.ok(await util.runMockm({
      runOk: false,
      cli: {
        '--node-options': `--inspect-brk="${await getPort()}"`,
      },
      okFn: async ({arg, str}) => {
        return str.match(`ws://`)
      }
    }))
  })
})