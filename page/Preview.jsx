const {
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
  fetchDownload,
} = window.utils

window.Preview = (() => {
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

  function com(props) {
    const initState = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(`PreviewState`) || undefined)
      } catch (error) {
        console.log(error)
      }
      return { // 默认值
        activePanel: ['responseBody'],
        activePanelTab: {
          responseBody: `preview`,
          // requestBody: `base64`,
        },
      }
    })();

    const [state, setState] = useState(initState);
    const httpData = props.httpData
    const file = `http://localhost:9005/${httpData.method},getBodyFile${httpData.api}`
    const contentType = httpData.data.res.headers[`content-type`]
    const shortType = contentType.replace(/\/.*/, '')

    const activePanelTabCanSel = { // 可选值
      responseBody: [],
      // requestBody: [`base64`],
    }
    Object.keys(activePanelTabCanSel).forEach(key => ( // 添加公用按钮
      activePanelTabCanSel[key] = [...activePanelTabCanSel[key], ...[
        `preview`,
        `base64`,
        `url`,
        `download`,
        `copy`,
        `open`,
      ]]
    ))

    useEffect(() => {
      window.localStorage.setItem(`PreviewState`, JSON.stringify(state, null, 2))
      // ... dom api
    });


    function ComShowBase64(props) { // 组件, 根据 api 渲染 base64
      const [state, setState] = useState('');

      useEffect(() => {
        if(state === ``) {
          fetch(file).then(res => res.blob()).then(blob => {
            let reader = new FileReader();
            reader.readAsDataURL(blob); // 转换为 base64, 直接放入 a 标签的 href 可用于下载
            reader.onload = res => {
              const base64 = res.target.result
              console.log(`resresres`, base64.length)
              setState(base64)
            }
            console.log(`reader`, reader.result)
          })
        }
      }, [state]);

      return (
        <div {...props} className={`ComShowBase64 ${props.className || ''}`}>
          {state ? (
            <a onClick={() => {
              const newWindow = window.open(``)
              newWindow.document.write(`<iframe style="border: 0;" width="100%" height="100%" src="${state}"></iframe>`)
              newWindow.document.body.style.margin = 0
            }} rel="noopener" target="_blank"
            >
              {state}
            </a>
          ) : `(暂无)`}
        </div>
      )
    }

    function ComShowFileContent(props) { // 组件, 根据 api 和 type 渲染文本文件内容
      const [state, setState] = useState('');

      useEffect(() => {
        if(state === ``) {
          http(props.file).then(res => {
            console.log(`resresres`, res.data)
            setState(JSON.stringify(res.data, null, 2))
          })
        }
      }, [state]);

      return (
        <div {...props} className={`ComShowFileContent ${props.className || ''}`}>
          {state ? state : `(暂无)`}
        </div>
      )

    }

    function canSelToNode(canSel) { // 按钮值转换为 node 结点
      return {
        [canSel]: canSel,
        copy: <icons.CopyOutlined />,
        download: <icons.DownloadOutlined />,
        open: <IconFont type="icon-open" />,
      }[canSel]
    }

    function formatData(type, data, cfg) { // 格式化数据, 例如 url query 转 object; image 转 base64
      cfg = {
        ...cfg,
      }
      return {
        preview: obj => {
          const noPre = obj => (
            <div className="noPre">
              <div className="msg">此文件类型暂不支持预览:</div>
              <div className="type">{contentType}</div>
              <div className="type">链接:</div>
              <div className="link"><a rel="noopener" target="_blank" href={file}>{file}</a></div>
            </div>
          )
          const dom = (() => {
            return ({
              "application": () => {
                const isText = [
                    `application/javascript`,
                    `application/json`,
                    `application/xml`,
                  ].includes(contentType)
                if(isText) {
                  return <ComShowFileContent file={file}/>
                } else {
                  return noPre()
                }
              },
              "audio": () => <audio controls><source src={file} type={contentType}></source></audio>,
              "chemical": noPre,
              "image": () => <img src={file} alt={file} />,
              "message": noPre,
              "model": noPre,
              "text": () => <ComShowFileContent file={file} />, // 如果是文件的时候, 获取 type 传给格式化工具, 例如: text/css => css
              "video": noPre, // <video controls><source src={src} type={type}></video>
              "x-conference": noPre,
              "font": noPre,
              "undefined": noPre,
            })[shortType]
          })()
          return dom()
        },
        base64: obj => {
          return <ComShowBase64 />
        },
        url: obj => <div className="link"><a rel="noopener" target="_blank" href={file}>{file}</a></div>,
        download: obj => `download`,
      }[type](data)
    }

    function getData(type) { // 根据 state 中的 key , 返回在 httpData 中的数据
      // HTTP请求中 request payload 和 formData  区别？
      // https://www.cnblogs.com/tugenhua0707/p/8975615.html
      return {
        responseBody: deepGet(httpData, `data.res.body`),
        // requestBody: deepGet(httpData, `data.req.body`),
      }[type]
    }

    function collapseChange(val) {
      console.log(`val`, val)
      setState(preState => ({...deepSet(preState, `activePanel`, val)}))
    }

    function getPanelData({panelKey}) {
      return formatData(
        deepGet(state, `activePanelTab.${panelKey}`),
        getData(panelKey, httpData),
        {
          activePanel: state.activePanel,
          panelKey,
        }
      )
    }

    return (
      <div className="Headers Preview">
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
                              if([`copy`, `download`, `open`].includes(canSel)) { // 不写入 header 选项的值
                                if(canSel === `copy`) {
                                  const text = document.querySelector(`.panelBody.${panelKey} .panelData`).outerText
                                  if(text && copyToClipboard(text)) {
                                    message.success(`复制成功`)
                                  } else {
                                    message.error(`复制失败`)
                                  }
                                }
                                if(canSel === `download`) {
                                  fetchDownload(file)
                                }
                                if(canSel === `open`) {
                                  window.open(file)
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
                  <pre className={`panelData ${state.activePanelTab[panelKey]} ${shortType}`}>
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
