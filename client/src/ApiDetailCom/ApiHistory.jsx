import React from 'react'
import * as ReactRouterDOM from 'react-router-dom'
import * as antd from 'antd'
import utils from '../utils.jsx'
import common from '../common.jsx'

const {
  http,
  cfg,
} = common

const {
  dateDiff,
  deepSet,
} = utils

const {
  useHistory,
  useLocation,
} = ReactRouterDOM

const {
  Drawer,
  Button,
  Table,
} = antd

const {
  useState,
} = React

function ApiHistory(props) {
  const reactHistory = useHistory()
  const reactLocation = useLocation()
  const [state, setState] = useState({ // 默认值
    captureImg: undefined, // 截图 objectUrl
  })

  const columnsApiHistry = [
    {
      title: 'id',
      dataIndex: 'id',
    },
    {
      title: 'date',
      dataIndex: 'date',
      sorter: (a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime(),
      defaultSortOrder: 'descend',
      render: record => {
        // return dayjs(record).format('YYYY-MM-DD HH:mm:ss')
        return dateDiff(new Date(record))
      }
    },
    {
      title: 'code',
      dataIndex: 'statusCode',
      sorter: (a, b) => a.statusCode - b.statusCode,
    },
    {
      title: 'res',
      dataIndex: 'resBodySize',
      sorter: (a, b) => b.resBodySize - a.resBodySize,
    },
    {
      title: 'req',
      dataIndex: 'reqBodySize',
      sorter: (a, b) => b.reqBodySize - a.reqBodySize,
    },
  ]

  function historyFn(isShow) {
    setState(preState => ({...deepSet(preState, `showHistry`, isShow)}))
    isShow && http.get(`${cfg.baseURL}/api/getApiHistry/${props.api0}`).then(res => {
      console.log(`resres`, res)
      res = res.map((item, key) => ({...item, key}))
      setState(preState => ({...deepSet(preState, `dataApiHistry`, res)}))
    })
  }

  return (
    <>
      <Button onClick={() => historyFn(true)} size="small" className="history">history</Button>
      <Drawer
        className="drawer"
        title="history"
        width="none"
        onClose={() => historyFn(false)}
        visible={state.showHistry}
      >
        <Table
          onRow={record => {
            return {
              onClick: event => {
                reactHistory.push(`/history,${record.id}/${record.method}${record.api}`)
              },
            };
          }}
          rowClassName={(record, index) => {
            const fullHistoryUrl = reactLocation.pathname.match(/\/history,(\w+)/) // 判断是否是含有 id 的 url
            const res = ((record.id === props.apiId) // 有 apiId 时高亮匹配当前 id 的行
              || ((fullHistoryUrl === null) && (index === 0)) // 没有 appId 时, 高亮第一行
            )
              ? `curItem index_${index}`
              : `index_${index}`
            return res
          }}
          showHeader={true}
          rowKey="key"
          size="small"
          pagination={false}
          columns={columnsApiHistry}
          dataSource={state.dataApiHistry}
        />
      </Drawer>
    </>
  )
}

export default ApiHistory
