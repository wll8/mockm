import React from 'react'
import common from '../common.jsx'
import utils from '../utils.jsx'
import * as ReactRouterDOM from 'react-router-dom'
import * as icons from '@ant-design/icons'
import * as antd from 'antd'

const $ = window.$
const {
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
    swagger: false, // 是否显示 swagger 文档
    pathInSwagger: false, // 显示 swagger 按钮
    serverConfig: {}, // 服务器配置
  })

  useEffect(() => { // 判断是否有 swagger, 如果有则显示 swagger 按钮
    try {
      let {method, path} = props
      let {paths, basePath} = state.spec
      method = method.toLowerCase()
      // 去除非 api 前缀, 仅留下 api 本身 /api/getFile => /getFile
      const re = new RegExp(`^(${basePath})(/.*)`)
      const swgPath = path.replace(re, '$2')
      const res = Object.keys(paths).some(path => {
        let re = swgPathToReg(path)
        return swgPath.match(re)
      })
      setState(preState => ({...deepSet(preState, `pathInSwagger`, res)}))
    } catch (error) {
      console.log(`error`, error)
      setState(preState => ({...deepSet(preState, `pathInSwagger`, false)}))
    }
  }, [state.spec, props])

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

  function initSwagger({serverConfig, store}) {
    // 添加 swagger-ui.css
    $(`head`).append($(`<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/swagger-ui-dist@3.25.1/swagger-ui.css">`))
    $(`head`).append($(`<link rel="stylesheet" href="/swagger-reset.css">`))
    // 添加 swagger-ui-bundle.js 并初始化 swg

    // swagger-ui v3 没有 setHost 方法, 这里注入此方法
    // https://github.com/swagger-api/swagger-ui/issues/5981
    const UrlMutatorPlugin = (system) => ({
      rootInjects: {
        setSpec (data) {
          const jsonSpec = system.getState().toJSON().spec.json
          const newSpec = {...jsonSpec, ...data}
          setState(preState => ({...deepSet(preState, `spec`, newSpec)}))
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
          // 如果原 url 存在 auth (需要 auth), 则使用新 token 替换它, 否则不要添加, 避免添加不必要的东西引起错误
          let authorization = props.authorization
          if(authorization) {
            req.headers.Authorization = authorization
          }
          return req
        },
        configs: {
          preFetch (req) { // 请求前处理 req
            return req
          }
        },
        onComplete () {
          let host = ``
          if(serverConfig.remote === false) { // 本地模式
            host = `${window.location.hostname}:${serverConfig.port}`
          } else { // 公网模式
            host = new URL(store.note.remote.port).host
          }
          const protocol = window.location.protocol.replace(`:`, ``) // 协议跟随当前页面
          window.swaggerUi.setSpec({host, protocol, schemes: [protocol]})
        }
      })
    }, true)
  }

  useEffect(() => {
    Promise.all([
      http.get(`${cfg.baseURL}/api/getConfig/`),
      http.get(`${cfg.baseURL}/api/getStore/`),
    ]).then(([config, store]) => {
      setState(preState => ({...deepSet(preState, `serverConfig`, config)}))
      const {openApi} = config
      openApi && initSwagger({serverConfig: config, store})
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
      let {method, path} = props
      method = method.toLowerCase()
      // 去除非 api 前缀, 仅留下 api 本身 /api/getFile => /getFile
      const basePath = $(`.swagger-ui .info .base-url`).text().match(/(\/.*) ]/)[1] // 其实就是 json 中的 basePath, 只是不想再请求并解析这个 json 文件, 所以直接在 dom 中获取
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
    <Button onClick={swagger} size="small" type={state.swagger ? `primary` : `default`} className="swagger" style={{display: state.pathInSwagger ? undefined : `none`}}>swagger</Button>
  )
}

export default Swagger
