const {
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
} = window.utils

window.HttpShow = (() => {
  const {
    useState,
    useEffect,
  } = React
  const {
    Collapse,
    Button,
    Tag,
    Tabs,
  } = window.antd

  const { Panel } = Collapse;
  const { TabPane } = Tabs;

  function callback(key) {
    console.log(key);
  }

  function com() {
    // 【计数器改写方法一】 React Hooks之useContext
    // https://blog.csdn.net/weixin_44282875/article/details/85336106
    const httpData = { // 使用 content 把请求数据传给每个组件
      method: `GET`,
      api: `/api/options/?page=1&pageSize=10`,
      data: {
        "req": {
          "headers": {
            "host": "localhost:9004",
            "connection": "keep-alive",
            "content-length": "501",
            "accept": "application/json, text/plain, */*",
            "sec-fetch-dest": "empty",
            "test": "emptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyemptyempty",
          },
          "body": {
            "中文@": "你好=",
            "receiveDate": "2020-03-31",
            "effectiveDate": "2020-03-31",
            "regulatorLocationId": 53,
            "registryDeptId": 1,
            "effectiveStatus": 2
          },
          "query": {
            "中文@": "你好=",
            "docType": "10",
            "pageSize": "9999",
            "docID": "32"
          },
          "form": {
            "中文@": "你好="
          },
          "path": "/api/regulations/"
        },
        "res": {
          "info": {
            "status": 200,
            "statusText": "OK"
          },
          "headers": {
            "server": "nginx/1.13.7",
            "date": "Tue, 31 Mar 2020 07:44:08 GMT",
            "content-type": "application/json",
          },
          "body": {
            "contentType": "application/json",
            "extensionName": "json",
            "bodyPath": "./httpData//api_regulations_POST_body_18.json"
          }
        }
      },
    }

    const [state, setState] = useState({ // 默认值

    });

    const tabList = {
      Headers: Headers,
      Preview: () => `Preview`,
      Response: () => `Response`,
      Timing: () => `Timing`,
      Cookies: () => `Cookies`,
      Doc: () => `Doc`,
    }

    useEffect(() => {
      // ... dom api
    });

    return (
      <div className="HttpShow">
        <Tabs animated={false} defaultActiveKey="Headers" onChange={callback}>
          {
            Object.keys(tabList).map(key => (
              <TabPane tab={key} key={key}>
                {tabList[key]({httpData})}
              </TabPane>
            ))
          }
        </Tabs>
      </div>
    )
  }

  return com
})()
