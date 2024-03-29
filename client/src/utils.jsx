import React from 'react'
import common from './common.jsx'
const {
  http,
  cfg,
} = common

// headers 不支持中文字符的 => Uncaught (in promise) TypeError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': Value is not a valid ByteString.


function isType(data, type = undefined) { // 判断数据是否为 type, 或返回 type
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}

/**
 * 判断是否是公网IP
 * https://stackoverflow.com/questions/13818064/check-if-an-ip-address-is-private
 * @param {string} ip
 * @returns boolean
 */
function isIp4InPrivateNet(ip) {
  const ip4toNumber = str => str.split('.').reverse().reduce((a, v, i) => a + parseInt(v, 10) * Math.pow(256, i), 0);
  const ip4RangeToNumbers = str => str.split('/').map(ip4toNumber);
  const privateNets = [
    '10.0.0.0/10.255.255.255', // single class A network
    '172.16.0.0/172.31.255.255', // 16 contiguous class B network
    '192.168.0.0/192.168.255.255', // 256 contiguous class C network
    '169.254.0.0/169.254.255.255', // Link-local address also refered to as Automatic Private IP Addressing
    '127.0.0.0/127.255.255.255' // localhost
  ].map(ip4RangeToNumbers);
  const ipNumber = ip4toNumber(ip);
  return !!privateNets.find(([net, mask]) => net === ((ipNumber & mask) >>> 0));
}

/**
 * 相对路径转绝对路径
 * @param {*} url 相对 url
 */
function toAbsURL(url){
  const a = document.createElement('a')
  a.href = url
  return a.href
}

/**
 * 转换参数为 restc url
 * @param {*} param0
 */
function getRestcLink({method, url, uri, path = {}, query = {}, header = {}, body = {}} = {}) {
  const queryParametersArr = isType(query, `array`) ? query : Object.keys(query).map(key => {
    return {
      enabled: true,
      key,
      value: query[key],
    }
  })
  const headerArr = isType(header, `array`) ? header : Object.keys(header).map(key => {
    return {
      enabled: true,
      key,
      value: header[key],
    }
  })
  const data = {
    method,
    queryParameters: JSON.stringify(queryParametersArr),
    body: JSON.stringify(body),
    headers: JSON.stringify(headerArr),
    url: setPathVal(url || uri, path),
  }
  const restcLink = `${window.location.origin}/restc/index.html#!${(queryParams(data, false))}`
  return restcLink
}

/**
 * 对象转url参数
 * @param {*} data,对象
 * @param {*} isPrefix,是否自动加上"?"
 */
function queryParams(data = {}, isPrefix = true, arrayFormat = 'brackets') {
  let prefix = isPrefix ? '?' : ''
  let _result = []
  if (['indices', 'brackets', 'repeat', 'comma'].indexOf(arrayFormat) === -1) arrayFormat = 'brackets';
  for (let key in data) {
    let value = data[key]
    // 去掉为空的参数
    if (['', undefined, null].indexOf(value) >= 0) {
      continue;
    }
    // 如果值为数组，另行处理
    if (value.constructor === Array) {
      // e.g. {ids: [1, 2, 3]}
      switch (arrayFormat) {
        case 'indices':
          // 结果: ids[0]=1&ids[1]=2&ids[2]=3
          for (let i = 0; i < value.length; i++) {
            _result.push(key + '[' + i + ']=' + value[i])
          }
          break;
        case 'brackets':
          // 结果: ids[]=1&ids[]=2&ids[]=3
          value.forEach(_value => {
            _result.push(key + '[]=' + _value)
          })
          break;
        case 'repeat':
          // 结果: ids=1&ids=2&ids=3
          value.forEach(_value => {
            _result.push(key + '=' + _value)
          })
          break;
        case 'comma':
          // 结果: ids=1,2,3
          let commaStr = "";
          value.forEach(_value => {
            commaStr += (commaStr ? "," : "") + _value;
          })
          _result.push(key + '=' + commaStr)
          break;
        default:
          value.forEach(_value => {
            _result.push(key + '[]=' + _value)
          })
      }
    } else {
      _result.push(key + '=' + value)
    }
  }
  return _result.length ? prefix + _result.join('&') : ''
}

/**
 *
 * @param {*} object 对象或数组
 * @param {*} findKey 要查找的 key
 * @param {*} value 要查找的 value
 */
function search(object, findKey, value) {
  for (const key in object) {
    if ((key === findKey) && (object[key] === value)) return [key];
    if (typeof(object[key]) === "object") {
      const temp = search(object[key], findKey, value);
      if (temp) return [key, temp].flat();
    }
  }
}

/**
 * 深拷贝
 * @param {*} obj
 */
function deepCopy(obj) {
  // 深度复制数组
  if (Object.prototype.toString.call(obj) === "[object Array]") {
    const object = [];
    for (let i = 0; i < obj.length; i++) {
      object.push(deepCopy(obj[i]));
    }
    return object;
  }
  // 深度复制对象
  if (Object.prototype.toString.call(obj) === "[object Object]") {
    const object = {};
    for (let p in obj) {
      object[p] = obj[p];
    }
    return object;
  }
}

/**
 * 转树形对象为数组
 * @param {*} treeObj 树形对象
 * @param {*} rootid 根结点 id
 */
function tree2Array(treeObj, rootid) {
  const temp = []; // 设置临时数组，用来存放队列
  const out = []; // 设置输出数组，用来存放要输出的一维数组
  temp.push(treeObj);
  // 首先把根元素存放入out中
  let pid = rootid;
  const obj = deepCopy(treeObj);
  obj.pid = pid;
  delete obj[`children`];
  out.push(obj);
  // 对树对象进行广度优先的遍历
  while (temp.length > 0) {
    const first = temp.shift();
    const children = first.children;
    if (children && children.length > 0) {
      pid = first.id;
      const len = first.children.length;
      for (let i = 0; i < len; i++) {
        temp.push(children[i]);
        const obj = deepCopy(children[i]);
        obj.pid = pid;
        delete obj[`children`];
        out.push(obj);
      }
    }
  }
  return out;
}

/**
 * 对象和行形式字符字符串互相转换
 * @param {*} arg 对象或字符串
 */
function objOrLine(arg) {
  let res
  if(typeof(arg) === `string`) {
    const str = arg
    res = str.replace(/[\r\n]/g, `\n`).split(/\n/).reduce((acc, cur) => {
      let [, key = ``, val = ``] = cur.match(/(.*):(.*)/) || []
      key = key.trim()
      val = val.trim()
      return {...acc, ...(key ? {[key]: val} : {} )}
    }, {})
  } else if(typeof(arg) === `object`) {
    const obj = arg
    res = Object.keys(obj).reduce((acc, cur) => `${acc}\n${cur}: ${obj[cur]}`, `` ).trim()
  }
  return res
}

/**
 *
 * @param {*} el 是包裹的元素
 * @param {*} title 鼠标上显示的 title
 */
function showTitle(el, title) {
  return title ? <span title={title}>{el}</span> : el
}

/**
 * 向数组键值
 * @param {object} param0.arr 要处理的数组
 * @param {object} param0.key 要添加的 key
 * @param {object} param0.val 要添加的值, 为函数时会使用函数返回值
 * @param {object} param0.childrenKey 要处理的子数组键名
 * @param {object} param0.cover 当 key 存在时是否覆盖, 默认否
 * @example setListVal({arr: list, key: `uuid`, val: uuid(), childrenKey: `children`})
 */
function setListVal({arr, key, val, childrenKey, cover = false}) {
  arr.forEach(arrItem => {
    arrItem[key] = (arrItem[key] === undefined || cover === true)
      ? (typeof(val) === 'function' ? val() : val)
      : arrItem[key]
    if(Array.isArray(arrItem[childrenKey])) {
      setListVal({arr: arrItem[childrenKey], key, val, childrenKey})
    }
  })
  return arr
}

/**
 * 生成 guid
 * @param {string} format 格式
 */
function guid(format = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx') {
  return format.replace(/[x]/g, function(c) {
    // eslint-disable-next-line
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 从数据中删除某个些键
 * @param {object} data 要处理的数据
 * @param {array} keys 要删除的键列表
 */
function removeKeys(data, keys) { // 从数据中删除某个些键
  return JSON.parse(
    JSON.stringify(data, (key, value)=> keys.includes(key) ? undefined : value)
  )
}

/**
 * 判断是否为空值
 * @param {*} value 要判断的值
 */
function isEmpty(value) {
  return [NaN, null, undefined, "", [], {}].some((emptyItem) =>
    typeof value === `string` && value
      ? false
      : JSON.stringify(value) === JSON.stringify(emptyItem)
  );
}

/**
 * 删除空值
 * @param {object} obj 要处理的数据
 */
function removeEmpty(obj) {
  return JSON.parse(JSON.stringify(obj), (key, value) => {
    if (isEmpty(value) === false && Array.isArray(value)) {
      value = value.filter((v) => !isEmpty(v));
    }
    return isEmpty(value) ? undefined : value;
  });
}

function swgPathToReg(path) { // 把 swagger 的 path /status/{codes} 转为正则 /status/.+?$
  return new RegExp(path.replace(/\{.+?\}/g, '.+?')+`$`)
}

function getAbsolutePosition(domObj) { // 获取元素位置及大小
  // 如果函数没有传入值的话返回对象为空的
  if (!domObj) return null;
  var w = domObj.offsetWidth, h = domObj.offsetHeight;
  // 从目标元素开始向外遍历，累加top和left值
  var t, l;
  // eslint-disable-next-line no-cond-assign
  for (t = domObj.offsetTop, l = domObj.offsetLeft; domObj = domObj.offsetParent;) {
    t += domObj.offsetTop;
    l += domObj.offsetLeft;
  }
  var r = document.body.offsetWidth - w - l;
  var b = document.body.offsetHeight - h - t;

  // 返回定位元素的坐标集合
  return { width: w, height: h, top: t, left: l, right: r, bottom: b };
}

function debounce(fn, wait) { // 防抖
  var timer = null;
  return function () {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(fn, wait);
  }
}

function dateDiff(hisTime, nowTime) {
  var now = nowTime ? nowTime : new Date().getTime(),
    diffValue = now - hisTime,
    result = '',
    minute = 1000 * 60,
    hour = minute * 60,
    day = hour * 24,
    halfamonth = day * 15,
    month = day * 30,
    year = month * 12,

    _year = diffValue / year,
    _month = diffValue / month,
    _week = diffValue / (7 * day),
    _day = diffValue / day,
    _hour = diffValue / hour,
    _min = diffValue / minute;

  if (_year >= 1) result = parseInt(_year) + "年前";
  else if (_month >= 1) result = parseInt(_month) + "个月前";
  else if (_week >= 1) result = parseInt(_week) + "周前";
  else if (_day >= 1) result = parseInt(_day) + "天前";
  else if (_hour >= 1) result = parseInt(_hour) + "小时前";
  else if (_min >= 1) result = parseInt(_min) + "分钟前";
  else result = "刚刚";
  return result;
}

function getSelectionText() { // 获取选中的文本
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

function getMethodUrl(path) {
  const [, method, api] = path.match(/(\w+)\s+(.*)/)
  return {method, api}
}

function fetchDownload(fileApi, name) {
  fetch(fileApi).then(res => res.blob()).then(blob => {
      var a = document.createElement('a')
      var url = window.URL.createObjectURL(blob)
      var filename = name || fileApi.replace(/.*\//, '')
      a.href = url
      a.download = filename
      a.click()
      window.URL.revokeObjectURL(url)
  })
}

async function blobTool(blob, action, fileName) {
  return new Promise((resolve, reject) => {
    if(action === `download`) {
      var a = document.createElement('a')
      var blobUrl = window.URL.createObjectURL(blob)
      a.href = blobUrl
      a.download = fileName
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      resolve(blobUrl)
    }
    if(action === `toBase64`) {
      let reader = new FileReader();
      reader.readAsDataURL(blob); // 转换为 base64, 直接放入 a 标签的 href 可用于下载
      reader.onload = res => {
        const result = res.target.result
        resolve(result)
      }
    }
    if(action === `toObjectURL`) {
      const blobUrl = window.URL.createObjectURL(blob)
      resolve(blobUrl)
    }
    if(action === `toText`) {
      let reader = new FileReader();
      reader.readAsText(blob, `utf-8`); // 转换为文本, 注意需要原数据就是文本
      reader.onload = res => {
        const result = res.target.result
        resolve(result)
      }
    }
  })
}

function copyToClipboard(text) { // 复制文本到剪贴版
  var textArea = document.createElement('textarea');
  textArea.style.position = 'fixed';
  textArea.style.zIndex = '-9';
  textArea.style.top = '-100%';
  textArea.style.left = '-100%';
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  var successful = false
  try {
    successful = document.execCommand('copy');
  } catch (err) {
    console.log('该浏览器不支持点击复制到剪贴板');
  }
  document.body.removeChild(textArea);
  return successful
}

function wordToUpperCase(str) { // 转换单词首字符为大写
  return str.replace(/(\w+)/g, m => m.charAt().toUpperCase()+m.slice(1))
}

function sortKey(obj) { // 排序对象的 key
  const newObj = {}
  Object.keys(obj).sort().forEach(key => (newObj[key] = obj[key]))
  return newObj
}

function deepGet(object, keys, defaultValue) { // 深层获取对象值
  // 如果 keys 无效时直接返回原数据
  if(keys === undefined || keys === `` || (keys.length === 0)) {
    return object
  }
  let res = (!Array.isArray(keys)
    ? keys
      .replace(/\[/g, '.')
      .replace(/\]/g, '')
      .split('.')
    : keys
  ).reduce((o, k) => (o || {})[k], object)
  return res !== undefined ? res : defaultValue
}

/**
 *
 * @param {*} object 要修改的对象
 * @param {*} keys 对象的键
 * @param {*} val 把指定的键替换为些 val 值
 * @param {*} removeUndefined 当 val 为 undefined 时, 是否进行删除操作, 例如对数组的某个值设置为 undefined 则表示删除该值
 */
function deepSet(object, keys, val, removeUndefined = false) { // 深层设置对象值
  keys = Array.isArray(keys) ? keys : keys
    .replace(/\[/g, '.')
    .replace(/\]/g, '')
    .split('.');
  if (keys.length > 1) {
    object[keys[0]] = object[keys[0]] || {}
    deepSet(object[keys[0]], keys.slice(1), val, removeUndefined)
    return object
  }
  object[keys[0]] = val
  if(removeUndefined && (val === undefined)) {
    if(Array.isArray(object)){ // 如果是数组则换一种方式删除, 避免还存在长度
      object.splice(keys[0], 1)
    } else {
      delete object[keys[0]]
    }
  }
  return object
}

function docLink(text, link) {
  return <a rel="noopener noreferrer" target="_blank" href={`https://www.hongqiye.com/doc/mockm${link}`}>{text}</a>
}

/**
 * 简单实现双向绑定
 * @param {event} ev event 对象 value 值
 * @param {string} stateKey 要映射到 state key
 * @param {object} param2 参数
 * @param {*} param2.state 传入 state
 * @param {*} param2.setState 传入 setState
 */
function onChange(ev, stateKey, {state, setState}) {
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

/**
 * 设置 path 中的参数
 * @param {string} path 链接
 * @param {object} obj 链接中的数据
 * @return {string} 替换后的链接
 */
function setPathVal(path, obj) {
  let origin = ``
  try {
    origin = (new URL(path)).origin
    path = path.replace(origin, ``)
  } catch (error) {
    console.log(`error`, error)
  }
  ;([...path.matchAll(/:(.+?)\b/g)]).forEach(([raw, key]) => { // 处理 /:id/
    path = path.replace(raw, obj[key])
  })
  ;([...path.matchAll(/{+(.+?)}+/g)]).forEach(([raw, key]) => { // 处理 /{id}/
    path = path.replace(raw, obj[key])
  })
  return origin + path
}

/**
 * 根据 api 生成请求示例参数, 并携带参数打开 restc 链接
 * @param {*} param0 
 * @param {string} param0.apiPath - api 的路径
 * @param {string} param0.method - 请求方法
 */
async function tryApi({apiPath, method} = {}) {
  const httpData = await http.get(`${cfg.baseURL}/api/studio/`, {params: {
    path: apiPath
  }})
  const reqData = httpData?.[method]?.parameters || {}
  await Promise.all( // 把每种数据 table 格式转换为示例数据
    Object.keys(reqData).map(key => {
      const {table = [], example: {rule, type = `object`} = {}} = reqData[key]
      return new Promise((resove, reject) => {
        http.post(`${cfg.baseURL}/api/listToData/`, {
          table,
          rule,
          type,
        }).then(res => {
          reqData[key].data = res
          resove(res)
        })
      })
    })
  )
  const {
    query: {data: query}  = {},
    "form/body": {data: body} = {},
    header: {data: header} = {},
    path: {data: path} = {},
  } = reqData
  const data = {
    method,
    query,
    body,
    path,
    header,
    url: `http://${window.serverConfig.osIp}:${window.serverConfig.port}${apiPath}`,
  }
  window.open(getRestcLink(data))
}

// eslint-disable-next-line
export default  {
  tryApi,
  isIp4InPrivateNet,
  setPathVal,
  isType,
  getRestcLink,
  toAbsURL,
  queryParams,
  onChange,
  docLink,
  deepCopy,
  tree2Array,
  objOrLine,
  showTitle,
  search,
  setListVal,
  guid,
  removeKeys,
  removeEmpty,
  swgPathToReg,
  getAbsolutePosition,
  debounce,
  dateDiff,
  getSelectionText,
  blobTool,
  getMethodUrl,
  fetchDownload,
  copyToClipboard,
  wordToUpperCase,
  sortKey,
  deepGet,
  deepSet,
}
