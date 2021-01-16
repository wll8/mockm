function tool() { // 与业务没有相关性, 可以脱离业务使用的工具函数
  function npm() { // npm 相关
    /**
     * 获取本地 package 版本号
     * @param {string} name packageName
     * @param {object} param1 选项
     * @param {array} param1.packagePath 指定路径
     */
    function getLocalVersion(name, {packagePath} = {}) { // 从本地获取版本号
      const hasFile = tool().file.hasFile
      packagePath = packagePath || require.main.paths.concat(`${require(`path`).parse(process.execPath).dir}/node_modules`) // 全局安装目录
        .find(path => hasFile(`${path}/${name}/package.json`))
      if(packagePath) {
        return require(`${packagePath}/${name}/package.json`).version // 从 package 中获取版本
      }
    }

    /**
     * 从 npmjs 中获取版本号
     * @param {*} name packageName 名称
     */
    function getServerVersion(name) { // 从 npmjs 中获取版本号
      return new Promise((resolve, reject) => {
        const https = require('https');
        https.get(`https://registry.npmjs.org/-/package/${name}/dist-tags`, res => {
            let data = ''
            res.on('data', chunk => {
              data += chunk
            })
            res.on('end', () => {
              const latest = JSON.parse(data || `{}`).latest // 获取最新版本
              resolve(latest)
            })
        }).on(`error`, (err) => {
          reject(err.message)
        })
      })
    }

    /**
    * 从 npmjs 检查依赖版本
    * @param {*} name 要检查更新的依赖名称
    * @param {object} param1 参数
    * @param {string} param1.version 指定版本
    * @param {array} param1.packagePath 指定路径
    */
    async function checkUpdate(name, {version, packagePath} = {}) {
      const getLocalVersionRes = version || getLocalVersion(name, {packagePath})
      const getServerVersionRes = await getServerVersion(name).catch(err => console.log(err))
      return {
        local: getLocalVersionRes,
        server: getServerVersionRes,
      }
    }

    return {
      getLocalVersion,
      getServerVersion,
      checkUpdate,
    }
  }

  function control() { // 流程控制
    /**
    * 以 Promise 方式等待条件成立
    * @param {*} condition 条件函数, 返回 true 时才陈立
    * @param {*} ms 检测条件的实时间隔毫秒
    * @param {*} timeout 超时
    */
    function awaitTrue({
      condition,
      ms = 250,
      timeout = 5e3,
    }) {
      return new Promise(async (resolve, reject) => {
        let timeStart = Date.now()
        let res = await condition()
        while (res !== true) {
          res = await condition()
          if(((Date.now() - timeStart) > timeout)) { // 超时
            reject(false)
          }
          await sleep(ms)
        }
        resolve(res)
      })
    }

    /**
     * 异步等待 sleep
     * @param {*} ms 毫秒
     */
    function sleep(ms = 1e3) { // 异步 sleep
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    return {
      awaitTrue,
      sleep,
    }

  }

  function cache() { // 缓存处理程序
    function delRequireCache(filePath) {
      delete require.cache[require.resolve(filePath)]
    }
    return {
      delRequireCache,
    }
  }

  function hasPackage(name, cfg = {}) { // 是还存在某个包
    const path = require(`path`)
    const mainPath = cfg.mainPath || path.join(__dirname, '../') // 主程序目录
    const packgePath =  `${mainPath}/node_modules/${name}`
    const hasPackge = tool().file.hasFile(packgePath)
    return hasPackge
  }

  function installPackage({cwd, env, packageName, version}) {
    // 注意: 修改为 npm 时某些依赖会无法安装, 需要使用 cnpm 成功率较高
    const installEr = {cnpm: `npm`}[packageName] || `cnpm`
    let {MOCKM_REGISTRY, NPM_CONFIG_REGISTRY} = process.env
    MOCKM_REGISTRY = MOCKM_REGISTRY || NPM_CONFIG_REGISTRY || `https://registry.npm.taobao.org/`
    return cli().spawn(
      `npx`, `${installEr} i ${packageName}@${version} --product --no-save --registry=${MOCKM_REGISTRY}`.split(/\s+/),
      {
        cwd,
        env: {
          NPM_CONFIG_REGISTRY: MOCKM_REGISTRY,
          ...process.env,
          ...env,
        }
      }
    )
  }

  function generate() { // 生成器
    /**
     * 如果某个依赖不存在, 则安装它
     * @param {*} packageName 依赖名称
     * @param {object} param1 配置
     * @param {string} param1.version 版本, 如果不填则从 packageJson.pluginDependencies 中获取
     * @param {boolean} param1.getRequire 是否安装完成后进行 require
     * @param {object} param1.env 安装时的环境变量
     * @param {string} param1.msg 依赖不存在时提示的消息
     */
    async function initPackge(packageName, {version, getRequire = true, env = {}, msg} = {}) {
      try {
        const path = require(`path`)
        const mainPath = path.join(__dirname, '../') // 主程序目录
        const packageJson =  require(`${mainPath}/package.json`)
        version = version || packageJson.pluginDependencies[packageName]
        const hasPackageRes = hasPackage(packageName)
        if(hasPackageRes === false) { // 如果 ngrok 不存在, 则安装它
          const cnpmVersion = npm().getLocalVersion(`cnpm`)
          if(cnpmVersion === undefined) { // 如果 cnpm 不存在则先安装 cnpm
            console.log(`正在初始化CNPM...`)
            await installPackage({cwd: mainPath, env, packageName: `cnpm`, version: `6.1.1` })
          }
          msg && console.log(msg)
          await installPackage({cwd: mainPath, env, packageName, version })
        }
        if(getRequire) {
          cache().delRequireCache(packageName)
          return require(packageName)
        }
      } catch (err) {
        console.log(`err`, err)
      }
    }

    function nextId() { // 获取全局自增 id
      global.id = (global.id || 0) + Date.now() + 1
      return global.id
    }
    return {
      initPackge,
      nextId,
    }
  }

  function hex() { // 进制转换
    function string10to62(number) { // 10 进制转 62 进制, 用来压缩数字长度
      const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split('')
      const radix = chars.length
      const arr = []
      let qutient = +number
      do {
        const mod = qutient % radix;
        qutient = (qutient - mod) / radix;
        arr.unshift(chars[mod]);
      } while (qutient);
      return arr.join('');
    }

    function string62to10(str) { // 62 进制转 10 进制
      str = String(str)
      const chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'
      const radix = chars.length
      const len = str.length
      let origin_number = 0
      let i = 0
      while (i < len) {
        origin_number += Math.pow(radix, i++) * chars.indexOf(str.charAt(len - i) || 0);
      }
      return origin_number;
    }

    return {
      string10to62,
      string62to10,
    }

  }

  function cli() { // 命令行相关处理程序
    /**
    * 自定义控制台颜色
    * https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    * nodejs 内置颜色: https://nodejs.org/api/util.html#util_foreground_colors
    */
    function colors () {
      const util = require('util')

      function colorize (color, text) {
        const codes = util.inspect.colors[color]
        return `\x1b[${codes[0]}m${text}\x1b[${codes[1]}m`
      }

      let returnValue = {}
      Object.keys(util.inspect.colors).forEach((color) => {
        returnValue[color] = (text) => colorize(color, text)
      })

      const colorTable = new Proxy(returnValue, {
        get (obj, prop) {
          // 在没有对应的具名颜色函数时, 返回空函数作为兼容处理
          const res = obj[prop] ? obj[prop] : (arg => arg)
          return res
        }
      })

      // 取消下行注释, 查看所有的颜色和名字:
      // Object.keys(returnValue).forEach((color) => console.log(returnValue[color](color)))
      return colorTable
    }

    /**
     * 以 Promise 方式运行 spawn
     * @param {*} cmd 主程序
     * @param {*} args 程序参数数组
     * @param {*} opts spawn 选项
     */
    function spawn (cmd, args, opts) {
      opts = { stdio: `inherit`, ...opts }
      opts.shell = opts.shell || process.platform === 'win32'
      return new Promise((resolve, reject) => {
        const cp = require('child_process')
        const child = cp.spawn(cmd, args, opts)
        let stdout = ''
        let stderr = ''
        child.stdout && child.stdout.on('data', d => { stdout += d })
        child.stderr && child.stderr.on('data', d => { stderr += d })
        child.on('error', reject)
        child.on('close', code => {
          resolve({code, stdout, stderr})
        })
      })
    }

    function parseArgv(arr) { // 解析命令行参数
      return (arr || process.argv.slice(2)).reduce((acc, arg) => {
        let [k, ...v] = arg.split('=')
        v = v.join(`=`) // 把带有 = 的值合并为字符串
        acc[k] = v === '' // 没有值时, 则表示为 true
          ? true
          : (
            /^(true|false)$/.test(v) // 转换指明的 true/false
            ? v === 'true'
            : (
              /[\d|.]+/.test(v)
              ? (isNaN(Number(v)) ? v : Number(v)) // 如果转换为数字失败, 则使用原始字符
              : v
            )
          )
        return acc
      }, {})
    }

    /**
     * 从 curl 命令中解析 request 库的 options 参数
     * @param {string} cmd // curl/bash 命令
     */
    async function getOptions(cmd) {
      const curlconverter = await tool().generate.initPackge(`curlconverter`)
      const requestStr = curlconverter.toNodeRequest(cmd)
      let optionStr = requestStr.match(/^var request = require[\s\S].*;([\s\S]*)^function callback([\s\S]*)/m)[1] // 只取出 options 相关的代码
      let options = {}
      try {
        const { NodeVM } = require(`vm2`)
        const vm = new NodeVM()
        options = vm.run(`${optionStr}\nmodule.exports = options`, `vm.js`) || ``
        // 避免 node v10.12.0 出现 options.uri is a required argument
        options.url = options.url || options.uri
        options.uri = options.url || options.uri
      } catch (err) {
        console.log(`err`, err)
      }
      return options
    }
    return {
      spawn,
      parseArgv,
      getOptions,
      colors: colors(),
    }
  }

  function url() { // url 处理程序
    /**
     * 根据 pathname 返回最匹配的 url
     * @param {*} param0.urlList url 列表
     * @param {*} param0.pathname pathname
     */
    function findLikeUrl({
      urlList,
      pathname
    }) {
      const apiSplitList = new URL(`http://127.0.0.1${pathname}`).pathname.split(`/`)
      const lvList = urlList.map((openApiItem) => {
        const openApiSplitList = new URL(openApiItem).pathname.split(`/`)
        const lv = apiSplitList.reduce((acc, apiSplitListItem, apiSplitListItemIndex) => {
          return acc + (apiSplitListItem === openApiSplitList[apiSplitListItemIndex] ? 1 : 0)
        }, 0)
        return lv
      })

      function findMaxIndex(arr) { // 查找数组中最大的数的索引
        const sortRes = [...arr].sort((a, b) => a - b)
        return arr.findIndex((item) => item === sortRes[arr.length - 1])
      }
      const maxIndex = findMaxIndex(lvList)
      return urlList[maxIndex]
    }

    function prepareProxy (proxy = {}) { // 解析 proxy 参数, proxy: string, object
      const pathToRegexp = require('path-to-regexp')
      const isType = type().isType
      const proxyType = isType(proxy)
      let resProxy = []
      if(proxyType === `string`) { // 任何路径都转发到 proxy
        proxy = {
          '/': proxy,
        }
      }
      function setIndexOfEnd(proxy) { // 需要排序 key:/ 到最后, 否则它生成的拦截器会被其他 key 覆盖
        const indexVal = proxy[`/`]
        delete proxy[`/`]
        proxy[`/`] = indexVal
        return proxy
      }
      proxy = setIndexOfEnd(proxy)
      resProxy = Object.keys(proxy).map(context => {
        let options = proxy[context]
        const optionsType = isType(options)
        if(optionsType === `string`) { // 转换字符串的 value 为对象
          options = {
            pathRewrite: { [`^${context}`]: options }, // 原样代理 /a 到 /a
            target: proxy[`/`],
          }
        }
        if(optionsType === `array`) { // 是数组时, 视为设计 res body 的值, 语法为: [k, v]
          const [item1, item2] = options
          const item1Type = isType(item1)
          const midResJson = httpClient().midResJson
          const deepMergeObject = obj().deepMergeObject

          if(options.length <= 1) { // 只有0个或一个项, 直接替换 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: () => item1})
              },
            }
          }
          if((item1Type === `string`) && (options.length === 2)) { // 以 item1 作为 key, item2 作为 val, 修改原 res
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, key: item1, val: item2})
              },
            }
          }
          if((item1Type === `object`) && (options.length === 2)) { // 根据 item2 的类型, 合并 item1
            options = {
              onProxyRes (proxyRes, req, res) {
                midResJson({proxyRes, res, cb: body => {
                  return ({
                    'deep': deepMergeObject(body, item1), // 父级【不会】被替换
                    '...': {...body, ...item1}, // 父级【会】被替换, 类似于js扩展运行符
                  })[item2 || `deep`]
                }})
              },
            }
          }
        }
        const re = pathToRegexp(context)
        return {
          re,
          context,
          options,
        }
      })
      return resProxy
    }

    function parseProxyTarget (proxy) { // 解析 proxy 为 {pathname, origin}
      let origin = ``
      try {
        if(typeof(proxy) === `string`) {
          origin = proxy
        }
        if(typeof(proxy) === `object`) {
          origin = proxy[`/`].target || proxy[`/`]
        }
        const parentUrl = new URL(origin)
        const res = {
          host: parentUrl.host,
          port: parentUrl.port || 80,
          hostname: parentUrl.hostname,
          pathname: parentUrl.pathname.replace(/\/$/, '') + '/',
          origin: parentUrl.origin,
          isIp: parentUrl.host.match(/\./g).length === 3,
        }
        return res
      } catch (error) {
        console.error(`请正确填写 proxy 参数`, error)
        process.exit()
      }
    }

    function fullApi2Obj(api) {
      let [, method, url] = api.match(/(\S+)\s+(.*)/) || [undefined, `*`, api.trim()]
      if(method === `*`) {
        method = `all`
      }
      if((url === undefined) || (url === `/`)) {
        url = `*`
      }
      const {path} = tool().httpClient.getClientUrlAndPath(url)
      return {path, method, url}
    }

    /**
     * 处理命令行上传入的路径参数, 如果是相对路径, 则相对于运行命令的目录, 而不是相对于书写 require() 方法文件的目录
     * @param {*} pathStr 路径
     */
    function handlePathArg(pathStr) {
      const path = require(`path`)
      let newPathStr = path.isAbsolute(pathStr) ? pathStr : `${process.cwd()}/${pathStr}` // 如果是相对路径, 则相对于运行命令的位置
      newPathStr = path.normalize(newPathStr) // 转换为跨平台的路径
      return newPathStr
    }

    function parseRegPath(rePath, url) { // 使用 path-to-regexp 转换 express 的 router, 并解析参数为对象
      // 注: path-to-regexp 1.x 自带 match 方法可处理此方法, 但是当前的 json-server 依赖的 express 的路由语法仅支持 path-to-regexp@0.1.7
      // 所以只能手动转换, 参考: https://github.com/ForbesLindesay/express-route-tester/blob/f39c57fa660490e74b387ed67bf8f2b50ee3c27f/index.js#L96
      const pathToRegexp = require('path-to-regexp')
      const keys = []
      const re = pathToRegexp(rePath, keys)
      const pathUrl = url
      const result = re.exec(pathUrl)
      const obj = keys.reduce((acc, cur, index) => {
        acc[cur.name] = result[index + 1]
        return acc
      }, {})
      return obj
    }

    function parseUrlArgToObjList(urlArg){ // 转换 url 参数为对象数组
      const querystring = require(`querystring`)
      const obj = querystring.parse(urlArg) // <= urlArg
      const res = []
      if(typeof(obj.action) === `string`) {
        res.push(obj)
      } else {
        obj.action.forEach((item, index) => {
          res.push({action: obj.action[index], arg: obj.arg[index]})
        })
      }
      return res
    }

    return {
      findLikeUrl,
      prepareProxy,
      parseProxyTarget,
      fullApi2Obj,
      handlePathArg,
      parseRegPath,
      parseUrlArgToObjList,
    }
  }

  function file() { // 文件相关
    function fileStore(storePath, initValue) { // 存取需要持久化存储的数据
      const fs = require(`fs`)
      const {
        o2s,
        deepSet,
        deepGet,
      } = obj()
      if(isFileEmpty(storePath)) {
        fs.writeFileSync(storePath, o2s(initValue || {}))
      } else if(initValue) { // 避免后期添加的键由于存在文件而没有正常初始化
        const store = JSON.parse(fs.readFileSync(storePath, `utf-8`))
        fs.writeFileSync(storePath, o2s({...initValue, ...store}))
      }
      let store = () => JSON.parse(fs.readFileSync(storePath, `utf-8`))
      return {
        set(key, val) {
          const newStore = store()
          deepSet(newStore, key, val)
          fs.writeFileSync(storePath, o2s(newStore))
          return store
        },
        get(key) {
          const newStore = store()
          return deepGet(newStore, key)
        },
        updateApiCount() {
          const apiCountOld =  this.get(`apiCount`) || 0
          this.set(`apiCount`, apiCountOld + 1)
          return this.get(`apiCount`)
        },
      }
    }

    function hasFile(filePath) { // 判断文件或目录是否存在
      const fs = require(`fs`)
      return fs.existsSync(filePath)
    }

    function getMd5(path) { // 获取文件 md5
      return new Promise((resolve, reject) => {
        const fs = require('fs')
        const crypto = require('crypto')
        const md5sum = crypto.createHash('md5')
        const stream = fs.createReadStream(path)
        stream.on('data', (chunk) => {
          md5sum.update(chunk)
        })
        stream.on('end', () => {
          const md5 = md5sum.digest('hex').toUpperCase()
          resolve(md5)
        })
      })
    }

    function getMd5Sync(path) { // 获取文件 md5
      const fs = require('fs')
      const buffer = fs.readFileSync(path)
      return tool().string.getMd5(buffer)
    }

    function isFileEmpty(file) { // 判断文件是否存或为空
      const fs = require(`fs`)
      return (
        (hasFile(file) === false)
        || fs.readFileSync(file, `utf-8`).trim() === ``
      )
    }

    return {
      fileStore,
      getMd5,
      getMd5Sync,
      isFileEmpty,
      hasFile,
    }
  }

  function middleware() { // express 中间件
    const compression = require('compression') // 压缩 http 响应

    function httpLog({config}) { // 设置 http 请求日志中间件
      const morgan = require('morgan')
      const {print} = require('./log.js')
      const colors = tool().cli.colors
      return morgan( (tokens, req, res) => {
        const colorTable = {
          1: `gray`,
          2: `green`,
          3: `yellowBright`,
          4: `yellow`,
          5: `red`,
        }
        const statusCode = String(res.statusCode)
        const len = res.getHeader(`Content-Length`)
        const str = [
          tool().time.dateFormat(`hh:mm:ss`, new Date),
          tool().httpClient.getClientIp(req),
          res.getHeader(config.apiInHeader),
          `${statusCode} ${res.statusMessage}`,
          `${tokens['response-time'](req, res)} ms`,
          len ? `${len} byte` : '',
        ].join(` `)
        // 使用原生 nodejs 打印日志
        print(colors[colorTable[statusCode[0]]](str)) // 根据状态码的第一位获取颜色函数
        return [] // return list.join(' ')
      })
    }

    function getJsonServerMiddlewares({config}) { // 获取 jsonServer 中的中间件
      // 利用 jsonServer 已有的中间件, 而不用额外的安装
      // 注意: 可能根据 jsonServer 版本的不同, 存在的中间件不同

      const jsonServer = require('json-server')
      const middlewares = jsonServer.defaults({bodyParser: true, logger: false}) // 可以直接使用的所有中间件数组
      middlewares.push(httpLog({config}))
      const middlewaresObj = middlewares.flat().reduce((res, item) => {
        // 使用 jsonServer 里面的中间件, 以保持一致:
        // compression, corsMiddleware, serveStatic, logger, jsonParser, urlencodedParser
        return ({
          ...res,
          [item.name]: item,
        })
      }, {})
      return {middlewares, middlewaresObj}
    }

    function reWriteRouter({app, routes = {}}) { // 根据 routes 对象, 重写路由
      const rewrite = require('express-urlrewrite')
      Object.keys(routes).forEach(key => {
        app.use(rewrite(key, routes[key]))
      })
    }

    function replayHistoryMiddleware ({
      id,
      HTTPHISTORY,
      config,
      business,
    } = {}) {
      const {
        clientInjection,
        historyHandle,
      } = business
      const {
        allowCors,
        setHeader,
        reSetApiInHeader,
      } = clientInjection({config})
      const {
        getHistory,
      } = historyHandle({config})
      return (req, res, next) => { // 修改分页参数, 符合项目中的参数
        const method = req.method.toLowerCase()
        const fullApi = id ? undefined :`${method} ${req.originalUrl}`
        HTTPHISTORY = HTTPHISTORY || require(config._httpHistory)
        const history = getHistory({history: HTTPHISTORY, id, fullApi, find: list => {
          const getStatus = (item) => {
            try {
              return item.data.res.lineHeaders.line.statusCode
            } catch (err) {
              console.log(`err`, err)
            }
          }
          const getStatusCodeItem = list => list.find(item => getStatus(item) === 200) // 查找 http 状态码为 200 的条目
          let getItemRes = undefined
          if(config.replayProxyFind) { // 先使用配置的 replayProxyFind 函数, 如果没有打到则使用普通状态码
            try {
              getItemRes = list.find((...arg) => config.replayProxyFind(...arg))
            } catch (error) {
              console.log(error)
            }
          }
          getItemRes = getItemRes || getStatusCodeItem(list) || list[0] || {} // 如果也没有找到状态码为 200 的, 则直接取第一条
          return getItemRes
        }}).data
        try {
          const lineHeaders = history.res.lineHeaders
          const headers = lineHeaders.headers
          setHeader(res, {
            ...headers, // 还原 headers
            ...reSetApiInHeader({headers}), // 更新 testApi
          })
          allowCors({res, req})
          const bodyPath = history.res.bodyPath
          if(bodyPath) {
            const path = require('path')
            const newPath = path.resolve(bodyPath) // 发送 body
            res.sendFile(newPath)
          } else {
            const {statusCode, statusMessage} = lineHeaders.line
            res.statusCode = statusCode
            res.statusMessage = statusMessage
            res.send()
          }
        } catch (err) {
          console.log(`err`, err)
          res.json(config.resHandleReplay({req, res}))
        }
      }
    }

    return {
      reWriteRouter,
      compression,
      httpLog,
      getJsonServerMiddlewares,
      replayHistoryMiddleware,
    }

  }

  function httpClient() {

    function midResJson({res, proxyRes, key, val, cb = body => body}) {
      const modifyResponse = require('node-http-proxy-json')
      modifyResponse(res, proxyRes, body => {
        body && key && obj().deepSet(body, key, val)
        return cb(body)
      })
    }

    function getClientUrlAndPath (originalUrl) { // 获取从客户端访问的 url 以及 path
      // 当重定向路由(mock api)时, req.originalUrl 和 req.url 不一致, req.originalUrl 为浏览器中访问的 url, 应该基于这个 url 获取 path
      return {
        url: originalUrl,
        path: (new URL(originalUrl, `http://127.0.0.1`)).pathname,
      }
    }

    function getClientIp (req) { // 获取客户端 IP
      let ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
        req.ip ||
        req.connection.remoteAddress || // 判断 connection 的远程 IP
        req.socket.remoteAddress || // 判断后端的 socket 的 IP
        req.connection.socket.remoteAddress || ''
      if (ip.includes(',')) {
        ip = ip.split(',')[0]
      }
      ip = ip.substr(ip.lastIndexOf(':') + 1, ip.length) // ::ffff:127.0.0.1 => 127.0.0.1
      return ip
    }

    return {
      midResJson,
      getClientUrlAndPath,
      getClientIp,
    }

  }

  function fn() { // 函数处理工具
    function emptyFn(f) {  // 把函数的参数 {}, [], null 转为默认值
      return (...a) => {
        return f(...a.map(
          v => {
            return (type().isEmpty(v) ? undefined : v)
          }
        ))
      }
    }
    return {
      emptyFn,
    }
  }

  function obj() { // 对象处理工具
    function flatObj(value, currentKey) { // 展开对象
      let result = {};
      Object.keys(value).forEach(key => {
        const tempKey = currentKey ? `${currentKey}.${key}` : key;
        if (typeof value[key] !== "object") {
          result[tempKey] = value[key];
        } else {
          result = { ...result, ...flatObj(value[key], tempKey) };
        }
      });
      return result;
    }

    function deepGet(object, keys = [], defaultValue) { // 深层获取对象值
      let res = (!Array.isArray(keys)
        ? keys
          .replace(/\[/g, '.')
          .replace(/\]/g, '')
          .split('.')
        : keys
      ).reduce((o, k) => (o || {})[k], object)
      return res !== undefined ? res : defaultValue
    }

    function deepMergeObject(originObj, adventObj) { // 深层合并对象
      const flatObjRes = flatObj(adventObj)
      Object.keys(flatObjRes).forEach(key => {
        deepSet(originObj, key, flatObjRes[key])
      })
      return originObj
    }

    function deepSet(object, keys, val) { // 深层设置对象值
      keys = Array.isArray(keys) ? keys : keys
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .split('.');
      if (keys.length > 1) {
        object[keys[0]] = object[keys[0]] || {}
        deepSet(object[keys[0]], keys.slice(1), val)
        return object
      }
      object[keys[0]] = val
      return object
    }

    function removeEmpty(obj) { // 删除对象中为空值的键
      obj = {...obj}
      Object.keys(obj).forEach(key => {
        if (type().isEmpty(obj[key])) {
          delete obj[key]
        }
      })
      return obj
    }

    function o2s(o) { // 对象转字符串
      return JSON.stringify(o, null, 2)
    }
    return {
      npm,
      deepMergeObject,
      flatObj,
      deepGet,
      deepSet,
      removeEmpty,
      o2s,
    }
  }

  function os() { // 系统工具
    /**
     *
     * @param {string} param0 动作, set, remove
     * @param {object} param1.ip 对应的 ip, 默认 127.0.0.1
     * @param {object} param1.hostname 对应的 hostname
     */
    async function sysHost(action, {ip = `127.0.0.1`, hostname}) {
      const hostile = await tool().generate.initPackge(`hostile`)
      return new Promise((resolve, reject) => {
        hostile[action](ip, hostname, err => {
          err ? reject(err) : resolve(true)
        })
      })
    }

    /**
     * 程序退出前清理工具
     * @param {object} param0.hostname 恢复 host 文件修改
     */
    function clearProcess({hostname} = {}) {
      function killProcess(...arg) {
        console.log(`err:`, ...arg)
        hostname ? sysHost(`remove`, {hostname}).finally(process.exit) : process.exit()
      }
      process.on(`SIGTERM`, killProcess)
      process.on(`SIGINT`, killProcess)
      process.on(`uncaughtException`, killProcess)
      process.on(`unhandledRejection`, killProcess)
    }

    function portIsOk (port) { // 判断端口是否可用
      if(typeof(port) === `object`) { // 判断多个端口
        return Promise.all(port.map(item => portIsOk(item)))
      }
      return new Promise(resolve => {
        const net = require('net')
        const server = net.createServer().listen(port)
        server.on('listening', () => server.close(resolve(true)))
        server.on('error', () => resolve(port))
      })
    }
    function getOsIp() { // 获取系统 ip
      const obj = require(`os`).networkInterfaces()
      const ip = Object.keys(obj).reduce((res, cur, index) => {
        return [...res, ...obj[cur]]
      }, []).filter(item => !item.address.match(/(127.|:)/))[0].address
      return ip
    }
    return {
      clearProcess,
      sysHost,
      getOsIp,
      portIsOk,
    }
  }

  function type() { // 类型处理工具
    function isEmpty(value) { // 判断空值
      return (
        value === null
        || value === undefined // 避免存在 key 但未定义值
        || value === ``
        || typeof(value) === `object`
          && (
            value.length === 0
            || Object.keys(value).length === 0
          )
      )
    }
    function isType(data, type = undefined) { // 判断数据是否为 type, 或返回 type
      const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
      return type ? (dataType === type.toLowerCase()) : dataType
    }
    return {
      isEmpty,
      isType,
    }
  }

  function time() {
    /**
     * 时间格式化
     * @param {string} fmt 格式
     * @param {Date} date 时间对象
     */
    function dateFormat(fmt, date) {
      let ret
      const opt = {
        'Y+': date.getFullYear().toString(),        // 年
        'M+': (date.getMonth() + 1).toString(),     // 月
        'D+': date.getDate().toString(),            // 日
        'h+': date.getHours().toString(),           // 时
        'm+': date.getMinutes().toString(),         // 分
        's+': date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
      }
      for (let k in opt) {
        ret = new RegExp(`(${k})`).exec(fmt)
        if (ret) {
          fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, '0')))
        }
      }
      return fmt
    }
    return {
      dateFormat,
    }
  }

  function string() { // 字符串处理

    /**
    * 获取字符串的 md5
    * @param {*} str 字符串
    */
    function getMd5(str) {
      const crypto = require('crypto')
      const md5 = crypto.createHash('md5')
      return md5.update(str).digest('hex')
    }

    /**
    * 驼峰转下划线
    * @param {*} str
    */
    function toLine(str) {
      str = str.replace(str[0],str[0].toLowerCase())
      return str.replace(/([A-Z])/g, `_$1`).toLowerCase();
    }

    /**
    * 转换字符为小驼峰, 支持 `空格 - _`
    * @param {string} str 要处理的字符
    */
    function toLittleHump(str) {
      str = toLine(str) // 先转一下, 避免本来是驼峰转换后不是驼峰了
      let arr = str.split(' ').join('-').split('-').join('_').split('_')
      for (let i = 1; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].substring(1)
      }
      arr[0] = arr[0].toLowerCase() // 此行为小驼峰
      return arr.join('')
    }

    function removeLeft(str) {
      const lines = str.split('\n')
      // 获取应该删除的空白符数量
      const minSpaceNum = lines.filter(item => item.trim())
        .map(item => item.match(/(^\s+)?/)[0].length)
        .sort((a, b) => a - b)[0]
      // 删除空白符
      const newStr = lines
        .map(item => item.slice(minSpaceNum))
        .join('\n')
      return newStr
    }
    return {
      getMd5,
      toLittleHump,
      toLine,
      removeLeft,
    }
  }

  function array() { // 数组处理
    /**
     * 排序数组
     * @param {array} arr 要排序的数组
     * @param {object} param1
     * @param {string} param1.key 要比较的 key
     * @param {boolean} param1.asc 是否升序, 默认是
     */
    function sort(arr, {key, asc} = {}) {
      asc = asc === undefined ? true : asc
      arr.sort((a, b) => {
        const val1 = key ? a[key] : a
        const val2 = key ? b[key] : b
        return asc ? val1 - val2 : val2 - val1
      })
      return arr
    }

    /**
    * 转换数组为树形结构
    * @param {array} data 包含 id, pid 的数组
    * @param {function} childrenFn  // 如果有 children 时, 可以接收 parent
    */
    function toTree(data, childrenFn = () => {}) {
      let result = [];
      if (!Array.isArray(data)) {
        return result;
      }
      data.forEach((item) => {
        delete item.children;
      });
      let map = {};
      data.forEach((item) => {
        map[item.id] = item;
      });
      data.forEach((item) => {
        let parent = map[item.pid];
        if (parent) {
          childrenFn && childrenFn(parent);
          (parent.children || (parent.children = [])).push(item);
        } else {
          result.push(item);
        }
      });
      return result;
    }


    /**
    * 根据字段值中的 - 标志转为树形结构
      ``` js
      const arr = `
      A
      -A.1
      B
      -B.1
      -B.2
      --B.2.1
      --B.2.2
      C
      D
      E
        `.trim().split(`\n`).filter(item => item.trim()).map(item => ({key: item}))
      console.log(`res`, arrToTree(arr, {key: `key`, tag: `-`}))
      ```
    * @param {array} arr 数组
    * @param {object} param1
    * @param {string} param1.key 对应的 key
    * @param {string} param1.tag 对应的 tag
    */
    function arrToTree(arr, {key = `key`, tag = `-`} = {}) {
      let pid = undefined // pid
      let oldTag = undefined // 标志
      const res = arr.map((item, index) => {
        let [, newTag, res] = item[key].match(new RegExp(`^(${tag}*)(.*)`))
        if(newTag === ``) { // 不存标志时 pid 为 root
          pid = `root`
        } else if(newTag !== oldTag) { // 存在标志但标志标志不同, 则更新 pid
          pid = index - 1
        }
        oldTag = newTag
        return {
          ...item,
          [key]: res, // 删除 tag 标志的结果
          id: index,
          pid,
        }
      })
      return toTree(res, parent => {parent.type = `object`})
    }

    return {
      sort,
      arrToTree,
      toTree,
    }

  }

  return {
    array: array(),
    string: string(),
    npm: npm(),
    control: control(),
    cache: cache(),
    generate: generate(),
    url: url(),
    file: file(),
    cli: cli(),
    hex: hex(),
    middleware: middleware(),
    httpClient: httpClient(),
    fn: fn(),
    obj: obj(),
    os: os(),
    type: type(),
    time: time(),
  }
}

module.exports = tool()
