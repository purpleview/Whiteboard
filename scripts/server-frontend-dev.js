const devServerConfig = {
    hot: true,
    proxy: [
        // proxies for the backend
        {
            context: ["/api", "/uploads"],
            target: "http://localhost:3000",
        },
        {
            context: ["/ws-api"],
            target: "ws://localhost:3000",
            ws: true,
        },
    ],
};

function startFrontendDevServer(port) {
    // require here to prevent prod dependency to webpack
    const webpack = require("webpack");
    // webpack-dev-server 6 is an ES module; require() returns its namespace object
    const { default: WebpackDevServer } = require("webpack-dev-server");
    const config = require("../config/webpack.dev");

    const server = new WebpackDevServer({ ...devServerConfig, port }, webpack(config));
    server.start().then(
        () => console.log("Listening on port " + port),
        (err) => console.log(err)
    );
}

module.exports = startFrontendDevServer;
