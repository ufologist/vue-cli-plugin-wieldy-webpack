module.exports = function(api, options, rootOptions) {
    // 复制并用 ejs 渲染 `./template` 内所有的文件
    api.render('./template');
};