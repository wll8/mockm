import './Edit.scss'
import React from 'react'
import utils from '../utils.jsx'
import * as antd from 'antd'
import { DownOutlined } from '@ant-design/icons'
import common from '../common.jsx'

const {
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
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const [state, setState] = useState({
    // autoUploadTemplateRaw: true, // 自动更新模板
    type: `object`, // 根节点数据类型
    rule: ``, // 根节点数据生成规则
    templateRaw: ``, // 模板
    templateResult: ``, // string 生成的结果
    templateOrResult: `templateRaw`, // 要使用的响应 templateRaw|templateResult
    headers: { // 响应头
      "content-type": `application/json`,
    },
  })

  useEffect(() => {
    const example = props.example || {}
    const templateRaw = JSON.stringify(example.templateRaw, null, 2)
    const templateResult = JSON.stringify(example.templateResult, null, 2)
    setState(preState => ({
      ...preState,
      ...props.example,
      templateRaw,
      templateRawOld: templateRaw,
      templateResult,
      templateResultOld: templateResult,
    }))
  }, [props.example])

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
    function listToData(list){ // 把类似 schema 的列表转换为数据
      const res = {}
      list.forEach(item => {
        if([`object`, `array`].includes(item.type) && Array.isArray(item.children)) {
          switch(item.type) {
            case `object`:
              res[item.name] = listToData(item.children)
              break;
            case `array`:
              res[item.name] = res[item.name] || []
              res[item.name].push(listToData(item.children))
              break;
            default:
              console.log(`no type`, item.type)
          }
        } else {
          res[item.name] = item.example
        }
      })
      return res
    }
    const data = listToData(list)
    setState(preState => {
      const templateRaw = {
        [`data${state.rule ? `|${state.rule}` : ''}`]: {object: data, array: [data]}[state.type]
      }
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

  function sendExampleComData(data) {
    const sendData = {
      ...state,
      ...{
        templateRaw: data,
        templateResult: data,
      },
      templateRawOld: undefined,
      templateResultOld: undefined,
    }
    // 删除用户未上传的内容
    delete sendData[{templateRaw: `templateResult`, templateResult: `templateRaw`}[state.templateOrResult]]
    props.onChange(sendData)
  }

  return (
    <div className="ExampleCom">
      <Input
        addonBefore={
          <Select onChange={ev => onChange(ev, `type`)} value={state.type}>
            <Option value="object">{showTitle(`object`, `以对象形式生成数据`)}</Option>
            <Option value="array">{showTitle(`array`, `以数组形式生成数据`)}</Option>
          </Select>
        }
        addonAfter={
          <Select onChange={ev => onChange(ev, `templateOrResult`)} value={state.templateOrResult}>
            <Option value="templateRaw">{showTitle(`template`, `使用模板生成数据`)}</Option>
            <Option value="templateResult">{showTitle(`value`, `使用固定的值`)}</Option>
          </Select>
        }
        value={state.rule}
        onChange={ev => onChange(ev, `rule`)}
        placeholder="跟节点生成规则"
      />
      <p />
      <div className="btnBox">
        <Button
          size="small"
          disabled={state.templateOrResult === `templateRaw`}
          onClick={templateToData}
        >
          {showTitle(`生成`, `使用当前模板生成数据`)}
        </Button>
        <Button
          size="small"
          onClick={() => {
            setState(preState => ({
              ...preState,
              ...{
                templateRaw: {templateRaw: preState.templateRawOld,},
                templateResult: {templateResult: preState.templateResultOld,},
              }[preState.templateOrResult],
            }))
          }}
        >
          {showTitle(`重置`, `使用服务器配置重置`)}
        </Button>
        <Button
          onClick={() => {
            if(state.templateOrResult === `templateResult`) { // 如果以 result 为值, 则先根据 content-type 校验
              const isToJson = state.headers[`content-type`].match(new RegExp(`^application/json`))
              if(isToJson) {
                try {
                  const templateResult = JSON.parse(state.templateResult)
                  sendExampleComData(templateResult)
                } catch (error) {
                  message.error(`error 错误的 json 内容`)
                }
              }
            } else if(state.templateOrResult === `templateRaw`) { // 如果以模板为值, 先校验模板
              try {
                const templateRaw = JSON.parse(state.templateRaw)
                sendExampleComData(templateRaw)
              } catch (error) {
                message.error(`error 错误的 template 内容`)
              }
            }
          }}
          size="small"
        >
          {showTitle(`上传`, `上传当前配置到服务器`)}
        </Button>
        {/* <Checkbox
          checked={state.autoUploadTemplateRaw}
          onChange={val => onChange(val, `autoUploadTemplateRaw`)}
        >
          自动更新模板
        </Checkbox> */}
      </div>
      <p />
      <div className="infoBox">
        {state.templateOrResult === `templateResult` && <Input.TextArea
          value={state.templateResult}
          onChange={val => onChange(val, `templateResult`)}
          autoSize
        />}
        {state.templateOrResult === `templateRaw` && <Input.TextArea
          value={state.templateRaw}
          onChange={val => onChange(val, `templateRaw`)}
          autoSize
        />}
      </div>
    </div>
  )
}

export default ExampleCom
