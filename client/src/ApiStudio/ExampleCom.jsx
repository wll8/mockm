import './Edit.scss'
import React from 'react'
import utils from '../utils.jsx'
import * as antd from 'antd'
import EditTable from './EditTable.jsx'
import { DownOutlined } from '@ant-design/icons'
import common from '../common.jsx'

const {
  listToData,
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
  const [state, setState] = useState({
    type: `object`, // 根节点数据类型
    rule: ``, // 根节点数据生成规则
    templateRaw: ``, // 模板
    templateResult: ``, // string 生成的结果
    templateOrResult: `templateRaw`, // 要使用的响应 templateRaw|templateResult
    headers: ``, // 响应头
  })

  function exampleReSet() {
    const example = props.example || {}
    const headers = objOrLine(example.headers || { // 响应头
      "content-type": `application/json`,
    })
    const templateRaw = JSON.stringify(example.templateRaw || {data: {}}, null, 2)
    const templateResult = typeof(example.templateResult) === `object`
      ? JSON.stringify(example.templateResult, null, 2)
      : example.templateResult || `{}`
    setState(preState => ({
      ...preState,
      ...props.example,
      headers,
      templateRaw,
      templateResult,
    }))
  }

  useEffect(() => {
    [1, 2, 3].map(i => setTimeout(exampleReSet, i)) // hack: 设置初始键, 太南了
  }, [props.example])

  useEffect(templateToData, [state.templateRaw])

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
      let res
      let list = removeEmpty(JSON.parse(JSON.stringify(props.table))) || []
      list = list.map(item => { // 转换字符串为对应的 type
        let example = item.example || ``
        if(example.match(/^\/.*\/$/)) { // /*/ 形式的值视为正则
          // eslint-disable-next-line
          example = eval(example)
        }
        return {
          ...item,
          example: item.type === `number` ? Number(example) : example,
        }
      })
      res = list
      res = listToData(res, {rule: state.rule, type: state.type})
      const templateRaw = res
      return {
        ...preState,
        templateRaw: JSON.stringify(templateRaw, null, 2),
      }
    })
  }, [props.table, state.rule, state.type])

  function templateToData() {
    setState(preState => {
      let templateResult = ``
      try {
        templateResult = JSON.stringify(window.Mock.mock(
          JSON.parse(state.templateRaw || `{}`)
        ).data, null, 2)
      } catch (error) {
        console.log(`error`, error)
      }
      return {
        ...preState,
        templateResult,
      }
    })
  }

  function sendExampleComData() {
    const headers = objOrLine(state.headers)
    let checkOk = true
    let sendData = {
      ...state,
      headers,
    }
    if(state.templateOrResult === `templateResult`) { // 如果以 result 为值, 则先根据 content-type 校验
      const isToJson = headers[`content-type`].match(new RegExp(`^application/json`))
      if(isToJson) {
        try {
          const templateResult = JSON.parse(state.templateResult)
          sendData.templateResult = templateResult
        } catch (error) {
          checkOk = false
          message.error(`error 错误的 json 内容`)
        }
      }
    }
    if(checkOk) {
      // 删除用户未上传的内容
      delete sendData.templateRaw
      props.upLoad(sendData)
    }
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

  return (
    <Space direction="vertical" className="ExampleCom" style={{width: `100%`}}>
      <Card size="small" title="数据源">
        <Select style={{width: `100%`}} onChange={ev => onChange(ev, `templateOrResult`)} value={state.templateOrResult}>
          <Option value="templateRaw">{showTitle(`template`, `使用模板生成数据`)}</Option>
          <Option value="templateResult">{showTitle(`value`, `使用固定的值`)}</Option>
        </Select>
      </Card>
      <Card size="small" title="模板">
        <Input
          addonBefore={
            <Select onChange={ev => onChange(ev, `type`)} value={state.type}>
              <Option value="object">{showTitle(`object`, `以对象形式生成数据`)}</Option>
              <Option value="array">{showTitle(`array`, `以数组形式生成数据`)}</Option>
            </Select>
          }
          value={state.rule}
          onChange={ev => onChange(ev, `rule`)}
          placeholder="跟节点生成规则"
        />
        <p />
        <Input.TextArea
          value={state.templateRaw}
          onChange={val => onChange(val, `templateRaw`)}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </Card>
      <Card size="small" title="模板生成的值">
        <Input.TextArea
          value={state.templateResult}
          onChange={val => onChange(val, `templateResult`)}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </Card>
      <Card size="small" title="响应头">
        <Input.TextArea
          placeholder={`每行一个键值对:\nkey: val`}
          value={state.headers}
          onChange={val => onChange(val, `headers`)}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </Card>
      <p />
      <BtnList type="templateResult"/>
    </Space>
  )
}

export default ExampleCom
