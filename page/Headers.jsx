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

  function canSelToNode(canSel) { // 按钮值转换为 node 结点
    return {
      [canSel]: canSel,
      copy: <icons.CopyOutlined />,
    }[canSel]
  }

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
    const initState = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(`HeadersState`))
      } catch (error) {
        console.log(error)
        // return {}
      }
      return { // 默认值
        activePanel: ['responseHeaders'],
        activePanelTab: {
          //// general: 'default', // 摘要
          responseHeaders: 'parse',
          requestHeaders: 'parse',
          queryStringParameters: 'parse',
          requestPayload: 'parse',
          formData: 'parse',
        },
      }
    })();
    console.log(`initState`, initState)

    const [state, setState] = useState(initState);

    function formatData(type, data, cfg) { // 格式化数据, 例如 url query 转 object; image 转 base64
      cfg = {
        keyToUpperCase: /Headers$/.exec(cfg.panelKey),
        headerRaw: /Headers$/.exec(cfg.panelKey),
        sortKey: /Headers$/.exec(cfg.panelKey),
        lineStr: cfg.activePanel.includes(cfg.panelKey) ? `` : `\r\n`, // 强制添加转行, 否则隐藏状态下复制时, 没有换行效果
        ...cfg,
      }
      if(cfg.sortKey) {
        data = sortKey(data)
      }

      return {
        source: obj => {
          if(cfg.headerRaw) {
            return `headerRaw`
          } else {
            return Qs.stringify(obj) // {中文: `你好`} => "%E4%B8%AD%E6%96%87=%E4%BD%A0%E5%A5%BD"
          }
        },
        encode: function (obj) {
          return this.parse(obj, 'encode')
        },
        json: obj => JSON.stringify(obj, null, 2),
        parse: (obj, action) => { // 对象转文件, 键名加粗
          return (
            <>
              {
                Object.keys(obj).map(key => {
                  const val = obj[key]
                  return (
                    <div key={key}>
                      <span className="key">{
                        (() => {
                          const res = cfg.keyToUpperCase ? wordToUpperCase(key) : key
                          return action === `encode` ? encodeURI(res) : res
                          // chrome network: key 使用的是 encodeURI, val 使用的是 encodeURIComponent
                          // 测试: axios.get('//httpbin.org/get', {params: {"中文@": "你好="}})
                          // 查看 view URL encoded 会发现 key 中的 @ 没有被转换, 即使用了 encodeURI
                          // %E4%B8%AD%E6%96%87@: %E4%BD%A0%E5%A5%BD%3D
                        })()
                      }</span>:
                      <span className="val">
                        {
                          (() => {
                            const res = typeof(val) === `object` ? JSON.stringify(val) : val
                            return action === `encode` ? encodeURIComponent(res) : res
                          })()
                          + cfg.lineStr
                        }
                      </span>
                    </div>
                  )
                })
              }
            </>
          )
        },
      }[type](data)
    }

    useEffect(() => {
      window.localStorage.setItem(`HeadersState`, JSON.stringify(state, null, 2))
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

    function collapseChange(val) {
      console.log(`val`, val)
      setState(preState => ({...deepSet(preState, `activePanel`, val)}))
    }

    function getPanelData({panelKey}) {
      return /Headers$/.exec(panelKey) ? // 如果是 headers 的时候, 处理 key 的顺序以大小写
        formatData(
          deepGet(state, `activePanelTab.${panelKey}`),
          getData(panelKey, apiData),
          {
            activePanel: state.activePanel,
            panelKey,
          },
        )
        :
          formatData(
            deepGet(state, `activePanelTab.${panelKey}`),
            getData(panelKey, apiData),
            {
              activePanel: state.activePanel,
              panelKey,
            }
          )
    }

    return (
      <div className="Headers">
        {JSON.stringify(state, null, 2)}
        <Collapse
          defaultActiveKey={state.activePanel}
          onChange={collapseChange}
        >
          {
            Object.keys(state.activePanelTab).map(panelKey => (
              <Panel
                forceRender // 就算是折叠状态也渲染 dom, 这样才能在没有展示时也能进入复制(读取 outerText)
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
                                const text = document.querySelector(`.panelBody.${panelKey} .panelData`).outerText
                                if(text && copyToClipboard(text)) {
                                  message.success(`复制成功`)
                                } else {
                                  message.error(`复制失败`)
                                }
                                return false
                              }
                              setState(preState => ({...deepSet(preState, `activePanelTab.${panelKey}`, canSel)}))
                            }}
                          >
                            {canSelToNode(canSel)}
                          </Tag.CheckableTag>
                        ))
                      }
                    </div>
                  </div>
                }
              >
                <div className={`panelBody ${panelKey}`}>
                  <pre className="panelData">
                    {getPanelData({panelKey})}
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
