const shelljs = require(`shelljs`)
process.env.MOCKM_REGISTRY = `https://registry.npm.taobao.org/`

// 当测试用例中含有 .only 时应关闭并行测试
const onlyFile = [...shelljs.ls(`./*.test.js`)].find((item) => {
  return require(`fs`).readFileSync(item).includes(`it.only`)
})

module.exports = {
  spec: `./*.test.js`,
  parallel: onlyFile ? false : true,
  reporter: `mochawesome`,
  reporterOptions: [
    `reportDir=./res,reportFilename=index`,
  ],
  require: [
    `mochawesome/src/register`,
    `./fixtures.js`,
  ],
  retries: 3,
  exit: true,
  timeout: 0,
}