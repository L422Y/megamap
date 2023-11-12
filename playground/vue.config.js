const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // hot reload
    devServer: {
        // Fixing issue with WDS disconnected and sockjs network error
        host: '0.0.0.0',
        // public: '0.0.0.0:8080',
        // disableHostCheck: true,
        // End of fix
    },
    chainWebpack: config => {
        config.module
        .rule('vue')
        .use('vue-loader')
        .tap(options => {
            // modify the options...
            return options
        })
    },
})
