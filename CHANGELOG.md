# CHANGELOG

* v1.0.7 2020-3-13

  * fix: 将 `webpack` 变为 [`peerDependencies`](https://javascript.ruanyifeng.com/nodejs/packagejson.html#toc3), 避免出现版本冲突的问题(外层依赖了低的版本, 而内层却依赖了高的版本)

* v1.0.6 2020-3-2

  * fix: `image-loader` 没有生效的 bug, 应该要放在 `url-loader` 之后

* v1.0.5 2020-3-1

  * fix: 修复引用的包名

* v1.0.4 2020-3-1

  * fix: 由于 `image-webpack-loader` 依赖的 `imagemin` 会去访问 `raw.githubusercontent.com` 下面的文件, 但我们的网络访问不了, 因此只能改用自建的修复包 `image-webpack-loader-coding-net-vendor`, 全部指向到 `coding.net` 上 :(

* v1.0.3 2019-10-15

  * fix: 由于默认配置了 `__use_default_css_public_path__` 环境变量, 但如何不配合使用绝对路径的 `publicPath`, 会造成 CSS 引用资源的路径有误, 因此调整为默认不开启 `__use_default_css_public_path__`

* v1.0.2 2019-8-5

  * fix: 可配置 `__use_default_css_public_path__` 环境变量, 让 `CSS` 使用默认的 `publicPath`, 而不是使用相对路径

    > [vue-cli#4378](https://github.com/vuejs/vue-cli/issues/4378)

* v1.0.1 2019-7-16

  * fix: 只在 `production` 模式下开启了 layout 机制, 应该是无论在哪个模式下都开启

* v1.0.0 2019-7-16

  初始版本