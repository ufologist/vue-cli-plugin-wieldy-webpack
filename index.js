// 将 wiedly-webpack 迁移到 vue-cli 3.0 插件体系
// [x]env.js                 -> 改为使用 .env 机制
// [x]merge-env.js           -> 改为使用 .env 机制
// [x]get-define-plugin.js   -> 改为使用 .env 机制
// [x]get-webpack-config.js  -> 升级到支持 webpack4
// [x]chunk-name-resolver.js -> 升级到支持 webpack4
// [x]wpk.js                 -> 升级到支持 webpack4
// [x]merge-wpk-config.js    -> 升级到支持 webpack4
// [x]index.js               -> 没用了
// [x]util.js                -> 没用了
// create-entry.js
// use-layout-template.js

var webpack = require('webpack');
var InlineChunksHtmlWebpackPlugin = require('fixed-webpack4-html-webpack-inline-chunk-plugin');
var mockHttpApi = require('mock-http-api');

var chunkNameResolver = require('./lib/chunk-name-resolver.js');
var pkg = require(process.cwd() + '/package.json');

/**
 * 根据文件的名称给动态分离的 chunk 命名
 * 例如 about.vue -> about-a1234567
 * 
 * cli-service 默认的机制没有取文件名,
 * 而是 about.vue -> chunk-a1234567 这样不直观, 看不出是由哪个文件构建出来的产物
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/app.js
 */
function namedDynamicChunkByFileName(webpackConfig) {
    // 如果配置中没有 named-chunks 则会报错
    webpackConfig.plugin('named-chunks')
                 .tap(function() {
                     return [chunkNameResolver];
                 });
}

/**
 * 将 runtime inline 到 html 文件中
 * 
 * 这样动态导入的模块改变后不会影响到主模块的 hash.
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/app.js
 */
function inlineRuntime(webpackConfig, projectOptions) {
    // 将 runtime 分离出来作为一个独立的 chunk
    webpackConfig.optimization.runtimeChunk('single');

    // 将 runtime chunk 添加到 HtmlWebpackPlugin 的 chunks 配置中
    const multiPageConfig = projectOptions.pages;
    if (multiPageConfig) {
        const pages = Object.keys(multiPageConfig);
        pages.forEach(function(name) {
            webpackConfig.plugin(`html-${name}`)
                         .tap(function(args) {
                             // 默认的 chunk 是 `chunk-vendors`, `chunk-common`, `entry`
                             args[0].chunks.unshift('runtime');
                             return args;
                         });
        });
    }

    // inline runtime chunk 到 html 文件中
    webpackConfig.plugin('inline-runtime')
                 .use(InlineChunksHtmlWebpackPlugin, [{
                     inlineChunks: ['runtime'],
                     // 不要将这个 chunk 删除掉, 否则当存在多个 HtmlWebpackPlugin 时,
                     // 会因为找不到这个 chunk 而报错的
                     deleteFile: false
                 }]);
}

/**
 * 添加 banner 注释
 * 
 * @param {ChainedMap} webpackConfig 
 */
function addBanner(webpackConfig) {
    webpackConfig.plugin('banner')
                 .use(webpack.BannerPlugin, [`${pkg.name} | (c) ${pkg.author}`]);
}

/**
 * 调整 url-loader 的 limit 配置
 * 
 * @param {ChainedMap} webpackConfig 
 * @see vue-cli/packages/@vue/cli-service/lib/config/base.js
 */
function modifyUrlLoaderLimit(webpackConfig) {
    webpackConfig.module.rule('images')
                        .use('url-loader')
                        .tap(function(options) {
                            // vue-cli 默认是 4096
                            options.limit = 8 * 1024;
                            return options;
                        });
}

/**
 * 优化图片
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/base.js
 */
function optimizeImage(webpackConfig) {
    var imageLoaderOptions = {
        optipng: {
            // optipng 压缩很慢, 而且压缩的效果不好, 只使用 pngquant 就好了
            enabled: false,
            optimizationLevel: 7
        },
        gifsicle: {
            interlaced: false
        },
        pngquant: {
            quality: '75-90',
            speed: 4
        },
        mozjpeg: {
            progressive: true,
            quality: 75
        }
    };

    webpackConfig.module.rule('images')
                        .use('image-loader')
                        .loader('image-webpack-loader').options(imageLoaderOptions)
                        .before('url-loader');
    // 如果 image-webpack-loader 执行有问题, 可以去掉这个 loader
    // webpackConfig.module.rule('images')
    //                     .uses.delete('image-loader')
}

/**
 * 开启 mock server 功能
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/commands/serve.js
 */
function setupMockServer(webpackConfig) {
    webpackConfig.devServer.historyApiFallback(false);
    webpackConfig.devServer.setup(function(app) {
        mockHttpApi(app);
    });
    // vue-cli 屏蔽了 devServer 内置的 open 功能, 打开都是 localhost
    webpackConfig.devServer.open(true);
}

/**
 * 调整 minimizer option
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/prod.js
 */
function modifyMinimizerOption(webpackConfig) {
    var minimizers = webpackConfig.optimization.get('minimizer');
    if (minimizers && minimizers[0]) {
        var terserOptions = minimizers[0].options.terserOptions;
        terserOptions.compress.drop_console = true;
    }
}

/**
 * 调整生成文件名的命名规则
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/base.js
 */
function modifyOutputFilenameRule(webpackConfig) {
    // 暂时不考虑修改生成文件的规则, 因为和默认的规则有很多地方不一样
    var chunkFilename = webpackConfig.output.get('chunkFilename');
    var filename = webpackConfig.output.get('filename');
    if (chunkFilename) {
        // 将 chunkFilename 命名为 chunk/[name].js
        // entry 生成的文件也会被放在 chunk 目录下, 感觉有点怪
        // 例如 pages/a/b.js -> chunk/pages/a/b.8b4bd278.js
        webpackConfig.output
                     .chunkFilename(chunkFilename.replace('js/', 'chunk/'));
    }
    if (filename) {
        webpackConfig.output
                     .filename(filename.replace('js/', ''));
    }
}

module.exports = function(api, projectOptions) {
    console.log('process.env.NODE_ENV', process.env.NODE_ENV);

    process.title = process.cwd();

    api.chainWebpack(function(webpackConfig) {
        const isDev = process.env.NODE_ENV === 'development';
        const isProd = process.env.NODE_ENV === 'production';

        modifyUrlLoaderLimit(webpackConfig);

        if (isDev) {
            setupMockServer(webpackConfig);
        } else {
            optimizeImage(webpackConfig);
        }

        if (isProd) {
            addBanner(webpackConfig);
            namedDynamicChunkByFileName(webpackConfig);
            inlineRuntime(webpackConfig, projectOptions);
            modifyMinimizerOption(webpackConfig);
        }

        // 审查项目的 webpack 配置
        // https://cli.vuejs.org/zh/guide/webpack.html#%E5%AE%A1%E6%9F%A5%E9%A1%B9%E7%9B%AE%E7%9A%84-webpack-%E9%85%8D%E7%BD%AE
        // vue inspect --mode=production
        // console.log(webpackConfig.toConfig());
    });
};