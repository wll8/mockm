import React from 'react'
import common from '../common.jsx'
import utils from '../utils.jsx'
import * as ReactRouterDOM from 'react-router-dom'
import * as icons from '@ant-design/icons'
import * as antd from 'antd'

const $ = window.$
const {
  isIp4InPrivateNet,
  swgPathToReg,
  getAbsolutePosition,
  debounce,
  deepSet,
} = utils

const {
  useState,
  useEffect,
} = React

const {
  useLocation,
} = ReactRouterDOM

const {
  http,
  cfg,
} = common

const {
  message,
  Button,
} = antd

function Swagger(props) {
  const reactLocation = useLocation()
  const [state, setState] = useState({ // 默认值
    spec: {}, // oepnApi 对象
    specPrefix: ``, // oepnApi 前缀
    swagger: false, // 是否显示 swagger 文档
    pathInSwagger: false, // 显示 swagger 按钮
    swaggerLoading: false, // swagger 是否正在加载
  })

  useEffect(() => { // 判断是否有 swagger, 如果有则显示 swagger 按钮
    try {
      let {
        headers: {
          authorization,
        },
        line: {
          method,
          path,
        },
      } = props.httpData.data.req.lineHeaders
      let {paths, basePath = ``} = state.spec
      method = method.toLowerCase()
      // 去除非 api 前缀, 仅留下 api 本身 /api/getFile => /getFile
      const re = new RegExp(`^(${basePath})(/.*)`)
      const swgPath = path.replace(re, '$2')
      const res = Object.keys(paths).some(path => {
        path = `${state.specPrefix}${path}`
        let re = swgPathToReg(path)
        return swgPath.match(re)
      })
      setState(preState => ({...deepSet(preState, `pathInSwagger`, res)}))
      setState(preState => ({...deepSet(preState, `authorization`, authorization)}))
    } catch (error) {
      console.log(`error`, error)
      setState(preState => ({...deepSet(preState, `pathInSwagger`, false)}))
    }
  }, [state.spec, state.specPrefix, props])

  useEffect(() => { // 退出此页面时销毁 swagger
    return hideDoc
  }, [])

  function parseHash() {
    let res = {}
    if(reactLocation.pathname.match(/^\/(\w+),(.*)/)) { // 如果 url 上有 /id,123/post/books/ 类似的参数, 则先取出 `id,123` 参数
      let [, argList, path] = reactLocation.pathname.match(/\/(.*?)(\/.*)/)
      const [action, ...actionArg] = argList.split(',')
      const actionArgStr = actionArg.join(`,`)
      res = {...res, action, actionArg, actionArgStr}
      const [, method, api] = (`#${path}${reactLocation.search}`).match(/#\/(\w+)(.*)/) || []
      res = {...res, method, api}
    } else {
      const [, method, api] = (`#${reactLocation.pathname}${reactLocation.search}`).match(/#\/(\w+)(.*)/) || []
      res = {...res, method, api}
    }
    return res
  }

  function initSwagger({store, cb}) {
    // 添加 swagger-ui.css
    $(`head`).append($(`<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/swagger-ui-dist@3.25.1/swagger-ui.css">`))
    $(`head`).append($(`<link rel="stylesheet" href="/swagger-reset.css">`))
    // 添加 swagger-ui-bundle.js 并初始化 swg

    // swagger-ui v3 没有 setHost 方法, 这里注入此方法
    // https://github.com/swagger-api/swagger-ui/issues/5981
    const UrlMutatorPlugin = (system) => ({
      rootInjects: {
        getSpec () {
          return system.getState().toJSON().spec.json
        },
        getSpecPrefix () {
          return system.getState().toJSON().spec.json.info._matchInfo.resPrefix || ``
        },
        setSpec (data) {
          const jsonSpec = system.getState().toJSON().spec.json
          const specPrefix = system.getState().toJSON().spec.json.info._matchInfo.resPrefix || ``
          const newSpec = {...jsonSpec, ...data}
          setState(preState => ({...deepSet(preState, `spec`, newSpec)}))
          setState(preState => ({...deepSet(preState, `specPrefix`, specPrefix)}))
          return system.specActions.updateJsonSpec(newSpec)
        }
      }
    });

    $.getScript2(`//cdn.jsdelivr.net/npm/swagger-ui-dist@3.25.1/swagger-ui-bundle.min.js`, () => {
      const parseHashData = parseHash()
      window.swaggerUi = window.SwaggerUIBundle({
        url: `${cfg.baseURL}/api/getOpenApi/${parseHashData.api ? `?api=${parseHashData.api}` : ``}`,
        dom_id: '#swagger-ui',
        plugins: [
          UrlMutatorPlugin,
        ],
        requestInterceptor (req) {
          Object.entries(window.injectionRequest).forEach(([key, value]) => {
            ;(value !== undefined) && deepSet({req}, key, value)
          })
          return req
        },
        configs: {
          preFetch (req) { // 请求前处理 req
            return req
          }
        },
        onComplete () {
          const spec = window.swaggerUi.getSpec()
          const specPrefix = window.swaggerUi.getSpecPrefix()
          const hostname = window.location.hostname
          let host = ``
           // 就算开启远程模式, 但访问的是链接地址是内网时, swagger try 的请求地址仍使用内网 url, 以增加访问速度
          if(
            (hostname === `localhost`) // 是本地域名
            || (
              hostname.split(``).every(str => str.match(/[0-9]|\./)) // 是IP
              && (isIp4InPrivateNet(hostname) === false) // 不是公网IP
            )
          ) { // 本地模式
            host = `${hostname}:${window.serverConfig.port}`
          } else { // 公网模式
            host = new URL(store.note.remote.port || store.note.local.port).host
          }

          const servers = (spec.servers || []).map(item => {
            const newUrl = item.url.replace(new URL(item.url).host, host)
            item.url = `${newUrl}${specPrefix}`
            return item
          })
          const protocol = window.location.protocol.replace(`:`, ``) // 协议跟随当前页面
          window.swaggerUi.setSpec({servers, host, protocol, schemes: [protocol]})
          cb()
        }
      })
    }, true)
  }

  useEffect(() => {
    Promise.all([
      http.get(`${cfg.baseURL}/api/getStore/`),
    ]).then(([store]) => {
      if(window.serverConfig.openApi) {
        setState(preState => ({...deepSet(preState, `swaggerLoading`, true)}))
        initSwagger({store, cb: () => {
          setState(preState => ({...deepSet(preState, `swaggerLoading`, false)}))
        }})
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactLocation]);

  function hideDoc() {
    setState(preState => ({...preState, swagger: false}))
    $(`.swaggerBox`).addClass(`hide`).removeClass(`show`)
    $(`#root`).css({width: ``})
  }

  function showDoc({$swaggerApiDom}) {
    setState(preState => ({...preState, swagger: true}))
    $(`.swaggerBox`).removeClass(`hide`).addClass('show')
    $(`#root`).css({width: `50%`})
    $(`#swagger-ui`).scrollTo($swaggerApiDom.parent())
  }

  function swagger() {
    if($(`.swaggerBox`).hasClass(`show`)) {
      hideDoc()
    } else {
      // 滚动 swagger 视图到相同的 api 位置
      let {
        line: {
          method,
          path,
        },
      } = props.httpData.data.req.lineHeaders
      method = method.toLowerCase()
      // 去除非 api 前缀, 仅留下 api 本身 /api/getFile => /getFile
      const basePath = state.spec.basePath
      const re = new RegExp(`^(${basePath})(/.*)`)
      const swgPath = path.replace(re, '$2')
      const $swaggerApiDom = $([...$(`.opblock-summary-${method} [data-path]`)].find(item => {
        let re = swgPathToReg($(item).data(`path`))
        return swgPath.match(re)
      }))
      if ($swaggerApiDom.length === 0) {
        message.error(`未找到文档`)
        return false
      }
      const $opblock = $swaggerApiDom.parents(`.opblock`) // 获取当前点击的 swagger api, 并且不是展开状态的元素
      if ($opblock.hasClass(`open`) === false) {
        $swaggerApiDom.click() // 打开
      }
      $opblock.addClass(`open`)

      // 一些 dom 改变事件, 当用户操作 swagger api, 例如点击 `try it out` 的时候, 重新获取高度, 并同步到 swaggerBox 和 swaggerShadow
      const domChange = `DOMAttrModified DOMAttributeNameChanged DOMCharacterDataModified DOMElementNameChanged DOMNodeInserted DOMNodeInsertedIntoDocument DOMNodeRemoved DOMNodeRemovedFromDocument DOMSubtreeModified`
      $('.opblock').off(domChange) // 监听前先取消所有类似元素的监听, 避免多于的监听造成卡顿
      function changeFn() {
        const pos = getAbsolutePosition($opblock[0])
        if (pos.height === 0) {
          return false; // 高度为 0 则不进行处理
        } else {
          let newHeight = `${pos.height}px`
          $(`#swagger-ui`).css({
            height: newHeight,
          })
        }
      }
      setTimeout(changeFn, 500) // 如果没有 dom 改变, 那也执行, 在 500 毫秒(等待样式展示)之后
      $opblock.on(domChange, debounce(changeFn, 100))

      showDoc({$swaggerApiDom})
    }
  }

  return (
    <Button
      loading={state.swaggerLoading}
      onClick={swagger}
      size="small"
      type={state.swagger ? `primary` : `default`}
      className="swagger"
      disabled={!state.pathInSwagger}
    >
      swagger
    </Button>
  )
}

export default Swagger
