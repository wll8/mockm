import './EditTable.scss'
import utils from './utils.jsx'
import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  Table,
  Input,
  Button,
  Popconfirm,
  Form,
  Checkbox,
  Select,
  Divider,
} from 'antd';
const { Option } = Select;
const {
  search,
  setListVal,
  removeKeys,
  guid,
  getSelectionText,
  deepGet,
  deepSet,
} = utils

const EditableContext = React.createContext();

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    type,
    ...restProps
  }) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef();
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      // eslint-disable-next-line no-unused-expressions
      inputRef?.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const onChangeData = async (e) => {
    try {
      const values = await form.validateFields();
      const res = { ...record, ...values }
      res[dataIndex] = res[dataIndex] === `` ? undefined : res[dataIndex]
      handleSave(res);
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  const dataType = [ // 数据类型
    `string`,
    `boolean`,
    `number`,
    `object`,
    `array`,
  ]

  const save = async (e) => {
    await onChangeData(e)
    toggleEdit();
  };

  let childNode = children;

  if (editable) {
    const val = record[dataIndex] // 当前正在编辑的值
    function getChildNode(type) {
      const formItemProps = {
        style: {
          margin: 0,
        },
        name: dataIndex,
      }
      return {
        string: (
          editing ? (
            <Form.Item
              {...formItemProps}
            >
              <Input.TextArea
                ref={inputRef}
                onBlur={save}
                placeholder="请输入"
                autoSize={{ minRows: 1 }}
              />
            </Form.Item>
          ) : (
            <div
              className="editable-cell-value-wrap"
              style={{
                paddingRight: 24,
              }}
              onClick={toggleEdit}
            >
              {
                // children 为空时, 使用空格替代, 把高度撑开
                children.filter(item => item !== undefined).length
                  ? children
                  : <>&nbsp;</>
              }
            </div>
          )
        ),
        boolean: editing ? (
          <Form.Item
            {...formItemProps}
          >
            <Select
              // mode="multiple"
              // bordered={false}
              // allowClear
              style={{ width: '100%' }}
              placeholder="请选择"
              onBlur={save}
              onChange={onChangeData}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        ) : (
          <div
            className="editable-cell-value-wrap"
            style={{
              paddingRight: 24,
            }}
            onClick={toggleEdit}
          >
            {
              {true: `是`, false: `否`}[val] || <>&nbsp;</>
            }
          </div>
        ),
        array: editing ? (
          <Form.Item
            {...formItemProps}
          >
            <Select
              // mode="multiple"
              // bordered={false}
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择"
              onBlur={save}
              onChange={onChangeData}
            >
              {
                dataType.map(dataTypeItem => (
                  <Option
                    key={dataTypeItem}
                    disabled={
                      [`string`, `number`].includes(dataTypeItem)
                        ? [`array`, `object`].includes(record.type) && record.children?.length
                        : false
                    }
                    value={dataTypeItem}
                  >
                    {dataTypeItem}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>
        ) : (
          <div
            className="editable-cell-value-wrap"
            onClick={toggleEdit}
          >
            {
              val ? val : <>&nbsp;</>
            }
          </div>
        ),
      }[type || `string`]
    }
    childNode = getChildNode(type);
  }

  return <td {...restProps}>{childNode}</td>;
};

function EditableTable (props) {
  const {
    useState,
    useEffect,
    useRef,
  } = React

  const [state, setState] = useState({
    dataSource: setListVal({
      arr: JSON.parse(JSON.stringify(props.dataSource || [{key: guid()}])),
      key: `key`,
      val: guid,
      childrenKey: `children`,
    }),
  });

  useEffect(() => {
    if(state.dataSource !== undefined) {
      const res = removeKeys(state.dataSource, [`key`])
      props.dataOnChange(res)
    }
    // 注意:
    // 不要 props.dataOnChange 写到变更依赖数组中, 否则会造成死循环
    // 因为 props.dataOnChange 带表 props 重新渲染, 并不代表组件内的 state.dataSource 变更
    // eslint-disable-next-line
  }, [state.dataSource])

  const handleDelete = (key) => {
    let searchRes = search(state.dataSource, `key`, key)
    searchRes.pop() // 去除最后一个值, 因为他是对象里面的 key, 我们需要的是对象
    const deepSetRes = deepSet([...state.dataSource], searchRes.join(`.`), undefined, true)
    setState({
      dataSource: deepSetRes,
    });
  };

  const handleAdd = (record) => {
    if(record) {
      record.children = [...(record.children || []), {key: guid()}]
      let searchRes = search(state.dataSource, `key`, record.key)
      searchRes = searchRes.slice(0, -2)
      handleSave(record) // 刷新数据上的展开图标
    } else {
      let { dataSource = [] } = state;
      const key = guid()
      const newData = {
        key,
      };
      setState({
        dataSource: [...dataSource, newData],
      });
    }
  };

  const handleDeleteAll = () => {
    setState({
      dataSource: [],
    });
  }

  const handleSave = (row) => {
    let searchRes = search(state.dataSource, `key`, row.key)
    searchRes = searchRes.slice(0, -1) // 去除最后一个值, 因为他是对象里面的 key, 我们需要的是对象
    let deepSetRes = deepSet([...state.dataSource], searchRes.join(`.`), row)
    deepSetRes = deepSet(deepSetRes, searchRes.join(`.`), {...row, children: (
      // 如果 type 不是复合类型, 则将 children 删除, 避免出现不必要的展开图标
      ([`array`, `object`].includes(row.type) === false)
    ) ? undefined : row.children })
    setState({
      dataSource: deepSetRes,
    });

  };

  const { dataSource } = state;
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  const columns = [
    ...props.columns,
    {
      title: ( // 表头操作
        <div>
          <Popconfirm
            title="确认删除所有字段?"
            onConfirm={() => handleDeleteAll()}
          >
            <Button size="small" danger>
              -
            </Button>
          </Popconfirm>
          <Divider type="vertical" />
          <Button
            title="在根结点下面添加字段"
            size="small"
            onClick={() => handleAdd()}
          >
            +
          </Button>
        </div>
      ),
      dataIndex: 'operation',
      width: 80,
      render: (text, record) => {
        return (
          <div>
            <Popconfirm
              title="确认删除?"
              onConfirm={() => handleDelete(record.key)}
              // disabled
            >
              <Button
                size="small"
                onClick={record.name ? () => {} : () => handleDelete(record.key)}
                danger
              >
                -
              </Button>
            </Popconfirm>
            {
              // 处理复合类型的值
              [`array`, `object`].includes(record.type) && (
                <>
                  <Divider type="vertical" />
                  <Button
                    title="在当前结点下面添加字段"
                    size="small"
                    onClick={() => handleAdd(record)}
                  >
                    +
                  </Button>
                </>
              )
            }
          </div>
        )
      },
    },
  ];

  const columnsNew = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        type: col.type,
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: handleSave,
      }),
    };
  });
  return (
    <div>
      <Table
        pagination={false}
        expandable={{defaultExpandAllRows: true}}
        size="small"
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        dataSource={dataSource}
        columns={columnsNew}
      />
    </div>
  );
}

export default EditableTable
