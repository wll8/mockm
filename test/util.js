process.env.LANG = 'en_US.UTF-8' // 统一语言环境, 以避免产生不同结果
function killProcess(...arg) {
  console.log(`killProcess:`, ...arg)
  if(arg[0] !== `SIGINT`) {
    console.log('中途退出测试')
    allTestAfter()
  }
  process.exit()
}
process.on(`SIGTERM`, killProcess)
process.on(`SIGINT`, killProcess)
process.on(`uncaughtException`, killProcess)
process.on(`unhandledRejection`, killProcess)

const fs = require('fs')
const os = require('os')
const shelljs = require('shelljs')
const isWin = os.type() === 'Windows_NT'
const child_process = require('child_process')
const packgeAdmin = shelljs.which('cnpm') ? 'cnpm' : 'npm'

/**
 * 封装断言方法, 用于打印相关信息
 * @param {*} val 
 */
function ok(val) {
  const assert = require('assert')
  console.log(`=>`, val)
  assert.ok(val)
}

/**
 * 运行 mockm
 * @param {*} arg
 */
async function runMockm(fnArg) {
  fnArg = typeof(fnArg) === `function` ? {okFn: fnArg} : fnArg
  const {
    runOk = true, // 是否等待运行完成
    mockm = undefined, // mockm 参数
    timeout = undefined, // 超时
    okFn = () => {}, // 运行成功回调, 返回为真时不继续匹配终端输出
  } = fnArg || {}
  const {
    fullCmd: cmd,
    arg,
  } = await craeteMockmCmdInfo(mockm)
  return new Promise((resolve, reject) => {
    testCliText({
      cmd,
      timeout,
      async fn(str) {
        console.log(`mockm>`, str)
        if(
          runOk
          ? (
            str.match(`:${arg.port}`) 
            && str.match(`:${arg.testPort}`)
          ) : true
        ) {
          let res
          try {
            res = await okFn({str, arg, cmd})
          } catch (error) {
            console.log(`error`, error.message)
          }
          res === undefined ? false : res
          res && resolve(res)
          return res
        }
      }
    }).catch(res => {
      console.log(`运行超时`)
      resolve(false)
    })
  })
}

/**
 * 生成 mockm 的运行命令, 端口默认随机, 可以传入对象参数覆盖
 */
async function craeteMockmCmdInfo(arg = {}, runPath) {
  const port = await newMockmPort()
  const res = {
    build: {
      runPath: pkgPath(runPath || `./run.js`),
      arg: {
        '--config': true,
        '--cwd': getTempDir(),
        port: port.port,
        testPort: port.testPort,
        replayPort: port.replayPort,
        ...arg,
      },
    },
    dev: {
      runPath: pkgPath(runPath || `./run.js`),
      arg: {
        '--config': true,
        '--cwd': getTempDir(),
        port: port.port,
        testPort: port.testPort,
        replayPort: port.replayPort,
        ...arg,
      },
    },
  }[process.env.testEnv]
  const argCmd = Object.entries(res.arg).reduce((acc, [key, val]) => {
    return `${acc} ${key}=${val === undefined ? true : val}`
  } , ``)
  res.fullCmd = `node ${res.runPath} ${argCmd}`
  res.argCmd = argCmd
  res.arr = [res.runPath].concat(argCmd.split(/\s+/))
  return res
}

function getTempDir() {
  const dir = `${require(`os`).tmpdir()}/${uuid()}`.replace(/\\/g, `/`)
  shelljs.mkdir(`-p`, dir)
  return dir
}

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

/**
 * 生成 mockm 的三个所需端口
 */
async function newMockmPort() {
  const getPort = require(`get-port`)
  return {
    port: await getPort(),
    testPort: await getPort(),
    replayPort: await getPort(),
  }
}

/**
 * 避免 require 使用缓存
 * @param {*} filePath 
 * @returns 
 */
function requireUncached(filePath) {
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

function pkgPath(file = '') {
  const basePath = {
    build: `${__dirname}/../dist/package/`,
    dev: `${__dirname}/../server/`,
  }[process.env.testEnv]
  const res = require('path').resolve(`${basePath}`, file)
  return res
}

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
    const tempDir = (__dirname || getTempDir()).replace(/\\/g, `/`)
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
      console.log(`error`, error.message)
    }
    filesCreateOrRemove(fileObj, `remove`)
    return {res, err}
  }
}

/**
 * 判断文件或目录是否存在
 * @param {*} filePath 
 * @returns 
 */
function hasFile(filePath) {
  const fs = require(`fs`)
  return fs.existsSync(filePath)
}

/**
 * 测试命令行输出
 * @param {*} param0 
 * @param {*} param0.cmd 要运行的命令
 * @param {*} param0.timeout 超时毫秒
 * @param {*} param0.fn 传入输出的文本, 返回匹配结果, 直到为真或超时
 */
function testCliText({cmd = str, timeout = 30 * 1e3, fn = (str) => str, } = {}) {
  console.log(`cmd:\n${cmd}`)
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const [bin, ...arg] = cmd.split(/\s+/)
    const cmdRef = spawn(bin, arg);
    cmdRef.stdout.on('data', async (data) => {
      const str = String(data)
      if(await fn(str)) {
        resolve(str)
        cmdRef.kill()
      }
    });
    cmdRef.stderr.on('data', async (data) => {
      const str = String(data)
      if(await fn(str)) {
        resolve(str)
        cmdRef.kill()
      }
    });
    setTimeout(() => {
      reject(false)
      cmdRef.kill()
    }, timeout);
  })
}

async function startApp({runPath, arg} = {}) {
  global.cmdRef = {
    out: ``,
  }

  const { spawn } = require('child_process');
  const craeteMockmCmdInfoRes = await craeteMockmCmdInfo({
    port: 9000,
    testPort: 9005,
    replayPort: 9001,
    ...arg,
  }, runPath)
  
  const cmdRef = spawn('node', craeteMockmCmdInfoRes.arr);
  
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
  
  return craeteMockmCmdInfoRes
}

function allTestBefore() {
  console.log('备份用户配置')
}

function allTestAfter() {
  console.log('恢复用户配置')
}

/**
 * @see https://github.com/scopsy/await-to-js
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 */
function to(promise, errorExt) {
  return promise
      .then(function (data) { return [null, data]; })
      .catch(function (err) {
      if (errorExt) {
          Object.assign(err, errorExt);
      }
      return [err, undefined];
  });
}

function http() {
  let axios = require('axios').default
  const http = axios.create({
    proxy: false,
  })
  http.defaults.timeout = 30 * 1e3
  http.defaults.retry = 3 // 重试次数
  http.defaults.retryDelay = 1000 // 重试延时
  http.defaults.shouldRetry = (error) => true // 重试条件，默认只要是错误都需要重试

  http.interceptors.response.use(undefined, (err) => {
    const config = err.config

    // 判断是否配置了重试
    if(!config || !config.retry) return Promise.reject(err)
    if(!config.shouldRetry || typeof config.shouldRetry != 'function') {
      return Promise.reject(err)
    }
 
    // 判断是否满足重试条件
    if(!config.shouldRetry(err)) {
      return Promise.reject(err)
    }
 
    // 设置重置次数，默认为0
    config.__retryCount = config.__retryCount || 0
 
    // 判断是否超过了重试次数
    if(config.__retryCount >= config.retry) {
      return Promise.reject(err)
    }
 
    // 重试次数自增
    config.__retryCount += 1
 
    // 延时处理
    const backoff = new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, config.retryDelay || 1)
    })
 
    // 重新发起请求
    return backoff.then(() => {
      return http(config)
    })
  })
  return http
}

module.exports = {
  to,
  ok,
  runMockm,
  craeteMockmCmdInfo,
  getTempDir,
  newMockmPort,
  hasFile,
  startApp,
  http: http(),
  asyncTosync,
  os,
  packgeAdmin,
  allTestAfter,
  allTestBefore,
  fs,
  shelljs,
  isWin,
  execSync,
  spawn,
  requireUncached,
  uuid,
  sleep,
  clearRequireCache,
  pkgPath,
  testCliText,
}
