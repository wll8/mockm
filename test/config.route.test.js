const util = require('./util.js')
const http = util.http

describe('config.route', () => {
  it(`config.db 创建数据`, async () => {
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
  it(`config.db 嵌套`, async () => {
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
  it(`api + db + static + proxy`, async () => {
    const title = util.uuid()
    util.ok(await util.runMockm({
      mockm: (util) => {
        return {
          route: {
            '/db/api/*': `/$1`,
          },
          api: {
            '/get'(req, res) {
              res.json(`ok`)
            },
          },
          db: util.libObj.mockjs.mock({
            'books|40-60': [
              {
                'id|+1': 1,
                title: `@ctitle`,
              },
            ],
            'posts': [
              { "id": 1, "title": "json-server", "author": "typicode" }
            ],
            'comments': [
              { "id": 1, "body": "some comment", "postId": 1 }
            ],
          }),
          static: [
            {
              fileDir: `./`,
              path: `/fs/`,
              list: true,
            },
          ],
        }
      },
      okFn: async ({arg, str}) => {
        const res1 = (await http.post(`http://127.0.0.1:${arg.port}/db/api/books`, {title})).data
        const res2 = (await http.post(`http://127.0.0.1:${arg.port}/books`, {title})).data
        const res3 = (await http.post(`http://127.0.0.1:${arg.port}/db/api/get`)).data
        const res4 = (await http.post(`http://127.0.0.1:${arg.port}/get`)).data
        const res5 = (await http.get(`http://127.0.0.1:${arg.port}/db/api/posts/1`)).data.data
        const res6 = (await http.get(`http://127.0.0.1:${arg.port}/db/api/posts/1/comments`)).data.data[0]
        const html = (await http.get(`http://127.0.0.1:${arg.port}/db/api/fs/`)).data
        const json = (await http.get(`http://127.0.0.1:${arg.port}/db/api/fs/httpData/store.json`)).data
        const { origin } = (await http.get(`http://127.0.0.1:${arg.port}/db/api/ip`)).data
        return (
          res1.data.title === title 
          && res2.data.title === title
          && res3 === `ok`
          && res4 === `ok`
          && res5.id === res6.postId
          && String(html).includes(`</div>`)
          && json.note
          && origin
        )
      },
    }))
  })
})