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
    type: `object`, // 根结点数据类型
    rule: ``, // 根结点数据生成规则
    templateRaw: ``, // 模板
    templateResult: ``, // string 生成的结果
    response: `template`, // 要使用的响应 template|value
    headers: {
      "content-type": `application/json`,
    }, // 响应头
  })

  function onChange(ev, stateKey) {
    if(ev === null) {
      return false
    }
    let value = ev
    if(typeof(ev.persist) === `function`) { // 绑定 event 形式的 value
      ev.persist()
      value = ev.target.value
    }
    const oldValue = deepGet(state, stateKey)
    if(JSON.stringify(oldValue) !== JSON.stringify(value)) {
      setState(preState => ({...deepSet(preState, stateKey, value)}))
    }
  }

  useEffect(() => {
    props.onChange(state)
    // eslint-disable-next-line
  }, [state])

  useEffect(() => {
    let list = removeEmpty(JSON.parse(JSON.stringify(props.list))) || []
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
      const templateResult = JSON.stringify(window.Mock.mock(templateRaw).data, null, 2)
      return {
        ...preState,
        templateResult,
        templateRaw: JSON.stringify(templateRaw, null, 2),
      }
    })
  }, [props.list, state.rule, state.type])

  useEffect(() => {
    setState(preState => {
      console.log(`state.templateRaw`, state.templateRaw)
      let templateResult = ``
      try {
        templateResult = JSON.stringify(window.Mock.mock(
          JSON.parse(state.templateRaw)
        ).data, null, 2)
      } catch (error) {
        console.log(`error`, error)
      }
      return {
        ...preState,
        templateResult,
      }
    })
  }, [state.templateRaw])

  function sendExampleComData(data, type) {
    http.patch(`${cfg.baseURL}/api/studio/`, {
      path: props.path,
      setPath: `response.example`,
      data: {
        ...state,
        templateResult: type !== `templateResult` ? undefined : data,
        templateRaw: type !== `templateRaw` ? undefined : data
      },
    }).then(res => {
      message.info(`上传成功`)
      console.log(res)
    })
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
          <Select onChange={ev => onChange(ev, `response`)} value={state.response}>
            <Option value="template">{showTitle(`template`, `使用模板生成数据`)}</Option>
            <Option value="value">{showTitle(`value`, `使用固定的值`)}</Option>
          </Select>
        }
        defaultValue={state.rule}
        onBlur={ev => onChange(ev, `rule`)}
        placeholder="跟结点生成规则"
      />
      <p />
      <div className="btnBox">
        <Button size="small">{showTitle(`重置`, `使用服务器配置重置`)}</Button>
        <Button
          onClick={() => {
            if(state.response === `value`) {
              const isToJson = state.headers[`content-type`].match(new RegExp(`^application/json`))
              if(isToJson) {
                try {
                  const templateResult = JSON.parse(state.templateResult)
                  sendExampleComData(templateResult, `templateResult`)
                } catch (error) {
                  message.error(`error 错误的 json 内容`)
                }
              }
            } else if(state.response === `template`) {
              try {
                const templateRaw = JSON.parse(state.templateRaw)
                sendExampleComData(templateRaw, `templateRaw`)
              } catch (error) {
                message.error(`error 错误的 template 内容`)
              }
            }
          }}
          size="small"
        >
          {showTitle(`上传`, `上传当前配置到服务器`)}
        </Button>
      </div>
      <p />
      <div className="infoBox">
        {state.response === `value` && <Input.TextArea
          value={state.templateResult}
          onChange={val => onChange(val, `templateResult`)}
          autoSize
        />}
        {state.response === `template` && <Input.TextArea
          value={state.templateRaw}
          onChange={val => onChange(val, `templateRaw`)}
          autoSize
        />}
      </div>
    </div>
  )
}

export default ExampleCom
