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
    const templateRaw = JSON.stringify(example.autoUploadTemplateRaw ? example.templateRawTable : example.templateRaw, null, 2)
    const templateResult = JSON.stringify(example.templateResult, null, 2)
    setState(preState => ({
      autoUploadTemplateRaw: undefined, // 是否根据字段定义自动更新模板
      ...preState,
      ...props.example,
      templateRaw,
      templateRawOld: templateRaw,
      templateResult,
      templateResultOld: templateResult,
    }))
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
      if(stateKey === `headers`) {
        value = objOrLine(value)
      }
      setState(preState => ({...deepSet(preState, stateKey, value)}))
    }
  }

  useEffect(() => {
    setState(preState => {
      let res
      if(preState.autoUploadTemplateRaw === false && props.example.templateRaw) {
        const templateRaw = JSON.stringify(props.example.templateRaw, null, 2)
        const dataKey = templateRaw.match(/"(data\|?.*)"/)[1]
        let data = JSON.parse(templateRaw)[dataKey]
        res = Array.isArray(data) ? data[0] : data
        console.log(`datadatadatadata`, res)
      } else {
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
      }
      res = listToData(res, {rule: state.rule, type: state.type})
      const templateRaw = res
      return {
        ...preState,
        templateRaw: JSON.stringify(templateRaw, null, 2),
      }
    })
  }, [state.rule, state.type])

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
    props.upLoad(sendData)
  }

  function BtnList(props) {
    return (
      <>
        <Space>
          <Button
            size="small"
          >
            {showTitle(`取消`, `放弃所有修改`)}
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
        <Checkbox
          checked={state.autoUploadTemplateRaw}
          onChange={val => onChange(val, `autoUploadTemplateRaw`)}
        >
          {(showTitle(`根据字段定义自动更新模板`, `勾选时表示服务器不存储自定义的模板`))}
        </Checkbox>
        <p />
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
          defaultValue={objOrLine(state.headers)}
          onBlur={val => onChange(val, `headers`)}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </Card>
      <BtnList type="templateResult"/>
    </Space>
  )
}

export default ExampleCom
