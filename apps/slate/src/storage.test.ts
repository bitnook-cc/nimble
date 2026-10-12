import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { ConflictError, Repository } from "./storage";
const connections: Repository[] = [];
afterEach(() => {
  connections.splice(0).forEach((c) => c.close());
});
async function open(name = crypto.randomUUID()) {
  const repo = await Repository.open(name);
  connections.push(repo);
  return repo;
}
describe("transactional campaign storage", () => {
  it("initializes only once and restores campaign state", async () => {
    const repo = await open();
    const original = await repo.load();
    original.campaigns[0].name = "The Lantern Coast";
    await repo.save(original, 0);
    const loaded = await repo.load();
    expect(loaded.campaigns[0].name).toBe("The Lantern Coast");
    expect(loaded.campaigns[0].id).toBe(original.campaigns[0].id);
    expect(loaded.revision).toBe(1);
  });
  it("initializes atomically across two tabs", async () => {
    const name = crypto.randomUUID();
    const a = await open(name);
    const b = await open(name);
    const [first, second] = await Promise.all([a.load(), b.load()]);
    expect(first.activeCampaignId).toBe(second.activeCampaignId);
  });
  it("rejects a stale write without overwriting another tab", async () => {
    const name = crypto.randomUUID();
    const a = await open(name);
    const b = await open(name);
    const first = await a.load();
    const second = await b.load();
    first.campaigns[0].name = "Saved elsewhere";
    await a.save(first, 0);
    second.campaigns[0].name = "Stale copy";
    await expect(b.save(second, 0)).rejects.toBeInstanceOf(ConflictError);
    expect((await a.load()).campaigns[0].name).toBe("Saved elsewhere");
  });
  it("rejects invalid state before any write", async () => {
    const repo = await open();
    const data = await repo.load();
    data.campaigns[0].screens[0].grid.columns = 1;
    expect(() => repo.save(data, 0)).toThrow();
    expect((await repo.load()).campaigns[0].screens[0].grid.columns).toBe(12);
  });
  it("stores byte attachments and decodes them for backups and recovery", async () => {
    const repo = await open();
    const data = await repo.load();
    const campaign = data.campaigns[0];
    const blob = new Blob(["Forest map"], { type: "text/plain" });
    campaign.assets = [
      {
        id: "map",
        name: "map.txt",
        mime: blob.type,
        size: blob.size,
        sha256: "a".repeat(64),
      },
    ];
    await repo.save(data, 0, {
      assets: [{ campaignId: campaign.id, id: "map", blob }],
    });
    expect(await (await repo.asset(campaign.id, "map"))!.text()).toBe(
      "Forest map",
    );
    const loaded = await repo.load();
    await repo.save(loaded, 1, { checkpoint: "Before edit" });
    const point = (await repo.recoveryPoints())[0];
    expect(await point.assets[0].blob.text()).toBe("Forest map");
    expect((await repo.bundle(campaign.id, 2)).assets[0].blob.type).toBe(
      "text/plain",
    );
  });
  it("still reads legacy Blob attachments and recovery points", async () => {
    const name = crypto.randomUUID();
    const repo = await open(name);
    const data = await repo.load();
    const campaign = data.campaigns[0];
    const blob = new Blob(["Old map"], { type: "text/plain" });
    const asset = { campaignId: campaign.id, id: "old-map", blob };
    campaign.assets = [
      {
        id: asset.id,
        name: "old.txt",
        mime: blob.type,
        size: blob.size,
        sha256: "a".repeat(64),
      },
    ];
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["state", "assets", "recovery"], "readwrite");
      tx.objectStore("state").put({ ...data, packs: [] }, "app");
      tx.objectStore("assets").put(asset, [campaign.id, asset.id]);
      tx.objectStore("recovery").put(
        {
          id: "legacy",
          at: new Date().toISOString(),
          reason: "Legacy",
          data,
          assets: [asset],
        },
        "legacy",
      );
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    expect((await repo.load()).campaigns[0].assets[0].id).toBe(asset.id);
    expect(await (await repo.asset(campaign.id, asset.id))!.text()).toBe(
      "Old map",
    );
    expect(await (await repo.recoveryPoints())[0].assets[0].blob.text()).toBe(
      "Old map",
    );
  });
});
