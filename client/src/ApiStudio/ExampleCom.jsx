import './Edit.scss'
import React from 'react'
import utils from '../utils.jsx'
import * as antd from 'antd'
import EditTable from './EditTable.jsx'
import { DownOutlined } from '@ant-design/icons'
import common from '../common.jsx'

const {
  objOrLine,
  debounce,
  removeEmpty,
  deepGet,
  deepSet,
  showTitle,
} = utils

const {
  http,
  cfg,
} = common

const {
  Space,
  Card,
  Checkbox,
  message,
  Alert,
  Button,
  Menu,
  Dropdown,
  Tabs,
  Select,
  Input,
} = antd


const { TabPane } = Tabs
const { Option } = Select

function ExampleCom(props) {
  const propsExampleCom = props
  const {
    useState,
    useEffect,
    useRef,
  } = React

  const initStateData = initState()
  const [state, setState] = useState({
    type: `object`, // 根节点数据类型
    rule: ``, // 根节点数据生成规则
    table: props.table,
    custom: ``,
    tableToStrData: ``,
    getApiIdDetailsRes: {
      headers: {},
      data: {},
    },
    useDataType: `table`, // 要使用的响应 table|custom
    ...initStateData,
  })

  function initState () {
    const example = props.example || {}
    const headers = objOrLine(example.headers || {})
    return {
      ...example,
      headers,
    }
  }

  function exampleReSet() {
    setState(preState => ({...preState, ...initState()}))
  }

  function onChange(ev, stateKey) {
    if(ev === null) {
      return false
    }
    let value = ev
    if(typeof(ev.persist) === `function`) { // 绑定 event 形式的 value
      ev.persist()
      value = ev.target.value
    } else if(ev.target && ev.target.checked !== undefined) {
      value = ev.target.checked
    }
    console.log(`valuevaluevalue`, value)
    const oldValue = deepGet(state, stateKey)
    if(JSON.stringify(oldValue) !== JSON.stringify(value)) {
      setState(preState => ({...deepSet(preState, stateKey, value)}))
    }
  }

  useEffect(() => {
    setState(preState => {
      tableToData()
      return preState
    })
    // eslint-disable-next-line
  }, [props.table, state.rule, state.type])

  useEffect(() => {
    setState(preState => {
      getApiIdDetails()
      return preState
    })
    // eslint-disable-next-line
  }, [state.history])

  async function tableToData() {
    const data = await http.post(`${cfg.baseURL}/api/listToData/`, {
      table: props.table,
      rule: state.rule,
      type: state.type,
    }).catch(err => console.log(err))
    const str = JSON.stringify( data, null, 2 )
    setState(preState => {
      return {
        ...preState,
        tableToStrData: str,
      }
    })
  }

  function sendExampleComData() {
    let err // 校验错误, 如果有录入错误则不进行提交
    let sendData = {
      ...props.example,
      useDataType: state.useDataType,
    }
    if(state.useDataType === `table`) {
      sendData.rule = state.rule
      sendData.type = state.type
      sendData.headers = objOrLine(state.headers)
      Object.keys(sendData.headers).some(key => {
        const val = sendData.headers[key]
        if(key.toLowerCase() === `content-type` && val.toLowerCase().trim() !== `application/json`) {
          err = `table 模式下仅允许 content-type 值为 application/json`
        } else if(escape(key).includes(`%u`)){
          err = `${key} 不能含有非英文字符`
        }
        return err
      })
    }
    if(state.useDataType === `custom`) { // 如果以 result 为值, 则先根据 content-type 校验
      sendData.custom = state.custom
      if(!state.custom) {
        err = `请输入自定义内容`
      }
    }
    if(state.useDataType === `history`) { // 如果以 result 为值, 则先根据 content-type 校验
      sendData.history = state.history
      if(!state.history) {
        err = `请输入请求ID`
      }
    }
    if(err) {
      message.error(err)
    } else {
      props.upLoad(sendData)
    }
  }

  function getApiIdDetails() {
    const id = state.history
    id && http.get(`${cfg.baseURL}/api/getApiResponseById,${state.history}/`, {_raw: true}).then((res) => {
      setState(preState => ({...preState, getApiIdDetailsRes: res}))
    })
  }

  function BtnList(props) {
    return (
      <>
        <Space>
          <Button
            size="small"
            onClick={propsExampleCom.close}
          >
            {showTitle(`取消`, `放弃所有修改`)}
          </Button>
          <Button
            size="small"
            onClick={exampleReSet}
          >
            {showTitle(`重置`, `使用服务器配置重置`)}
          </Button>
          <Button
            onClick={sendExampleComData}
            size="small"
          >
            {showTitle(`上传`, `上传当前配置到服务器`)}
          </Button>
        </Space>
      </>
    )

  }

  function useDataTypeToCom() {
    return {
      history: (
        <>
          <Input
            addonBefore="请求ID"
            addonAfter={
              <Button
                size="small"
              >
                {/* todo x-test-api 应根据配置文件获取 */}
                <a target="_blank" rel="noopener noreferrer" href={state.getApiIdDetailsRes.headers[`x-test-api`]}>查看此记录</a>
              </Button>
            }
            value={state.history}
            onChange={ev => onChange(ev, `history`)}
            placeholder="区分大小写"
          />
          <p />
          响应头
          <Input.TextArea
            disabled
            value={objOrLine(state.getApiIdDetailsRes.headers)}
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
          <p />
          响应体
          <Input.TextArea
            disabled
            value={
              (() => {
                const data = state.getApiIdDetailsRes.data
                return typeof(data) === `string` ? data : JSON.stringify(data, null, 2)
              })()
            }
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
        </>
      ),
      custom: (
        <>
          <Input.TextArea
            placeholder="自定义接口响应逻辑"
            value={state.custom}
            onChange={val => onChange(val, `custom`)}
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
        </>
      ),
      table: (
        <>
          <Input
            disabled={propsExampleCom.type === `req`}
            addonBefore={
              <Select disabled={propsExampleCom.type === `req`} onChange={ev => onChange(ev, `type`)} value={state.type}>
                <Option value="object">{showTitle(`object`, `以对象形式生成数据`)}</Option>
                <Option value="array">{showTitle(`array`, `以数组形式生成数据`)}</Option>
              </Select>
            }
            addonAfter={
              <Button
                size="small"
                onClick={tableToData}
              >
                {showTitle(`示例`, `使用浏览器上的数据表格生成数据`)}
              </Button>
            }
            value={state.rule}
            onChange={ev => onChange(ev, `rule`)}
            placeholder="生成规则"
          />
          <p />
          <Input.TextArea
            disabled
            value={state.tableToStrData}
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
          <p />
          <Input.TextArea
            disabled={propsExampleCom.hand.method === 'ws' || propsExampleCom.type === `req` }
            placeholder={`响应头, 每行一个键值对:\nkey: val`}
            value={state.headers}
            onChange={val => onChange(val, `headers`)}
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </>
      ),
    }[state.useDataType]
  }

  return (
    <Space direction="vertical" className="ExampleCom" style={{width: `100%`}}>
      <Card size="small" title="数据源">
        <Select disabled={propsExampleCom.type === `req`} style={{width: `100%`}} onChange={ev => onChange(ev, `useDataType`)} value={state.useDataType}>
          <Option value="table">{showTitle(`表格`, `使用表格生成数据`)}</Option>
          <Option value="custom">{showTitle(`自定义`, `以编程方式处理接口`)}</Option>
          <Option disabled={propsExampleCom.method === 'ws'} value="history">{showTitle(`请求历史`, `使用已有请求记录的响应`)}</Option>
        </Select>
        <p />
        {useDataTypeToCom()}
      </Card>
      <p />
      {propsExampleCom.type === `res` && <BtnList />}
    </Space>
  )
}



export default ExampleCom
