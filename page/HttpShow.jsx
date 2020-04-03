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
  } = window.antd

  const { Panel } = Collapse;


  const httpData = {
    "api001": {
      "req": {
        "headers": {
          "host": "localhost:9004",
          "connection": "keep-alive",
          "content-length": "501",
          "accept": "application/json, text/plain, */*",
          "sec-fetch-dest": "empty",
        },
        "body": {
          "receiveDate": "2020-03-31",
          "effectiveDate": "2020-03-31",
          "regulatorLocationId": 53,
          "registryDeptId": 1,
          "effectiveStatus": 2
        },
        "query": {
          "docType": "10",
          "pageSize": "9999",
          "docID": "32"
        },
        "path": "/api/regulations/"
      },
      "res": {
        "info": {
          "status": 200,
          "statusText": "OK"
        },
        "headers": {
          "server": "nginx/1.13.7",
          "date": "Tue, 31 Mar 2020 07:44:08 GMT",
          "content-type": "application/json",
        },
        "body": {
          "contentType": "application/json",
          "extensionName": "json",
          "bodyPath": "./httpData//api_regulations_POST_body_18.json"
        }
      }
    },
  }

  const activePanelTabCanSel = { // 可选值
    // general: [`default`],
    responseHeaders: [],
    requestHeaders: [],
    queryStringParameters: [`encode`,`encodeURI`],
    requestPayload: [],
    formData: [`encode`,`encodeURI`],
  }
  Object.keys(activePanelTabCanSel).forEach(key => ( // 添加公用按钮
    activePanelTabCanSel[key] = [...[`copy`, `parsed`, `source`], ...activePanelTabCanSel[key]]
  ))

  function demo() {
    const [state, setState] = useState({ // 默认值
      activePanel: ['responseHeaders'],
      activePanelTab: {
        //// general: 'default', // 摘要
        responseHeaders: 'parsed', // parsed | source
        requestHeaders: 'parsed', // parsed | source
        queryStringParameters: 'parsed', // source | encode | encodeURI
        requestPayload: 'parsed', // parsed | source
        formData: 'parsed', // source | encode | encodeURI
      },
    });

    // 类似 componentDidMount 和 componentDidUpdate: 挂载后, 更新后
    useEffect(() => {
      // ... dom api
    });

    const apiData = httpData.api001
    function getData(type, apiData) { // 根据 state 中的 key , 返回在 apiData 中的数据
      // HTTP请求中 request payload 和 formData  区别？
      // https://www.cnblogs.com/tugenhua0707/p/8975615.html
      return {
        responseHeaders: deepGet(apiData, `res.headers`),
        requestHeaders: deepGet(apiData, `req.headers`),
        queryStringParameters: deepGet(apiData, `req.query`), // query 参数
        requestPayload: deepGet(apiData, `req.body`), // application/json 或 multipart/form-data
        formData: deepGet(apiData, `res.form`, 'null'), //  application/x-www-form-urlencoded
      }[type]
    }


    return (
      <div className="HttpShow">
        <Collapse bordered={false} defaultActiveKey={state.activePanel}>
          {
            Object.keys(state.activePanelTab).map(panelKey => (
              <Panel
                key={panelKey}
                header={
                  <div>
                    <span>
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
                          <Tag
                            className="tag"
                            key={canSel}
                            onClick={() => {
                              if([`copy`].includes(canSel)) { // 不写入 header 选项的值
                                console.log(`canSel`, canSel)
                                return false
                              }
                              setState(preState => ({...deepSet(preState, `activePanelTab.${panelKey}`, canSel)}))
                            }}
                          >
                            {canSel}
                          </Tag>
                        ))
                      }
                    </div>
                  </div>
                }
              >
                <div className="panelBody">
                  <pre>
                    {
                      /Headers$/.exec(panelKey) ? // 如果是 headers 的时候, 处理 key 的顺序以大小写
                        formatData(`objectToText`, sortKey(getData(panelKey, apiData)), {keyToUpperCase: true})
                        : formatData(`objectToText`, getData(panelKey, apiData))
                    }
                    {
                      JSON.stringify(state, null, 2)
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

  return demo
})()
