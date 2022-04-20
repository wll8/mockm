const util = require('./util.js')
const http = util.http

describe('config.db', () => {
  it(`获取列表`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          db: util.libObj.mockjs.mock({
            'books|40-60': [
              {
                title: `@ctitle`,
              },
            ],
          }),
        }
      },
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/books`)).data
        return httpData.data.length > 1
      },
    }))
  })
  it(`路由重定向 config.route`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          route: {
            '/db/api/*': `/$1`,
          },
          db: util.libObj.mockjs.mock({
            'books|40-60': [
              {
                title: `@ctitle`,
              },
            ],
          }),
        }
      },
      okFn: async ({arg, str}) => {
        const httpData = (await http.get(`http://127.0.0.1:${arg.port}/db/api/books`)).data
        return httpData.data.length > 1
      },
    }))
  })
  it(`创建数据`, async () => {
    const title = util.uuid()
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          route: {
            '/db/api/*': `/$1`,
          },
          db: util.libObj.mockjs.mock({
            'books|40-60': [
              {
                'id|+1': 1,
                title: `@ctitle`,
              },
            ],
          }),
        }
      },
      okFn: async ({arg, str}) => {
        const res1 = (await http.post(`http://127.0.0.1:${arg.port}/db/api/books`, {title})).data
        const res2 = (await http.post(`http://127.0.0.1:${arg.port}/books`, {title})).data
        return (
          res1.data.title === title 
          && res2.data.title === title
        )
      },
    }))
  })
})