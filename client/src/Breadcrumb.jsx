import React from 'react'
import * as antd from 'antd'
import * as ReactRouterDOM from 'react-router-dom'
import utils from './utils.jsx'
const {
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
                  overlay={
                    <Menu>
                      <Menu.Item><a href="/#/">记录</a></Menu.Item>
                      <Menu.Item><a href="/#/apiStudio">接口</a></Menu.Item>
                      <Menu.Item><a href="/#/restc">请求</a></Menu.Item>
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
