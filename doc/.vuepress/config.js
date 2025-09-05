const path = require('path')

// 检测是否为GitHub Pages环境
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

// 统一的链接替换函数
function replaceHongqiyeLinks(url) {
  if (!url || typeof url !== 'string') return url
  return url.replace(/https?:\/\/(www\.)?hongqiye\.com\/doc\/mockm/g, '')
}

// 中文配置
const zhConfig = {
  lang: 'zh-CN',
  title: 'mockm',
  description: '极简, 灵活, 强大的 api 神器, 开箱即用.',
  themeConfig: {
    selectLanguageName: '简体中文',
    selectLanguageText: '选择语言',
    selectLanguageAriaLabel: '选择语言',
    lastUpdated: '最后更新时间',
    nav: [
      { text: '版本 v1.1.28', link: '/' },
      { text: '配置项', link: '/config/option.md' },
      { text: '更多示例', link: isGitHubPages ? 'https://wll8.github.io/mockm/case/index.html' : 'https://www.hongqiye.com/doc/mockm/case/' },
      { text: 'mockjs', link: 'https://wll8.github.io/mockjs-examples/' },
      { text: 'github', link: 'https://github.com/wll8/mockm' },
    ],
    sidebar: [
      {
        title: `它致力解决什么问题?`,
        collapsable: false,
        children: [
          {
            title: `开发页面时的问题`,
            collapsable: false,
            path: `/process/start.md`,
          },
          {
            title: `联调过程中的问题`,
            collapsable: false,
            path: `/process/process.md`,
          },
        ]
      },
      {
        title: `如何使用?`,
        collapsable: false,
        children: [
          {
            title: `安装和使用`,
            collapsable: false,
            path: `/use/try.md`,
          },
          {
            title: `示例`,
            collapsable: false,
            path: `/use/example.md`,
          },
          {
            title: `web 界面`,
            collapsable: false,
            path: `/use/webui.md`,
          },
        ]
      },
      {
        title: `配置`,
        collapsable: false,
        children: [
          {
            title: `命令行参数`,
            collapsable: false,
            path: `/config/cli.md`,
          },
          {
            title: `配置文件`,
            collapsable: false,
            path: `/config/config_file.md`,
          },
          {
            title: `config.api 作为函数`,
            collapsable: false,
            path: `/config/config_api_fn.md`,
          },
          {
            title: `配置项`,
            collapsable: false,
            path: `/config/option.md`,
          },
        ]
      },
      {
        title: `开发`,
        collapsable: false,
        children: [
          {
            title: `更新日志`,
            collapsable: false,
            path: `/dev/change_log.md`,
          },
          {
            title: `实现`,
            collapsable: false,
            path: `/dev/realize.md`,
          },
        ]
      },
    ],
  }
}

// 英文配置
const enConfig = {
  lang: 'en-US',
  title: 'MockM',
  description: 'Minimalist, flexible, powerful API tool, ready to use out of the box.',
  themeConfig: {
    selectLanguageName: 'English',
    selectLanguageText: 'Languages',
    selectLanguageAriaLabel: 'Select language',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Version v1.1.28', link: '/en/' },
      { text: 'Configuration', link: '/en/config/option.md' },
      { text: 'More Examples', link: isGitHubPages ? 'https://wll8.github.io/mockm/case/index.html' : 'https://www.hongqiye.com/doc/mockm/case/' },
      { text: 'MockJS', link: 'https://wll8.github.io/mockjs-examples/' },
      { text: 'GitHub', link: 'https://github.com/wll8/mockm' },
    ],
    sidebar: [
      {
        title: `What Problems Does It Solve?`,
        collapsable: false,
        children: [
          {
            title: `Development Issues`,
            collapsable: false,
            path: `/en/process/start.md`,
          },
          {
            title: `Integration Issues`,
            collapsable: false,
            path: `/en/process/process.md`,
          },
        ]
      },
      {
        title: `How to Use?`,
        collapsable: false,
        children: [
          {
            title: `Installation and Usage`,
            collapsable: false,
            path: `/en/use/try.md`,
          },
          {
            title: `Examples`,
            collapsable: false,
            path: `/en/use/example.md`,
          },
          {
            title: `Web Interface`,
            collapsable: false,
            path: `/en/use/webui.md`,
          },
        ]
      },
      {
        title: `Configuration`,
        collapsable: false,
        children: [
          {
            title: `Command Line Arguments`,
            collapsable: false,
            path: `/en/config/cli.md`,
          },
          {
            title: `Configuration File`,
            collapsable: false,
            path: `/en/config/config_file.md`,
          },
          {
            title: `config.api as Function`,
            collapsable: false,
            path: `/en/config/config_api_fn.md`,
          },
          {
            title: `Configuration Options`,
            collapsable: false,
            path: `/en/config/option.md`,
          },
        ]
      },
      {
        title: `Development`,
        collapsable: false,
        children: [
          {
            title: `Changelog`,
            collapsable: false,
            path: `/dev/change_log.md`,
          },
          {
            title: `Implementation`,
            collapsable: false,
            path: `/en/dev/realize.md`,
          },
        ]
      },
    ],
  }
}

// 基础配置
const baseConfig = {
  base: isGitHubPages ? '/mockm/' : `/doc/mockm/`,
  head: [
    ['link', { rel: 'shortcut icon', href: '/icon/favicon.ico' }],
    // 百度统计
    ['script', {}, `
      var _hmt = _hmt || [];
      (function() {
        var hm = document.createElement("script");
        hm.src = "https://hm.baidu.com/hm.js?2d22c415e87bb32e7e06ce85c1934fb6";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(hm, s);
      })();
    `],
    // 隐藏友盟统计的文字
    ['style', { type: 'text/css' }, `
      a[href*="www.cnzz.com"] {
        display: none;
      }
    `],
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@doc': path.join(__dirname, '../'),
      }
    }
  },
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-vuepress-code-snippet-enhanced'))
      md.use(require('markdown-it-task-lists'))
      md.set({
        breaks: true,
        linkify: true,
      })

      // GitHub Pages 环境链接替换
      if (isGitHubPages) {
        try {
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
        } catch (e) {
          console.warn('Link replacement rule failed:', e.message)
        }
      }
    },
  },
  plugins: [
    ['fulltext-search'],
    ['vuepress-plugin-code-copy', {
      successText: `复制成功`
    }],
    ['@vuepress/back-to-top'],
    ['@vuepress/nprogress'],
    ['@vuepress/medium-zoom'],
    [
      '@vuepress/google-analytics',
      {
        'ga': 'UA-178264895-1'
      }
    ]
  ],
  
  // 多语言配置
  locales: {
    '/': zhConfig,
    '/en/': enConfig,
  },
  
  themeConfig: {
    locales: {
      '/': zhConfig.themeConfig,
      '/en/': enConfig.themeConfig,
    }
  }
}

// GitHub Pages 环境处理
if (isGitHubPages) {
  baseConfig.head = baseConfig.head.filter(item => {
    if (Array.isArray(item) && item[0] === 'script' && item[1] && item[1].src) {
      return !item[1].src.includes('cnzz.com')
    }
    return true
  })

  // 处理导航栏链接替换
  Object.keys(baseConfig.themeConfig.locales).forEach(locale => {
    baseConfig.themeConfig.locales[locale].nav = baseConfig.themeConfig.locales[locale].nav.map(item => {
      if (item.link && typeof item.link === 'string') {
        return { ...item, link: replaceHongqiyeLinks(item.link) }
      }
      return item
    })
  })
}

module.exports = baseConfig