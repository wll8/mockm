import React from 'react'
import * as antd from 'antd'
import * as ReactRouterDOM from 'react-router-dom'
import utils from './utils.jsx'
const {
  getRestcLink,
  tree2Array,
} = utils

const {
  BackTop,
  ConfigProvider,
  Breadcrumb,
  Menu,
} = antd

function handleMenu(routePath) {
  const menuObj = {
    id: `^/index/?$`,
    name: `首页`,
    path: `/`,
    children: [
      {
        id: `^/?$`,
        name: `记录`,
        path: `/`,
        children: [
          {
            id: `^/history,.*`,
            name: `详情`,
            path: `/history/`,
          },
          {
            id: `get|post|put|patch|delete|head|options|trace`.split(`|`).map(item => `(^/${item}/.*)`).join(`|`),
            name: `详情`,
            path: `/history/`,
          },
        ],
      },
      {
        id: `^/restc/?$`,
        name: `请求`,
        path: `/restc/`,
      },
      {
        id: `^/openApiDoc/?$`,
        name: `openApiDoc`,
        path: `/openApiDoc/`,
      },
      {
        id: `^/apiStudio/?$`,
        name: `接口`,
        path: `/apiStudio/`,
        children: [
          {
            id: `^/apiStudio/edit/?$`,
            name: `详情`,
            path: `/apiStudio/edit/`,
          },
        ],
      },
    ]
  }

  const newList = tree2Array(menuObj)
  const {id} = newList.find(item => routePath.match(new RegExp(item.id)))
  const resList = newList.reduce((acc, cur) => {
    const findRes = newList.find(item => item.id === acc.findPid)
    if(findRes) {
      return {findPid: findRes.pid, res: acc.res.concat(findRes)}
    } else {return acc}
  }, {findPid: id, res: []}).res
  console.log(`newList`, {newList, resList, id})
  return resList.reverse()
}


function BreadcrumbCom() {
  const {
    useState,
    useEffect,
  } = React
  const [state, setState] = useState({
    routePath: ``,
  })
  const {
    useLocation,
  } = ReactRouterDOM
  const reactLocation = useLocation()
  useEffect(() => {
    console.log(`useEffect`)
    const pathname = reactLocation.pathname
    setState(preState => ({...preState, routePath: pathname}))
  }, [reactLocation])

  return (
    <div className="Breadcrumb">
      <Breadcrumb>
        {
          state.routePath && handleMenu(state.routePath).map((item, index, arr) => (
            item.name === `首页`
              ? <Breadcrumb.Item
                  key={index}
                  overlay={
                    <Menu>
                      <Menu.Item key="记录"><a href="/#/">记录</a></Menu.Item>
                      <Menu.Item key="接口"><a href="/#/apiStudio">接口</a></Menu.Item>
                      <Menu.SubMenu key="工具" title="工具">
                        <Menu.Item key="openApiDoc" onClick={() => {
                          window.open(`/#/openApiDoc`)
                        }}>openApiDoc</Menu.Item>
                        <Menu.Item key="请求" onClick={() => {
                          window.open(getRestcLink({
                            method: `GET`,
                            header: [
                              {
                                enabled: false,
                                key: `X-Powered-By`,
                                value: `mockm`,
                              },
                              {
                                enabled: true,
                                key: `Authorization`,
                                value: `test`,
                              },
                            ],
                            query: {
                              _sort: `id`,
                              _order: `desc`,
                              _page: 1,
                              _limit: 10,
                            },
                            url: `http://${window.serverConfig.osIp}:${window.serverConfig.testPort}/api/getApiList/`,
                          }))
                        }}>请求</Menu.Item>
                        <Menu.Item key="文档"><a target="_blank" rel="noreferrer" href="https://hongqiye.com/doc/mockm/?from=mockm">文档</a></Menu.Item>
                        <Menu.Item key="mockjs"><a target="_blank" rel="noreferrer" href="http://wll8.gitee.io/mockjs-examples/?from=mockm">mockjs</a></Menu.Item>
                      </Menu.SubMenu>
                      <Menu.Item key="github"><a target="_blank" rel="noreferrer" href="https://github.com/wll8/mockm?from=mockm">github</a></Menu.Item>
                    </Menu>
                  }
                >
                  mockm
                </Breadcrumb.Item>
              : <Breadcrumb.Item key={index}>
                  {index < arr.length - 1 ? <a href={`/#${item.path}`}>{item.name}</a> : item.name}
                </Breadcrumb.Item>

          ))
        }
      </Breadcrumb>
    </div>
  )
}

export default BreadcrumbCom
