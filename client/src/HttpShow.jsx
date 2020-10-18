import React from 'react'
import * as ReactRouterDOM from 'react-router-dom'
import * as antd from 'antd'
import en_GB from 'antd/es/locale/en_GB'
import ApiList from './ApiList.jsx'
import ApiDetail from './ApiDetail.jsx'
import ApiStudio from './ApiStudio.jsx'
import './HttpShow.scss'

const HttpShow = (() => {
  const {
    BackTop,
    ConfigProvider,
  } = antd

  const {
    HashRouter,
  } = ReactRouterDOM

  function com() {
    function App() {
      const {
        Route,
        Switch,
      } = ReactRouterDOM
      return (
        <Switch>
          <Route cache exact path="/">
            <ApiList />
          </Route>
          <Route cache path="/apiStudio/edit">
            <ApiStudio.Edit />
          </Route>
          <Route cache path="/apiStudio">
            <ApiStudio.List />
          </Route>
          <Route cache path="/*">
            <ApiDetail />
          </Route>
        </Switch>
      )
    }

    return (
      <div className="HttpShow">
        <ConfigProvider locale={en_GB}>
          <HashRouter>
            <BackTop visibilityHeight={0} target={() => document.querySelector(`#root`)}/>
            <App />
          </HashRouter>
        </ConfigProvider>
      </div>
    )
  }
  return com
})()


export default HttpShow
