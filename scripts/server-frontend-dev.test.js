const mockStart = jest.fn();
const mockWebpackDevServer = jest.fn(() => ({ start: mockStart }));

jest.mock("webpack", () => jest.fn(() => "compiler"));
// webpack-dev-server 6 is an ES module: require() yields its namespace with a default export
jest.mock("webpack-dev-server", () => ({ default: mockWebpackDevServer }));
jest.mock("../config/webpack.dev", () => ({ mode: "development" }));

const webpack = require("webpack");
const startFrontendDevServer = require("./server-frontend-dev");

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    delete process.env.DEV_SERVER_ALLOWED_HOSTS;
});

afterEach(() => {
    console.log.mockRestore();
    delete process.env.DEV_SERVER_ALLOWED_HOSTS;
});

function startAndGetOptions() {
    mockStart.mockResolvedValue();
    startFrontendDevServer(8080);
    return mockWebpackDevServer.mock.calls[0][0];
}

test("Starts the dev server with options first and the compiler second", async () => {
    mockStart.mockResolvedValue();

    startFrontendDevServer(8080);
    await Promise.resolve();

    expect(webpack).toHaveBeenCalledWith({ mode: "development" });
    expect(mockWebpackDevServer).toHaveBeenCalledTimes(1);
    const [options, compiler] = mockWebpackDevServer.mock.calls[0];
    expect(compiler).toBe("compiler");
    expect(options.port).toBe(8080);
    expect(options.hot).toBe(true);
    expect(mockStart).toHaveBeenCalledWith();
    expect(console.log).toHaveBeenCalledWith("Listening on port 8080");
});

test("Proxies the REST API, uploads and the websocket to the backend", () => {
    mockStart.mockResolvedValue();

    startFrontendDevServer(8080);

    const [options] = mockWebpackDevServer.mock.calls[0];
    expect(options.proxy).toEqual([
        { context: ["/api", "/uploads"], target: "http://localhost:3000" },
        { context: ["/ws-api"], target: "ws://localhost:3000", ws: true },
    ]);
});

test("Logs the error when the dev server fails to start", async () => {
    const error = new Error("port in use");
    mockStart.mockRejectedValue(error);

    startFrontendDevServer(8080);
    await new Promise(process.nextTick);

    expect(console.log).toHaveBeenCalledWith(error);
    expect(console.log).not.toHaveBeenCalledWith("Listening on port 8080");
});

test("Lets the browser take the live reload socket port from the page", () => {
    const options = startAndGetOptions();

    // a fixed port 8080 would bypass a reverse proxy
    expect(options.client.webSocketURL).toEqual({ port: 0 });
    expect(options.client.webSocketTransport).toBe(
        require.resolve("../src/js/devServerWebSocketClient.js")
    );
});

test("Keeps the default host check without DEV_SERVER_ALLOWED_HOSTS", () => {
    expect(startAndGetOptions().allowedHosts).toBe("auto");
});

test("Allows the host names from DEV_SERVER_ALLOWED_HOSTS", () => {
    process.env.DEV_SERVER_ALLOWED_HOSTS = " dev.example.org, ,.example.com ";

    expect(startAndGetOptions().allowedHosts).toEqual(["dev.example.org", ".example.com"]);
});
