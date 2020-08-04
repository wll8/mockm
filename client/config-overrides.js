const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = function override(config, env) {
  config.plugins.push(new BundleAnalyzerPlugin())
  return config;
}
