/**
自动校验数据
- 在 side 中
  - schema 对象中包含 header/path/query/cookie/body 这些 joi schema 对象, 本插件为自动校验它们
  - validateAuto -- boolean, 是否自动验证, 默认 true
  - validateErrorNext -- boolean, 验证不通过时是否进入主业务, 默认 false
- todo // todo
  - [ ] feat: 支持校验 config.db
 */

module.exports = {
  key: `validate`,
  summary: `自动校验数据`,
  hostVersion: [],
  async main({hostInfo, pluginConfig, config, util}){
    return {
      async apiListParsed(serverRouterList = []) {
        for (let index = 0; index < serverRouterList.length; index++) {
          const serverRouterItem = serverRouterList[index]
          Object.assign(serverRouterItem, {
            validateAuto: true, // Boolean, 是否自动验证
            validateErrorNext: false, // Boolean, 验证不通过时是否进入主业务
          }, serverRouterItem)
          if(util.toolObj.type.isEmpty(serverRouterItem.schema) === false) {
            const actionOld = serverRouterItem.action
            serverRouterItem.action = async (req, res, next) => {
              req.schema = serverRouterItem.schema
              if(serverRouterItem.validateAuto) {
                const error = await new Promise((resolve, reject) => {
                  let error
                  Object.entries(req.schema).some(([key, val]) => {
                    const data = {
                      header: req.headers,
                      path: req.params,
                      query: req.query,
                      cookie: req.cookies,
                      body: req.body,
                    }[key]
                    error = val.validate(data).error
                    if(error) {
                      req.validateKey = key
                      req.validateError = error
                    }
                    return error
                  })
                  resolve(error)
                })
                if(error) {
                  if(serverRouterItem.validateErrorNext) {
                    await actionOld(req, res, next)
                  } else {
                    res.status(400).json(error.details)
                  }
                } else {
                  await actionOld(req, res, next)
                }
              } else {
                await actionOld(req, res, next)
              }
            }
          }
        }
      },
    }
  },
}