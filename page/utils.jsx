// headers 不支持中文字符的 => Uncaught (in promise) TypeError: Failed to execute 'setRequestHeader' on 'XMLHttpRequest': Value is not a valid ByteString.

window.utils = (() => {
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
    copyToClipboard,
    wordToUpperCase,
    sortKey,
    deepGet,
    deepSet,
  }
})()
