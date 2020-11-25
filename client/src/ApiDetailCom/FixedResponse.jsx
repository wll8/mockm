import React from 'react'
import common from '../common.jsx'
import utils from '../utils.jsx'
import * as icons from '@ant-design/icons'
import * as antd from 'antd'

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
} = antd

function FixedResponse({httpData}) {
  const [state, setState] = useState({ // 默认值
    replayDone: true, // 是否重放结束
  });

  function fn() {
    setState(preState => ({...preState, replayDone: false}))
    const path = new URL(`http://127.0.0.1${httpData.api}`).pathname
    const method = httpData.method
    const apiId = httpData.apiId
    http.patch(`${cfg.baseURL}/api/studio/`, {
      setPath: `paths.${path}`,
      data: {
        [method]: {
          responses: {
            200: {
              example: {
                useDataType: `history`,
                history: apiId,
              }
            }
          }
        }
      }
    }
    ).then(res => {
      message.info(`设置成功`)
    }).catch(err => {
      message.error(`重发失败 ${err}`)
    })
  }


  return (
    <Popconfirm
      title={
        <div>总是以这条记录的响应作为此接口的返回值, 这将自动创建或修改{docLink(`接口`, `/use/webui.html#接口`)}.</div>
      }
      onConfirm={fn}
      okText="是"
      cancelText="否"
    >
      <Button size="small">fixed</Button>
    </Popconfirm>
  )
}

export default FixedResponse
