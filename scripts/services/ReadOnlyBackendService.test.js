const ReadOnlyBackendService = require("./ReadOnlyBackendService");

test("an editable whiteboard gets a stable read-only id", () => {
    const readOnlyId = ReadOnlyBackendService.getReadOnlyId("board-a");

    expect(readOnlyId).toMatch(/^[0-9a-f-]{36}$/);
    expect(ReadOnlyBackendService.getReadOnlyId("board-a")).toBe(readOnlyId);
    expect(ReadOnlyBackendService.getIdFromReadOnlyId(readOnlyId)).toBe("board-a");
});

test("a read-only id is recognised and maps back to the editable id", () => {
    const readOnlyId = ReadOnlyBackendService.getReadOnlyId("board-b");

    expect(ReadOnlyBackendService.isReadOnly(readOnlyId)).toBe(true);
    expect(ReadOnlyBackendService.isReadOnly("board-b")).toBe(false);
    // Asking for the read-only id of a read-only id returns the id itself.
    expect(ReadOnlyBackendService.getReadOnlyId(readOnlyId)).toBe(readOnlyId);
});

test("different whiteboards get different read-only ids", () => {
    expect(ReadOnlyBackendService.getReadOnlyId("board-c")).not.toBe(
        ReadOnlyBackendService.getReadOnlyId("board-d")
    );
});
