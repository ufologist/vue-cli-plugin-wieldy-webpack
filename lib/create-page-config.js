var path = require('path');

/**
 * 创建 page config
 * 
 * @param {string} entry 入口 JS 文件, 生成的入口名字为 JS 文件相对于 `src` 目录的路径, 再去掉文件后缀, 例如: src/index/index.js -> index/index.js -> index/index
 * @param {object} [options] HtmlWebpackPlugin options
 * @param {object} [layoutOptions]
 * @param {string} [layoutOptions.layoutFile]
 * @param {boolean} [layoutOptions.isContent=false]
 * @param {string | RegExp} [layoutOptions.placeholder]
 * @return {object}
 */
function createPageConfig(entry, options, layoutOptions) {
    var pageConfig = {
        entry: entry
    };

    if (layoutOptions) {
        pageConfig._useLayout = layoutOptions;
    }

    // 获取相对于 src 根目录的路径名
    var entryName = path.posix.relative('src', entry);
    // 去掉文件后缀名
    entryName = entryName.substring(0, entryName.lastIndexOf('.'));

    return {
        [entryName]: Object.assign(pageConfig, options)
    };
}

module.exports = createPageConfig;