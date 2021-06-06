const opener = require(`./opener.js`)
const hx = require("hbuilderx");
function activate(context) {
  context.subscriptions.push(hx.commands.registerCommand("extension.mockmTool.apiStudio", () => mockmTool(`extension.mockmTool.apiStudio`)));
  context.subscriptions.push(hx.commands.registerCommand("extension.mockmTool.reqHistory", () => mockmTool(`extension.mockmTool.reqHistory`)));
  context.subscriptions.push(hx.commands.registerCommand("extension.mockmTool.simplePostman", () => mockmTool(`extension.mockmTool.simplePostman`)));
  context.subscriptions.push(hx.commands.registerCommand("extension.mockmTool.mockmDoc", () => mockmTool(`extension.mockmTool.mockmDoc`)));
  context.subscriptions.push(hx.commands.registerCommand("extension.mockmTool.mockjsDoc", () => mockmTool(`extension.mockmTool.mockjsDoc`)));
}
function deactivate() { }
function mockmTool(cmd) {
  const cmdRes = {
    "extension.mockmTool.apiStudio"() {
      opener(`http://127.0.0.1:9005/#/apiStudio`)
    },
    "extension.mockmTool.reqHistory"() {
      opener(`http://127.0.0.1:9005/`)
    },
    "extension.mockmTool.simplePostman"() {
      opener(`http://127.0.0.1:9005/restc/index.html`)
    },
    "extension.mockmTool.mockmDoc"() {
      opener(`https://hongqiye.com/doc/mockm/`)
    },
    "extension.mockmTool.mockjsDoc"() {
      opener(`http://wll8.gitee.io/mockjs-examples/`)
    },
  }[cmd]()
}
module.exports = { activate, deactivate };
