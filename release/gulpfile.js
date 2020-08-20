const gulp = require(`gulp`)
const gulpCopy = require(`gulp-copy`)
// const rename = require(`gulp-rename`)
const del = require(`del`)
const uglify = require(`gulp-uglify-es`).default

gulp.task(`clear`, () => { // 复制 server 中的文件, 例如 package.json
  return del([`../dist/**`, `!../dist`], { force: true }) // 清除目录
})

gulp.task(`copyServer`, () => { // 复制 server 中的文件, 例如 package.json
  return gulp
    .src([
      `../server/**/*.*`,
      '!../server/node_modules/**',
      '!../server/httpData/**',
      '!../server/db.json',
    ])
    .pipe(gulpCopy(`../dist/server`))
})

gulp.task(`uglify`, () => {
  // uglify-es - https://github.com/mishoo/UglifyJS/tree/harmony
  return gulp.src([`../server/**/*.js`, '!../server/page/**', '!../server/node_modules/**'])
    .pipe(uglify())
    .pipe(gulp.dest(`../dist/server`))
});

// see: https://github.com/gulpjs/gulp/issues/1091#issuecomment-163151632
gulp.task(
  `default`,
  gulp.series(
    `clear`,
    gulp.parallel(`copyServer`),
    gulp.series(`uglify`, done => done())
  ),
)
