# vue-cli 3.0 提供的功能

* 核心是 [CLI 服务](https://cli.vuejs.org/zh/guide/#cli-%E6%9C%8D%E5%8A%A1)(`@vue/cli-service`)和 CLI 插件(`vue-cli-plugin-xxx`)

  > `@vue/cli-service` 安装了一个名为 [`vue-cli-service`](https://cli.vuejs.org/zh/guide/cli-service.html) 的命令
  > 
  > 插件可以修改内部的 webpack 配置，也可以向 `vue-cli-service` 注入命令
  > 
  > 每个插件都会包含一个(用来创建文件的)生成器(`generator.js`)和一个(用来调整 webpack 核心配置和注入命令的)运行时(`index.js`)
  > 
  > `vue invoke xxx` 只调用它的生成器
* 预设配置(`.vuerc`)
  
  > 一个包含创建新项目所需的预定义选项和插件的 JSON 对象，让用户无需在命令提示中选择它们
  >
  > 远程预设: 通过发布 git repo 将一个预设配置分享给其他开发者
* `.env.[mode]` [环境变量配置机制](https://cli.vuejs.org/zh/guide/mode-and-env.html)(基于 `dotenv` 和 `--mode` 命令行参数)

  > `VUE_APP_*`: 只有以 `VUE_APP_` 开头的变量会被 `webpack.DefinePlugin` 静态嵌入到客户端侧的包中, 但两个特殊的变量在你的应用代码中始终可用: `NODE_ENV` 和 `BASE_URL` 
* `vue.config.js` [项目配置文件](https://cli.vuejs.org/zh/config/)(可实现自定义 `webpack` 配置)

  > * [configureWebpack](https://cli.vuejs.org/zh/config/#configurewebpack)
  > * [chainWebpack](https://cli.vuejs.org/zh/config/#chainwebpack)