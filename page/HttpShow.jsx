const {
  getSelectionText,
  getMethodUrl,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
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
    useLocation,
    HashRouter,
    Route,
    Switch,
    Redirect,
  } = window.ReactRouterDOM

  function com() {
    function App() {
      const {
        useLocation,
        HashRouter,
        Route,
        Switch,
        Redirect,
      } = window.ReactRouterDOM

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
        // fullApi: `GET /api/options/?page=1&pageSize=999`,
        // fullApi: `POST /api/auth/login/`,
        // fullApi: `PUT /api/regulations/2020200019/normal/`, // 500 => html
        // fullApi: `GET /static/static/hot.95598193.png`,
        // fullApi: `POST /api/dynamicdatatemplate/search/?a=1&b=2`,
      });

      function savePage() {
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
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                [blob.type]: blob
              })
            ]);
            message.success(`复制图片成功`)
          } catch(err) {
            console.error(err.name, err.message);
            message.error(`复制图片失败: ${err.message}, ${err.message}`)
          }
        });
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

      useEffect(() => {
        window.localStorage.setItem(`HttpShowState`, JSON.stringify({activeTabs: state.activeTabs}, null, 2))
      }, [state.activeTabs]);

      useEffect(() => {
        const [, method, api] = window.location.hash.match(/#\/(\w+)(.*)/) || []
        setState(preState => ({...preState, httpData: {}}))
        if(method && api) { // 如果 true 显示某个 api 信息; 否则显示所有 api 列表
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

        } else {
          http.get(`GET,getApiList/`).then(res => {
            const newData = res.data
            setState(preState => ({...deepSet(preState, `apiList`, newData)}))
          })
        }

        const hotKey = new HotKey();
        hotKey.add(`CTRL+C`, ev => {
          if(!getSelectionText()) { // 如果没有选择任何文本
            savePage()
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
