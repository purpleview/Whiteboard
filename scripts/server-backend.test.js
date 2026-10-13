// The info service broadcasts on an interval that would keep Jest from exiting
jest.mock("./services/WhiteboardInfoBackendService", () => ({
    start: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    setScreenResolution: jest.fn(),
}));
// webdav is an ES module that Jest cannot require; these tests do not use WebDAV
jest.mock("webdav", () => ({ createClient: jest.fn() }));

const { once } = require("events");
const fs = require("fs");
const path = require("path");
const startBackendServer = require("./server-backend");
const ReadOnlyBackendService = require("./services/ReadOnlyBackendService");
const s_whiteboard = require("./s_whiteboard");

let server;
let baseUrl;

function base64(text) {
    return Buffer.from(text, "utf8").toString("base64");
}

function fromBase64(text) {
    return Buffer.from(text, "base64").toString("utf8");
}

function loadWhiteboard(wid) {
    return fetch(`${baseUrl}/api/loadwhiteboard?wid=${wid}`).then((res) => res.json());
}

function draw(params) {
    return fetch(`${baseUrl}/api/drawToWhiteboard?${new URLSearchParams(params)}`);
}

beforeAll(async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    server = startBackendServer(0);
    await once(server, "listening");
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    console.log.mockRestore();
    console.warn.mockRestore();
});

describe("GET /api/drawToWhiteboard", () => {
    test("Strips script from the Base64 textbox text before storing it", async () => {
        const wid = "rest-xss";
        const res = await draw({
            wid,
            t: "setTextboxText",
            "d[0]": "tb1",
            "d[1]": base64('<div>hi<img src="x" onerror="alert(1)"></div>'),
        });

        expect(res.status).toBe(200);
        const [event] = await loadWhiteboard(wid);
        expect(fromBase64(event.d[1])).toBe("<div>hi</div>");
    });

    test("Purifies the text when d is parsed as an object", async () => {
        const wid = "rest-xss-object";
        // "d[x]" turns "d" into an object; the client still reads d[1]
        const res = await draw({
            wid,
            t: "setTextboxText",
            "d[x]": "tb1",
            "d[1]": base64('<img src="x" onerror="alert(1)">'),
        });

        expect(res.status).toBe(200);
        const [event] = await loadWhiteboard(wid);
        expect(fromBase64(event.d[1])).toBe("");
    });

    test("Accepts setTextboxText without text instead of failing", async () => {
        const res = await draw({ wid: "rest-no-text", t: "setTextboxText", "d[0]": "tb1" });

        expect(res.status).toBe(200);
    });

    test("Replaces a nested text value with an empty text", async () => {
        const wid = "rest-nested-text";
        const res = await draw({ wid, t: "setTextboxText", "d[0]": "tb1", "d[1][a]": "x" });

        expect(res.status).toBe(200);
        const [event] = await loadWhiteboard(wid);
        expect(event.d[1]).toBe("");
    });

    test("Rejects a read-only whiteboard id once and draws nothing", async () => {
        const readOnlyWid = ReadOnlyBackendService.getReadOnlyId("rest-readonly");

        const res = await draw({ wid: readOnlyWid, t: "rect", "d[0]": "1" });

        expect(res.status).toBe(401);
        expect(await res.text()).toBe("");
        // the event would be stored under the read-only id itself
        expect(s_whiteboard.loadStoredData(readOnlyWid)).toEqual([]);
    });

    test("Rejects a missing whiteboard id", async () => {
        const res = await draw({ t: "rect" });

        expect(res.status).toBe(401);
    });
});

describe("POST /api/upload", () => {
    test("Answers 401 for a read-only whiteboard id", async () => {
        const readOnlyWid = ReadOnlyBackendService.getReadOnlyId("upload-readonly");

        const res = await fetch(`${baseUrl}/api/upload`, {
            method: "POST",
            body: new URLSearchParams({ wid: readOnlyWid, imagedata: "iVBORw0KGgo=" }),
            signal: AbortSignal.timeout(2000),
        });

        expect(res.status).toBe(401);
    });

    test("Answers 500 without image data", async () => {
        const wid = "upload-no-data";
        // the upload creates this folder before it looks at the image data
        const uploadDir = path.join("public", "uploads", ReadOnlyBackendService.getReadOnlyId(wid));

        try {
            const res = await fetch(`${baseUrl}/api/upload`, {
                method: "POST",
                body: new URLSearchParams({ wid }),
                signal: AbortSignal.timeout(2000),
            });

            expect(res.status).toBe(500);
        } finally {
            fs.rmSync(uploadDir, { recursive: true, force: true });
        }
    });
});
