const {
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
  fetchDownload,
  blobTool,
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
        return JSON.parse(window.localStorage.getItem(`PreviewState`)) || {}
      } catch (error) {
        console.log(error)
      }
      return { // 默认值
        resBodyBlob: undefined,
        resBodyText: undefined,
        resBodyBase64: undefined,
        activePanel: ['responseBody'],
        activePanelTab: {
          responseBody: `preview`,
          // requestBody: `base64`,
        },
      }
    })();

    const [state, setState] = useState(initState);
    const httpData = props.httpData
    const resBodyBlob = state.resBodyBlob
    const resBodyBase64 = state.resBodyBase64
    const resBodyText = state.resBodyText
    const resBodyObjectURL = state.resBodyObjectURL
    const file = `${cfg.baseURL}/${httpData.method},getBodyFile${httpData.api}`
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
      http.get(`${cfg.baseURL}/api/getBodyFile/${httpData.method}${httpData.api}`, {responseType: 'blob'}).then(res => {
        const blob = res
        setState(preState => ({...deepSet(preState, `resBodyBlob`, blob)}))
        blobTool(blob, `toText`).then(res => {
          if(blob.type === `application/json`) {
            res = JSON.stringify(JSON.parse(res), null, 2)
          }
          setState(preState => ({...deepSet(preState, `resBodyText`, res)}))
        })
        blobTool(blob, `toBase64`).then(res => {
          setState(preState => ({...deepSet(preState, `resBodyBase64`, res)}))
        })
        blobTool(blob, `toObjectURL`).then(res => {
          setState(preState => ({...deepSet(preState, `resBodyObjectURL`, res)}))
        })
      })
    }, []);

    useEffect(() => {
      window.localStorage.setItem(`PreviewState`, JSON.stringify({
        activePanel: state.activePanel,
        activePanelTab: state.activePanelTab,
      }, null, 2))
    });


    function canSelToNode(canSel) { // 按钮值转换为 node 结点
      return {
        [canSel]: canSel,
        copy: <icons.CopyOutlined />,
        download: <icons.DownloadOutlined />,
        open: <IconFont type="icon-open" />,
      }[canSel]
    }

    function base64Render() {
      return (
        <div className="ComShowBase64">
          {resBodyBase64 ? (
            <a className="link" onClick={() => {
              const newWindow = window.open(``)
              newWindow.document.write(`<iframe style="border: 0;" width="100%" height="100%" src="${resBodyBase64}"></iframe>`)
              newWindow.document.body.style.margin = 0
            }} rel="noopener" target="_blank"
            >
              {resBodyBase64}
            </a>
          ) : `(暂无)`}
        </div>
      )
    }

    function formatData(type, data, cfg) { // 格式化数据, 例如 url query 转 object; image 转 base64
      cfg = {
        ...cfg,
      }
      return {
        preview: obj => {
          const noPreRender = obj => (
            <div className="noPre">
              <div className="msg">此文件类型暂不支持预览:</div>
              <div className="type">{contentType}</div>
              <div className="msg">链接:</div>
              <div className="linkBox"><a className="link" rel="noopener" target="_blank" href={file}>{file}</a></div>
            </div>
          )
          const resBodyTextRender = obj => (
            <div className="ComShowText">
              {resBodyText || ''}
            </div>
          )

          const heightTextRender = obj => ( // 如果是文本的时候, 获取 type 传给格式化工具, 例如: text/css => css
            <div className="ComHeightText">
              颜色高亮: {resBodyText}
            </div>
          )

          const dom = (() => {
            let getDom = (({ // 根据 contentType 渲染 dom
              "text/html": () => (
                <iframe className="htmlViewIframe" src={resBodyObjectURL}></iframe>
              ),
              // "application/json": resBodyTextRender,
              "application/json": resBodyTextRender,
            })[contentType] || ({ // 如果 contentType 没有匹配, 则根据大类(shortType)渲染
              "application": () => {
                const isLanguage = [
                    `application/javascript`,
                    `application/xml`,
                  ].includes(contentType)
                if(isLanguage) {
                  return heightTextRender() // 使用颜色高亮进行渲染
                } else {
                  return noPreRender()
                }
              },
              "audio": () => <audio controls><source src={file} type={contentType}></source></audio>,
              "chemical": noPreRender,
              "image": () => <img src={file} alt={file} />,
              // "image": () => <img src={resBodyObjectURL} alt={file} />,
              "message": noPreRender,
              "model": noPreRender,
              "text": heightTextRender,
              "video": () => <video controls><source src={file} type={contentType} /></video>,
              "x-conference": noPreRender,
              "font": noPreRender,
              "undefined": noPreRender,
            })[shortType])


            return getDom
          })()
          return dom()
        },
        base64: base64Render,
        url: obj => <div className="link"><a className="link" rel="noopener" target="_blank" href={file}>{file}</a></div>,
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
                                  blobTool(resBodyBlob, `download`, file.replace(/.*\//, ''))
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
