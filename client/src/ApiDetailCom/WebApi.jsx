import React from 'react'
import common from '../common.jsx'
import utils from '../utils.jsx'
import * as icons from '@ant-design/icons'
import * as antd from 'antd'
import * as ReactRouterDOM from 'react-router-dom'

const {
  http,
  cfg,
} = common

const {
  showTitle,
  docLink,
} = utils

const {
  useState,
} = React
const {
  message,
  Button,
  Popconfirm,
  Dropdown,
  Menu,
} = antd
const {
  DownOutlined,
  UserOutlined,
} = icons

function FixedResponse({httpData}) {
  const [state, setState] = useState({ // 默认值
    replayDone: true, // 是否重放结束
  });
  const path = new URL(`http://127.0.0.1${httpData.api}`).pathname

  const {
    useHistory,
    useLocation,
  } = ReactRouterDOM
  const history = useHistory()

  function fn() {
    setState(preState => ({...preState, replayDone: false}))
    const method = httpData.method
    const apiId = httpData.apiId
    http.patch(`${cfg.baseURL}/api/studio/`, {
      setPath: [`paths`, path, method, `responses`, 200, `example`],
      data: {
        useDataType: `history`,
        history: apiId,
      }
    }
    ).then(res => {
      message.info(`设置成功`)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    })
  }

  function handleMenuClick(e) {
    const handle = {
      fixed() {
        fn()
      },
      switch() {
        http.post(`${cfg.baseURL}/api/changeWebApiStatus/`, {api: `${httpData.method} ${httpData.api}`}).then(res => {
          message.info(`操作成功`)
          setTimeout(() => {
            window.location.reload()
          }, 500)
        })
      },
      detail() {
        window.open(`#/apiStudio/edit?path=${path}&method=${httpData.method}`)
      },
    }[e.key]
    handle()
  }

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="fixed">
        {showTitle(`使用此记录`, `总是以这条记录的响应作为此接口的返回值, 这将自动创建或修改接口.`)}
      </Menu.Item>
      <Menu.Item key="switch" disabled={!httpData.webApi}>
        {(httpData.webApi || {}).disable ? `启用` : `禁用`}
      </Menu.Item>
      <Menu.Item key="detail" disabled={!httpData.webApi}>
        编辑
      </Menu.Item>
    </Menu>
  )

  return (
    <Dropdown
      overlay={menu}
    >
      <Button size="small">
        webApi <DownOutlined />
      </Button>
    </Dropdown>
  )
}

export default FixedResponse
