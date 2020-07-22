module.exports = {
    entry: __dirname + "/src/index.js",
    output: {
        path: __dirname + "/public",
        publicPath: '/',
        filename: 'bundle.js'
    },
    devServer: {
        contentBase: __dirname + "/public/",
        inline: true,
        host: '0.0.0.0',
        port: 8080
    }
}