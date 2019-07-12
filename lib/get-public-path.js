var pkg = require(process.cwd() + '/package.json');

/**
 * 获取 publicPath 配置
 * 
 * 一般我们只需要配置环境变量 `__public_base_path__`, 会自动拼接上 `pkg.name` 来生成 `publicPath`,
 * 但我们也可以直接配置环境变量 `__public_path__` 来直接决定 `publicPath` 的配置
 * 
 * @return {string}
 */
function getPublicPath() {
    var publicPath = '/';

    if (process.env.__public_path__) {
        publicPath = process.env.__public_path__;
    } else if (process.env.__public_base_path__) {
        publicPath = `${process.env.__public_base_path__}/${pkg.name}/`;
    }

    return publicPath;
}

module.exports = getPublicPath;