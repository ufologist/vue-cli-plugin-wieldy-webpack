var path = require('path')
var createHash = require('crypto').createHash;

// 与 lib/Compilation.js 中计算 chunkHash 的方式保持一致
var options = {
    hashFunction: 'md5',
    hashDigest: 'hex',
    hashDigestLength: 8
};

var usedHash = new Set();

/**
 * 获取 code split 方式懒加载的文件的文件名
 * 
 * 使用模块的文件名作为 chunk 的名称, 这样便于定位文件
 * 
 * @param {object} chunk
 * @return {string} 文件名
 * @see https://github.com/ufologist/wieldy-webpack/blob/master/src/chunk-name-resolver.js
 */
function getLazyModuleFileName(chunk) {
    var moduleFileName = null;
    var request = null;

    var groups = Array.from(chunk.groupsIterable);
    for (var i = 0, groupLength = groups.length; i < groupLength; i++) {
        var blocks = groups[i].getBlocks();

        // 找出通过 import() 或者 require.ensure() 方式加载的模块名称
        for (var ii = 0, blockLength = blocks.length; ii < blockLength; ii++) {
            var block = blocks[ii];
            var dependencies = block.dependencies;
            for (var iii = 0, dependencyLength = dependencies.length; iii < dependencyLength; iii++) {
                var dependency = dependencies[iii];
                if (dependency.request) {
                    request = dependency.request;
                    break;
                }
            }
        }

        if (request) {
            moduleFileName = path.basename(request, path.extname(request));
        }
    }

    return moduleFileName;
}

/**
 * 计算 chunk 的 hash 值
 * 
 * 参考
 * https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
 * HashedModuleIdsPlugin
 * 
 * @param {object} chunk 
 * @return {string}
 */
function calcChunkHash(chunk) {
    var hash = '';

    // https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/config/app.js
    var chunkModulesPath = Array.from(chunk.modulesIterable, m => m.id).join('_');
    hash = createHash(options.hashFunction).update(chunkModulesPath)
                                           .digest(options.hashDigest);

    // 截取 hash 的长度
    var len = options.hashDigestLength;
    while(usedHash.has(hash.substr(0, len))) {
        len++;
    }
    hash = hash.substr(0, len);
    usedHash.add(hash);

    return hash;
}

/**
 * 获取 chunk 的名字
 * 
 * @param {object} chunk 
 * @return {string} chunk 的名字
 */
function chunkNameResolver(chunk) {
    var name = null;

    if (chunk.name) {
        name = chunk.name;
    } else {
        var moduleFileName = getLazyModuleFileName(chunk);
        var hash = calcChunkHash(chunk);

        if (moduleFileName) {
            name = moduleFileName + '-' + hash;
        } else {
            name = hash;
        }
    }

    return name;
}

module.exports = chunkNameResolver;