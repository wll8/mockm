const { inspect } = require('util')

function getType(data, type) {
  const dataType = Object.prototype.toString.call(data).replace(/(.* )(.*)\]/, '$2').trim().toLowerCase()
  return type ? (dataType === type.trim().toLowerCase()) : dataType
}

function print(...argList) { // 用于输出有用信息, 而不是调试信息
  const resList = []
  argList.map(item => {
    const type = getType(item)
    ;([
      ['undefined', ''],
      ['string', 'number', item],
      ['object', 'error', 'array', inspect(item || '', false, null, true)],
    ]).forEach(item2 => item2.slice(0, -1).includes(type) && resList.push((item2.reverse())[0]))
  })
  console.log(...resList)
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
    const stack = getStackTrace() || ''
    const matchResult = stack.match(/\(.*?\)/g) || []
    const line = (matchResult[1] || '()').match(/^\((.*)\)$/)[1]
    if( // 重写时忽略的调用栈路径
      line.match(/node_modules/)
    ) {
      log(...arg)
      return undefined
    } else {
      log(new Date().toLocaleString())
      log(`> ${line}`)
      log(...arg)
    }
  }
}

module.exports = {
  logHelper,
  print,
}
