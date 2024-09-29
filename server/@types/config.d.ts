import { AxiosStatic as axios, Method } from 'axios'
import { BetterMock as mockjs } from '@wll8/better-mock'
import * as http from 'http'
import { Request, Response, Application } from 'express'
import { Server } from 'node:net'
import { Options as connectHistoryApiFallbackOptions } from 'connect-history-api-fallback'
import { OptionsJson, OptionsUrlencoded } from 'body-parser'
import WebSocket from 'ws'

export {
  WsUrl,
  UseUrl,
  HttpUrl,
  Json,
  Config,
  Request,
  Response,
  Api,
  ConfigApiFnArg,
  libObj,
  ConfigFnArg,
  ConfigObj,
  WrapApiData,
  Static,
}

type WsUrl = `ws${string}`
type UseUrl = `use${string}`
type HttpUrl = `/${string}` | `*${string}` | `${Method}${string}`
type Json = number | string | object | undefined | null
type Config = ConfigObj | ((util: ConfigFnArg) => ConfigObj)
type Api = {
  [key: WsUrl]: Json | ((ws: WebSocket, req: Request) => void),
  [key: HttpUrl | UseUrl]: Json | ((req: Request, res: Response, next?: () => void) => void),
} | ((arg: ConfigApiFnArg) => Api)

interface ConfigApiFnArg {
  /**
   * 工具函数
   */
  run: {
    /**
     * 运行 curl 命令, 并返回结果, 会把响应头绑定到自定义 api 上.
     */
    curl: ((arg: {req: Request, res: Response, cmd: string}) => void),
    /**
     * 运行 fetch 方法并返回结果, 会把响应头绑定到自定义 api 上, 它是对 node-fetch 的一个封装.
     */
    fetch: ((arg: {req: Request, res: Response, fetchRes: Promise<any>}) => void),
  },
}

interface libObj {
  mockjs: mockjs,
  axios: axios,
  mime: any,
}

interface ConfigFnArg {
  server: {
    /**
     * express 实例
     */
    app: Application,
  },
  toolObj: any,
  /**
   * 第三方库
   */
  libObj: libObj,
  business: any,
  /**
   * 用于扩展 api 的函数
   */
  side: any,
  /**
   * 内置插件
   */
  plugin: any,
}

interface configHttps {
  /**
   * 私钥文件地址, 例如 *.key
   */
  key: String,

  /**
   * 公钥文件地址, 例如 *.crt, *.cer
   */
  cert: String,
  
  /**
   * 是否重定向到 https
   * @default true
   */
  redirect: Boolean,
  
  /**
   * 配置 https 使用的端口, 默认同 config.port
   */
  port: number | string,
  /**
   * 配置 https 使用的端口, 默认同 config.testPort
   */
  testPort: number | string,
  /**
   * 配置 https 使用的端口, 默认同 config.replayPort
   */
  replayPort: number | string,
}

interface ConfigObj {
  /**
   * 用于快速屏蔽是所有自定义的 api, 直接通往服务器.
   * @default
   * false
   */
  disable: boolean,

  /**
   * 想绑定到 mm 程序的 IP, 会自动添加到 调试链接 中.
   * @default
   * // 内网网卡第一个 IP
   */
  osIp: string,

  /**
   * 服务端口, 用于接口调用.
   * @default
   * 9000
   */
  port: number | string,

  /**
   * 调试端口, 用于生成测试页面服务
   * @default
   * 9005
   */
  testPort: number | string,

  /**
   * 重放端口, 用于使用服务端口产生的缓存数据.
   * @default
   * 9001
   */
  replayPort: number | string,

  /**
   * 记录中不存在所需请求时, 是否转发请求到 proxy.
   * @default
   * true
   */
  replayProxy: boolean,

  /**
   * 自定义请求重放时的逻辑.
   * @default
   *
   */
  replayProxyFind: ((arg: any) => void),

  /**
   * 是否通过修改 host 文件来实现代码 `0侵入`.
   * @default
   * false
   */
  hostMode: boolean,

  /**
   * 是否自动从上一个 http 请求获取数据到重放和调试时的 http 请求上
   * @default
   * true
   */
  updateToken: boolean | string | string[] | object,

  /**
   * 是否在 header 中添加调试 api 地址.
   * @default
   * true
   */
  apiInHeader: boolean | string,

  /**
   * 代理到远程的目标域名，为对象时每个键是分别对应一个要自定义代理的路由.
   * @default
   * `http://www.httpbin.org/`
   */
  proxy: string | {
    [key: string]: string | {
      /**
       * 拦截请求
       */
      onProxyReq(proxyReq: http.ClientRequest, req: Request, res: Response): void,
      /**
       * 在进行代理之前添加中间件
       */
      mid(req: Request, res: Response, next: () => void): void,
      /**
       * 拦截响应
       */
      onProxyRes(proxyRes: http.IncomingMessage, req: Request, res: Response): void,
    }
  },

  /**
   * 是否启用外网映射.
   * @default
   * false
   */
  remote: boolean,

  /**
   * 外网映射程序所使用的 authtoken, 以数组形式提供多个 token, 分别用于 port/testPort/replayPort 服务的通道  
   * 目前 ngrok 已注册的免费用户仅可使用 1 通道, 如果你的 tokenA 支持 3 个通道, 可以这样重复使用: [tokenA, tokenA, tokenA]
   * @default
   * []
   */
  remoteToken: string | string[],

  /**
   * 关联的 openApi 数据文件, 支持 json 格式, 会自动根据当前的 api 匹配对应的 swagger 文档. 支持多个 api 源.
   * @default
   * `http://httpbin.org/spec.json`
   */
  openApi: string | string[] | {
    [key: string]: string,
  },

  /**
   * 是否允许通过跨域.
   * @default
   * true
   */
  cors: boolean,

  /**
   * http 请求数据保存目录.
   * @default
   * `${os.homedir()}/.mockm/${configPathByName}/httpData/`
   */
  dataDir: string,

  /**
   * json 数据生成的保存位置.
   * @default
   * `${config.dataDir}/db.json`
   */
  dbJsonPath: string,

  /**
   * 是否在重载时重新根据 config.db 生成新的数据文件.
   * @default
   * false
   */
  dbCover: boolean,

  /**
   * 供 [json-server](https://github.com/typicode/json-server) 使用的 json 数据.
   * @default
   * {}
   */
  db: Json | (() => Json),

  /**
   * 路由映射, 作用于 config.api 及 config.db 产生的 api
   * - 参考: [custom-routes](https://github.com/typicode/json-server#add-custom-routes)
   * @default
   *
   */
  route: {
    [key: string]: string,
  },

  /**
   * 从 web 页面创建的接口数据, 会与 config.api 合并, config.api 具有优先权
   * @default
   * ./webApi.json
   */
  apiWeb: string,

  /**
   * 统一包装从 web 页面创建的接口数据.
   * @default
   */
  apiWebWrap: boolean | ((arg: WrapApiData) => any),

  /**
   * 自建 api.
   * @default
   *
   */
  api: Api,

  /**
   * 处理重放请求出错时会进入这个方法.
   * @default
   */
  resHandleReplay: ((arg: {req: Request, res: Response}) => void),

  /**
   * 由 config.db 生成的接口的最后一个拦截器, 可以用来构建项目所需的数据结构.
   * @default
   */
  resHandleJsonApi: ((arg: {req: Request, res: Response, data: any}) => void),

  /**
   * 指定一些目录或文件路径, 当它们被修改时自动重载服务. 支持绝对路径和相对于配置文件的路径.
   * @default
   *
   */
  watch: string | string[],

  /**
   * 启动时清理冗余的请求记录.
   * @default
   * false
   */
  clearHistory: boolean | {
    /**
     * 从多少分钟前的历史中选择要清除的项目
     * @default
     * 60 * 24 * 3
     */
    retentionTime: number,
    /**
     * 相同内容保留条数, 正数时保留新记录, 负数时保留旧记录
     * @default
     * 1
     */
    num : number,
  } | ((arg: object[]) => string[]),

  /**
   * 当程序异常退出时, 是否自动重启.
   * @default
   * false
   */
  guard: boolean,

  /**
   * 每隔多少分钟检测 openApi 更新记录, 保存到 `${config.dataDir}/openApiHistory` 目录中.
   * @default
   * 10
   */
  backOpenApi: boolean | number,

  /**
   * 配置静态文件访问地址, 优先级大于 proxy, 支持 history 模式.
   * @default
   */
  static: string | Static | Static[],

  /**
   * 哪些请求不记录
   * @default
   * false
   */
  disableRecord: boolean | string | string[] | DisableRecord | DisableRecord[],

  /**
   * bodyParser 相关的中间件配置
   * @default
   */
  bodyParser: {
    json?: OptionsJson,
    urlencoded?: OptionsUrlencoded,
  },

  /**
   * https 证书配置
   * @default {}
   */
  https: configHttps,
  
  /**
   * 注册新插件, 或向内置插件传递参数, 当插件对象为字符串时表示内置插件
   * - 示例: `[p1, [p2, {}]]` -- 注册 p1 和 p2 两个插件, 并向 p2 传递选项
   * - 示例: `['validate']` -- 启用内置插件 validate
   * - 示例: `[['validate', {}]]` -- 启用内置插件并变更它的选项
   * - 示例: `[['validate', false]]` -- 禁用内置插件 validate
   */
  plugin: Plugin[] | [Plugin, any][] | [string, any][],
}

interface WrapApiData {
  /**
   * 原始数据
   * @default
   */
  data?: Json,

  /**
   * http 状态码
   * @default
   * 200
   */
  code?: number,
}

interface Static {
  /**
   * 浏览器访问的 url 前缀
   * @default
   * /
   */
  path: string,

  /**
   * 本地文件的位置. 可以是相对于运行目录的路径, 或绝对路径
   * @default
   */
  fileDir: string,

  /**
   * 配置访问模式
   * @default
   * hash
   */
  mode?: `history` | `hash`,

  /**
   * 是否显示内容列表
   * @default
   * false
   */
  list?: boolean,

  /**
   * 模式的更多配置
   * @default
   */
  option?: connectHistoryApiFallbackOptions,
}

interface DisableRecord {
  /**
   * 请求地址, 将被转换为正则
   */
  path: string,

  /**
   * 请求方法, 不指定时为匹配所有
   */
  method: Method,

  /**
   * 仅记录后 n 条, 0 表示不记录
   * @default
   * 0
   */
  num: number,
}

interface Plugin {
  /**
   * 插件的唯一标识
   */
  key: string,

  /**
   * 支持的宿主版本
   * 若版本不被支持时会给予警告
   */
  hostVersion: string[],

  /**
   * 插件入口
   * function, 需要返回一个对象
   * 在这里获取用户转给插件的配置
   */
  main: Promise<{}>,
}
