const devServerConfig = {
    hot: true,
    client: {
        // Port 0 makes the browser use the port of the page instead of the dev server port,
        // so the live reload socket also connects through a reverse proxy (e.g. https on 443)
        webSocketURL: { port: 0 },
        // prefixes the socket path with the page directory (reverse proxy sub path)
        webSocketTransport: require.resolve("../src/js/devServerWebSocketClient.js"),
    },
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

/**
 * Host names the dev server accepts besides localhost and IP addresses, e.g. the public host
 * name of a reverse proxy. The live reload socket rejects other origins.
 * @param {string | undefined} value comma separated list, e.g. "dev.example.org,.example.com"
 * @returns {"auto" | string[]}
 */
function parseAllowedHosts(value) {
    const hosts = (value || "")
        .split(",")
        .map((host) => host.trim())
        .filter((host) => host !== "");
    return hosts.length > 0 ? hosts : "auto";
}

function startFrontendDevServer(port) {
    // require here to prevent prod dependency to webpack
    const webpack = require("webpack");
    // webpack-dev-server 6 is an ES module; require() returns its namespace object
    const { default: WebpackDevServer } = require("webpack-dev-server");
    const config = require("../config/webpack.dev");

    const allowedHosts = parseAllowedHosts(process.env.DEV_SERVER_ALLOWED_HOSTS);
    const server = new WebpackDevServer(
        { ...devServerConfig, allowedHosts, port },
        webpack(config)
    );
    server.start().then(
        () => console.log("Listening on port " + port),
        (err) => console.log(err)
    );
}

module.exports = startFrontendDevServer;
