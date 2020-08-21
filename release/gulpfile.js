const gulp = require(`gulp`)
// const rename = require(`gulp-rename`)
const del = require(`del`)
const uglify = require(`gulp-uglify-es`).default

gulp.task(`clear`, () => { // 复制 server 中的文件, 例如 package.json
  return del([`../dist/**`, `!../dist`], { force: true }) // 清除目录
})

gulp.task(`copyServer`, (cb) => { // 复制 server 中的文件, 例如 package.json
  const shell = require(`shelljs`)
  const cmdList = `
    npx shx mkdir -p ../dist/package/
    npx shx cp ../server/*.* ../dist/package/
    npx shx cp -r ../server/page ../server/util ../dist/package/
  `.split(`\n`).map(item => item.trim()).filter(item => item)
  cmdList.forEach(cmd => {
    console.log(`run: ${cmd}`)
    if(shell.exec(cmd).code !== 0) {
      new Error(`运行错误: ${cmd}`)
    }
  })
  cb()
})

gulp.task(`uglify`, () => {
  // uglify-es - https://github.com/mishoo/UglifyJS/tree/harmony
  return gulp.src([`../server/**/*.js`, '!../server/page/**', '!../server/node_modules/**'])
    .pipe(uglify())
    .pipe(gulp.dest(`../dist/package`))
})

gulp.task(`tar`, () => {
  const tar = require(`tar`)
  return tar.c( // or tar.create
    {
      gzip: true,
      cwd: `${__dirname}/../dist/`,
      file: `../dist/package.tgz`,
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
