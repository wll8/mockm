const {
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
  } = window.antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function com() {
    // 【计数器改写方法一】 React Hooks之useContext
    // https://blog.csdn.net/weixin_44282875/article/details/85336106

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
      fullApi: `GET /api/options/?page=1&pageSize=9999`,
      // fullApi: `GET /static/static/hot.95598193.png`,
      // fullApi: `POST /api/dynamicdatatemplate/search/?a=1&b=2`,
    });

    const tabList = {
      ReqRes,
      Headers,
      Preview,
      // Preview: () => `Preview`,
      Response: () => `Response`,
      Timing: () => `Timing`,
      Cookies: () => `Cookies`,
      Doc: () => `Doc`,
    }

    const {method, api} = getMethodUrl(state.fullApi)

    function tabsChange(key) {
      console.log(key);
      setState(preState => ({...deepSet(preState, `activeTabs`, key)}))
    }

    useEffect(() => {
      window.localStorage.setItem(`HttpShowState`, JSON.stringify({activeTabs: state.activeTabs}, null, 2))
    }, [state.activeTabs]);

    useEffect(() => {
      http.get(`${method},getHttpData${api}`).then(res => {
        const newData = {
          method,
          api,
          data: res.data,
        }
        setState(preState => ({...deepSet(preState, `httpData`, newData)}))
      })
    }, [state.fullApi]);

    return (
      <div className="HttpShow">
        {state.fullApi}
        <Tabs animated={false} defaultActiveKey={state.activeTabs} onChange={tabsChange}>
          {
            Object.keys(tabList).map(key => (
              <TabPane tab={key} key={key}>
                {
                  state.httpData ?
                    (() => {
                      const ComName = tabList[key]
                      return <ComName {...state} />
                    })()
                  : `(暂无)`
                }
              </TabPane>
            ))
          }
        </Tabs>
      </div>
    )
  }

  return com
})()
