import './ApiStudio.scss'
import React from 'react'
import utils from './utils.jsx'
import * as antd from 'antd'
import EditTable from './EditTable.jsx'

const {
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
    ]
    const parametersList = [ // 参数列表
      `query`,
      `path`,
      `header`,
      `formData`,
      `json`,
    ]
    const responsesList = [ // 参数列表
      `200`,
      `403`,
      `404`,
      `500`,
    ]

    const baseApiInfo = () => { // api 默认值
      return { // 方法
        summary: ``,
        parameters: { // 参数
          query: {},
          path: {},
          header: {},
          formData: {},
        },
        responses: { // 响应
          200: {
            description: ``,
          },
        },
      }
    }

    const [state, setState] = useState({ // 默认值
      path: ``, // 路径
      method: `get`,
      data: {
        get: baseApiInfo(),
      },
    })


    function handleCellChange(nextSource){
      console.log(nextSource);
    }

    function onChange(ev, stateKey) {
      if(typeof(ev) === `string`) {
        setState(preState => ({...deepSet(preState, stateKey, ev)}))
      } else {
        ev.persist()
        const value = ev.target.value
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
          <Tabs onChange={val => onChange(val, `method`)}>
            {
              methodList.map(methodItem => {
                return (
                  <TabPane tab={methodItem} key={methodItem}>
                    {/* 接口描述 */}
                    <Input.TextArea
                      value={state.data[state.method]?.summary}
                      onChange={ev => onChange(ev, `data.${state.method}.summary`)}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      placeholder="接口描述, 例如对应的原型地址"
                    />
                    {/* 接口入参 */}
                    <Tabs onChange={val => onChange(val, `data.${state.method}.parameters.${val}`)}>
                      {
                        parametersList.map(methodItem => {
                          return (
                            <TabPane tab={methodItem} key={methodItem}>
                              <EditTable dataOnChange={(data) => {console.log(`data`, data)}} dataSource={parametersListDataSource} columns={columns} />
                            </TabPane>
                          )
                        })
                      }
                    </Tabs>
                    {/* 接口出参 */}
                    <Tabs onChange={val => onChange(val, `data.${state.method}.responses.${val}`)}>
                      {
                        responsesList.map(methodItem => {
                          return (
                            <TabPane tab={methodItem} key={methodItem}>
                              <EditTable dataOnChange={(data) => {console.log(`data`, data)}} dataSource={responseListDataSource} columns={columns} />
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
            JSON.stringify(state, null, 2)
          }
        </pre>
      </div>
    )
  }
  return Com
})()

export default ApiStudio
