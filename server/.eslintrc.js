module.exports = {
  env: {
    node: true,
    es2021: true, // es 变量
  },
  extends: [
    `eslint:recommended`, // 继承 eslint 的核心推荐规则
  ],
  parserOptions: {
    ecmaVersion: 2021, // es 语法
  },
  rules: {
    "no-unused-vars": [`off`],
    "no-async-promise-executor": [`off`],
  },
};
