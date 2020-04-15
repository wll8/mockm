// http 协议概述
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Overview

const {
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
} = window.utils

window.ReqRes = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React

  const {
    Collapse,
    Button,
    Tag,
    message,
  } = window.antd

  const { Panel } = Collapse;

  function com(props) {
    const activePanelCanSel = { // 可选值
      activePanel: [`req`, `res`],
      activePanelPanel: {
        req: [`lineHeaders`, `body`],
        res: [`lineHeaders`, `body`],
      },
    }
    const initState = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(`ReqResState`) || undefined)
      } catch (error) {
        console.log(error)
        // return {}
      }
      return { // 默认值
        activePanel: [`req`],
        activePanelPanel: {
          req: [`lineHeaders`],
          res: [`lineHeaders`],
        },
      }
    })();
    const [state, setState] = useState({
      ...initState,
      newHttpData: props.httpData,
    });
    console.log(`initState`, initState)

    const newHttpData = state.newHttpData
    console.log(`httpData`, newHttpData)
    console.log(`newHttpData`, state.newHttpData)
    const {data: {req, res}} = newHttpData
    const resDataObj = {
      req,
      res,
    }
    console.log(`resDataObj`, resDataObj)


    useEffect(() => {
      // ...
    });

    useEffect(() => {
      function getAllTypeBody(reqOrRes) {
        deepGet(state, `newHttpData.data.${reqOrRes}.bodyPath`) && http.get(`${newHttpData.method},getBodyFile${toUpperCase(reqOrRes)}${newHttpData.api}`, {responseType: 'blob'}).then(res => {
          const blob = res.data
          Promise.all([
            blobTool(blob, `toText`),
            blobTool(blob, `toBase64`),
            blobTool(blob, `toObjectURL`),
          ]).then(res => {
            let [
              bodyText,
              bodyBase64,
              bodyObjectURL,
            ] = res
            if(blob.type === `application/json`) {
              bodyText = JSON.stringify(JSON.parse(bodyText), null, 2)
            }
            const newRes = {
              ...deepGet(state, `newHttpData.data.${reqOrRes}`, {}),
              bodyBlob: blob,
              bodyText,
              bodyBase64,
              bodyObjectURL,
            }
            setState(preState => ({...deepSet(preState, `newHttpData.data.${reqOrRes}`, newRes)}))
          })
        })
      }
      getAllTypeBody(`res`)
      getAllTypeBody(`req`)
    }, []);

    function toUpperCase(str) {
      return str.replace(/(.)(.*)/, ($0, $1, $2) => $1.toLocaleUpperCase()+$2)
    }

    function preview({panel: reqOrRes, panelPanel}) {
      const jsonRender = json => {
        let jsonObj = {}
        if(typeof(json) === `string`) {
          jsonObj = JSON.parse(json)
        } else {
          jsonObj = json
        }
        const ReactJson = reactJsonView.default
        return <ReactJson {...{
          indentWidth: 2,
          displayObjectSize: false,
          enableClipboard: true,
          name: false,
          displayDataTypes: false,
          src: jsonObj,
        }} />
      }

      function wrap({type, chidren}) {
        return <div className={`preview ${type}`}>{chidren}</div>
      }
      if(panelPanel === `lineHeaders`) {
        const json = deepGet(state, `newHttpData.data.${reqOrRes}.lineHeaders`)
        return wrap({type: `application/json`, chidren: jsonRender(json)})
      }

      const keyPath = `newHttpData.data.${reqOrRes}.lineHeaders.headers.content-type`
      const {
        bodyBlob,
        bodyBase64,
        bodyText,
        bodyObjectURL,
      } = deepGet(state, `newHttpData.data.${reqOrRes}`)
      const contentType = deepGet(state, keyPath, '').split(`;`)[0]
      const shortType = contentType.replace(/\/.*/, '')
      const file = `http://localhost:9005/${newHttpData.method},getBodyFile${toUpperCase(reqOrRes)}${newHttpData.api}`
      const noPreRender = obj => (
        <div className="noPre">
          <div className="msg">此文件类型暂不支持预览:</div>
          <div className="type">{contentType}</div>
          <div className="msg">链接:</div>
          <div className="linkBox"><a className="link" rel="noopener" target="_blank" href={file}>{file}</a></div>
        </div>
      )
      const bodyTextRender = obj => (
        <div className="ComShowText">
          {bodyText || ''}
        </div>
      )

      const heightTextRender = obj => ( // 如果是文本的时候, 获取 type 传给格式化工具, 例如: text/css => css
        <div className="ComHeightText">
          颜色高亮: {bodyText}
        </div>
      )

      const dom = (() => {
        let getDom = (({ // 根据 contentType 渲染 dom
          "text/html": () => (
            <iframe className="htmlViewIframe" src={bodyObjectURL}></iframe>
            // <object className="htmlViewIframe" data={bodyObjectURL} type="text/html"></object>
          ),
          "application/json": () => jsonRender(bodyText),
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
          // "image": () => <img src={bodyObjectURL} alt={file} />,
          "message": noPreRender,
          "model": noPreRender,
          "text": heightTextRender,
          "video": () => <video controls><source src={file} type={contentType} /></video>,
          "x-conference": noPreRender,
          "font": noPreRender,
          "undefined": noPreRender,
          "": noPreRender,
        })[shortType])

        return getDom
      })()
      return wrap({type: contentType, chidren: dom()})
    }

    function collapseChange(val, key) {
      console.log(`val`, {val, key})
      setState(preState => ({...deepSet(preState, key, val)}))
    }

    function comDetails(props) {
      const [state, setState] = useState(JSON.parse(JSON.stringify(props)))
      function removeItem(arr, val) {
        arr = [...arr]
        var index = arr.indexOf(val);
        if (index > -1) {
          arr.splice(index, 1);
        }
        return arr
      }
      function collapseChange(val, key) {
        const oldList = deepGet(state, key)
        const newList = oldList.some(item => item === val) ? removeItem(oldList, val) : [...oldList, val]
        setState(preState => {
          const newState = {...deepSet(preState, key, newList)}
          props.cb(newState)
          return newState
        })
      }

      function copyBtn(ev, ...arg) {
        console.log(`evev`, ev, arg)
        return false
        ev.nativeEvent.stopImmediatePropagation()
        ev.stopPropagation()
      }

      return (
        <div
          className="detailsBox"
        >
          {
            activePanelCanSel.activePanel.map(panel => {
              return (
                <details
                  disabled
                  key={panel}
                  open={props.activePanel.includes(panel)}
                >
                  <summary
                    onClick={val => collapseChange(panel, `activePanel`)}
                  >{panel}</summary>
                  <div>
                    {
                      activePanelCanSel.activePanelPanel[panel].filter(item => (
                        (item !== `body`)
                        || (item === `body`) && (deepGet(newHttpData, `data.${panel}.bodyPath`) !== undefined) // 当 bodyPath 为空时, 不渲染 body 折叠面板
                      )).map(panelPanel => {
                        return (
                          <details
                            key={panelPanel}
                            open={props.activePanelPanel[panel].includes(panelPanel)}
                          >
                            <summary
                              onClick={val => collapseChange(panelPanel, `activePanelPanel.${panel}`)}
                            >
                              {panelPanel}
                              {/* <button onClick={(ev) => copyBtn(ev, 1,2,3)}>copy</button> */}
                            </summary>
                            <div className="content">
                              {preview({panel, panelPanel})}
                            </div>
                          </details>
                        )
                      })
                    }
                  </div>
                </details>
              )
            })
          }
        </div>
      )
    }
    return (
      <div className="ReqRes">
        {comDetails({
          activePanel: state.activePanel,
          activePanelPanel: state.activePanelPanel,
          cb: (val) => {
            console.log(`collapseChange`, val)
            window.localStorage.setItem(`ReqResState`, JSON.stringify(val, null, 2))
            // collapseChange(val, keyPath)
          }
        })}
      </div>
    )
  }

  return com
})()
