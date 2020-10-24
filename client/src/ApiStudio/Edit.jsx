import './Edit.scss'
import React from 'react'
import utils from '../utils.jsx'
import * as antd from 'antd'
import EditTable from './EditTable.jsx'
import ExampleCom from './ExampleCom.jsx'
import { DownOutlined } from '@ant-design/icons'
import * as ReactRouterDOM from 'react-router-dom'
import common from '../common.jsx'

const {
  listToData,
  removeEmpty,
  getSelectionText,
  deepGet,
  deepSet,
} = utils

const {
  http,
  cfg,
} = common

const {
  Switch,
  Radio,
  Drawer,
  Menu,
  Dropdown,
  Card,
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

function Edit() {
  const {
    useState,
    useEffect,
    useRef,
  } = React

  const {
    useHistory,
    useLocation,
  } = ReactRouterDOM
  const reactLocation = useLocation()
  useEffect(() => {
    // 当 reactLocation 改变时重新渲染
  }, [reactLocation])

  function Com(props) {
    const {
      useState,
      useEffect,
      useRef,
      useCallback,
    } = React
    const history = useHistory()

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
        width: 80,
      },
      {
        type: `boolean`,
        title: '必填',
        dataIndex: 'required',
        key: 'required',
        editable: true,
        ellipsis: true,
        width: 50,
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
    ]

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
          query: {
            table: [{}],
          },
        },
        responses: {
          200: {
            table: [{}],
          },
        },
      }
    }

    const searchParams = new URL(window.location.href.replace(`#`, ``)).searchParams
    const [state, setState] = useState({ // 默认值
      showDrawer: ``,
      queryPath: searchParams.get(`path`), // url 上的 path 参数
      apiOk: false, // api 是否请求结束
      hand: { // 标识各个 tab 所在位置
        method: searchParams.get(`method`) || `get`, // api 方法
        parameters: `query`, // 参数
        responses: `200`, // 响应
      },
      path: ``, // api 路径
      data: {
        get: baseApiInfo(),
      },
    })

    const method = state?.hand?.method
    const userMethods = Object.keys(removeEmpty(JSON.parse(JSON.stringify(state.data))) || {})
    const userParameters = Object.keys(removeEmpty(JSON.parse(JSON.stringify(
      state.data?.[method]?.parameters || {}
    ))) || {})
    const userResponses = Object.keys(removeEmpty(JSON.parse(JSON.stringify(
      state.data?.[method]?.responses || {}
    ))) || {})

    function saveApiData() { // 保存 api 数据
      // 由于 saveApiData 可以位于 useEffect 钩子中, 得到的 state 不是最新的
      // 所以可以利用 setState 方法来获取最新的 state

      setState(preState => {
        const {rule, type} = preState.data?.[preState.hand.method]?.responses?.[preState.hand.responses]?.example || {}
        const templateRaw = listToData(
          removeEmpty(JSON.parse(JSON.stringify(preState.data?.[preState.hand.method]?.responses?.[preState.hand.responses]?.table || `{}`))),
          {
            rule,
            type,
          },
        )
        onChangeExampleCom({
          templateRaw,
        }, preState)
        setTimeout(() => {
          if(preState.path.match(new RegExp(`^/.*`)) === null) {
            // 把 message.warn 写在setTimeout 中, 避免 react 控制台报错:
            // Warning: Render methods should be a pure function of props and state; triggering nested component updates from render is not allowed. If necessary, trigger nested updates in componentDidUpdate.
            setTimeout(() => message.warn(`接口路径格式错误`), 0)
          } else {
            const sendData = {
              setPath: `paths.${preState.path}`,
              data: preState.data,
            }
            console.log(`sendData`, sendData.data.get.responses[200].example)
            http.patch(`${cfg.baseURL}/api/studio/`, removeEmpty(JSON.parse(JSON.stringify(sendData)))).then(res => {
              message.info(`上传成功`)
              // 如果当前页面的 path 与 query 参数中的 path 不相同时, 更改 query 上的 path
              // 避免用户错误的使用浏览器地址栏中的 url
              if (preState.path !== preState.queryPath) {
                history.push(`/apiStudio/edit?path=${preState.path}`);
              }
              console.log(res)
            })
          }
        }, 0);
        return preState
      })
    }

    useEffect(() => { // 当 method 改变的时候, 更新 hand
      setState(preState => {
        const method = preState.hand.method
        const parameters = userParameters[0] || `query`
        const responses = userResponses[0] || `200`
        return {...preState, hand: {
          method,
          parameters,
          responses,
        }}
      })
      // eslint-disable-next-line
    }, [state.hand.method])

    useEffect(() => {
      const path = state.queryPath
      path && http.get(`${cfg.baseURL}/api/studio/?path=${path}`).then(data => {
        if(Boolean(data) === false) {
          setState(preState => ({ ...preState, path}))
          return false
        }
        setState(preState => {
          const method = preState.hand?.method
          const parameters = Object.keys(data[method]?.parameters || {})[0] || preState.hand?.parameters
          const responses = Object.keys(data[method]?.responses || {})[0] || preState.hand?.responses
          return {
            ...preState,
            data,
            path,
            hand: {
              method,
              parameters,
              responses,
            },
          }
        })
      }).finally(() => {
        setState(preState => ({...preState, apiOk: true}))
      })
    }, [state.queryPath])

    const HotKey = window.HotKey
    useEffect(() => {
      const hotKey = new HotKey()
      hotKey.add(`ctrl+s`, ev => {
        ev.preventDefault()
        // 让当前所编辑的输入内容失去焦点, 以触发数据收集, 收集后再保存
        const focus = document.querySelector(`*:focus`)
        focus && focus.blur()
        setTimeout(() => saveApiData(), 0)
      })
      hotKey.add(`ctrl+e`, ev => {
        ev.preventDefault()
        setState(preState => ({...preState, showDrawer: `ExampleCom`}))
      })
      hotKey.setup({
        metaToCtrl: true,
      })
      hotKey.start();
      return () => hotKey.stop()
      // eslint-disable-next-line
    }, [HotKey])

    function onChange(ev, stateKey) {
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

    function setDrawer(show) { // 设置 Drawer 的隐藏状态
      setState(preState => ({...preState, showDrawer: show}))
    }

    function onChangeExampleCom(data, myPreState) {
      const fn = preState => {
        const setPath = `data.${preState.hand.method}.responses.${preState.hand.responses}.example`
        const oldValue = deepGet(preState, setPath)
        const res = {...deepSet(preState, setPath, {...oldValue, ...data})}
        Boolean(myPreState) === false && setTimeout(() => saveApiData(), 0)
        return res
      }
      myPreState ? fn(myPreState) : setState(fn)
    }

    const {table = [], example = {}} = state.data?.[state.hand.method]?.responses?.[state.hand.responses] || {}
    return (
      <div className="ApiStudioEdit">
        {
          state.showDrawer && <Drawer
            className="drawer"
            width="none"
            onClose={() => setDrawer(``)}
            visible={state.showDrawer}
          >
            {state.showDrawer === `ExampleCom` && example && table && <ExampleCom
              upLoad={onChangeExampleCom}
              close={() => setDrawer(``)}
              table={table}
              example={example}
            />}
          </Drawer>
        }
        <div className="headerBox">
          {/* api 路径 */}
          <Input
            defaultValue={state.queryPath}
            onBlur={ev => onChange(ev, `path`)}
            placeholder="接口路径, 以 / 开头"
            className="apiPath"
          />
          {/* 请求方法 */}
          <Tabs
            activeKey={state.hand.method}
            onChange={val => onChange(val, `hand.method`)}
            onTabClick={key => history.push(`/apiStudio/edit?path=${state.path}&method=${key}`)}
            tabBarExtraContent={
              {
                right: (
                  <Dropdown
                    overlay={(
                      <Menu>
                        <Menu.Item disabled={Boolean(state.path) === false} onClick={saveApiData}>save</Menu.Item>
                        <Menu.Item>record</Menu.Item>
                        <Menu.Item>swagger</Menu.Item>
                        <Menu.Item>capture</Menu.Item>
                        <Menu.Item danger>delete</Menu.Item>
                      </Menu>
                    )}
                    trigger={['click']}
                  >
                    <span onClick={e => e.preventDefault()}>
                      action <DownOutlined />
                    </span>
                  </Dropdown>
                ),
              }
            }
          >
            {
              methodList.map(methodItem => {
                // 存在 queryPath 时需要等待请求结束后才渲染, 否则 EditTable 组件拿不到更新的 state
                const isRender = (
                  (state.queryPath && state.apiOk)
                  || (Boolean(state.queryPath) === false)
                )
                return (
                  <TabPane
                    tab={
                      <div
                        className={userMethods.includes(methodItem) ? `hasValue` : ''}
                      >
                        {methodItem}
                      </div>
                    }
                    key={methodItem}
                  >
                    {/* 接口描述 */}
                    {isRender && <Input.TextArea
                      defaultValue={state.data[state.hand.method]?.description}
                      onBlur={ev => onChange(ev, `data.${state.hand.method}.description`)}
                      autoSize={{ minRows: 2, maxRows: 6 }}
                      placeholder="接口描述, 例如对应的原型地址"
                    />}
                    {/* 接口入参 */}
                    <Tabs
                      activeKey={state.hand.parameters}
                      onChange={val => onChange(val, `hand.parameters`)}
                      tabBarExtraContent={
                        {
                          right: (
                            <Dropdown
                              overlay={(
                                <Menu>
                                  <Menu.Item>example</Menu.Item>
                                  <Menu.Item>code</Menu.Item>
                                </Menu>
                              )}
                              trigger={['click']}
                            >
                              <span onClick={e => e.preventDefault()}>
                                action <DownOutlined />
                              </span>
                            </Dropdown>
                          ),
                        }
                      }
                    >
                      {
                        parametersList.map(parametersItem => {
                          return (
                            <TabPane
                              key={parametersItem}
                              tab={
                                <div
                                  className={userParameters.includes(parametersItem) ? `hasValue` : ''}
                                >
                                  {parametersItem}
                                </div>
                              }
                            >
                              {isRender && <EditTable
                                dataOnChange={data => {
                                  onChange(
                                    data,
                                    `data.${state.hand.method}.parameters.${state.hand.parameters}.table`
                                  )
                                }}
                                dataSource={state.data?.[state.hand.method]?.parameters?.[state.hand.parameters]?.table}
                                columns={columns}
                                scroll={{ x: 800 }}
                              />}
                            </TabPane>
                          )
                        })
                      }
                    </Tabs>
                    {/* 接口出参 */}
                    <Tabs
                      activeKey={state.hand.responses}
                      className="responsesTabs"
                      onChange={val => onChange(val, `hand.responses`)}
                      tabBarExtraContent={
                        {
                          right: (
                            <Dropdown
                              overlay={(
                                <Menu>
                                  <Menu.Item onClick={() => setDrawer(`ExampleCom`)}>example</Menu.Item>
                                  <Menu.Item>header</Menu.Item>
                                </Menu>
                              )}
                              trigger={['click']}
                            >
                              <span onClick={e => e.preventDefault()}>
                                action <DownOutlined />
                              </span>
                            </Dropdown>
                          ),
                        }
                      }
                    >
                      {
                        responsesList.map(responsesItem => {
                          return (
                            <TabPane
                              tab={
                                <div
                                  className={userResponses.includes(responsesItem) ? `hasValue` : ''}
                                >
                                  {responsesItem}
                                </div>
                              }
                              key={responsesItem}
                            >
                              {isRender && <EditTable
                                dataOnChange={data => {
                                  onChange(
                                    data,
                                    `data.${state.hand.method}.responses.${state.hand.responses}.table`
                                  )
                                }}
                                dataSource={state.data?.[state.hand.method]?.responses?.[state.hand.responses]?.table}
                                columns={columns}
                                scroll={{ x: 800 }}
                              />}
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
      </div>
    )
  }
  return <Com />
}

export default Edit
