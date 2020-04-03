window.utils = (() => {
  function wordToUpperCase(str) { // 转换单词首字符为大写
    return str.replace(/(\w+)/g, m => m.charAt().toUpperCase()+m.slice(1))
  }

  function sortKey(obj) { // 排序对象的 key
    const newObj = {}
    Object.keys(obj).sort().forEach(key => (newObj[key] = obj[key]))
    return newObj
  }

  function formatData(type, data, cfg) { // 格式化数据, 例如 url query 转 object; image 转 base64
    cfg = {
      keyToUpperCase: false,
      ...cfg,
    }
    return {
      querySource: obj => qs.stringify(obj), // {a: 1, b: 2} => a=1&b=2
      objectToText: obj => { // 对象转文件, 键名加粗
        return (
          <>
            {
              Object.keys(obj).map(key => {
                const val = obj[key]
                return (
                  <div key={key}>
                    <span className="key">{cfg.keyToUpperCase ? wordToUpperCase(key) : key}</span>:
                    <span className="val">
                      {typeof(val) === `object` ? JSON.stringify(val) : val}
                    </span>
                  </div>
                )
              })
            }
          </>
        )
      },
    }[type](data)
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
    wordToUpperCase,
    sortKey,
    formatData,
    deepGet,
    deepSet,
  }
})()
