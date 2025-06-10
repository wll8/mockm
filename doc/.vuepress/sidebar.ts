import { sidebar } from "vuepress-theme-hope";

export const sidebarConfig = sidebar([
  {
    text: `它致力解决什么问题?`,
    collapsible: false,
    description: `解决了什么问题?`,
    children: [
      {
        text: `开发页面时的问题`,
        collapsible: false,
        description: `页面开发前的问题`,
        path: `/process/start.md`,
      },
      {
        text: `联调过程中的问题`,
        collapsible: false,
        description: `联调过程中的问题`,
        path: `/process/process.md`,
      },
    ],
  },
  {
    text: `如何使用?`,
    collapsible: false,
    children: [
      {
        text: `安装和使用`,
        collapsible: false,
        description: `创建配置, 添加接口`,
        path: `/use/try.md`,
      },
      {
        text: `示例`,
        collapsible: false,
        description: `放置一些常用示例`,
        path: `/use/example.md`,
      },
      {
        text: `web 界面`,
        collapsible: false,
        description: `关于 web 界面上的功能讲解`,
        path: `/use/webui.md`,
      },
      {
        text: `生成的文件`,
        collapsible: false,
        description: `生成在系统上的文件及目录`,
        path: `/use/outfile.md`,
      },
      {
        text: `最佳实践`,
        collapsible: false,
        description: `推荐使用经验`,
        path: `/use/experience.md`,
      },
    ],
  },
  {
    text: `选项`,
    collapsible: false,
    children: [
      {
        text: `命令行`,
        collapsible: false,
        description: `与配置文件的不同, 以及优先及, 可时该用`,
        path: `/config/cli.md`,
      },
      {
        text: `配置文件`,
        collapsible: false,
        description: `各种使用方式`,
        path: `/config/config_file.md`,
      },
      {
        text: `配置项`,
        collapsible: false,
        description: `各个配置项讲解`,
        path: `/config/option.md`,
      },
    ],
  },
  {
    text: `工具库`,
    collapsible: false,
    description: `mockm 运行时自带的一些函数和库`,
    children: [
      {
        text: `config 作为函数`,
        collapsible: false,
        description: `config 作为函数时提供的工具`,
        path: `/config/config_fn.md`,
      },
      {
        text: `config.api 作为函数`,
        collapsible: false,
        description: `config.api 作为函数时提供的工具`,
        path: `/config/config_api_fn.md`,
      },
    ],
  },
  {
    text: `开发`,
    collapsible: false,
    description: `关于 mockm 的开发信息`,
    children: [
      {
        text: `更新日志`,
        collapsible: false,
        description: `时间表, 功能更新, bug修复`,
        path: `/dev/change_log.md`,
      },
      // {
      //   text: `待完成`,
      //   collapsible: false,
      //   description : `要完成的, 进行中的, 受阻碍的, 期待获得帮助`,
      //   path: `/dev/todo.md`,
      // },
      // {
      //   text: `贡献表`,
      //   collapsible: false,
      //   description : `记录除自己以外的贡献者`,
      //   path: `/dev/contribution.md`,
      // },
      {
        text: `实现`,
        collapsible: false,
        description: `讲解项目结构, 运作方式, 注意点, 用于帮助他人参考或贡献`,
        path: `/dev/realize.md`,
      },
    ],
  },
]);
