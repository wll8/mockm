const util = require('./util.js')
const http = util.http

describe('config.static', () => {
  it(`显示文件列表 list:true`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        static: [
          {
            fileDir: `./`,
            path: `/fs/`,
            list: true,
          },
        ],
      }),
      okFn: async ({arg, str}) => {
        const html = (await http.get(`http://127.0.0.1:${arg.port}/fs/`)).data
        const json = (await http.get(`http://127.0.0.1:${arg.port}/fs/httpData/store.json`)).data
        return String(html).includes(`</div>`) && json.note
      },
    }))
  })
  it(`禁用文件列表 list:false`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        static: [
          {
            fileDir: `./`,
            path: `/fs/`,
          },
        ],
      }),
      okFn: async ({arg, str}) => {
        const html = (await http.get(`http://127.0.0.1:${arg.port}/fs/`).catch(err => err))
        const json = (await http.get(`http://127.0.0.1:${arg.port}/fs/httpData/store.json`)).data
        return String(html).includes(`</div>`) === false && json.note
      },
    }))
  })
  it(`指定多个文件目录`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        static: [
          {
            fileDir: `./`,
            path: `/root/`,
            list: true,
          },
          {
            fileDir: `./httpData/`,
            path: `/data/`,
          },
        ],
      }),
      okFn: async ({arg, str}) => {
        const html = (await http.get(`http://127.0.0.1:${arg.port}/root/`)).data
        const json = (await http.get(`http://127.0.0.1:${arg.port}/data/store.json`)).data
        return String(html).includes(`</div>`) && json.note
      },
    }))
  })
})