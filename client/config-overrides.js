const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
module.exports = function override(config, env) {
  const showGraph = false // 是否显示依赖分析图
  if(showGraph) {
    config.plugins.push(new BundleAnalyzerPlugin())
  }
  return config;
}
