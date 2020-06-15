// headers 不支持中文字符的 => Uncaught (in promise) TypeError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': Value is not a valid ByteString.

window.utils = (() => {
  function swgPathToReg(path) { // 把 swagger 的 path /status/{codes} 转为正则 /status/.+?$
    return new RegExp(path.replace(/\{.+?\}/g, '.+?')+`$`)
  }

  function getAbsolutePosition(domObj) { // 获取元素位置及大小
    // 如果函数没有传入值的话返回对象为空的
    if (!domObj) return null;
    var w = domObj.offsetWidth, h = domObj.offsetHeight;
    // 从目标元素开始向外遍历，累加top和left值
    var t, l;
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
      } else if (document.selection && document.selection.type != "Control") {
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
        var blobUrl = window.URL.createObjectURL(blob)
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
    let res = (!Array.isArray(keys)
      ? keys
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .split('.')
      : keys
    ).reduce((o, k) => (o || {})[k], object)
    return res !== undefined ? res : defaultValue
  }

  function deepSet(object, keys, val) { // 深层设置对象值
    keys = Array.isArray(keys) ? keys : keys
      .replace(/\[/g, '.')
      .replace(/\]/g, '')
      .split('.');
    if (keys.length > 1) {
      object[keys[0]] = object[keys[0]] || {}
      deepSet(object[keys[0]], keys.slice(1), val)
      return object
    }
    object[keys[0]] = val
    return object
  }
  return {
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
})()
