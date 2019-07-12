# vue-cli-plugin-wieldy-webpack

将 [wieldy-webpack](https://github.com/ufologist/wieldy-webpack) 迁移到 vue-cli 3.0 插件体系

## 内置功能

* 多套环境配置
  * 开发: `development`
  * 测试: `test`
  * 预上线: `stage`
  * 线上: `production`
* `browserslist` 配置
* 在 `vue.config.js` 从环境变量中获取 `publicPath`
* 增强 `webpack` 配置
  * 根据文件的名称给动态分离的 `chunk` 命名
  * 将 `webpack runtime` inline 到 html 文件中
  * 添加 banner 注释
  * 优化图片
  * 开启 mock server 功能
  * 调整 minimizer option