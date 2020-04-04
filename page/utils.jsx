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

  function formatData(type, data, cfg) { // 格式化数据, 例如 url query 转 object; image 转 base64
    cfg = {
      keyToUpperCase: false,
      ...cfg,
    }
    return {
      source: obj => {
        if(cfg.headerRaw) {
          return `headerRaw`
        } else {
          return Qs.stringify(obj) // {中文: `你好`} => "%E4%B8%AD%E6%96%87=%E4%BD%A0%E5%A5%BD"
        }
      },
      parse: function (obj) {
        return this.parse(obj)
      },
      encode: function (obj) {
        return this.parse(obj, 'encode')
      },
      json: obj => JSON.stringify(obj, null, 2),
      parse: (obj, action) => { // 对象转文件, 键名加粗
        return (
          <>
            {
              Object.keys(obj).map(key => {
                const val = obj[key]
                return (
                  <div key={key}>
                    <span className="key">{
                      (() => {
                        const res = cfg.keyToUpperCase ? wordToUpperCase(key) : key
                        return action === `encode` ? encodeURI(res) : res
                        // chrome network: key 使用的是 encodeURI, val 使用的是 encodeURIComponent
                        // 测试: axios.get('//httpbin.org/get', {params: {"中文@": "你好="}})
                        // 查看 view URL encoded 会发现 key 中的 @ 没有被转换, 即使用了 encodeURI
                        // %E4%B8%AD%E6%96%87@: %E4%BD%A0%E5%A5%BD%3D
                      })()
                    }</span>:
                    <span className="val">
                      {
                        (() => {
                          const res = typeof(val) === `object` ? JSON.stringify(val) : val
                          return action === `encode` ? encodeURIComponent(res) : res
                        })()
                      }
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
    copyToClipboard,
    wordToUpperCase,
    sortKey,
    formatData,
    deepGet,
    deepSet,
  }
})()
