import React from 'react'
import * as ReactRouterDOM from 'react-router-dom'
import * as antd from 'antd'
import * as icons from '@ant-design/icons'
import utils from './utils.jsx'
import common from './common.jsx'
import ReqRes from './ReqRes.jsx'
import Capture from './ApiDetailCom/Capture.jsx'
import Replay from './ApiDetailCom/Replay.jsx'
import Swagger from './ApiDetailCom/Swagger.jsx'
import ApiHistory from './ApiDetailCom/ApiHistory.jsx'
import './ApiDetail.scss'

const {
  http,
  cfg,
} = common

const $ = window.$
const HotKey = window.HotKey

const {
  getSelectionText,
  deepGet,
  deepSet,
} = utils

const ApiDetail = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Collapse,
    Button,
    Tabs,
    message,
    Spin,
    Table,
  } = antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function Com() {
    const {
      useHistory,
      useLocation,
    } = ReactRouterDOM

    const initState = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(`ApiDetailState`)) || {}
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
      httpData: {},
      showHistry: false,
      dataApiHistry: [],
      parseHashData: {}, // 解析 hash 参数得到的信息
      captureImg: undefined, // 截图 objectUrl
    });

    function captureCb(res) {
      setState(preState => ({...preState, captureImg: res}))
    }

    function tabsChange(key) {
      console.log(key);
      setState(preState => ({...deepSet(preState, `activeTabs`, key)}))
    }

    const reactLocation = useLocation();

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

    function getHttpData({method, api, parseHashData}) {
      console.log(`method, api`, method, api)
      const fullApi = window.decodeURIComponent(`${method} ${api}`)
      console.log(`fullApi`, fullApi, state.parseHashData)
      http.get(`${cfg.baseURL}/api/getHttpData/${method}${api}`).then(data => {
        const [, apiId = undefined] = window.location.hash.match(/#\/history,(\w+)/) || []
        const newData = {
          method,
          api,
          api0: `${method}${api}`,
          apiId, // todo 这里不一定是 id, 可能会导致错误
          data,
        }
        setState(preState => ({
          ...preState,
          parseHashData,
          captureImg: undefined,
          fullApi,
          httpData: newData,
          simpleInfo: getSimpleInfo(newData),
        }))
      })
    }

    function parseHash() {
      let res = {}
      if(reactLocation.pathname.match(/^\/(\w+),(.*)/)) { // 如果 url 上有 /id,123/post/books/ 类似的参数, 则先取出 `id,123` 参数
        let [, argList, path] = reactLocation.pathname.match(/\/(.*?)(\/.*)/)
        const [action, ...actionArg] = argList.split(',')
        const actionArgStr = actionArg.join(`,`)
        res = {...res, action, actionArg, actionArgStr}
        const [, method, api] = (`#${path}${reactLocation.search}`).match(/#\/(\w+)(.*)/) || []
        res = {...res, method, api}
      } else {
        const [, method, api] = (`#${reactLocation.pathname}${reactLocation.search}`).match(/#\/(\w+)(.*)/) || []
        res = {...res, method, api}
      }
      return res
    }

    useEffect(() => {
      window.localStorage.setItem(`ApiDetailState`, JSON.stringify({activeTabs: state.activeTabs}, null, 2))
    }, [state.activeTabs]);

    useEffect(() => {
      console.log(`location`, reactLocation)
      console.log(`location.pathname`, reactLocation.pathname)
      const parseHashData = parseHash()
      const {api, method, action, actionArg} = parseHashData
      if(method && api) { // 如果 true 显示某个 api 信息; 否则显示所有 api 列表
        getHttpData({method, api, parseHashData})
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reactLocation]);

    const tabList = {
      ReqRes,
      // Doc: () => `Doc`,
    }

    return (
      <div className="ApiDetail">
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
          <Replay method={state.httpData.method} api={state.httpData.api} />
          <Capture cb={captureCb} captureImg={state.captureImg} />
          {
            state?.httpData?.data?.req?.lineHeaders?.line
              &&  <Swagger
                    authorization={state.httpData.data.req.lineHeaders.headers.authorization}
                    method={state.httpData.data.req.lineHeaders.line.method}
                    path={state.httpData.data.req.lineHeaders.line.path}
                  />
          }
          <ApiHistory apiId={state.httpData.apiId} api0={state.httpData.api0} />
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
      </div>
    )
  }
  return Com
})()

export default ApiDetail
