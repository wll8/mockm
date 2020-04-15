const {
  getSelectionText,
  getMethodUrl,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
} = window.utils

window.ApiList = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Collapse,
    Button,
    Tag,
    Tabs,
    BackTop,
    message,
    Spin,
  } = window.antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function com(props) {
    return (
      <div className="ApiList">
        <ul className="ulRef">
          {
            props.apiList.map((item, index) => {
              return (
                <li key={index} >
                  <span className="statusCode">
                    {item.statusCode || '--'}
                  </span>
                  <a className="api" href={`#${item.method}${item.api}`}>
                    {item.api}
                  </a>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }

  return com
})()
