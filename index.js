// 将 wieldy-webpack 迁移到 vue-cli 3.0 插件体系
// [x]env.js                 -> 改为使用 .env 机制
// [x]merge-env.js           -> 改为使用 .env 机制
// [x]get-define-plugin.js   -> 改为使用 .env 机制
// [x]get-webpack-config.js  -> 升级到支持 webpack4
// [x]chunk-name-resolver.js -> 升级到支持 webpack4
// [x]wpk.js                 -> 升级到支持 webpack4
// [x]merge-wpk-config.js    -> 升级到支持 webpack4
// [x]create-entry.js        -> 升级到支持 HtmlWebpackPlugin3 
// [x]index.js               -> 没用了
// [x]util.js                -> 没用了
// [x]use-layout-template.js -> 没用了
// [x]add-deploy-plugin.js   -> 没用了

var path = require('path');
var fs = require('fs');

var _ = require('lodash');
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
 * @param {object} projectOptions
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
                             var htmlPluginOptions = args[0];
                             // 默认的 chunk 是 `chunk-vendors`, `chunk-common`, `entry`
                             htmlPluginOptions.chunks.unshift('runtime');
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
 * layout 机制
 * 
 * @param {ChainedMap} webpackConfig
 * @param {object} projectOptions 
 */
function useLayout(webpackConfig, projectOptions) {
    const multiPageConfig = projectOptions.pages;
    if (multiPageConfig) {
        const pages = Object.keys(multiPageConfig);
        pages.forEach(function(name) {
            webpackConfig.plugin(`html-${name}`)
                         .tap(function(args) {
                             var htmlPluginOptions = args[0];
                             if (htmlPluginOptions._useLayout) {
                                 htmlPluginOptions.templateContent = getTemplateContent(htmlPluginOptions, projectOptions);
                             }
                             return args;
                         });
        });
    }
}

/**
 * 通过 layout 机制获取模版页面的 HTML 内容
 * 
 * @param {object} htmlPluginOptions
 * @param {object} htmlPluginOptions._useLayout
 * @param {string} [htmlPluginOptions._useLayout.layoutFile]
 * @param {boolean} [htmlPluginOptions._useLayout.isContent=false]
 * @param {string | RegExp} [htmlPluginOptions._useLayout.placeholder]
 * @param {object} projectOptions
 * @return {string}
 * @see https://github.com/ufologist/wieldy-webpack/blob/master/src/create-entry.js#L71
 */
function getTemplateContent(htmlPluginOptions, projectOptions) {
    var layoutOptions = htmlPluginOptions._useLayout;
    layoutOptions = Object.assign({
        isContent: false,
        placeholder: /<!--\sbody\s-->[\s\S]*<!--\s\/body\s-->/
    }, layoutOptions);

    console.log('------使用 layout 机制------');
    console.log(layoutOptions);
    console.log('---------------------------');

    var layoutFile = layoutOptions.layoutFile;
    var layoutContent = '';
    var templateFile = htmlPluginOptions.template;
    var templateContent = '';

    // 获取 layout 的内容
    if (layoutFile) {
        if (layoutOptions.isContent) {
            layoutContent = layoutFile;
        } else {
            var layoutFilePath = '';
            if (path.isAbsolute(layoutFile)) {
                layoutFilePath = layoutFile;
            } else {
                layoutFilePath = path.resolve(layoutFile);
            }

            try {
                layoutContent = fs.readFileSync(layoutFilePath, 'utf8');
            } catch (error) {
                console.error('read layout content fail', error.message);
                throw error;
            }
        }
    }

    // 获取页面模版的内容
    try {
        if (templateFile) {
            templateContent = fs.readFileSync(templateFile, 'utf8');
        }
    } catch (error) {
        console.error('read template content fail', error.message);
        throw error;
    }

    // 以页面模版的内容替换掉 layout 内容中占位的内容
    var html = '';
    if (layoutContent && templateContent) {
        html = layoutContent.replace(layoutOptions.placeholder, templateContent);
    } else if (templateContent) {
        html = templateContent;
    } else if (layoutContent) {
        html = layoutContent;
    }

    // 根据数据生成 HTML 页面的内容
    // TODO 这里并不支持所有的 variables are available in the template
    return _.template(html)({
        NODE_ENV: process.env.NODE_ENV,
        BASE_URL: projectOptions.publicPath,
        htmlWebpackPlugin: {
            options: htmlPluginOptions,
        }
    });
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
 * XXX 暂未使用, 因为没有理论依据为什么要调整到 8KB
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
                        .loader('image-webpack-loader-coding-net-vendor').options(imageLoaderOptions);
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
 * XXX 暂未使用, 因为 cli-service 和 wieldy-webpack 定义的规则有很多地方不一样
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/base.js
 */
function modifyOutputFilenameRule(webpackConfig) {
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

/**
 * 提取 CSS 时不使用相对路径
 * 因为当 entry 有嵌套路径时, 生成的 CSS 文件中引用的静态资源路径有误
 * 
 * 例如配置如下 entry, CSS 中引用的文件路径为 ./res/a.png
 * 'pages/a/a': 'src/pages/a/a.js'
 * 
 * 那么生成的 CSS 文件为 css/pages/a/a.css
 * 引用的路径为 ../res/a.png, 而所有的图片是放在 /img 目录下的, 显然路径有误
 * 
 * @param {ChainedMap} webpackConfig
 * @see vue-cli/packages/@vue/cli-service/lib/config/css.js
 * @see https://github.com/vuejs/vue-cli/issues/4378
 */
function useDefaultCssPublicPathWhenExtractedCss(webpackConfig) {
    var ruleNames = ['css', 'postcss', 'scss', 'sass', 'less', 'stylus'];

    ruleNames.forEach(function(ruleName) {
        var baseRule = webpackConfig.module.rule(ruleName);
        var oneOfs = [
            baseRule.oneOf('vue-modules').resourceQuery(/module/),
            baseRule.oneOf('vue').resourceQuery(/\?vue/),
            baseRule.oneOf('normal-modules').test(/\.module\.\w+$/),
            baseRule.oneOf('normal')
        ];

        oneOfs.forEach(function(rule) {
            var hasMiniCssExtractLoader = rule.uses.get('extract-css-loader');
            if (hasMiniCssExtractLoader) {
                rule.use('extract-css-loader').tap(function(options) {
                    if (options) {
                        delete options.publicPath;
                    }
                    return options;
                });
            }
        });
    });
}

module.exports = function(api, projectOptions) {
    console.log('-----------------------------');
    console.log('[vue-cli-plugin-wieldy-webpack]', 'process.env.NODE_ENV', process.env.NODE_ENV);
    console.log('[vue-cli-plugin-wieldy-webpack]', 'publicPath', projectOptions.publicPath);
    console.log('-----------------------------');

    process.title = process.cwd();

    api.chainWebpack(function(webpackConfig) {
        const isDev = process.env.NODE_ENV === 'development';
        const isProd = process.env.NODE_ENV === 'production';
        const useDefaultCssPublicPath = process.env.__use_default_css_public_path__ === 'true';

        useLayout(webpackConfig, projectOptions);

        if (useDefaultCssPublicPath) {
            useDefaultCssPublicPathWhenExtractedCss(webpackConfig);
        }

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