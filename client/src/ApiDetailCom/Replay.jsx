import React from 'react'
import common from '../common.jsx'
import * as icons from '@ant-design/icons'
import * as antd from 'antd'

const {
  http,
  cfg,
} = common

const {
  useState,
} = React
const {
  message,
  Button,
} = antd

function Replay({method, api}) {
  const [state, setState] = useState({ // 默认值
    replayDone: true, // 是否重放结束
  });

  function replay() {
    setState(preState => ({...preState, replayDone: false}))
    http.get(`${cfg.baseURL}/api/replay/${method}${api}`).then(res => {
      setState(preState => ({...preState, replayDone: true}))
      message.info(`重发请求成功 ${res.message}`)
    }).catch(err => {
      message.error(`重发失败 ${err}`)
    })
  }

  return (
    <Button onClick={replay} size="small" className="replay">replay <icons.LoadingOutlined style={{display: state.replayDone ? `none` : undefined}} /> </Button>
  )
}

export default Replay
