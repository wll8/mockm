const util = require('./util.js')
const http = util.http

describe('config.db', () => {
  it(`从 config.api 中操作 db`, async () => {
    util.ok(await util.runMockm({
      mockm: () => ({
        api: {
          'get /test/db' (req, res) {
            const db = global.config._db // 通过 _.chain({}) 包装的对象
            const data = db.getState() // 整个 json 数据
            data.user[0].t1 = 111
            db.write() // 调用 write 存储变更
            data.user[0].t2 = 222
            db.get(`user`).set(`[0].t3`, 333).value() // 可以使用 lodash 链式操作, 操作完成后需要调用 .value()
            res.json(data.user[0])
          },
        },
        db: {
          user: [
            {
              name: `张三`,
            },
          ],
        },
      }),
      okFn: async ({arg, str}) => {
        const apiUser = (await http.get(`http://127.0.0.1:${arg.port}/test/db`)).data
        const dbUser = require(`${arg[`--cwd`]}/httpData/db.json`).user[0]
        return (
          apiUser.t1 === 111
          && apiUser.t2 === 222
          && apiUser.t3 === 333
        ) && (
          dbUser.t1 === 111
          && dbUser.t2 === undefined
          && dbUser.t3 === undefined
        )
      },
    }))
  })
  it(`拦截 config.db 生成的接口`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          api: {
            'get /books/:id' (req, res, next) { // 拦截 config.db
              res.json(req.params)
            },
            'patch /books/:id' (req, res, next) { // 拦截 config.db
              req.body.a = `111` // 修改用户传入的数据
              next()
              res.mm.resHandleJsonApi = async (arg) => {
                arg.data.a = `222` // 修改响应, 不会存储到 db.json
                return arg.resHandleJsonApi(arg)
              }
            },
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
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/books/111`)).data
        const res2 = (await http.patch(`http://127.0.0.1:${arg.port}/books/1`, {a: 1})).data
        return res1.id === `111` && res2.data.a === `222`
      },
    }))
  })
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
  it(`嵌套`, async () => {
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          route: {
            '/db/api/*': `/$1`,
          },
          db: util.libObj.mockjs.mock({
            "posts": [
              { "id": 1, "title": "json-server", "author": "typicode" }
            ],
            "comments": [
              { "id": 1, "body": "some comment", "postId": 1 }
            ],
          }),
        }
      },
      okFn: async ({arg, str}) => {
        const res1 = (await http.get(`http://127.0.0.1:${arg.port}/db/api/posts/1`)).data.data
        const res2 = (await http.get(`http://127.0.0.1:${arg.port}/posts/1`)).data.data
        const res3 = (await http.get(`http://127.0.0.1:${arg.port}/db/api/posts/1/comments`)).data.data[0]
        return (
          res1.id === res2.id
          && res1.id === res3.postId
        )
      },
    }))
  })
})