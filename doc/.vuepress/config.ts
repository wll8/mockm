import { viteBundler } from "@vuepress/bundler-vite";
import { baiduAnalyticsPlugin } from "@vuepress/plugin-baidu-analytics";
import { googleAnalyticsPlugin } from "@vuepress/plugin-google-analytics";
import { defineUserConfig } from "vuepress";
import { getDirname, path } from "vuepress/utils";
import { hopeTheme } from "vuepress-theme-hope";

const root = path.resolve(getDirname(import.meta.url), "../../");

export default defineUserConfig({
  title: "mockm",
  description: "极简、灵活、强大的 API 神器，开箱即用",

  base: "/doc/mockm/",

  lang: "zh-CN",

  head: [
    // 隐藏友盟统计的文字
    [
      "style",
      {},
      `\
a[href*="www.cnzz.com"] {
  display: none;
}
`,
    ],
    // 添加友盟统计功能
    [
      "script",
      { src: `https://v1.cnzz.com/z_stat.php?id=1279281360&web_id=1279281360` },
    ],
  ],

  markdown: {
    importCode: {
      handleImportPath: (str) => {
        if (str.startsWith("@")) return str.replace("@", root);

        return str;
      },
    },
  },

  plugins: [
    baiduAnalyticsPlugin({
      id: "2d22c415e87bb32e7e06ce85c1934fb6",
    }),
    googleAnalyticsPlugin({
      id: "UA-178264895-1",
    }),
  ],

  bundler: viteBundler(),

  theme: hopeTheme({
    logo: "/icon/favicon.ico",
    favicon: "/icon/favicon.ico",

    navbar: [
      { text: "版本 v1.1.26", link: "/" },
      { text: "配置项", link: "/config/option.md" },
      { text: "更多示例", link: "https://www.hongqiye.com/doc/mockm/case/" },
      { text: "mockjs", link: "https://wll8.github.io/mockjs-examples/" },
      // { text: 'QQ答疑群', link: 'https://qm.qq.com/cgi-bin/qm/qr?k=4rvOknpHyqs5wd3c2kEt34Eysx83djEZ&jump_from=webapi' },
      { text: "github", link: "https://github.com/wll8/mockm" },
    ],

    sidebar: "structure",

    markdown: {
      breaks: true,
      linkify: true,
      tasklist: true,
    },

    plugins: {
      slimsearch: true,
    },
  }),
});
