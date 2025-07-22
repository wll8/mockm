const baseConfig = require('./config.js')

// 统一的链接替换函数
function replaceHongqiyeLinks(url) {
  if (!url || typeof url !== 'string') return url
  return url.replace(/https?:\/\/(www\.)?hongqiye\.com\/doc\/mockm/g, '/mockm')
}

module.exports = {
  ...baseConfig,
  base: '/mockm/', // GitHub Pages 部署地址，格式：/仓库名/
  // 使用默认的 dist 目录，无需修改 dest

  // 移除原配置中的服务器特定设置
  head: baseConfig.head.filter(item => {
    // 保留 favicon 和基本的统计代码，移除服务器特定的统计
    if (Array.isArray(item) && item[0] === 'script' && item[1].src) {
      return !item[1].src.includes('cnzz.com')
    }
    return true
  }),

  // 扩展 markdown 配置，替换 hongqiye.com 链接
  markdown: {
    ...baseConfig.markdown,
    extendMarkdown: md => {
      // 先执行原有的 markdown 扩展
      if (baseConfig.markdown && baseConfig.markdown.extendMarkdown) {
        baseConfig.markdown.extendMarkdown(md)
      }

      // 添加链接替换规则
      md.core.ruler.push('replace_hongqiye_links', state => {
        state.tokens.forEach(token => {
          if (token.type === 'inline' && token.children) {
            token.children.forEach(child => {
              if (child.type === 'link_open') {
                const href = child.attrGet('href')
                const newHref = replaceHongqiyeLinks(href)
                if (newHref !== href) {
                  child.attrSet('href', newHref)
                }
              }
            })
          }
        })
      })
    }
  },

  // 更新导航栏和链接
  themeConfig: {
    ...baseConfig.themeConfig,
    nav: baseConfig.themeConfig.nav.map(item => {
      // 更新版本信息
      if (item.text && item.text.includes('版本')) {
        return { ...item, text: `版本 v${require('../../package.json').version}` }
      }
      // 统一处理所有 hongqiye.com 链接
      if (item.link) {
        return { ...item, link: replaceHongqiyeLinks(item.link) }
      }
      return item
    })
  }
}
