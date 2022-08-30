const lib = {
  axios: require(`axios`),
  compareVersions: require(`../lib/compare-versions@3.6.0`),
  mockjs: require(`@wll8/better-mock`),
  mime: require(`mime`),
  bodyParser: require(`body-parser`),
  midResJson: undefined, // 在运行时中注入
}

module.exports = lib
