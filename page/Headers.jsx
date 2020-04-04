// axios.post('//httpbin.org/post', Qs.stringify({中文: `你好`}))
// axios.get('//httpbin.org/get', {params: {"中文": "你好"}})
const {
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
} = window.utils

window.Headers = (() => {
  const {
    useState,
    useEffect,
  } = React
  const {
    Collapse,
    Button,
    Tag,
    message,
  } = window.antd

  const { Panel } = Collapse;

  const activePanelTabCanSel = { // 可选值
    // general: [`default`],
    responseHeaders: [`parse`],
    requestHeaders: [`parse`],
    queryStringParameters: [`parse`,`encode`],
    requestPayload: [`parse`],
    formData: [`parse`,`encode`],
  }
  Object.keys(activePanelTabCanSel).forEach(key => ( // 添加公用按钮
    activePanelTabCanSel[key] = [...activePanelTabCanSel[key], ...[
      `source`,
      `json`,
      `copy`,
    ]]
  ))

  function com(props) {
    const [state, setState] = useState({ // 默认值
      activePanel: ['responseHeaders'],
      activePanelTab: {
        //// general: 'default', // 摘要
        responseHeaders: 'parse',
        requestHeaders: 'parse',
        queryStringParameters: 'parse',
        requestPayload: 'parse',
        formData: 'parse',
      },
    });

    // 类似 componentDidMount 和 componentDidUpdate: 挂载后, 更新后
    useEffect(() => {
      // ... dom api
    });
    const apiData = props.httpData.data
    function getData(type, apiData) { // 根据 state 中的 key , 返回在 apiData 中的数据
      // HTTP请求中 request payload 和 formData  区别？
      // https://www.cnblogs.com/tugenhua0707/p/8975615.html
      return {
        responseHeaders: deepGet(apiData, `res.headers`),
        requestHeaders: deepGet(apiData, `req.headers`),
        queryStringParameters: deepGet(apiData, `req.query`), // query 参数
        requestPayload: deepGet(apiData, `req.body`), // application/json 或 multipart/form-data
        formData: deepGet(apiData, `req.form`, 'null'), //  application/x-www-form-urlencoded
      }[type]
    }

    return (
      <div className="Headers">
        {JSON.stringify(state, null, 2)}
        <Collapse
          defaultActiveKey={state.activePanel}
        >
          {
            Object.keys(state.activePanelTab).map(panelKey => (
              <Panel
                key={panelKey}
                header={
                  <div>
                    <span className="panelTitle">
                      {
                        wordToUpperCase(panelKey.replace(/([A-Z])/g,` $1`)) // 小驼峰转空格
                          // .replace(/(^|_)(\w)/g, (m, $1 ,$2) => ` ${$2.toUpperCase()}`) // 下划线转大驼峰
                      }
                    </span>
                    <div
                      className="btnList"
                      onClick={(e) => {
                        // react 阻止事件冒泡 https://www.cnblogs.com/yadiblogs/p/10137413.html
                        console.log('合成事件')
                        e.nativeEvent.stopImmediatePropagation() // 阻止原生冒泡
                        e.stopPropagation() // 阻止 react 合成冒泡
                      }}
                    >
                      {
                        activePanelTabCanSel[panelKey].map(canSel => (
                          <Tag.CheckableTag
                            className="tag"
                            checked={canSel === state.activePanelTab[panelKey]}
                            key={canSel}
                            onChange={() => {
                              if([`copy`].includes(canSel)) { // 不写入 header 选项的值
                                if(copyToClipboard(document.querySelector(`.panelBody.${panelKey} .panelData`).outerText)) {
                                  message.success(`复制成功`)
                                } else {
                                  message.error(`复制失败`)
                                }
                                return false
                              }
                              setState(preState => ({...deepSet(preState, `activePanelTab.${panelKey}`, canSel)}))
                            }}
                          >
                            {canSel}
                          </Tag.CheckableTag>
                        ))
                      }
                    </div>
                  </div>
                }
              >
                <div className={`panelBody ${panelKey}`}>
                  <pre className="panelData">
                    {
                      /Headers$/.exec(panelKey) ? // 如果是 headers 的时候, 处理 key 的顺序以大小写
                        formatData(
                          deepGet(state, `activePanelTab.${panelKey}`),
                          sortKey(getData(panelKey, apiData)),
                          {
                            keyToUpperCase: true,
                            headerRaw: true,
                          },
                        )
                        :
                          formatData(
                            deepGet(state, `activePanelTab.${panelKey}`),
                            getData(panelKey, apiData),
                          )
                    }
                  </pre>
                </div>
              </Panel>
            ))
          }
        </Collapse>
      </div>
    )
  }

  return com
})()
