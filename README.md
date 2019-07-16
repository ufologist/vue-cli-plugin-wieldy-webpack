# vue-cli-plugin-wieldy-webpack

将 [wieldy-webpack](https://github.com/ufologist/wieldy-webpack) 迁移到 [vue-cli 3.0](vue-cli3.md) 插件体系

## 使用方法



## 内置功能

* 预备多套[环境配置](https://cli.vuejs.org/zh/guide/mode-and-env.html)
  * 开发: `development`
  * 测试: `test`
  * 预上线: `stage`
  * 线上: `production`
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