import React from 'react'
import * as antd from 'antd'
import utils from '../utils.jsx'
import common from '../common.jsx'
import './List.scss'
import * as querystring from 'qs'
import * as icons from '@ant-design/icons'

const $ = window.$
const HotKey = window.HotKey
const {
  http,
  cfg,
} = common
const {
  getSelectionText,
  getMethodUrl,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
  dateDiff,
} = utils

const ApiList = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Table,
    Collapse,
    Button,
    Tag,
    Tabs,
    Popconfirm,
    BackTop,
    message,
    Spin,
    Switch,
    Divider,
  } = antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function Com(props) {
    const [state, setState] = useState({
      loading: false,
      apiListData: {
        results: [],
        disable: [],
      },
    })

    const columnsApiList = [
      {
        title: 'path',
        ellipsis: true,
        width: 200,
        render: record => {
          const url = querystring.stringify({
            path: record.path,
            method: record.method,
          }, { encode: false })
          return (
            record.type === `apiWeb` ?
              <a href={`#/apiStudio/edit?${url}`}>
                {record.path}
              </a>
              : record.path
          )
        }
      },
      {
        title: 'method',
        width: 60,
        dataIndex: 'method',
        render: record => record || `--`,
      },
      {
        title: 'description',
        width: 200,
        dataIndex: 'description',
      },
      {
        title: 'type',
        width: 80,
        dataIndex: 'type',
      },
      {
        title: (record) => { // 表头操作
          const disableFn = (val) => {
            setState(preState => ({...deepSet(preState, `loading`, true)}))
            http.post(`${cfg.baseURL}/api/changeWebApiStatus/`, {api: `/`, val}).then(res => {
              setState(preState => ({...deepSet(preState, `loading`, false)}))
              getApiList()
            })
          }
          return (
            <div className="title operation">
              <icons.PlusOutlined onClick={() => window.location.href = "#/apiStudio/edit" } />
              <Divider type="vertical" />
              <Switch
                size="small"
                loading={state.loading}
                checked={state.apiListData.disable.includes(`/`) === false}
                onChange={disableFn}
              />
            </div>
          )
        },
        width: 80,
        render: (...record) => {
          const {type, path, method} = record[1]
          const api = `${method} ${path}`
          const deleteFn = () => {
            const setPath = [`paths`, path, method]
            http.post(`${cfg.baseURL}/api/removeApi/`, {setPath}).then(res => {
              getApiList()
            })
          }
          const disableFn = (val) => {
            setState(preState => ({...deepSet(preState, `loading`, true)}))
            http.post(`${cfg.baseURL}/api/changeWebApiStatus/`, {api: api, val}).then(res => {
              setState(preState => ({...deepSet(preState, `loading`, false)}))
              getApiList()
            })
          }
          return (
            <div className={`${type} apiType operation`}>
              <Popconfirm
                title="确定删除此API?"
                onConfirm={deleteFn}
                okText="是"
                cancelText="否"
              >
                <icons.MinusOutlined />
              </Popconfirm>
              <Divider type="vertical" />
              <Switch
                size="small"
                loading={state.loading}
                disabled={state.apiListData.disable.includes(`/`)}
                checked={state.apiListData.disable.includes(api) === false}
                onChange={disableFn}
              />
            </div>
          )
        },
        dataIndex: 'operation',
      },
    ];

    useEffect(() => {
      getApiList()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function getApiList (params = {}) {
      http.get(`${cfg.baseURL}/api/studio/`, {params}).then(res => {
        const list = res.api.map((item, index) => ({index, ...item}))
        const disable = res.disable
        setState(preState => ({...deepSet(preState, `apiListData`, {
          results: list,
          disable,
        })}))
      })
    }
    return (
      <div className="ApiList">
        <Table
          bordered
          size="small"
          rowKey="index"
          pagination={false}
          columns={columnsApiList}
          dataSource={state.apiListData.results}
        />
      </div>
    )
  }

  return Com
})()

export default ApiList
