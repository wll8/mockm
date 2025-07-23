const api = require(`./api/index.js`)
const { wrapApiData } = require(`./util.js`)

/**
 * 配置说明请参考文档: 
 * https://wll8.github.io/mockm/config/option.html
 * @type {import('mockm/@types/config').Config}
 */
module.exports = util => {
  return {
    guard: false,
    port: 9000,
    testPort: 9005,
    replayPort: 9001,
    watch: [`./api/`],
    proxy: {
      '/': `http://www.httpbin.org/`, // 后端接口主域
      '/anything/intercept': [`origin`, `127.0.0.1`], // 修改接口返回的数据
    },
    api: {
      // 在其他文件里的 api
      ...api(util).api,
      
      // 当为基本数据类型时, 直接返回数据, 这个接口返回 {"msg":"ok"}
      '/api/1': {msg: `ok`},

      // 也可以像 express 一样返回数据
      '/api/2' (req, res) {
        res.send({msg: `ok`})
      },

      // 一个只能使用 post 方法访问的接口
      'post /api/3': {msg: `ok`},

      // // 一个 websocket 接口, 会发送收到的消息
      // 'ws /api/4' (ws, req) {
      //   ws.on('message', (msg) => ws.send(msg))
      // },

      // 一个下载文件的接口
      '/file' (req, res) {
        res.download(__filename, `mm.config.js`)
      },

      // 获取动态的接口路径的参数 code
      '/status/:code' (req, res) {
        res.json({statusCode: req.params.code})
      },

      // 使用 mockjs 生成数据
      '/user' (req, res) {
        const json = util.libObj.mockjs.mock({
          'data|3-7': [{
            userId: `@id`,
            userName: `@cname`,
          }],
        })
        res.json(json)
      },
    },
    static: [],
    resHandleReplay: ({req, res}) => wrapApiData({code: 200, data: {}}),
    resHandleJsonApi: ({req, res: {statusCode: code}, data}) => wrapApiData({code, data}),
  }
}
