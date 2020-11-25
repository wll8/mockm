import React from 'react'
import * as antd from 'antd'
import utils from '../utils.jsx'
import common from '../common.jsx'
import './List.scss'
import * as querystring from 'qs'

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
  } = antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function Com(props) {
    const [state, setState] = useState({
      apiListData: {
        results: [],
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
            <a href={`#/apiStudio/edit?${url}`}>
              {record.path}
            </a>
          )
        }
      },
      {
        title: 'method',
        width: 60,
        dataIndex: 'method',
      },
      {
        title: 'des',
        width: 200,
        dataIndex: 'description',
      },
      {
        title: ( // 表头操作
          <div>
            <Button
              title="在当前结点下面添加字段"
              size="small"
              onClick={() => window.location.href = "#/apiStudio/edit" }
            >
              +
            </Button>
          </div>
        ),
        width: 80,
        render: (...record) => {
          record = record[1]
          const fn = () => {
            const setPath = `paths.${record.path}.${record.method}`
            http.post(`${cfg.baseURL}/api/removeApi/`, {setPath}).then(res => {
              getApiList()
            })
          }
          return (
            <div>
              <Popconfirm
                title="确定删除此API?"
                onConfirm={fn}
                okText="是"
                cancelText="否"
              >
                <Button
                  title="删除此API"
                  size="small"
                >
                  -
                </Button>
              </Popconfirm>
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
        const list = Object.keys(res).map(path => {
          return Object.keys(res[path]).map(method => ({
            key: `${method} ${path}`,
            path,
            method,
            ...res[path][method],
          }))
        }).flat()
        setState(preState => ({...deepSet(preState, `apiListData`, {
          results: list,
        })}))
      })
    }
    return (
      <div className="ApiList">
        <Table
          bordered
          size="small"
          rowKey="key"
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
