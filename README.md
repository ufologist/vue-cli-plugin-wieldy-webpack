# vue-cli-plugin-wieldy-webpack

[![NPM version][npm-image]][npm-url] [![Known Vulnerabilities][vulnerabilities-status-image]][vulnerabilities-status-url] [![changelog][changelog-image]][changelog-url] [![license][license-image]][license-url]

[vulnerabilities-status-image]: https://snyk.io/test/npm/vue-cli-plugin-wieldy-webpack/badge.svg
[vulnerabilities-status-url]: https://snyk.io/test/npm/vue-cli-plugin-wieldy-webpack
[npm-image]: https://img.shields.io/npm/v/vue-cli-plugin-wieldy-webpack.svg?style=flat-square
[npm-url]: https://npmjs.org/package/vue-cli-plugin-wieldy-webpack
[license-image]: https://img.shields.io/github/license/ufologist/vue-cli-plugin-wieldy-webpack.svg
[license-url]: https://github.com/ufologist/vue-cli-plugin-wieldy-webpack/blob/master/LICENSE
[changelog-image]: https://img.shields.io/badge/CHANGE-LOG-blue.svg?style=flat-square
[changelog-url]: https://github.com/ufologist/vue-cli-plugin-wieldy-webpack/blob/master/CHANGELOG.md

[![npm-image](https://nodei.co/npm/vue-cli-plugin-wieldy-webpack.png?downloads=true&downloadRank=true&stars=true)](https://npmjs.com/package/vue-cli-plugin-wieldy-webpack)

将 [wieldy-webpack](https://github.com/ufologist/wieldy-webpack) 迁移到 [vue-cli 3.0](vue-cli3.md) 插件体系

## 使用方法

```
vue add wieldy-webpack
```

## 内置功能

* 预备多套[环境配置](https://cli.vuejs.org/zh/guide/mode-and-env.html)
  * 开发: `development`
  * 测试: `test`
  * 预上线: `stage`
  * 生产: `production`
* 默认的 `browserslist` 配置
* 在 `vue.config.js` 从环境变量中获取 `publicPath`
* 增强 `webpack` 配置
  * 根据文件的名称给动态分离的 `chunk` 命名
  * 将 `webpack runtime` inline 到 html 文件中
  * 增加 layout 机制
  * 添加 banner 注释
  * 优化图片
  * 开启 mock server 功能
  * 调整 minimizer option

### 预留的环境变量

需要配合 `lib/get-public-path.js` 来使用

* `__public_base_path__`: `publicPath` 的基础路径, 会拼上 `pkg.name` 形成完整的 `publicPath`
* `__public_path__`: `publicPath`

### 配置 layout 机制

如果想不指定 `template` 参数, 需要将 `public/index.html` 的内容清空或者只保留 `<body>` 中的内容

* 给默认的单页配置 layout
  ```javascript
  // vue.config.js
  pages: {
      main: {
          entry: 'src/main.js',
          filename: 'index.html',
          title: 'page title',

          _useLayout: {
              layoutFile: './src/layout.html'
          }
      }
  }
  ```
* 多页配置 layout

  ```javascript
  // vue.config.js
  var createPageConfig = require('vue-cli-plugin-wieldy-webpack/lib/create-page-config.js');

  pages: {
      ...createPageConfig('src/pages/a/a.js', {
          title: 'page a'
      }, {
          layoutFile: './src/layout.html'
      }),
      ...createPageConfig('src/pages/b/b.js', {
          title: 'page b'
      }, {
          layoutFile: './src/layout.html'
      })
  }
  ```