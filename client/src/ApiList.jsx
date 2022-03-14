import React from 'react'
import * as antd from 'antd'
import utils from './utils.jsx'
import jSchema from './JsonSchemaEditorVisual'
import variable from './variable'
import common from './common.jsx'
import './ApiList.scss'

console.log(`variable.MOCK_SOURCE`, variable.MOCK_SOURCE)
const ResBodySchema = jSchema({ lang: 'zh_CN', mock: variable.MOCK_SOURCE });

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
    BackTop,
    message,
    Spin,
  } = antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function Com(props) {
    const [state, setState] = useState({
      loading: false,
      defaultPageSize: 100,
      defaultPageIndex: 1,
      defaultSort: `date`,
      defaultOrder: `desc`,
      apiListData: {
        count: 0,
        results: [],
      },
    })

    const columnsApiList = [
      {
        title: 'api',
        sorter: true,
        ellipsis: true,
        render: record => {
          return (
            <a href={`#/history,${record.id}/${record.method}${record.api}`}>
              {record.api}
            </a>
          )
        }
      },
      {
        title: 'id',
        width: 80,
        dataIndex: 'id',
        sorter: true,
      },
      {
        title: 'code',
        width: 100,
        dataIndex: 'statusCode',
        sorter: true,
      },
      {
        title: 'type',
        width: 100,
        dataIndex: 'extensionName',
        sorter: true,
      },
      {
        title: 'method',
        width: 120,
        dataIndex: 'method',
        sorter: true,
      },
      {
        title: 'date',
        width: 100,
        dataIndex: 'date',
        sorter: true,
        defaultSortOrder: 'descend',
        render: record => {
          // return dayjs(record).format('YYYY-MM-DD HH:mm:ss')
          return dateDiff(new Date(record))
        }
      },
    ];

    function onChange(pagination, filters, sorter, extra) {
      console.log('params', pagination, filters, sorter, extra);
      getApiList({
        _sort: sorter.field,
        _order: {ascend: `asc`, descend: `desc`}[sorter.order || `ascend`],
        _page: pagination.current,
        _limit: pagination.pageSize,
      })
    }

    useEffect(() => {
      getApiList()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function getApiList (params = {
      _sort: state.defaultSort,
      _order: state.defaultOrder,
      _page: state.defaultPageIndex,
      _limit: state.defaultPageSize,
      }) {
      setState(preState => ({...preState, loading: true}))
      http.get(`${cfg.baseURL}/api/getApiList/`, {params}).then(res => {
        res.results = res.results.map((item, key) => ({...item, key}))
        setState(preState => ({...deepSet(preState, `apiListData`, res)}))
      }).finally(() => {
        setState(preState => ({...preState, loading: false}))
      })
    }
    const testData = {
      "type": "object",
      "title": "title",
      "properties": {
        "name": {
          "type": "string",
          "mock": {
            "mock": "@cname"
          }
        },
        "title": {
          "type": "string",
          "mock": {
            "mock": "@ctitle"
          }
        }
      },
      "required": [
        "name",
        "title"
      ]
    }
    return (
      <div className="ApiList">
        <ResBodySchema
          onChange={text => {
            console.log(`text`, text)
          }}
          isMock={false}
          data={''}
        />
        <Table scroll={{x: 800}} loading={state.loading} size="small" rowKey="key" pagination={{
          defaultPageSize: state.defaultPageSize,
          total: state.apiListData.count,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `Total ${total} items`,
        }} columns={columnsApiList} dataSource={state.apiListData.results} onChange={onChange} />
      </div>
    )
  }

  return Com
})()

export default ApiList
