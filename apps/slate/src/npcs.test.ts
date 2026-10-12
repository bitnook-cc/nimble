import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import { strFromU8, unzipSync, strToU8, zipSync } from "fflate";
import {
  newApp,
  newTool,
  appSchema,
  type NpcTool,
  type AppData,
} from "./model";
import {
  generateNpcResults,
  replaceNpcResult,
  saveNpcResult,
  npcNote,
} from "./npcs";
import { rerollNpcAttribute } from "@nimble/generators";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";
import { Repository } from "./storage";
import { migrateApp } from "./migrations";

const repos: Repository[] = [];
afterEach(() => repos.splice(0).forEach((repo) => repo.close()));
async function repository() {
  const repo = await Repository.open(crypto.randomUUID());
  repos.push(repo);
  return repo;
}
const initial = () => newTool("npc") as NpcTool;

it("keeps saved NPCs independently of the capped recent list and preserves individual rerolls", () => {
  let tool = saveNpcResult(generateNpcResults(initial(), 1, () => 0));
  const kept = structuredClone(tool.saved[0]);
  const changed = {
    ...tool.current!,
    ...rerollNpcAttribute(tool.current!, "scar", () => 0.99),
  };
  tool = replaceNpcResult(tool, changed);
  expect(tool.saved[0]).toEqual(kept);
  expect(tool.history[0]).toEqual(changed);
  tool = saveNpcResult(tool);
  expect(tool.saved).toEqual([changed]);
  tool = generateNpcResults(tool, 30, () => 0.5);
  expect(tool.history).toHaveLength(20);
  expect(tool.saved).toEqual([changed]);
});

it("stores, copies and exports complete NPCs and shared widget references", async () => {
  const repo = await repository(),
    app = await repo.load(),
    campaign = app.campaigns[0];
  const tool = saveNpcResult(generateNpcResults(initial(), 5, () => 0.5));
  campaign.tools.push(tool);
  campaign.screens[0].widgets.push({
    id: crypto.randomUUID(),
    toolId: tool.id,
    kind: "npc",
    x: 0,
    y: 5,
    w: 3,
    h: 3,
    title: "",
  });
  await repo.save(app, 0);
  const loaded = await repo.load();
  expect(loaded.campaigns[0].tools.find((t) => t.id === tool.id)).toEqual(tool);
  const copy = copyCampaign(campaign),
    copied = copy.tools.find((t): t is NpcTool => t.kind === "npc")!;
  expect(copied.id).not.toBe(tool.id);
  expect(copied.current!.id).not.toBe(tool.current!.id);
  expect(copied.current!.id).toBe(copied.saved[0].id);
  expect(copied.current!.id).toBe(copied.history[0].id);
  expect(copy.screens[0].widgets.find((w) => w.kind === "npc")!.toolId).toBe(
    copied.id,
  );
  expect(copied.current!.attributes).toEqual(tool.current!.attributes);
  const bytes = await encodeBackup(
    await repo.bundle(campaign.id, loaded.revision),
  );
  expect((await decodeBackup(bytes)).campaign.tools).toEqual(campaign.tools);
  expect(
    JSON.parse(strFromU8(unzipSync(bytes)["manifest.json"])).schemaVersion,
  ).toBe(17);
  expect(npcNote(tool.current!)).toMatchObject({
    kind: "note",
    name: tool.current!.name,
    tags: ["npc", "generic"],
  });
});

it("upgrades schema 4 storage and backups without losing packs, views, or recovery data", async () => {
  const name = crypto.randomUUID(),
    old = { ...newApp(), version: 4 };
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () => {
      for (const store of ["state", "assets", "recovery", "packs"])
        request.result.createObjectStore(store);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...old, packs: [] }, "app");
    for (const pack of old.packs)
      tx.objectStore("packs").put(pack, `${pack.id}@${pack.version}`);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(name);
  repos.push(repo);
  const upgraded = await repo.load();
  expect(upgraded.version).toBe(17);
  expect(upgraded.packs).toEqual(old.packs);
  expect(upgraded.campaigns).toEqual(old.campaigns);
  expect(upgraded.revision).toBe(1);
  const checkpoint = (await repo.recoveryPoints())[0];
  expect((checkpoint.data as AppData).packs).toEqual(old.packs);
  expect(migrateApp(checkpoint.data).campaigns).toEqual(old.campaigns);
  await repo.save(upgraded, upgraded.revision);
  await repo.load();
  expect(await repo.recoveryPoints()).toHaveLength(1);
  const files = unzipSync(
    await encodeBackup({
      campaign: old.campaigns[0],
      assets: [],
      packs: old.packs,
    }),
  );
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.schemaVersion = 4;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  expect((await decodeBackup(zipSync(files))).campaign).toEqual(
    old.campaigns[0],
  );
});

it("rejects malformed NPC details and duplicate saved records before persisting", () => {
  const app = newApp(),
    tool = saveNpcResult(generateNpcResults(initial(), 1, () => 0.5));
  app.campaigns[0].tools.push(tool);
  tool.saved.push(structuredClone(tool.saved[0]));
  expect(appSchema.safeParse(app).success).toBe(false);
  tool.saved.pop();
  tool.current!.attributes.scar = "";
  expect(appSchema.safeParse(app).success).toBe(false);
});
