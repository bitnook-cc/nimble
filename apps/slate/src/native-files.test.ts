import { beforeEach, expect, it, vi } from "vitest";
import { pickFiles, shareFile, toBase64, fromBase64 } from "./native-files";
const mocks = vi.hoisted(() => ({
  pick: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  share: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true },
}));
vi.mock("@capawesome/capacitor-file-picker", () => ({
  FilePicker: { pickFiles: mocks.pick },
}));
vi.mock("@capacitor/filesystem", () => ({
  Directory: { Cache: "CACHE" },
  Filesystem: { readFile: mocks.read, writeFile: mocks.write },
}));
vi.mock("@capacitor/share", () => ({ Share: { share: mocks.share } }));
beforeEach(() => vi.resetAllMocks());
it("copies native picker bytes into ordinary files for existing import validation", async () => {
  mocks.pick.mockResolvedValue({
    files: [
      {
        name: "rules.json",
        size: 4,
        path: "content://picked",
        mimeType: "application/json",
      },
    ],
  });
  mocks.read.mockResolvedValue({
    data: toBase64(new Uint8Array([0, 255, 12, 34])),
  });
  const result = await pickFiles(false, ".json,application/json");
  expect(mocks.pick).toHaveBeenCalledWith({
    limit: 1,
    readData: false,
    types: ["application/json", "application/octet-stream"],
  });
  expect(mocks.read).toHaveBeenCalledWith({ path: "content://picked" });
  expect(result[0].name).toBe("rules.json");
  expect(new Uint8Array(await result[0].arrayBuffer())).toEqual(
    new Uint8Array([0, 255, 12, 34]),
  );
});
it("bounds native selection before reading bytes and rejects changed files", async () => {
  mocks.pick.mockResolvedValue({
    files: [
      {
        name: "too-big.zip",
        size: 129 * 1024 * 1024,
        path: "file:///large",
        mimeType: "application/zip",
      },
    ],
  });
  await expect(pickFiles(false)).rejects.toThrow("128 MiB");
  expect(mocks.read).not.toHaveBeenCalled();
  mocks.pick.mockResolvedValue({
    files: [
      { name: "map.png", size: 10, path: "file:///map", mimeType: "image/png" },
    ],
  });
  mocks.read.mockResolvedValue({ data: "AQID" });
  await expect(pickFiles(false)).rejects.toThrow("changed");
});
it("exports through unique cache files and propagates native file/share failures", async () => {
  mocks.write.mockResolvedValue({ uri: "file:///cache/export.zip" });
  mocks.share.mockResolvedValue({ activityType: "save" });
  await shareFile(new Blob([new Uint8Array([1, 2, 3])]), "../backup.zip");
  const first = mocks.write.mock.calls[0][0];
  expect(first.directory).toBe("CACHE");
  expect(first.data).toBe("AQID");
  expect(first.path).toMatch(/^slate-exports\/[a-z0-9-]+\/..-backup.zip$/);
  expect(mocks.share).toHaveBeenCalledWith(
    expect.objectContaining({ files: ["file:///cache/export.zip"] }),
  );
  await shareFile(new Blob(["new"]), "../backup.zip");
  expect(mocks.write.mock.calls[1][0].path).not.toBe(first.path);
  mocks.share.mockRejectedValue(new Error("Share unavailable"));
  await expect(shareFile(new Blob(["x"]), "x.txt")).rejects.toThrow(
    "Share unavailable",
  );
  mocks.write.mockRejectedValue(new Error("Disk full"));
  await expect(shareFile(new Blob(["x"]), "x.txt")).rejects.toThrow(
    "Disk full",
  );
});
it("round-trips binary attachments without overflowing the call stack", () => {
  const bytes = Uint8Array.from({ length: 1024 * 1024 }, (_, i) => i % 256);
  expect(fromBase64(toBase64(bytes))).toEqual(bytes);
});
