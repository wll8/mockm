const {
  getSelectionText,
  getMethodUrl,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
  blobTool,
} = window.utils

window.HttpShow = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Collapse,
    Button,
    Tag,
    Tabs,
    BackTop,
    message,
    Spin,
  } = window.antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  const {
    HashRouter,
  } = window.ReactRouterDOM

  function com() {
    function App() {
      const {
        useHistory,
        useLocation,
        HashRouter,
        Route,
        Switch,
        Redirect,
      } = window.ReactRouterDOM
      const history = useHistory()


      const initState = (() => {
        try {
          return JSON.parse(window.localStorage.getItem(`HttpShowState`) || undefined)
        } catch (error) {
          console.log(error)
          // return {}
        }
        return { // 默认值
          activeTabs: `ReqRes`,
        }
      })();

      const [state, setState] = useState({ // 默认值
        ...initState,
        apiList: [],
        replayDone: true,
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
        const node = document.getElementById(`root`)
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
        if(replayDone) {
          setState(preState => ({...preState, replayDone: false}))
          http.get(`/${method},replay${api}`).then(({data, status, statusText, headers, config, request}) => {
            setState(preState => ({...preState, replayDone: true}))
            message.info(`重发请求成功 ${data.message}`)
            getHttpData({method, api})
          }).catch(err => {
            message.error(`重发失败 ${err}`)
          })
        } else {
          message.info('请等待重发结束')
        }
      }

      function tabsChange(key) {
        console.log(key);
        setState(preState => ({...deepSet(preState, `activeTabs`, key)}))
      }

      const location = useLocation();


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
        const fullApi = `${method.toLocaleUpperCase()} ${api}`
        console.log(`fullApi`, fullApi)
        http.get(`${method},getHttpData${api}`).then(res => {
          const newData = {
            method,
            api,
            data: res.data,
          }
          setState(preState => ({
            ...preState,
            fullApi,
            httpData: newData,
            simpleInfo: getSimpleInfo(newData),
          }))
        })
      }

      useEffect(() => {
        window.localStorage.setItem(`HttpShowState`, JSON.stringify({activeTabs: state.activeTabs}, null, 2))
      }, [state.activeTabs]);

      useEffect(() => {
        console.log(`location`, location)
        console.log(`location.pathname`, location.pathname)
        // const [, method, api] = window.location.hash.match(/#\/(\w+)(.*)/) || []
        const [, method, api] = (`#${location.pathname}${location.search}`).match(/#\/(\w+)(.*)/) || []
        setState(preState => ({ // 当路由改变时, 清理上一次路由中的数据
          ...preState,
          httpData: {},
          captureImg: undefined,
        }))
        if(method && api) { // 如果 true 显示某个 api 信息; 否则显示所有 api 列表
          getHttpData({method, api})
        } else {
          http.get(`GET,getApiList/`).then(res => {
            const newData = res.data
            setState(preState => ({...deepSet(preState, `apiList`, newData)}))
          })
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
      }, [location]);

      const tabList = {
        ReqRes,
        // Doc: () => `Doc`,
      }
      return (
        <Switch>
          <Route exact path="/">
            <ApiList apiList={state.apiList} />
          </Route>
          <Route path="/*">
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
                <Button onClick={() => history.push(`/`)} size="small" className="replay">apiList</Button>
                <Button onClick={replay} size="small" className="replay">replay</Button>
                <Button onClick={capture} size="small" type={state.captureImg ? `primary` : `default`} className="capture">capture</Button>
                <div className={`optionsPreViewRes ${state.captureImg && `show`}`}>
                  {state.captureImg && <img className="captureImg" src={state.captureImg} alt="captureImg"/>}
              </div>
              </div>
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
        <HashRouter>
          <BackTop />
          <App />
        </HashRouter>
      </div>
    )
  }

  return com
})()
