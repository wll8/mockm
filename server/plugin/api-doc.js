/**
生成接口文档
- 自动扫描现有接口生成文档
- 在插件配置中
  - apiDocInit -- boolean, 是否启用文档，默认否
  - apiDocDataRoute -- string, openApi 数据地址, 默认 `/doc/openApi.json`
  - docPage -- string, 接口文档地址, 默认 `/doc`
  - cssUrl -- string, swagger-ui css 地址, 默认使用 cdn, 当为相对地址时, 由生成路由并引用本地资源
  - jsUrl -- string, swagger-ui js 地址, 规则同上
  - apiDocData -- yaml/json, openApi 数据, 可以自定义混入, 默认自动生成
- 在 side 中
  - 可以根据 side 中的 schema 数据生成 schema
  - 可以在 side 中配置常见接口属性
    - deprecated -- boolean, 是否已废弃, 默认 false
    - tags -- string[], 标签
    - summary -- string, 摘要
    - noDoc -- boolean, 不生成接口文档, 默认 false
  - 可以在 side 中操作当前接口文档的任意属性
    - apiDocData -- yaml/json, 混入当前接口, 优先级最高

- todo // todo
  - [ ] feat: 支持为动态添加的接口生成文档
  - [ ] feat: 支持 db 中的接口
  - [ ] feat: 支持混入 tags, 当为函数时则为自定义混入
  - [ ] feat: 支持 webApi 中的接口
  - [ ] feat: 支持配置某个接口不显示在文档中
  - [ ] feat: 支持扩展 use 和 all-method 以及 ws
    - https://github.com/OAI/OpenAPI-Specification/issues/1747
    - 由于 openApi 不支持, 所以做以下处理
        - use -- 被中间件处理的路由
          - 中间件 xxx, xxx 工作在这个路由
          - 应隐藏按钮 `Try it out`
        - ws -- 这是 websocket 接口, 请使用 websocket 连接它
          - 应隐藏按钮 `Try it out`
        - all-methods -- 支持所有请求方法, 例如 get/post/put/...
  - [ ] feat: 支持本地化 swagger-ui
    - 当 css/js url 为相对地址时, 自动初始化本地依赖
    - 当 url 为绝对地址时, 视为 cdn
  - [ ] apiDocDataRoute 支持引用线上地址, 此时不生成本地路由
  - [ ] feat: 支持混入 apiDocData
    - 以 yaml 形式
    - 以 json 形式
    - 若某节点为 function 时, 表示自定义混入, 例如:
      ``` js
      {
        paths: {
          '/weddings/{id}/{name}': {
            post: {
              parameters(rawArg){
                // 只返回一部分参数
                return rawArg.slice(2, 4)
              },
            }
          }
        }
      }
      ```
 */

module.exports = {
  key: `apiDoc`,
  summary: `生成接口文档`,
  hostVersion: [],
  async main({hostInfo, pluginConfig, config, util}){
    pluginConfig = {
      ...pluginConfig,
      apiDocInit: true,  // 是否启用文档，默认否
      apiDocDataRoute: `/doc/openApi.json`, // openApi 数据地址
      docPage: `/doc`, // 接口文档地址
      apiDocData: {
        openapi: `3.0.0`,
        servers: [
          {
            url: `http://${config.osIp}:${config.port}/`,
          },
        ],
        // 这里声明标签, 然后在 method 中引用时可以有描述, 如果这里未声明时没有描述
        tags: [],
      },
    }
    return {
      async apiParsed(api, apiUtil){
        Object.assign(api, {
          [`get ${pluginConfig.docPage}`](req, res) {
            res.send(`
              <!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>SwaggerUI</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/swagger-ui.css" />
              </head>
              <body>
                <div id="swagger-ui"></div>
                <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
                <script>
                  // 参数文档 https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
                  window.ui = SwaggerUIBundle({
                    url: 'http://${config.osIp}:${config.port}${pluginConfig.apiDocDataRoute}',
                    dom_id: '#swagger-ui',
                    docExpansion: 'none', // 折叠所有
                  });
                </script>
              </body>
              </html>
            `)
          },
          [`get ${pluginConfig.apiDocDataRoute}`](req, res){
            res.json(pluginConfig.apiDocData)
          },
        })
      },
      /**
       * config.api 中的每个接口已解析完成
       * 可以在这里使用它, 例如生成接口列表
       * @param {*} serverRouterList 
       */
      async apiListParsed(serverRouterList = []) {
        const j2s = await util.tool.generate.initPackge(`joi-to-swagger`)
        const pathsAcc = {}
        for (let index = 0; index < serverRouterList.length; index++) {
          const serverRouterItem = serverRouterList[index]
          const schemaOpenApiSchema = Object.entries(serverRouterItem.schema || {}).reduce((acc, [key, val]) => {
            // todo 研究关于 j2s 的其他参数以发掘更多功能
            acc[key] = j2s(val).swagger
            return acc
          }, {})
          const path = serverRouterItem.route.replace(/:([a-z]\w*)/ig, `{$1}`)
          const method = serverRouterItem.method
          const parameters = [
            `header`,
            `path`,
            `query`,
            `cookie`,
          ].reduce((accIn, valueIn) => {
            const schema = schemaOpenApiSchema[valueIn] || {}
            const parameters = Object.entries(schema.properties || {}).reduce((acc, [key, val]) => {
              acc.push({
                name: key,
                in: valueIn,
                required: (schema.required || []).includes(key),
                description: val.description,
                schema: val,
                example: val.example,
              })
              return acc
            }, [])
            accIn.push(parameters)
            return accIn
          }, []).flat()
          
          const requestBody = (() => {
            const schema = schemaOpenApiSchema.body
            if(schema) {
              return {
                description: schema.description,
                required: !schema.nullable,
                content: {
                  'application/json': {
                    schema: schema,
                  },
                },
              }
            }
          })()
          const item = {
            deprecated: serverRouterItem.deprecated,
            tags: serverRouterItem.tags,
            summary: serverRouterItem.summary,
            parameters,
            requestBody,
            responses: {
              '200': requestBody,
            },
          }
          pathsAcc[path] = pathsAcc[path] || {}
          pathsAcc[path][method] = pathsAcc[path][method] || {}
          Object.assign(pathsAcc[path][method], item)
        }
        pluginConfig.apiDocData.paths = pathsAcc
      },
    }
  },
}