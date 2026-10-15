import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  newApp,
  newRun,
  appSchema,
  changeRun,
  type InitiativeTool,
} from "./model";
import { entries, searchContent, resolveEntry } from "./content";
import {
  recordSchema,
  packKey,
  packSchema,
  packTarget,
} from "./content-schema";
import { monsterPack, starterPack, gmgPack } from "./starter-pack";
import { addMonsterToRun } from "./monsters";
import { copyCampaign } from "./campaigns";
import { migrateApp } from "./migrations";
import { Repository } from "./storage";
import { encodeBackup, decodeBackup } from "./backup";

const goblin = () => {
  const app = newApp();
  return searchContent(
    entries(app.campaigns[0], app.packs),
    "Goblin",
    "monster",
  ).find((entry) => entry.title === "Goblin")!;
};

it("bundles validated monsters, fractional levels, inherited abilities and legendary phases", () => {
  expect(packSchema.parse(monsterPack).records).toHaveLength(101);
  expect(goblin().body).toContain("Goblins:");
  const minion = monsterPack.records.find(
    (entry) => entry.title === "Goblin Minion",
  )!;
  expect(minion.fields).toMatchObject({ hp: 1, level: "1/4", minion: true });
  const legendary = monsterPack.records.find((entry) =>
    entry.title.startsWith("Alaric"),
  )!;
  expect(legendary.fields.legendary).toBe(true);
  expect(legendary.body).toContain("## Bloodied");
  expect(legendary.body).toContain("## Last stand");
  expect(legendary.body).toContain("roll:1d10%2B15");
  expect(() =>
    recordSchema.parse({ ...goblin(), fields: { hp: 0, level: "1" } }),
  ).toThrow();
});

it("adds separate enemy snapshots, preserves the combat turn, and enforces capacity atomically", () => {
  const entry = goblin();
  const first = addMonsterToRun(newRun(), entry);
  const active = {
    ...first,
    round: 3,
    status: "active" as const,
    activeId: first.combatants[0].id,
  };
  const second = addMonsterToRun(active, entry);
  expect(second).toMatchObject({
    round: 3,
    activeId: active.activeId,
    status: "active",
  });
  expect(second.combatants[0]).toEqual(first.combatants[0]);
  expect(second.combatants[1]).toMatchObject({
    name: "Goblin",
    hp: 15,
    maxHp: 15,
    side: "enemy",
    initiative: null,
  });
  expect(second.combatants[1].id).not.toBe(first.combatants[0].id);
  entry.fields.hp = 99;
  entry.body = "Changed library";
  expect(second.combatants[1].monster!.record.fields.hp).toBe(15);
  expect(second.combatants[1].monster!.record.body).not.toBe(entry.body);
  const full = {
    ...active,
    combatants: Array.from({ length: 100 }, (_, i) => ({
      ...first.combatants[0],
      id: String(i),
    })),
  };
  expect(() => addMonsterToRun(full, entry)).toThrow("100 combatants");
  expect(full.combatants).toHaveLength(100);
});

it("copies local monster references consistently through combat undo and dependency-complete backups", async () => {
  const app = newApp(),
    campaign = app.campaigns[0],
    entry = goblin();
  const record = recordSchema.parse({
    ...entry,
    id: "campaign-goblin",
    title: "Cave scout",
  });
  campaign.content.push(record);
  const local = { ...record, target: "local::campaign-goblin" };
  const tracker = campaign.tools.find(
    (tool): tool is InitiativeTool => tool.kind === "initiative",
  )!;
  const added = changeRun(tracker, addMonsterToRun(tracker.run, local));
  const damaged = changeRun(added, {
    ...added.run,
    combatants: added.run.combatants.map((c) => ({ ...c, hp: 7 })),
  });
  campaign.tools = campaign.tools.map((t) =>
    t.id === damaged.id ? damaged : t,
  );
  const copy = copyCampaign(campaign);
  const copied = copy.tools.find(
    (t): t is InitiativeTool => t.kind === "initiative",
  )!;
  expect(copied.run.combatants[0].monster!.target).toBe(
    "local::" + copy.content[0].id,
  );
  expect(copied.history[0].combatants[0].monster!.target).toBe(
    copied.run.combatants[0].monster!.target,
  );
  expect(copied.run.combatants[0].hp).toBe(7);
  const restored = await decodeBackup(
    await encodeBackup({ campaign, assets: [], packs: app.packs }),
  );
  expect(restored.campaign.tools).toEqual(campaign.tools);
  expect(
    resolveEntry(
      entries(restored.campaign, restored.packs!),
      packTarget(gmgPack, "monster/goblin"),
    )!.title,
  ).toBe("Goblin");
  const files = unzipSync(
    await encodeBackup({ campaign, assets: [], packs: app.packs }),
  );
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.schemaVersion = 6;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  expect((await decodeBackup(zipSync(files))).campaign.tools).toEqual(
    campaign.tools,
  );
});

it("upgrades genuine schema 6 storage once while preserving the original recovery point", async () => {
  const app = newApp();
  app.packs = [starterPack];
  app.campaigns[0].packRefs = [packKey(starterPack)];
  const old = { ...app, version: 6 };
  const name = crypto.randomUUID();
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
    tx.objectStore("packs").put(starterPack, packKey(starterPack));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(name);
  try {
    const migrated = await repo.load();
    expect(migrated.version).toBe(19);
    expect(migrated.campaigns[0].tools).toEqual(old.campaigns[0].tools);
    expect(migrated.campaigns[0].packRefs).toContain(packKey(gmgPack));
    expect(migrated.packs).toHaveLength(3);
    const points = await repo.recoveryPoints();
    expect(points).toHaveLength(1);
    expect((points[0].data as { version: number }).version).toBe(6);
    await repo.load();
    expect(await repo.recoveryPoints()).toHaveLength(1);
  } finally {
    repo.close();
  }
});

it("preserves full existing pack libraries instead of discarding data during upgrade", () => {
  const app = newApp();
  app.packs = Array.from({ length: 20 }, (_, i) => ({
    ...starterPack,
    id: "custom-" + i,
  }));
  app.campaigns[0].packRefs = app.packs.map(packKey);
  const migrated = migrateApp({ ...app, version: 6 });
  expect(migrated.packs).toEqual(app.packs);
  expect(migrated.campaigns[0].packRefs).toEqual(app.campaigns[0].packRefs);
  expect(() => appSchema.parse(migrated)).not.toThrow();
});
