const util = require(`./index.js`)
const http = require(`./http.js`)
const {
  tool,
} = util

/**
 * 批量处理文本为 mockm 的数据定义表
 * @param {object} param0
 * @param {string} param0.text 要翻译的多行文本
 * @param {string} param0.appid 百度 appid
 * @param {string} param0.key 百度 key
 * @param {string} param0.type tree 或 list
 */
function batchTextEnglish({text, appid, key, type = `tree`}) {
  return new Promise((resove, reject) => {
    if(text === undefined) {
      return reject(new Error(`请填写 text 参数`))
    }
    translateTextToLine({
      text,
      key,
      appid,
    }).then(res => {

      // 小驼峰列表
      const littleHumpResList = res.map((item, index) => {
        const littleHump = tool.string.toLittleHump(item.en.replace(/^-*\s*/, ``)).match(/[a-zA-Z0-9]+/ig).join(``)
        // 根据翻译结果返回 mock 模板
        const {mock, type} = ruleHandle({word: littleHump})
        return {
          // ...item,
          name: littleHump,
          type: type[0],
          example: mock,
          description: item.zh,
        }
      })
      if(type === `tree`) {
        // 转换为树形结构
        const tree = tool.array.arrToTree(littleHumpResList, {key: `description`, tag: `-`})
        resove(tree)
      } else {
        resove(littleHumpResList)
      }
    }).catch(err => {
      console.log(`err`, err)
      reject(err)
    })
  })
}

/**
 * 翻译多行文本并处理为数组
 * @param {object} param0
 * @param {string} param0.text 要翻译的多行文本
 * @param {string} param0.appid 百度 appid
 * @param {string} param0.key 百度 key
 */
async function translateTextToLine({ text, appid, key }) { // 翻译行
  const str = text.split(/[\r\n]/).map(item => item.trim()).filter(item => Boolean(item)).join(`\n`) // 删除多余字符
  const isChinese = escape(str.match(/(.+?)\s?/)[1]).includes(`%u`) // 查看第一个字符是不是中文
  const translateFormat = isChinese ? { from: `zh`, to: `en` } : { from: `en`, to: `zh` }
  async function translatePlatforms() {
    return new Promise(async (resolve, reject) => {
      await tool.generate.initPackge(`translate-platforms`, {getRequire: false})
      const { google, microsoft, youdao, baidu } = require(`translate-platforms`)
      let errInfo = []
      const handleYouDao = (...arg) => {
        // - [ ] fix: youdao 的翻译结果 text 和 word 顺序颠倒了: https://github.com/imlinhanchao/translate-platforms/issues/1
        return new Promise((resolve, reject) => {
          youdao(...arg).then(res => {
            return resolve({
              ...res,
              text: res.word,
              word: res.text,
            })
          }).catch(err => reject(err))
        })
      }
      const apiList = [
        baidu,
        microsoft,
        google,
        handleYouDao, // 有道不能直接翻译驼峰式文本, 并且词语会被翻译为句子的形式
      ]

      let result = undefined
      for (let index = 0; index < apiList.length; index++) {
        if(result !== undefined) {
          break
        } else {
          result = await apiList[index](str, translateFormat).catch(err => { errInfo.push(err) })
        }
      }
      if (result === undefined) {
        reject(errInfo)
      } else {
        const enArr = (isChinese ? result.text : result.word).split(`\n`)
        const zhArr = (isChinese ? result.word : result.text).split(`\n`)
        const rawArr = isChinese ? zhArr : enArr
        const handleRes = enArr.reduce((acc, cur, index) => {
          return [...acc, {
            raw: rawArr[index],
            en: cur,
            zh: zhArr[index],
          }]
        }, [])
        resolve(handleRes)
      }
    })
  }

  async function baiduTranslate({ key, appid }) {
    return new Promise(async (resolve, reject) => {
      if(Boolean((key && appid)) === false) {
        return reject(`请添加百度翻译 key appid`)
      }
      const querystring = require(`querystring`)

      const cfg = {
        appid,
        key,
        q: str,
        salt: `Date.now()`,
      }
      const isChinese = escape(cfg.q.match(/(.+?)\s?/)[1]).includes(`%u`) // 查看第一个字符是不是中文
      const md5 = tool.string.getMd5(`${cfg.appid}${cfg.q}${cfg.salt}${cfg.key}`)
      const paramsObj = {
        ...translateFormat,
        q: cfg.q,
        salt: cfg.salt,
        appid: cfg.appid,
        sign: md5,
      }
      const paramsUrl = querystring.stringify(paramsObj)
      const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?${paramsUrl}`
      http.get(url).then(res => {
        // if (Boolean(res.data.trans_result) === false) {
        //   reject(res.data)
        // }
        const handle = res.trans_result.map(item => {
          const zh = isChinese ? item.src : item.dst
          const en = isChinese ? item.dst : item.src
          const raw = isChinese ? zh : en
          return { raw, zh, en }
        })
        resolve(handle)
      }).catch(err => reject(err))
    })
  }

  return new Promise(async (resolve, reject) => {
    let errInfo = []
    let fnArr = [
      () => translatePlatforms().catch(err => { errInfo.push({ key: `translatePlatforms`, err }) }),
      () => baiduTranslate({ key, appid }).catch(err => { errInfo.push({ key: `baiduTranslate`, err }) }),
    ]
    fnArr = (appid && key)
      ? fnArr.reverse() // 如果传了 key, 则优先使用需要 key 的方法
      : fnArr
    const res = await fnArr[0]() || await fnArr[1]()
    res ? resolve(res) : reject(errInfo)
  })

}


/**
 * 根据类型和词语返回 mock 模版
 * @param {object} param0 参数
 * @param {string} param0.type 参数
 * @param {string} param0.word 单词
 */
function ruleHandle({type, word}) {
  const ruleList = [
    {
      type: [`string`],
      re: `avatar|icon`,
      reOption: `i`,
      mock: `@image('100x100')`,
      des: `头像、icon`,
    },
    {
      type: [`string`],
      re: `image|img|photo|pic`,
      reOption: `i`,
      mock: `@image('400x400')`,
      des: `图片`,
    },
    {
      type: [`string`],
      re: `.*url`,
      reOption: `i`,
      mock: `@url('http')`,
      des: `URL`,
    },
    {
      type: [`string`],
      re: `nick|user_?name`,
      reOption: `i`,
      mock: `@cname`,
      des: `用户名、昵称`,
    },
    {
      type: [`string`],
      re: `title|name`,
      reOption: `i`,
      mock: `@ctitle`,
      des: `标题、名称`,
    },
    {
      type: [`number`, `integer`, `string`],
      re: `No$|Code$`,
      reOption: ``,
      mock: `@natural(1,100)`,
      des: `XX编号、XX码`,
    },
    {
      type: [`number`, `integer`, `string`],
      re: `id|age|total|num|code|amount|quantity|price|discount|balance|money`,
      reOption: `i`,
      mock: `@natural(1,100)`,
      des: `常见数字型`,
    },
    {
      type: [`number`, `integer`],
      re: `state|status`,
      reOption: `i`,
      mock: `@pick(1,2,3)`,
      des: `状态`,
    },
    {
      type: [`number`, `integer`, `string`],
      re: `phone|mobile|tel$`,
      reOption: `i`,
      mock: `@phone`,
      des: `手机号`,
    },
    {
      type: [`string`],
      re: `.*date`,
      reOption: `i`,
      mock: `@date('yyyy-MM-dd')`,
      des: `字符串日期`,
    },
    {
      type: [`number`, `integer`],
      re: `.*date`,
      reOption: `i`,
      mock: `@date('yyyyMMdd')`,
      des: `数字型日期`,
    },
    {
      type: [`string`],
      re: `created?_?at|updated?_?at|deleted?_?at|.*time`,
      reOption: `i`,
      mock: `@datetime('yyyy-MM-dd HH:mm:ss')`,
      des: `字符串时间`,
    },
    {
      type: [`number`, `integer`],
      re: `created?_?at|updated?_?at|deleted?_?at|.*time`,
      reOption: `i`,
      mock: `@datetime('T')`,
      des: `时间戳`,
    },
    {
      type: [`string`],
      re: `e?mail*`,
      reOption: `i`,
      mock: `@email('qq.com')`,
      des: `邮箱`,
    },
    {
      type: [`string`],
      re: `.*province*`,
      reOption: `i`,
      mock: `@province`,
      des: `省份`,
    },
    {
      type: [`string`],
      re: `.*city*`,
      reOption: `i`,
      mock: `@city`,
      des: `城市`,
    },
    {
      type: [`string`],
      re: `.*address`,
      reOption: `i`,
      mock: `@address`,
      des: `地址`,
    },
    {
      type: [`string`],
      re: `.*district|region`,
      reOption: `i`,
      mock: `@county`,
      des: `区`,
    },
    {
      type: [`string`],
      re: `.*ip`,
      reOption: `i`,
      mock: `@ip`,
      des: `IP 地址`,
    },
  ]
  let res // 结果
  const Random = require(`@wll8/better-mock`).Random
  const hasMockMethod = Object.keys(Random).some(method => {
    return method.match(new RegExp(`^${word}$`, `i`))
  })
  // 如果完整匹配 mockjs 的方法则直接返回
  if(hasMockMethod) {
    res = {
      type: [`string`],
      re: word,
      mock:  Random[`c${word.toLowerCase()}`] ? `@c${word}` : `@${word}`, // 如果存在 c 开头的方法, 则优先使用
      des: `mockjs.Mock.Random.${word}`,
    }
  } else {
    if(type) { // 如果传入 type 则先匹配 type
      res = ruleList.find(item => {
        return item.type.includes(type) && word.match(new RegExp(item.re, item.reOption))
      })
    }
    if(res === undefined) { // 如果 type 没有匹配到, 则忽略 type 进行匹配
      res = ruleList.find(item => word.match(new RegExp(item.re, item.reOption)))
    }
  }
  if(res === undefined) { // 如果啥也没匹配到, 就返回一个默认值
    res = {
      type: [`string`],
      re: word,
      reOption: `i`,
      mock: `@ctitle`,
      des: `未知匹配`,
    }
  }
  return res
}

module.exports = {
  batchTextEnglish,
  translateTextToLine,
}
