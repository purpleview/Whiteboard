jest.mock("webpack-dev-server/client/clients/WebSocketClient.js", () => ({
    __esModule: true,
    default: class {
        constructor(url) {
            this.url = url;
        }
    },
}));

import DevServerWebSocketClient, { prefixSocketPathWithPageDir } from "./devServerWebSocketClient";

describe("prefixSocketPathWithPageDir", () => {
    test("Keeps the socket path for a page at the server root", () => {
        expect(prefixSocketPathWithPageDir("ws://127.0.0.1:8080/ws", "/")).toBe(
            "ws://127.0.0.1:8080/ws"
        );
    });

    test("Prefixes the reverse proxy sub path", () => {
        expect(prefixSocketPathWithPageDir("wss://example.org/ws", "/whiteboard/")).toBe(
            "wss://example.org/whiteboard/ws"
        );
    });

    test("Uses the directory of a page or worker file", () => {
        expect(
            prefixSocketPathWithPageDir("wss://example.org/ws", "/a/whiteboard/pdf.worker-1.js")
        ).toBe("wss://example.org/a/whiteboard/ws");
    });
});

describe("DevServerWebSocketClient", () => {
    afterEach(() => {
        delete global.self;
    });

    test("Connects relative to the location of the page", () => {
        global.self = { location: { pathname: "/whiteboard/" } };

        const client = new DevServerWebSocketClient("wss://example.org/ws");

        expect(client.url).toBe("wss://example.org/whiteboard/ws");
    });
});
