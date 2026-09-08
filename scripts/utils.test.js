const path = require("path");
const { getArgs, getSafeFilePath } = require("./utils");

describe("getArgs", () => {
    const originalArgv = process.argv;

    afterEach(() => {
        process.argv = originalArgv;
    });

    test("parses long options and single-letter flags", () => {
        process.argv = ["node", "server.js", "--mode=production", "--port=8080", "-vq"];

        expect(getArgs()).toEqual({ mode: "production", port: "8080", v: true, q: true });
    });

    test("ignores positional arguments", () => {
        process.argv = ["node", "server.js", "positional"];

        expect(getArgs()).toEqual({});
    });
});

describe("getSafeFilePath", () => {
    const root = path.join("public", "uploads");

    test("joins a plain file name below the root", () => {
        expect(getSafeFilePath(root, "board.json")).toBe(path.join(root, "board.json"));
    });

    test("rejects path traversal and nested segments", () => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        expect(() => getSafeFilePath(root, "../secret.txt")).toThrow(
            "Attempted path traversal attack"
        );
        expect(() => getSafeFilePath(root, "sub/board.json")).toThrow(
            "Attempted path traversal attack"
        );

        console.log.mockRestore();
    });
});
