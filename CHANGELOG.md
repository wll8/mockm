# Changelog

## [1.1.27-alpha.7](https://github.com/wll8/mockm/compare/1.1.27-alpha.6...1.1.27-alpha.7) (2024-09-29)


### Features

* --config 在 es 模块中使用 .cjs 后缀 ([1ed0e21](https://github.com/wll8/mockm/commit/1ed0e21b703ef352f1935a899e6af9637e2b9591))
* 按需生成文件, 例如 db.json httpHistory.json apiWeb.json ([3b84cee](https://github.com/wll8/mockm/commit/3b84cee711b62f88cc751e785d833a198584a143))
* 不在当前位置生成 httpData 目录 ([b96553c](https://github.com/wll8/mockm/commit/b96553c3a151ad9df5e41b31aa5d089708258a3b))

## [1.1.27-alpha.6](https://github.com/wll8/mockm/compare/1.1.27-alpha.5...1.1.27-alpha.6) (2024-08-22)


### Features

* 设置 bodyParser.json 的选项 strict 为 false 提高容错性 ([c3c3cf2](https://github.com/wll8/mockm/commit/c3c3cf2fbcf08a9e82e4c63cadf66569bfe25469))

## [1.1.27-alpha.5](https://github.com/wll8/mockm/compare/1.1.27-alpha.4...1.1.27-alpha.5) (2024-08-12)


### Features

* 因为备案要求个人网站不能放群所以去除 ([73c07f2](https://github.com/wll8/mockm/commit/73c07f24ab93e5fcbdaa885eeb2ce3f10ac91643))
* Catching proxy errors ([ce6ee89](https://github.com/wll8/mockm/commit/ce6ee89af09d3c57192aefdde237e9b1ca70c38d))

## [1.1.27-alpha.4](https://github.com/wll8/mockm/compare/1.1.27-alpha.3...1.1.27-alpha.4) (2024-05-31)


### Features

* client 支持相对路径部署 ([4c8b82b](https://github.com/wll8/mockm/commit/4c8b82b4fdff8c8b07a669fd0b926b865026d13d))

## [1.1.27-alpha.3](https://github.com/wll8/mockm/compare/1.1.27-alpha.2...1.1.27-alpha.3) (2024-05-31)


### Bug Fixes

* 插件周期 useParserCreated 应注入 app ([8444037](https://github.com/wll8/mockm/commit/8444037e590f88daf2e4c290caeaa93e0cb7dc64))
* 应避免 db 中不完整的层级表占用 proxy ([d3ec0f0](https://github.com/wll8/mockm/commit/d3ec0f02727f77fcd767c27721c6260b537d5b6a))


### Features

* 更新 @wll8/json-server ([f100404](https://github.com/wll8/mockm/commit/f100404988c16ca812886f021d8c64eeb8cbfdc6))
* 静态文件 dotfiles 值默认为 allow ([0d59d4d](https://github.com/wll8/mockm/commit/0d59d4dc2dc565086390c8ce68809e20211adbcd))