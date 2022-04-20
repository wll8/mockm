const gulp = require(`gulp`)
// const rename = require(`gulp-rename`)
const del = require(`del`)
const uglify = require(`gulp-uglify-es`).default
const babel = require('gulp-babel')

gulp.task(`clear`, () => { // 清理发布目录
  return del([`../dist/**`, `!../dist`], { force: true }) // 清除目录
})

gulp.task(`copyServer`, (cb) => { // 复制 server 中的文件, 例如 package.json
  const shell = require(`shelljs`)
  const cmdList = `
    npx shx mkdir -p ../dist/package/
    npx shx cp ../server/*.* ../dist/package/
    npx shx cp -r ../server/page ../server/util ../dist/package/
    npx shx cp -r ../server/example ../dist/package/
    npx shx cp -r ../server/@types ../dist/package/
    npx shx cp ../README.md ../dist/package/
    npx shx rm  ../dist/package/package-lock.json
  `.split(`\n`).map(item => item.trim()).filter(item => item)
  cmdList.forEach(cmd => {
    console.log(`run: ${cmd}`)
    if(shell.exec(cmd).code !== 0) {
      new Error(`运行错误: ${cmd}`)
    }
  })
  cb()
})

gulp.task(`pushDoc`, (cb) => { // 发布文档
  const shell = require(`shelljs`)
  const cmdList = `
    cd ../ && npm run doc:build
    cd ../doc/.vuepress/ && scp -r dist/** root@hongqiye.com:/home/www/doc/mockm/
  `.split(`\n`).map(item => item.trim()).filter(item => item)
  cmdList.forEach(cmd => {
    console.log(`run: ${cmd}`)
    if(shell.exec(cmd).code !== 0) {
      new Error(`运行错误: ${cmd}`)
    }
  })
  cb()
})

gulp.task(`uglify`, () => { // 代码压缩, 处理兼容性
  // uglify-es - https://github.com/mishoo/UglifyJS/tree/harmony
  // 示例配置, 不进行压缩 // todo 此行配置在 mac 上不生效! 所以需要在下面的 babel 配置中再次添加.
  const ignore = [
    '!../server/httpData/**',
    '!../server/page/**',
    '!../server/node_modules/**',
    '!../server/example/**',
    '!../server/example/simple.mm.config.js',
  ]
  return gulp.src([
    `../server/**/*.js`,
    ...ignore,
  ])
    .pipe(babel({
      "ignore" : [
        ...ignore,
      ],
      "presets": [
        [
          '@babel/preset-env',
          {
            "useBuiltIns": "usage", // usage 为按需加载 polyfill
            "corejs": 3,
            "targets": {
              "node": `10.12.0`
            },
          },
        ],
      ],
      "plugins": [
        [
          "@babel/plugin-transform-runtime",
          {
            "corejs": 3
          }
        ]
      ]
    }))
    // .pipe(uglify())
    .pipe(gulp.dest(`../dist/package`))
})

gulp.task(`tar`, () => { // 压缩相关文件为发布包 .tgz
  const tar = require(`tar`)
  const package = require(`../dist/package/package.json`)
  const filePath = `../dist/${package.name}-${package.version}.tgz`
  return tar.c( // or tar.create
    {
      gzip: true,
      cwd: `${__dirname}/../dist/`,
      file: filePath,
    },
    [`package/`]
  )
})

// see: https://github.com/gulpjs/gulp/issues/1091#issuecomment-163151632
gulp.task(
  `default`,
  gulp.series(
    `clear`,
    gulp.parallel(`copyServer`),
    gulp.series(`uglify`, `tar`, done => done())
  ),
)
