const { wrapApiData } = require(`../util.js`)

module.exports = util => {
  const {
    libObj: { mockjs },
  } = util
  return {
    // 创建接口并使用 mockjs 生成数据
    'get /api/test': wrapApiData(mockjs.mock({
      'data|3-7': [{
        userId: `@id`,
        userName: `@cname`,
      }]
    })),
  }
}
