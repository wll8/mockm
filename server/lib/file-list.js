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
        <div class="item">
          <a href="./${cur.name}" class="name">${cur.name}</a>
          <div class="size">${cur.size}</div>
          <div class="mtime">${cur.mtime}</div>
          <div class="action">
            <a href="./${cur.name}?download=true" class="download ${cur.isFile && 'show'}">+</a>
          </div>
        </div>
      `
      },
      pathList.length > 1 ? `
        <a href=".." class="item">
          <div class="name">..</div>
          <div class="size">--</div>
          <div class="mtime">--</div>
          <div class="action">&nbsp;</div>
        </a>
      ` : ``
    )
  // 文件模板
  const template = `
    <head>
      <meta charset="UTF-8">
      <base href="${data.originalUrl}" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      .main a {
        text-decoration: none;
      }
      .main .path {
        word-break: break-all;
      }
      .main .path .item:hover {
        background-color: #eee;
      }
      .main .list.header {
        font-weight: bold;
        display: flex;
      }
      .main .list .item {
        display: flex;
      }
      .main .list .item:hover {
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
      .main .list.header :not(.name),
      .main .list .item :not(.name) {
        flex-shrink: 0;
        min-width: 40px;
      }
      .main .list .name {
        width: 100%;
      }
      .main .list .size {
        width: 120px;
        text-align: left;
      }
      .main .list .mtime {
        width: 200px;
      }
      .action a {
        display: none;
        font-style: normal;
      }
      .action a.show {
        display: inline-block;
        padding: 0 10px;
        box-sizing: border-box;
      }
      @media screen and (max-width: 480px) {
        .main .list .size,
        .main .list .mtime {
          display: none;
        }
      }
      @media screen and (max-width: 768px) {
        .main .list .mtime {
          display: none;
        }
      }
    </style>
    <div class="main">
      <div class="path">${pathStr}</div>
      <div class="list header">
        <div class="name">name</div>
        <div class="size">size</div>
        <div class="mtime">mtime</div>
        <div class="action">&nbsp;</div>
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
    const { download } = req.query
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
            if(download) {
              const name = require(`path`).parse(path).base
              res.set(`Content-Disposition`, `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
            }
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
