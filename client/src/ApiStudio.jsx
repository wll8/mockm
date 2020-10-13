import './ApiStudio.scss'
import React from 'react'
import utils from './utils.jsx'
import * as antd from 'antd'
import EditTable from './EditTable.jsx'

const {
  removeEmpty,
  getSelectionText,
  deepGet,
  deepSet,
} = utils


const {
  Collapse,
  Button,
  Tabs,
  message,
  Spin,
  Table,
  Select,
  Input,
  Form,
  Checkbox,
  Row,
  Col,
  Divider,
} = antd


const { TabPane } = Tabs
const { Option } = Select

const ApiStudio = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React

  function Com(props) {
    const parametersListDataSource = [
      {
        key: Date.now(),
      },
    ];
    const responseListDataSource = [
      {
        key: Date.now(),
      },
    ];

    const columns = [
      {
        type: `string`,
        title: '字段名',
        dataIndex: 'name',
        key: 'name',
        editable: true,
        ellipsis: true,
        width: 100,
      },
      {
        type: `string`,
        title: '示例值',
        dataIndex: 'example',
        key: 'example',
        editable: true,
        ellipsis: true,
        width: 100,
      },
      {
        type: `array`,
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        editable: true,
        ellipsis: true,
        width: 100,
      },
      {
        type: `boolean`,
        title: '必填',
        dataIndex: 'required',
        key: 'required',
        editable: true,
        ellipsis: true,
        width: 100,
      },
      {
        type: `string`,
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        editable: true,
        ellipsis: true,
        width: 200,
      },
    ];

    const methodList = [ // 请求方法列表
      `get`,
      `post`,
      `put`,
      `patch`,
      `delete`,
      `head`,
      `options`,
      `trace`,
    ]
    const parametersList = [ // 参数列表
      `query`,
      `header`,
      `path`,
      `cookie`,
      `form/body`,
    ]
    const responsesList = [ // 参数列表
      `200`,
      `403`,
      `404`,
      `500`,
    ]

    // [`get`,`put`,`post`,`delete`,`options`,`head`,`patch`,]
    // https://swagger.io/specification/v2/?sbsearch=parameters#parameterObject
    const baseApiInfo = () => { // api 默认值
      return { // 某个 API 的请求方法, 操作对象
        description: ``, // 对此操作行为的详细解释
        parameters: {
          query: [{}],
        },
        responses: {
          200: [{}],
        },
      }
    }

    const [state, setState] = useState({ // 默认值
      hand: { // 标识各个 tab 所在位置
        method: `get`, // api 方法
        parameters: `query`, // 参数
        responses: `200`, // 响应
      },
      path: ``, // api 路径
      data: {
        get: baseApiInfo(),
      },
    })

    function onChange(ev, stateKey) {
      let value = ev
      if(typeof(ev) !== `string` && ev?.constructor?.name === `SyntheticEvent`) { // 绑定 event 形式的 value
        ev.persist()
        value = ev.target.value
      }
      const oldValue = deepGet(state, stateKey)
      if(JSON.stringify(oldValue) !== JSON.stringify(value)) {
        setState(preState => ({...deepSet(preState, stateKey, value)}))
      }
    }

    return (
      <div className="ApiStudio">
        <div className="headerBox">
          {/* api 路径 */}
          <Input
            value={state.path}
            onChange={ev => onChange(ev, `path`)}
            placeholder="接口路径, 以 / 开头"
            className="apiPath"
          />
          {/* 请求方法 */}
          <Tabs activeKey={state.hand.method} onChange={val => onChange(val, `hand.method`)}>
            {
              methodList.map(methodItem => {
                return (
                  <TabPane tab={methodItem} key={methodItem}>
                    {/* 接口描述 */}
                    <Input.TextArea
                      value={state.data[state.hand.method]?.description}
                      onChange={ev => onChange(ev, `data.${state.hand.method}.description`)}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      placeholder="接口描述, 例如对应的原型地址"
                    />
                    {/* 接口入参 */}
                    <Tabs activeKey={state.hand.parameters} onChange={val => onChange(val, `hand.parameters`)}>
                      {
                        parametersList.map(parametersItem => {
                          return (
                            <TabPane tab={parametersItem} key={parametersItem}>
                              <EditTable
                                dataOnChange={data => {
                                  onChange(
                                    data,
                                    `data.${state.hand.method}.parameters.${state.hand.parameters}`
                                  )
                                }}
                                dataSource={state.data?.[state.hand.method]?.parameters?.[state.hand.parameters]}
                                columns={columns}
                              />
                            </TabPane>
                          )
                        })
                      }
                    </Tabs>
                    {/* 接口出参 */}
                    <Tabs activeKey={state.hand.responses} className="responsesTabs" onChange={val => onChange(val, `hand.responses`)}>
                      {
                        responsesList.map(responsesItem => {
                          return (
                            <TabPane tab={responsesItem} key={responsesItem}>
                              <EditTable
                                dataOnChange={data => {
                                  onChange(
                                    data,
                                    `data.${state.hand.method}.responses.${state.hand.responses}`
                                  )
                                }}
                                dataSource={state.data?.[state.hand.method]?.responses?.[state.hand.responses]}
                                columns={columns}
                              />
                            </TabPane>
                          )
                        })
                      }
                    </Tabs>
                  </TabPane>
                )
              })
            }
          </Tabs>
        </div>
        <div className="bodyBox">

        </div>
        <pre>
          {
            JSON.stringify(removeEmpty(JSON.parse(JSON.stringify(state))), null, 2)
          }
        </pre>
      </div>
    )
  }
  return Com
})()

export default ApiStudio
