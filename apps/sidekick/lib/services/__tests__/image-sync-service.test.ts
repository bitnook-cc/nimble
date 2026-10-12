import { afterEach, describe, expect, it, vi } from "vitest";

import { characterImageService } from "../character-image-service";
import { imageSyncService } from "../sync/image-sync-service";

vi.mock("../auth-service", () => ({
  authService: { fetchUser: vi.fn().mockResolvedValue({ user: { id: "account" } }) },
}));
vi.mock("../character-image-service", () => ({ characterImageService: { imageExists: vi.fn() } }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("portrait version sync", () => {
  it("uploads a local replacement when its exact version is absent", async () => {
    vi.mocked(characterImageService.imageExists).mockResolvedValue(true);
    const fetch = vi.fn().mockResolvedValue({ status: 404, ok: false });
    vi.stubGlobal("fetch", fetch);
    const upload = vi
      .spyOn(imageSyncService, "uploadCharacterImage")
      .mockResolvedValue({ success: true });
    expect((await imageSyncService.syncCharacterImage("character", "new-image")).success).toBe(
      true,
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("?imageId=new-image"),
      expect.any(Object),
    );
    expect(fetch.mock.calls[0][0]).not.toContain("legacy=");
    expect(upload).toHaveBeenCalledWith("character", "new-image");
  });
  it("allows legacy cloud portraits when restoring onto a new device", async () => {
    vi.mocked(characterImageService.imageExists).mockResolvedValue(false);
    const fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ url: "https://example.invalid/avatar.webp" }),
    });
    vi.stubGlobal("fetch", fetch);
    const download = vi
      .spyOn(imageSyncService, "downloadCharacterImage")
      .mockResolvedValue({ success: true });
    await imageSyncService.syncCharacterImage("character", "old-image");
    expect(fetch.mock.calls[0][0]).toContain("imageId=old-image&legacy=1");
    expect(download).toHaveBeenCalledWith(
      "character",
      "https://example.invalid/avatar.webp",
      "old-image",
    );
  });
  it("reports failure when the referenced portrait cannot be restored", async () => {
    vi.mocked(characterImageService.imageExists).mockResolvedValue(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 404, ok: false }));
    expect((await imageSyncService.syncCharacterImage("character", "missing")).success).toBe(false);
  });
});
