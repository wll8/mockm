import React from 'react'
import domtoimage from 'dom-to-image'
import * as ReactRouterDOM from 'react-router-dom'
import * as antd from 'antd'
import en_GB from 'antd/es/locale/en_GB';
import * as icons from '@ant-design/icons'
import utils from './utils.jsx'
import common from './common.jsx'
import ApiList from './ApiList.jsx'
import ReqRes from './ReqRes.jsx'
import './HttpShow.scss'

const {
  http,
  cfg,
} = common

const $ = window.$
const HotKey = window.HotKey

const {
  swgPathToReg,
  getAbsolutePosition,
  debounce,
  dateDiff,
  getSelectionText,
  blobTool,
  getMethodUrl,
  fetchDownload,
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  deepGet,
  deepSet,
} = utils

const HttpShow = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Drawer,
    Collapse,
    Button,
    Tag,
    Tabs,
    BackTop,
    message,
    Spin,
    Table,
    ConfigProvider,
  } = antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  const {
    HashRouter,
  } = ReactRouterDOM

  function com() {
    function App() {
      const {
        useHistory,
        useLocation,
        HashRouter,
        Route,
        Switch,
        Redirect,
      } = ReactRouterDOM
      const reactHistory = useHistory()
      let apiToken = `` // 组件内全局变量, 可以在其他闭包函数中使用, 避免获取到旧值, 也可使用 useRef 来总是获取新值


      const initState = (() => {
        try {
          return JSON.parse(window.localStorage.getItem(`HttpShowState`)) || {}
        } catch (error) {
          console.log(error)
          // return {}
        }
        return { // 默认值
          swagger: false, // 是否显示 swagger 文档
          activeTabs: `ReqRes`,
        }
      })();

      const [state, setState] = useState({ // 默认值
        ...initState,
        apiList: [],
        httpData: {},
        spec: {},
        pathInSwagger: false,
        replayDone: true,
        showHistry: false,
        dataApiHistry: [],
        parseHashData: {}, // 解析 hash 参数得到的信息
        captureImg: undefined, // 截图 objectUrl
        // fullApi: `GET /api/options/?page=1&pageSize=999`,
        // fullApi: `POST /api/auth/login/`,
        // fullApi: `PUT /api/regulations/2020200019/normal/`, // 500 => html
        // fullApi: `GET /static/static/hot.95598193.png`,
        // fullApi: `POST /api/dynamicdatatemplate/search/?a=1&b=2`,
      });

      function capture () {
        if(state.captureImg) {
          setState(preState => ({...preState, captureImg: undefined}))
        } else {
          const node = document.querySelector(`.HttpShow`)
          // const scale = 1200 / node.offsetWidth; // 生成固定宽度的图像
          const scale = 1.5;
          const cfg = {
            height: node.offsetHeight * scale,
            width: node.offsetWidth * scale,
            style: {
              transform: "scale(" + scale + ")",
              transformOrigin: "top left",
              width: node.offsetWidth + "px",
              height: node.offsetHeight + "px",
            }
          }
          domtoimage.toBlob(node, cfg).then(async function (blob) {
            const objectUrl = await blobTool(blob, `toObjectURL`)
            setState(preState => ({...preState, captureImg: objectUrl}))
          }).catch(err => {
            console.log(`err`, err)
          })
        }
      }

      function replay() {
        const {method, api} = state.httpData
        const replayDone = state.replayDone
        setState(preState => ({...preState, replayDone: false}))
        http.get(`${cfg.baseURL}/api/replay/${method}${api}`).then(res => {
          setState(preState => ({...preState, replayDone: true}))
          message.info(`重发请求成功 ${res.message}`)
          getHttpData({method, api})
        }).catch(err => {
          message.error(`重发失败 ${err}`)
        })
      }
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
          let {method, path} = state.httpData.data.req.lineHeaders.line
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

      function tabsChange(key) {
        console.log(key);
        setState(preState => ({...deepSet(preState, `activeTabs`, key)}))
      }

      const reactLocation = useLocation();

      function getToken(req) {
        let authorization
        try {
          authorization = req.lineHeaders.headers.authorization
        } catch (error) {
          console.log(`error`, `暂无 token`)
        }
        return authorization
      }

      function getSimpleInfo(httpData) {
        if(!httpData.data) {
          return {}
        }
        const res = httpData.data.res
        const {method, api} = httpData
        let simpleInfo = {
          method,
          api,
          // fullApi,
          statusCode: res.lineHeaders.line.statusCode,
          contentType: res.lineHeaders.headers[`content-type`],
          extensionName: (res.bodyPath || '').replace(/(.*)(\.)/, ''),
          date: res.lineHeaders.headers.date,
        }
        return simpleInfo
      }

      function getHttpData({method, api}) {
        console.log(`method, api`, method, api)
        const fullApi = window.decodeURIComponent(`${method} ${api}`)
        console.log(`fullApi`, fullApi, state.parseHashData)
        http.get(`${cfg.baseURL}/api/getHttpData/${method}${api}`).then(data => {
          const [, apiId = undefined] = window.location.hash.match(/#\/history,(\w+)/) || []
          const newData = {
            method,
            api,
            api0: `${method}${api}`,
            apiId, // todo 这里不一定是 id, 可能会导致错误
            data,
          }
          apiToken = getToken(data.req)
          setState(preState => ({
            ...preState,
            fullApi,
            httpData: newData,
            simpleInfo: getSimpleInfo(newData),
          }))
        })
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

        $.getScript(`//cdn.jsdelivr.net/npm/swagger-ui-dist@3.25.1/swagger-ui-bundle.min.js`, () => {
          window.swaggerUi = window.SwaggerUIBundle({
            url: `${cfg.baseURL}/api/getOpenApi/`,
            dom_id: '#swagger-ui',
            plugins: [
              UrlMutatorPlugin,
            ],
            requestInterceptor (req) {
              // 如果原 url 存在 auth (需要 auth), 则使用新 token 替换它, 否则不要添加, 避免添加不必要的东西引起错误
              let authorization = apiToken
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
        })
      }

      const columnsApiHistry = [
        {
          title: 'id',
          dataIndex: 'id',
        },
        {
          title: 'date',
          dataIndex: 'date',
          sorter: (a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime(),
          defaultSortOrder: 'descend',
          render: record => {
            // return dayjs(record).format('YYYY-MM-DD HH:mm:ss')
            return dateDiff(new Date(record))
          }
        },
        {
          title: 'code',
          dataIndex: 'statusCode',
          sorter: (a, b) => a.statusCode - b.statusCode,
        },
        {
          title: 'res',
          dataIndex: 'resBodySize',
          sorter: (a, b) => b.resBodySize - a.resBodySize,
        },
        {
          title: 'req',
          dataIndex: 'reqBodySize',
          sorter: (a, b) => b.reqBodySize - a.reqBodySize,
        },
      ]

      function historyFn(isShow) {
        setState(preState => ({...deepSet(preState, `showHistry`, isShow)}))
        isShow && http.get(`${cfg.baseURL}/api/getApiHistry/${state.httpData.api0}`).then(res => {
          console.log(`resres`, res)
          res = res.map((item, key) => ({...item, key}))
          setState(preState => ({...deepSet(preState, `dataApiHistry`, res)}))
        })
      }

      useEffect(() => {
        window.localStorage.setItem(`HttpShowState`, JSON.stringify({activeTabs: state.activeTabs}, null, 2))
      }, [state.activeTabs]);

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
      }, []);

      useEffect(() => { // 判断是否有 swagger, 如果有则显示 swagger 按钮
        try {
          let {method, path} = state.httpData.data.req.lineHeaders.line
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
          setState(preState => ({...deepSet(preState, `pathInSwagger`, false)}))
        }
      }, [state.spec, state.httpData]);

      useEffect(() => {
        hideDoc()
        console.log(`location`, reactLocation)
        console.log(`location.pathname`, reactLocation.pathname)
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
        const parseHashData = parseHash()
        setState(preState => ({...preState, parseHashData}))
        const {api, method, action, actionArg} = parseHashData
        setState(preState => ({ // 当路由改变时, 清理上一次路由中的数据
          ...preState,
          httpData: {},
          captureImg: undefined,
        }))
        if(method && api) { // 如果 true 显示某个 api 信息; 否则显示所有 api 列表
          getHttpData({method, api})
        }

        const hotKey = new HotKey();
        hotKey.add(`CTRL+C`, ev => {
          if(!getSelectionText()) { // 如果没有选择任何文本
            console.log(`ctrl+c`)
          }
        });
        hotKey.setup({
          metaToCtrl: true,
        });
        hotKey.start();
        return () => hotKey.stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [reactLocation]);

      const tabList = {
        ReqRes,
        // Doc: () => `Doc`,
      }
      return (
        <Switch>
          <Route cache exact path="/">
            <ApiList />
          </Route>
          <Route cache path="/*">
            <>
              <div className="info">
                <div className="item api">
                  <span className="key">api:</span>
                  <span className="val">{state.fullApi}</span>
                </div>
                <div className="item status">
                  <span className="key">status:</span>
                  <span className="val">{deepGet(state, `httpData.data.res.lineHeaders.line.statusCode`)} {deepGet(state, `httpData.data.res.lineHeaders.line.statusMessage`)}</span>
                </div>
              </div>
              <div className="options">
                <Button onClick={() => reactHistory.push(`/`)} size="small" className="replay">apiList</Button>
                <Button onClick={replay} size="small" className="replay">replay <icons.LoadingOutlined style={{display: state.replayDone ? `none` : undefined}} /> </Button>
                <Button onClick={capture} size="small" type={state.captureImg ? `primary` : `default`} className="capture">capture</Button>
                <Button onClick={swagger} size="small" type={state.swagger ? `primary` : `default`} className="swagger" style={{display: state.pathInSwagger ? undefined : `none`}}>swagger</Button>
                <Button onClick={() => historyFn(true)} size="small" className="history">history</Button>
                <div className={`optionsPreViewRes ${state.captureImg && `show`}`}>
                  {state.captureImg && <img className="captureImg" src={state.captureImg} alt="captureImg"/>}
                </div>
              </div>
              <Drawer
                className="drawer"
                title="history"
                width="none"
                onClose={() => historyFn(false)}
                visible={state.showHistry}
              >
                <Table
                  onRow={record => {
                    return {
                      onClick: event => {
                        reactHistory.push(`/history,${record.id}/${record.method}${record.api}`)
                      },
                    };
                  }}
                  rowClassName={(record, index) => {
                    const fullHistoryUrl = reactLocation.pathname.match(/\/history,(\w+)/) // 判断是否是含有 id 的 url
                    const res = ((record.id === state.httpData.apiId) // 有 apiId 时高亮匹配当前 id 的行
                      || ((fullHistoryUrl === null) && (index === 0)) // 没有 appId 时, 高亮第一行
                    )
                      ? `curItem index_${index}`
                      : `index_${index}`
                    return res
                  }}
                  showHeader={true}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={columnsApiHistry}
                  dataSource={state.dataApiHistry}
                />
              </Drawer>
              <Tabs animated={false} defaultActiveKey={state.activeTabs} onChange={tabsChange}>
                {
                  Object.keys(tabList).map(key => (
                    <TabPane tab={key} key={key}>
                      {
                        state.httpData ?
                          (() => {
                            const ComName = tabList[key]
                            return <ComName httpData={state.httpData} />
                          })()
                        : `(暂无)`
                      }
                    </TabPane>
                  ))
                }
              </Tabs>
            </>
          </Route>
        </Switch>
      )
    }

    return (
      <div className="HttpShow">
        <ConfigProvider locale={en_GB}>
          <HashRouter>
            <BackTop visibilityHeight={0} target={() => document.querySelector(`#root`)}/>
            <App />
          </HashRouter>
        </ConfigProvider>
      </div>
    )
  }
  return com
})()


export default HttpShow
