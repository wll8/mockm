const {
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
  } = React
  const {
    Collapse,
    Button,
    Tag,
    Tabs,
  } = window.antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function callback(key) {
    console.log(key);
  }

  function com() {
    // 【计数器改写方法一】 React Hooks之useContext
    // https://blog.csdn.net/weixin_44282875/article/details/85336106

    const [state, setState] = useState({ // 默认值
      httpData: undefined,
    });

    const tabList = {
      Headers,
      Preview: () => `Preview`,
      Response: () => `Response`,
      Timing: () => `Timing`,
      Cookies: () => `Cookies`,
      Doc: () => `Doc`,
    }

    const method = `GET`
    const api = `/api/options/?page=1&pageSize=9999`
    const http = axios.create({
      baseURL: `http://localhost:9005/`,
      timeout: 1000,
      headers: {'X-Custom-Header': 'foobar'}
    });
    useEffect(() => {
      http(`${method},getHttpData${api}`).then(res => {
        const newData = {
          method,
          api: `${api}`,
          data: res.data,
        }
        console.log(`newData`, newData)
        setState({httpData: newData})
      })
      // ... dom api
    }, []);

    return (
      <div className="HttpShow">
        <Tabs animated={false} defaultActiveKey="Headers" onChange={callback}>
          {
            Object.keys(tabList).map(key => (
              <TabPane tab={key} key={key}>
                {
                  state.httpData ?
                    (() => {
                      const ComName = tabList[key]
                      return <ComName {...{httpData: state.httpData}}></ComName>
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
