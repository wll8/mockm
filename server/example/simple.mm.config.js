/**
 * @see: https://www.hongqiye.com/doc/mockm/config/option.html
 * @type {import('mockm/@types/config').Config}
 */
module.exports = util => {
  return  {
    // 代理后端的接口, 如果没有可以不填
    proxy: {
      // 根结点
      '/': `https://httpbin.org/`,
      
      // 接口转发
      '/get': `https://www.httpbin.org/ip`,
      
      // 修改响应体中的 json
      '/anything/mid': [`headers.Host`, `xxxxxx`],

      // 使用函数修改响应体
      '/anything/proxy/fn':[({req, json}) => {
        return (json.method + req.method).toLowerCase() // getget
      }],
    },

    // 自己编写的接口
    api: {
      // 当为基本数据类型时, 直接返回数据, 这个接口返回 {"msg":"ok"}
      '/api/1': {msg: `ok`},

      // 也可以像 express 一样返回数据
      '/api/2' (req, res) {
        res.send({msg: `ok`})
      },

      // 一个只能使用 post 方法访问的接口
      'post /api/3': {msg: `ok`},

      // 一个 websocket 接口, 会发送收到的消息
      'ws /api/4' (ws, req) {
        ws.on(`message`, (msg) => ws.send(msg))
      },

      // 一个下载文件的接口
      '/file' (req, res) {
        res.download(__filename)
      },

      // 获取动态的接口路径的参数 code
      '/status/:code' (req, res) {
        res.json({statusCode: req.params.code})
      },
    },
    
    // 自动生成 Restful API
    dbCover: true,
    db: util.libObj.mockjs.mock({
      'books|40-60': [
        {
          'id|+1': 1,
          user: /\d\d/,
          view: /\d\d\d\d/,
          'type|1': [`js`, `css`, `html`],
          'discount|1': [`0`, `1`],
          author: {
            'name|1': [`张三`, `李四`],
          },
          title: `@ctitle`,
        },
      ],
    }),
  }
}