import React from 'react'
import * as ReactRouterDOM from 'react-router-dom'
import * as antd from 'antd'

const {
  Button,
} = antd
const {
  useHistory,
} = ReactRouterDOM

function ToList() {
  const reactHistory = useHistory()
  return (
    <Button onClick={() => reactHistory.push(`/`)} size="small" className="replay">apiList</Button>
  )
}

export default ToList
