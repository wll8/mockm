require(`util`).inspect.defaultOptions.depth = null // console.log 展开对象

const { inspect } = require(`util`)

function print(...argList) { // 用于输出有用信息, 而不是调试信息
  const resList = []
  argList.map(item => {
    const type = isType(item)
    ;([
      [`undefined`, ``],
      [`string`, `number`, item],
      [`object`, `error`, `array`, inspect(item || ``, false, null, true)],
    ]).forEach(item2 => item2.slice(0, -1).includes(type) && resList.push((item2.reverse())[0]))
  })
  console._log ? console._log(...resList) : console.log(...resList)
}

function logHelper(isUse = true) { // 重写 console.log 方法, 打印时附带日期, 所在行
  if(isUse === false) {
    console.log = console._log ? console._log : console.log
    return
  }
  const log = console.log
  console._log = log
  console.log = (...arg) => {
    const getStackTrace = () => {
      const obj = {}
      Error.captureStackTrace(obj, getStackTrace)
      return obj.stack
    }
    const stack = getStackTrace() || ``
    const matchResult = stack.match(/\(.*?\)/g) || []
    const line = (matchResult[1] || `()`).match(/^\((.*)\)$/)[1]
    if( // 重写时忽略的调用栈路径
      line.match(/node_modules/)
    ) {
      log(...arg)
      return undefined
    } else {
      log(dateFormat(`YYYY-MM-DD hh:mm:ss`, new Date()))
      log(`> ${line}`)
      log(...arg)
    }
  }
}

/**
 * 时间格式化
 * @param {string} fmt 格式
 * @param {Date} date 时间对象
 */
function dateFormat(fmt, date) {
  let ret
  const opt = {
    'Y+': date.getFullYear().toString(),        // 年
    'M+': (date.getMonth() + 1).toString(),     // 月
    'D+': date.getDate().toString(),            // 日
    'h+': date.getHours().toString(),           // 时
    'm+': date.getMinutes().toString(),         // 分
    's+': date.getSeconds().toString(),          // 秒
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  }
  for (let k in opt) {
    ret = new RegExp(`(${k})`).exec(fmt)
    if (ret) {
      fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, `0`)))
    }
  }
  return fmt
}

function isType(data, type = undefined) { // 判断数据是否为 type, 或返回 type
  const dataType = Object.prototype.toString.call(data).match(/\s(.+)]/)[1].toLowerCase()
  return type ? (dataType === type.toLowerCase()) : dataType
}

module.exports = {
  logHelper,
  print,
}
