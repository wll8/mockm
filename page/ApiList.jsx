const {
  getSelectionText,
  getMethodUrl,
  wordToUpperCase,
  sortKey,
  formatData,
  deepGet,
  deepSet,
  dateDiff,
} = window.utils

window.ApiList = (() => {
  const {
    useState,
    useEffect,
    useRef,
  } = React
  const {
    Table,
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
    const apiList = props.apiList

    const columns2 = [
      {
        title: 'code',
        width: 100,
        dataIndex: 'statusCode',
        sorter: (a, b) => a.statusCode - b.statusCode,
      },
      {
        title: 'type',
        width: 100,
        dataIndex: 'extensionName',
        sorter: (a, b) => a.extensionName.localeCompare(b.extensionName),
      },
      {
        title: 'method',
        width: 120,
        dataIndex: 'method',
        sorter: (a, b) => a.method.localeCompare(b.method),
      },
      {
        title: 'api',
        sorter: (a, b) => a.api.localeCompare(b.api),
        render: record => {
          return (
            <a href={`#${record.method}${record.api}`}>
              {record.api}
            </a>
          )
        }
      },
      {
        title: 'date',
        width: 100,
        dataIndex: 'date',
        sorter: (a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime(),
        defaultSortOrder: 'descend',
        render: record => {
          // return dayjs(record).format('YYYY-MM-DD HH:mm:ss')
          return dateDiff(new Date(record))
        }
      },
    ];

    function onChange(pagination, filters, sorter, extra) {
      console.log('params', pagination, filters, sorter, extra);
    }
    return (
      <div className="ApiList">
        <Table size="small" pagination={false} rowKey={({method, api}) => method + api } columns={columns2} dataSource={apiList} onChange={onChange} />
      </div>
    )
  }

  return com
})()
