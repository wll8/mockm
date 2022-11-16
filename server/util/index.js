const jsonServer = require(`@wll8/json-server`)
const app = jsonServer.create()

const tool = require(`./tool.js`)
const business = require(`./business.js`)
const lib = require(`./lib.js`)

module.exports = {
  server: {
    app, // express 实例
  },
  tool,
  toolObj: tool,
  lib,
  libObj: lib,
  business,
}
