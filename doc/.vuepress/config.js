const path = require('path')

module.exports = {
  base: `/doc/mockm/`, // 部署地址
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
    // 添加友盟统计功能
    ['script', {src: `https://v1.cnzz.com/z_stat.php?id=1279281360&web_id=1279281360`}],
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@doc': path.join(__dirname, '../'),
      }
    }
  },
  markdown: {
    // lineNumbers: true,
    extendMarkdown: md => {
      md.use(require('markdown-it-vuepress-code-snippet-enhanced')) // 文件片段引用
      md.use(require('markdown-it-task-lists')) // todo list 支持
      md.set({
        breaks: true, // 转换段落里的 '\n' 到 <br>
        linkify: true,
      })
    },
  },
  plugins: [
    ['fulltext-search'],
    ['vuepress-plugin-code-copy', {
      successText: `复制成功`
    }],
    ['@vuepress/back-to-top'], // 回到顶部
    ['@vuepress/nprogress'], // 进度条
    ['@vuepress/medium-zoom'], // 图片缩放
    [
      '@vuepress/google-analytics', // 谷歌统计
      {
        'ga': 'UA-178264895-1' // UA-00000000-0
      }
    ]
  ],
  title: `mockm`,
  description : `极简, 灵活, 强大的 api 神器, 开箱即用.`,
  themeConfig : {
    lastUpdated: '最后更新时间',
    sidebar: 'auto',
    // search: false,
    sidebarDepth: 2,
    nav: [
      { text: '版本 v1.1.26-alpha.17', link: '/' },
      { text: '配置项', link: '/config/option.md' },
      { text: 'mockjs', link: 'http://wll8.gitee.io/mockjs-examples/' },
      { text: 'QQ答疑群', link: 'https://qm.qq.com/cgi-bin/qm/qr?k=4rvOknpHyqs5wd3c2kEt34Eysx83djEZ&jump_from=webapi' },
      { text: 'github', link: 'https://github.com/wll8/mockm' },
    ],
    sidebar: [
      {
        title: `它致力解决什么问题?`,
        collapsable: false,
        description : `解决了什么问题?`,
        children: [
          {
            title: `开发页面时的问题`,
            collapsable: false,
            description : `页面开发前的问题`,
            path: `/process/start.md`,
          },
          {
            title: `联调过程中的问题`,
            collapsable: false,
            description : `联调过程中的问题`,
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
            description : `创建配置, 添加接口`,
            path: `/use/try.md`,
          },
          {
            title: `示例`,
            collapsable: false,
            description : `放置一些常用示例`,
            path: `/use/example.md`,
          },
          {
            title: `web 界面`,
            collapsable: false,
            description : `关于 web 界面上的功能讲解`,
            path: `/use/webui.md`,
          },
          {
            title: `生成的文件`,
            collapsable: false,
            description : `生成在系统上的文件及目录`,
            path: `/use/outfile.md`,
          },
          {
            title: `最佳实践`,
            collapsable: false,
            description : `推荐使用经验`,
            path: `/use/experience.md`,
          },
        ]
      },
      {
        title: `选项`,
        collapsable: false,
        children: [
          {
            title: `命令行`,
            collapsable: false,
            description : `与配置文件的不同, 以及优先及, 可时该用`,
            path: `/config/cli.md`,
          },
          {
            title: `配置文件`,
            collapsable: false,
            description : `各种使用方式`,
            path: `/config/config_file.md`,
          },
          {
            title: `配置项`,
            collapsable: false,
            description : `各个配置项讲解`,
            path: `/config/option.md`,
          },
        ]
      },
      {
        title: `工具库`,
        collapsable: false,
        description : `mockm 运行时自带的一些函数和库`,
        children: [
          {
            title: `config 作为函数`,
            collapsable: false,
            description : `config 作为函数时提供的工具`,
            path: `/config/config_fn.md`,
          },
          {
            title: `config.api 作为函数`,
            collapsable: false,
            description : `config.api 作为函数时提供的工具`,
            path: `/config/config_api_fn.md`,
          },
        ]
      },
      {
        title: `开发`,
        collapsable: false,
        description : `关于 mockm 的开发信息`,
        children: [
          {
            title: `更新日志`,
            collapsable: false,
            description : `时间表, 功能更新, bug修复`,
            path: `/dev/change_log.md`,
          },
          // {
          //   title: `待完成`,
          //   collapsable: false,
          //   description : `要完成的, 进行中的, 受阻碍的, 期待获得帮助`,
          //   path: `/dev/todo.md`,
          // },
          // {
          //   title: `贡献表`,
          //   collapsable: false,
          //   description : `记录除自己以外的贡献者`,
          //   path: `/dev/contribution.md`,
          // },
          // {
          //   title: `实现`,
          //   collapsable: false,
          //   description : `讲解项目结构, 运作方式, 注意点, 用于帮助他人参考或贡献`,
          //   path: `/dev/realize.md`,
          // },
        ]
      },
    ],
  }
}
