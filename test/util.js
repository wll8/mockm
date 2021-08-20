process.env.LANG = 'en_US.UTF-8' // 统一语言环境, 以避免产生不同结果
process.on('uncaughtException', err => {
  console.log(err)
  allTestAfter()
  process.exit()
})
process.on('SIGINT', err => {
  console.log('中途退出测试')
  allTestAfter()
  process.exit()
})
const fs = require('fs')
const os = require('os')
const assert = require('assert')
const shelljs = require('shelljs')
const isWin = os.type() === 'Windows_NT'
const child_process = require('child_process')
const packgeAdmin = shelljs.which('cnpm') ? 'cnpm' : 'npm'

function obj2str(obj) {
  return JSON.stringify(obj, null, 2)
}

function getType(data, type) {
  const dataType = Object.prototype.toString.call(data).replace(/(.* )(.*)\]/, '$2').trim().toLowerCase()
  return type ? (dataType === type.trim().toLowerCase()) : dataType
}

function execSync(cmd, option, out = true) {
  if(getType(option, 'boolean')) {
    out = option
    option = {}
  }
  console.log(`cmd:\r\n${cmd}\r\n`)
  let str = child_process.execSync(cmd, option).toString().trim()
  out && console.log(str)
  return str
}

function spawn(arr, option = {}) {
  console.log(`arr:\r\n${obj2str(arr)}\r\n`)
  console.log(`cmd:\r\n${arr.join(' ')}\r\n`)
  let [arg1, ...argMore] = arr
  return child_process.spawn(arg1, argMore, {
    stdio: 'inherit',
    ...option
  })
}

function requireUncached(filePath) { // 避免 require 使用缓存
  delete require.cache[require.resolve(filePath)]
  return require(filePath)
}

function uuid(sep = '') {
  let increment = process.increment === undefined ? (process.increment = 1) : (process.increment = (process.increment + 1))
  // let str = `${increment}_${process.pid}_${('' + (Math.random() + Math.random()))}`
  // console.log('increment', increment)
  // return str.replace('.', '').replace(/_/g, sep)
  return `${Number(String(Date.now()).slice(-5))}_${String(Math.random()).slice(-2)}_${process.pid}_${increment}`.replace(/_/g, sep)
}

function sleep(time = 1000) { return new Promise((res, rej) => setTimeout(res, time)) }

function clearRequireCache() { // 清除 require 缓存, 使用场景: 当 require 同一个 json 文件, 但这文件改变后再 require 时并没有改变
  Object.keys(require.cache).forEach(key => delete require.cache[key])
}

function absPath(file = '') { return require('path').resolve(__dirname, file) }

/**
 * 创建或删除一组文件
 * @param objOrArr {object|number} 要操作的内容
 * @param action {stirng} 操作方式 create remove
 */
function filesCreateOrRemove (objOrArr, action) {
  const {writeFileSync, unlinkSync} = require('fs')
  Object.keys(objOrArr).forEach(key => {
    const name = objOrArr[key]
    if (action === `create`) {
      writeFileSync(name, ``, `utf8`)
    }
    if (action === `remove`) {
      unlinkSync(name)
    }
  })
}

/**
 * 根据 dirName 和 fileName 返回一个当前目录不存在的文件名
 * @param dirName 目录
 * @param fileName 名称
 * @return {stirng} 例 `${dirName}/temp_${Date.now()}.${fileName}`
 */
function createNewFile (dirName, fileName) {
  const newFile = `${dirName}/temp_${Date.now()}.${fileName}`
  return require(`fs`).existsSync(newFile) === true ? createNewFile(dirName, fileName) : newFile
}

/**
 * 同步执行异步函数, 入参和出参需要可序列化, 不会输出出参数之外的其他信息
 * @param fn 要运行的函数
 * @return {function} 接收原参数, 返回 {res, err}
 */
function asyncTosync (fn) {
  return (...args) => {
    const { writeFileSync, readFileSync } = require(`fs`)
    const fnStr = fn.toString()
    const tempDir = (__dirname || require(`os`).tmpdir()).replace(/\\/g, `/`)
    const fileObj = {
      fnFile: createNewFile(tempDir, `fn.js`),
      resFile: createNewFile(tempDir, `res.log`),
      errFile: createNewFile(tempDir, `err.log`),
    }
    filesCreateOrRemove(fileObj, `create`)
    let res = ``
    let err = ``
    try {
      const argsString = args.map(arg => JSON.stringify(arg)).join(', ');
      const codeString = `
        const { writeFileSync } = require('fs')
        const fn = ${fnStr}
        new Promise(() => {
          fn(${argsString})
            .then((output = '') => {
              writeFileSync("${fileObj.resFile}", output, 'utf8')
            })
            .catch((error = '') => {
              writeFileSync("${fileObj.errFile}", error, 'utf8')
            })
          }
        )
      `
      writeFileSync(fileObj.fnFile, codeString, `utf8`)
      require(`child_process`).execSync(`"${process.execPath}" ${fileObj.fnFile}`)
      res = readFileSync(fileObj.resFile, `utf8`)
      err = readFileSync(fileObj.errFile, `utf8`)
    } catch (error) {
      console.log(`error`, error)
    }
    filesCreateOrRemove(fileObj, `remove`)
    return {res, err}
  }
}

function hasFile(filePath) { // 判断文件或目录是否存在
  const fs = require(`fs`)
  return fs.existsSync(filePath)
}

function startApp() {
  global.cmdRef = {
    out: ``,
  }

  const { spawn } = require('child_process');
  const cfg = ({
    build: {
      runPath: `../dist/package/run.js`,
      arg: [`config`],
    },
    dev: {
      runPath: `../server/run.js`,
      arg: [],
    },
  })[process.env.testEnv]
  
  const cmdRef = spawn('node', [absPath(cfg.runPath), ...cfg.arg]);
  
  cmdRef.stdout.on('data', (data) => {
    console.log(String(data))
    global.cmdRef.out = global.cmdRef.out + data
  });
  
  cmdRef.stderr.on('data', (data) => {
    console.log(String(data))
    global.cmdRef.out = global.cmdRef.out + data
  });
  
  cmdRef.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

function allTestBefore() {
  console.log('备份用户配置')
}

function allTestAfter() {
  console.log('恢复用户配置')
}

function http() {
  const axios = require(`axios`)
  axios.interceptors.response.use((response) => {
    return response
  }, (error) => {
    return Promise.reject(error)
  })
  return axios
}

module.exports = {
  hasFile,
  startApp,
  http: http(),
  asyncTosync,
  os,
  packgeAdmin,
  allTestAfter,
  allTestBefore,
  fs,
  assert,
  shelljs,
  isWin,
  execSync,
  spawn,
  requireUncached,
  uuid,
  sleep,
  clearRequireCache,
  absPath,
}
