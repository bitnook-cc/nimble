import "fake-indexeddb/auto";
import { IDBObjectStore } from "fake-indexeddb";
import { afterEach, expect, it, vi } from "vitest";
import { Repository, AppStore, ConflictError } from "./storage";
import { newApp, SCHEMA_VERSION } from "./model";
import { packSchema, packKey, type ContentPack } from "./content-schema";

const connections: Repository[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  connections.splice(0).forEach((repo) => repo.close());
});
async function open(name = crypto.randomUUID()) {
  const repo = await Repository.open(name);
  connections.push(repo);
  return repo;
}
async function seed(name: string, data: unknown, packs: ContentPack[]) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(
        ["state", "packs", "assets", "recovery"],
        "readwrite",
      );
      tx.objectStore("state").put(data, "app");
      tx.objectStore("packs").clear();
      for (const pack of packs)
        tx.objectStore("packs").put(pack, packKey(pack));
      tx.objectStore("assets").put(
        {
          campaignId: "old",
          id: "map",
          blob: { bytes: new Uint8Array([1, 2]).buffer, type: "image/png" },
        },
        ["old", "map"],
      );
      tx.objectStore("recovery").put(
        {
          id: "old",
          at: "2026-10-13T00:00:00Z",
          reason: "Original",
          data,
          assets: [],
        },
        "old",
      );
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
const custom = packSchema.parse({
  format: "slate-content",
  schemaVersion: 1,
  id: "custom",
  version: "1",
  name: "Custom pack",
  source: { revision: "1", license: "Test content" },
  records: [
    {
      id: "rule",
      kind: "rule",
      title: "Custom rule",
      body: "Keep this content",
      tags: [],
    },
  ],
  terms: [],
  assets: {},
});

it("loads schema 16 packs before migration and preserves custom packs and original recovery data", async () => {
  const name = crypto.randomUUID();
  const repo = await open(name);
  const data = newApp();
  data.campaigns[0].name = "Keep this campaign";
  data.packs.push(custom);
  data.packs.sort((a, b) => packKey(a).localeCompare(packKey(b)));
  data.campaigns[0].packRefs.push(packKey(custom));
  const original = { ...data, version: 16 };
  await seed(name, { ...original, packs: [] }, data.packs);
  expect((await repo.raw()).data).toEqual(original);
  const loaded = await repo.load();
  expect(loaded.version).toBe(SCHEMA_VERSION);
  expect(loaded.campaigns[0]).toMatchObject({
    id: data.campaigns[0].id,
    name: "Keep this campaign",
    packRefs: data.campaigns[0].packRefs,
  });
  expect(loaded.packs).toEqual(data.packs);
  expect(
    (await repo.recoveryPoints()).find(
      (point) => point.reason === "Before storage upgrade",
    )?.data,
  ).toEqual(original);
  expect(await repo.load()).toEqual(loaded);
});

it("a genuinely missing custom pack is retained until an explicit reset clears the workspace", async () => {
  const name = crypto.randomUUID();
  const repo = await open(name);
  const data = newApp();
  data.campaigns[0].packRefs.push("missing@1");
  const invalid = { ...data, revision: 7, packs: [] };
  await seed(name, invalid, data.packs);
  const store = new AppStore(async () => repo);
  await store.init();
  expect(store.getSnapshot()).toMatchObject({ data: null, status: "error" });
  expect(store.getSnapshot().error).toContain(
    "Campaign content pack is missing",
  );
  const before = await repo.raw();
  expect(before.data).toEqual({ ...invalid, packs: data.packs });
  await store.resetLocalData();
  const fresh = store.getSnapshot().data!;
  expect(store.getSnapshot()).toMatchObject({
    status: "saved",
    busy: false,
    error: "",
  });
  expect(fresh.campaigns).toHaveLength(1);
  expect(fresh.campaigns[0].id).not.toBe(data.campaigns[0].id);
  expect(fresh.campaigns[0].content).toEqual([]);
  expect(fresh.packs).toEqual(newApp().packs);
  expect(fresh.revision).toBe(8);
  expect((await repo.raw()).assets).toEqual([]);
  expect(await repo.recoveryPoints()).toEqual([]);
  expect(await repo.load()).toEqual(fresh);
});

it("reset failures roll back campaigns, packs, attachments and recovery points", async () => {
  const name = crypto.randomUUID();
  const repo = await open(name);
  const data = { ...newApp(), version: 999, revision: 4 };
  await seed(name, { ...data, packs: [] }, data.packs);
  const before = await repo.raw();
  const points = await repo.recoveryPoints();
  const put = vi
    .spyOn(IDBObjectStore.prototype, "put")
    .mockImplementation(() => {
      throw new Error("Disk full");
    });
  await expect(repo.reset()).rejects.toThrow("Disk full");
  put.mockRestore();
  expect(await repo.raw()).toEqual(before);
  expect(await repo.recoveryPoints()).toEqual(points);
});

it("other tabs cannot overwrite a reset with a stale revision", async () => {
  const name = crypto.randomUUID();
  const first = await open(name),
    second = await open(name);
  const stale = await second.load();
  await first.reset();
  await expect(second.save(stale, stale.revision)).rejects.toBeInstanceOf(
    ConflictError,
  );
});

it("reset works even when opening the original repository failed", async () => {
  const name = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 99);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  const store = new AppStore(
    () => Repository.open(name),
    async () => {
      const repo = await Repository.recreate(name);
      connections.push(repo);
      return repo;
    },
  );
  await store.init();
  expect(store.getSnapshot().data).toBeNull();
  await store.resetLocalData();
  expect(store.getSnapshot().status).toBe("saved");
  expect(store.getSnapshot().data?.campaigns).toHaveLength(1);
  const reopened = await open(name);
  expect(await reopened.load()).toEqual(store.getSnapshot().data);
});

it("the store prevents resetting an open campaign", async () => {
  const repo = await open();
  const store = new AppStore(async () => repo);
  await store.init();
  const before = await repo.raw();
  await expect(store.resetLocalData()).rejects.toThrow(
    "only when local data cannot be opened",
  );
  expect(await repo.raw()).toEqual(before);
});

it("a structurally incomplete database can still be manually reset", async () => {
  const name = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  db.close();
  const repo = await open(name),
    store = new AppStore(async () => repo);
  await store.init();
  expect(store.getSnapshot()).toMatchObject({ data: null, status: "error" });
  await store.resetLocalData();
  expect(store.getSnapshot().data?.campaigns).toHaveLength(1);
  expect(await repo.load()).toEqual(store.getSnapshot().data);
});
