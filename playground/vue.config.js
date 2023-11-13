const {defineConfig} = require("@vue/cli-service")
const mockApi = require("./src/mock-api")
module.exports = defineConfig({

    transpileDependencies: true,
    devServer: {
        host: "0.0.0.0",
        onBeforeSetupMiddleware(devServer) {
            if (!devServer) {
                throw new Error("webpack-dev-server is not defined")
            }
            console.log("onBeforeSetupMiddleware")
            devServer.app.use(mockApi)
        }
    },
    chainWebpack: config => {
        config.module
            .rule("vue")
            .use("vue-loader")
            .tap(options => {
                return options
            })
    },
})
