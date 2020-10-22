import React from 'react'

// headers 不支持中文字符的 => Uncaught (in promise) TypeError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': Value is not a valid ByteString.

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
    res = Object.keys(obj).reduce((acc, cur) => `${acc}\n\n${cur}: ${obj[cur]}`, `` ).trim()
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


/**
 * 把类似 schema 的列表转换为数据
 * @param {*} list
 */
function listToData(list, options = {}){
  let res = {}
  if(Array.isArray(list) === true) {
    list.forEach(item => {
      if([`object`, `array`].includes(item.type) && Array.isArray(item.children)) {
        switch(item.type) {
          case `object`:
            res[item.name] = listToData(item.children)
            break;
          case `array`:
            res[item.name] = res[item.name] || []
            res[item.name].push(listToData(item.children))
            break;
          default:
            console.log(`no type`, item.type)
        }
      } else {
        res[item.name] = item.example
      }
    })
  } else {
    res = list
  }
  res = {
    [`data${options.rule ? `|${options.rule}` : ''}`]: {object: res, array: [res]}[options.type]
  }
  return res
}

export default  {
  listToData,
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
