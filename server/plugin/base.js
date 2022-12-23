module.exports = {
  /**
   * 插件的唯一标识
   * string, 必填
   */
  key: `base`,
  /**
   * 支持的宿主版本
   * array[string], 必填
   * 若版本不被支持时会给予警告
   */
  hostVersion: [],
  /**
   * 插件入口
   * function, 需要返回一个对象
   * 在这里获取用户转给插件的配置
   * 约定: 当用户传入 false 时不启用插件
   */
  async main({hostInfo, pluginConfig, config, util} = {}){
    return {
      /**
       * 宿主应用配置项完成
       * 例如创建了程序所需目录结构
       * 可以在这里创建插件所需目录结构
       */
      async hostFileCreated(){},
      /**
       * server listen 调用成功
       * info
       */
      async serverCreated(info){},
      /**
       * app 初始化完成, 在这个时候
       * - 只有 ws 和 http/https 支持
       * - 没有 bodyParse urlencodedParser logger 也没有宿主的 proxy db api 各种功能
       * - 当调用 next 方法之后才进入其他中间件
       * 可以在这里注册一个优先级较高的中间件, 例如请求拦截
       */
      async useCreated(app){},
      /**
       * app 中的解析器初始化完成, 在这个时候
       * - 只有 bodyParser urlencodedParser logger
       * - 没有宿主的 proxy db api 各种功能
       * - 当调用 next 方法之后才进入其他中间件
       * 在这里的中间件可以获取 req.body 数据, 到这里的请求会被 log 记录
       */
      async useParserCreated(app){},
      /**
       * config.api 已解析完成
       * - 它不再是一个函数, 而是一个对象
       * - side 方法还未展示
       * 可以在这里使用它, 例如注入新的接口
       */
      async apiParsed(api, apiUtil){},
      /**
       * config.api 对象中的每个接口已解析完成为一个 api 详情列表
       * - side 方法已被展开
       * - method route action 等信息已被展开
       * 可以在这里使用它, 例如生成接口文档
       * @param {*} serverRouterList 
       */
      async apiListParsed(serverRouterList = []) {},
    }
  },
}