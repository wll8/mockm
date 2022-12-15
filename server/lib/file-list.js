const fs = require(`fs`)
const util = require(`../util/tool.js`)

function getHtml(data) {
  // 文件路径
  const pathList = data.path.replace(/\/$/, ``).split(`/`).map((item, index, arr) => {
    const cur = arr.slice(0, index + 1)
    return {
      cur,
      href: `${data.baseUrl}${cur.join(`/`) || `/`}`,
      text: `/${cur.slice(-1)[0]}`,
    }
  })
  const pathStr = pathList.reduce((acc, cur) => `${acc}<a href="${cur.href}">${cur.text}</a>`, ``)
  // 文件列表
  const fileListStr = data.files
    .map((item) => ({
      ...item,
      mtime: util.time.dateFormat(`YYYY-MM-DD hh:mm:ss`, new Date(item.mtime)),
      name: item.isFile ? item.name : `${item.name}/`,
      size: item.isFile ? util.hex.getSize(item.size) : `--`,
    }))
    .reduce(
      (acc, cur) => {
        return `${acc}
        <a href="./${cur.name}">
          <div class="name">${cur.name}</div>
          <div class="size">${cur.size}</div>
          <div class="mtime">${cur.mtime}</div>
        </a>
      `
      },
      pathList.length > 1 ? `
        <a href="..">
          <div class="name">..</div>
          <div class="size">--</div>
          <div class="mtime">--</div>
        </a>
      ` : ``
    )
  // 文件模板
  const template = `
    <head>
      <base href="${data.originalUrl}" />
    </head>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
      }
      .main {
        font-family: 'Courier New', Courier, monospace;
      }
      .main .path a:hover {
        background-color: #eee;
      }
      .main .list.header {
        font-weight: bold;
      }
      .main .list a {
        display: block;
        text-decoration: none;
      }
      .main .list a:hover {
        background-color: #eee;
      }
      .main .list .name,
      .main .list .size,
      .main .list .mtime {
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .main .list .name {
        width: calc(100% - 330px);
      }
      .main .list .size {
        width: 100px;
        text-align: right;
      }
      .main .list .mtime {
        width: 200px;
      }
    </style>
    <div class="main">
      <div class="path">${pathStr}</div>
      <div class="list header">
        <div>
          <div class="name">name</div>
          <div class="size">size</div>
          <div class="mtime">mtime</div>
        </div>
      </div>
      <div class="list fileList">${fileListStr}</div>
    </div>
  `
  return template
}

const obj = {
  post() {},
  delete() {},
  /**
   * 获取目录下的内容列表
   * @param {*} option
   * @param {*} option.root 目录地址
   * @param {*} option.sort 排序的 key
   * @param {*} option.order 排序方式 asc desc
   * @returns
   */
  async get(option) {
    const list = fs
      .readdirSync(option.root)
      .map((name) => {
        try {
          const stat = fs.statSync(`${option.root}/${name}`)
          const isFile = stat.isFile()
          const isDirectory = stat.isDirectory()
          return isFile || isDirectory
            ? {
                name,
                // 文件大小
                size: stat.size,
                // 修改时间
                mtime: stat.mtime,
                // 创建时间
                birthtime: stat.birthtime,
                // 是否是文件
                isFile,
                // stat,
              }
            : undefined
        } catch (error) {
          return undefined
        }
      })
      .filter((item) => item)

    return list
  },
  put() {},
}

module.exports = (option) => {
  return async (req, res, next) => {
    const nodePath = require(`path`)
    const url = decodeURI(req.url.split(`?`)[0])
    const path = nodePath.normalize(`${option.root}/${url}`)
    const pathRoot = nodePath.normalize(option.root)
    /**
     * 避免路径遍历
     * https://cwe.mitre.org/data/definitions/23.html
     */
    if(path.startsWith(pathRoot) === false) {
      res.status(403)
      res.json({ msg: `Forbidden ${url}` })
    } else {
      if (req.method.toLowerCase() === `get`) {
        if (fs.existsSync(path)) {
          if (fs.statSync(path).isDirectory()) {
            const files = await obj.get({
              root: path,
            })
            const data = {
              baseUrl: req.baseUrl,
              originalUrl: `${req.originalUrl}/`.replace(/\/\/$/, `/`),
              path: url, // 由于数据不会存储并展示, 所以不用担心 xss
              files,
            }
            res.send(getHtml(data))
          } else {
            res.sendFile(path, {
              hidden: true,
            })
          }
        } else {
          res.status(404)
          res.json({ msg: `no such file or directory ${path}` })
        }
      }
    }
  }
}
