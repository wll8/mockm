module.exports = function override(config, env) {
  const showGraph = false // 是否显示依赖分析图
  if(showGraph) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    config.plugins.push(new BundleAnalyzerPlugin())
  }
  if(config.mode === `production`) { // 生产环境关闭 sourceMap
    config.devtool = `none`
  }
  return config;
}
