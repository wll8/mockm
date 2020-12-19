import React from 'react'
import * as antd from 'antd'
import utils from '../utils.jsx'
import common from '../common.jsx'
import { FastBackwardFilled } from '@ant-design/icons'

function TranslateCom(props) {
  const {
    onChange,
  } = utils
  const {
    Button,
    Input,
    Modal,
  } = antd
  const {
    useState,
    useImperativeHandle,
    useEffect,
    useRef,
  } = React
  const {
    http,
    cfg,
  } = common

  useImperativeHandle(props.cRef, () => ({
    show,
  }))

  const [state, setState] = useState({ // 默认值
    text: ``,
    translateRes: [],
    confirmLoading: false,
    enclosure: undefined, // isModalVisible 显示时的附件, 当点击 ok 时会再返回
    isModalVisible: props.isModalVisible,
  })

  function handleCancel() {
    setState(preState => ({
      ...preState,
      isModalVisible: false,
    }))
  }

  function show(enclosure) {
    setState(preState => ({
      ...preState,
      isModalVisible: true,
      enclosure,
    }))
  }

  function handleOk() {
    setState(preState => ({
      ...preState,
      confirmLoading: true,
    }))
    http.post(`${cfg.baseURL}/api/translate/`, {text: state.text}).then(res => {
      props.onOk({
        data: res,
        enclosure: state.enclosure,
      })
    }).finally(() => {
      setState(preState => ({
        ...preState,
        isModalVisible: false,
        confirmLoading: false,
      }))
    })
  }

  return (
    <div>
      <Modal
        title="从文本自动转换"
        visible={state.isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={state.confirmLoading}
      >
        <Input.TextArea
          defaultValue={state.text}
          rows={5} onChange={val => onChange(val, `text`, {state, setState})}
        />
      </Modal>
    </div>
  )
}
export default TranslateCom
