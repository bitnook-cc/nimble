import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import {
  generateNpc,
  rerollNpcAttribute,
  rerollNpcName,
  generatorDefinitionSchema,
} from "@nimble/generators";
import {
  builtinDefinition,
  blankDefinition,
  generatorRecord,
  exportGeneratorPack,
} from "./generator-content";
import { newApp, newTool, appSchema, type NpcTool } from "./model";
import {
  parsePack,
  mergePacks,
  packKey,
  packTarget,
  recordSchema,
} from "./content-schema";
import { generateNpcResults, saveNpcResult, npcNote } from "./npcs";
import { copyCampaign } from "./campaigns";
import { entries } from "./content";
import { encodeBackup, decodeBackup } from "./backup";
import { Repository } from "./storage";

const repos: Repository[] = [];
afterEach(() => repos.splice(0).forEach((repo) => repo.close()));

it("exports validated generator records as normal immutable content packs, including mixed packs", () => {
  const campaign = newApp().campaigns[0];
  campaign.content.push(
    generatorRecord("market", "Market people", blankDefinition()),
  );
  const pack = parsePack(
    JSON.stringify(
      exportGeneratorPack(campaign, "market-people", "1", "Market people"),
    ),
  );
  expect(pack.records[0].fields).toEqual(blankDefinition());
  expect(mergePacks([pack], [structuredClone(pack)])).toEqual([pack]);
  expect(() => mergePacks([pack], [{ ...pack, name: "Changed" }])).toThrow(
    "different content",
  );
  const invalid = structuredClone(pack);
  invalid.records[0].fields = {
    ...blankDefinition(),
    attributes: { ...blankDefinition().attributes, quirk: [] },
  };
  expect(() => parsePack(JSON.stringify(invalid))).toThrow();
  const badPattern = builtinDefinition();
  if (badPattern.names.mode !== "syllables")
    throw new Error("Expected patterns");
  badPattern.names.config.male!.patterns = ["X"];
  expect(() => generatorDefinitionSchema.safeParse(badPattern)).not.toThrow();
  expect(
    recordSchema.safeParse({ ...pack.records[0], fields: badPattern }).success,
  ).toBe(false);
  expect(() =>
    parsePack(
      JSON.stringify({ ...pack, records: [...pack.records, pack.records[0]] }),
    ),
  ).toThrow("Duplicate");
});

it("retains tables for saved rerolls and remaps campaign generator selections when duplicating", () => {
  const campaign = newApp().campaigns[0],
    definition = blankDefinition();
  definition.names = {
    mode: "list",
    firstNames: { any: ["Rowan", "Sable"], male: [], female: [] },
    surnames: ["Vale"],
  };
  definition.attributes.quirk = ["Collects shells", "Refuses hats"];
  campaign.content.push(
    generatorRecord("harbour", "Harbour people", definition),
  );
  let tool = newTool("npc") as NpcTool;
  tool.options.style = "local::harbour";
  tool = saveNpcResult(generateNpcResults(tool, 1, () => 0, definition));
  campaign.tools.push(tool);
  definition.attributes.quirk[1] = "Changed source table";
  expect(
    rerollNpcAttribute(tool.current!, "quirk", () => 0.99).attributes.quirk,
  ).toBe("Refuses hats");
  expect(rerollNpcName(tool.current!, () => 0.99).name).toBe("Sable Vale");
  const copy = copyCampaign(campaign),
    copied = copy.tools.find((t): t is NpcTool => t.kind === "npc")!;
  expect(copied.options.style).toBe(`local::${copy.content[0].id}`);
  for (const npc of [copied.current!, ...copied.saved, ...copied.history])
    expect(npc.style).toBe(copied.options.style);
  expect(copied.current!.generator).toEqual(tool.current!.generator);
  const note = npcNote({
    ...tool.saved[0],
    style: "local::" + "long-generator-id".repeat(20),
  });
  expect(note.tags).toEqual(["npc", "custom-generator"]);
  campaign.content.push(note);
  campaign.content = [];
  expect(rerollNpcName(tool.saved[0], () => 0.99).name).toBe("Sable Vale");
});

it("persists imported generators and NPC snapshots in IndexedDB and portable campaign backups", async () => {
  const repo = await Repository.open(crypto.randomUUID());
  repos.push(repo);
  const app = await repo.load(),
    campaign = app.campaigns[0];
  const source = structuredClone(campaign);
  source.content.push(
    generatorRecord("harbour", "Harbour people", blankDefinition()),
  );
  const pack = exportGeneratorPack(source, "harbour", "1", "Harbour tables");
  app.packs.push(pack);
  campaign.packRefs.push(packKey(pack));
  const tool = newTool("npc") as NpcTool;
  tool.options.style = packTarget(pack, "harbour");
  campaign.tools.push(
    saveNpcResult(generateNpcResults(tool, 1, () => 0, blankDefinition())),
  );
  await repo.save(app, app.revision);
  const loaded = await repo.load();
  expect(
    entries(loaded.campaigns[0], loaded.packs).some(
      (entry) => entry.target === tool.options.style,
    ),
  ).toBe(true);
  const restored = await decodeBackup(
    await encodeBackup(await repo.bundle(campaign.id, loaded.revision)),
  );
  expect(restored.packs!.find((p) => packKey(p) === packKey(pack))).toEqual(
    pack,
  );
  expect(restored.campaign.tools).toEqual(campaign.tools);
  const copy = copyCampaign(restored.campaign);
  expect(
    (copy.tools.find((t) => t.kind === "npc") as NpcTool).options.style,
  ).toBe(tool.options.style);
  restored.campaign.packRefs = restored.campaign.packRefs.filter(
    (key) => key !== packKey(pack),
  );
  expect(
    entries(restored.campaign, restored.packs!).some(
      (entry) => entry.kind === "npc-generator",
    ),
  ).toBe(false);
});

it("keeps old built-in settings and validates all built-in tables without changing generated names", () => {
  for (const style of [
    "generic",
    "human",
    "elf",
    "dwarf",
    "halfling",
    "gnome",
  ]) {
    const builtin = generateNpc({ style }, () => 0.5);
    const custom = generateNpc({ style }, () => 0.5, builtinDefinition(style));
    expect(custom.name).toBe(builtin.name);
    expect(custom.attributes).toEqual(builtin.attributes);
  }
  const app = newApp(),
    tool = newTool("npc") as NpcTool;
  tool.current = {
    ...generateNpc({ style: "elf" }, () => 0),
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  app.campaigns[0].tools.push(tool);
  expect(appSchema.parse(app).campaigns[0].tools).toEqual(
    app.campaigns[0].tools,
  );
});

it("upgrades schema 7 transactionally once, preserving NPCs and disabled pack choices", async () => {
  const name = crypto.randomUUID(),
    previous = { ...newApp(), version: 7 };
  previous.campaigns[0].packRefs = [previous.campaigns[0].packRefs[0]];
  previous.campaigns[0].tools.push(
    saveNpcResult(generateNpcResults(newTool("npc") as NpcTool, 1, () => 0)),
  );
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
    tx.objectStore("state").put({ ...previous, packs: [] }, "app");
    for (const pack of previous.packs)
      tx.objectStore("packs").put(pack, packKey(pack));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(name);
  repos.push(repo);
  const migrated = await repo.load();
  expect(migrated.version).toBe(19);
  expect(migrated.revision).toBe(1);
  expect(migrated.campaigns).toEqual(previous.campaigns);
  expect(migrated.packs).toEqual(previous.packs);
  expect(
    ((await repo.recoveryPoints())[0].data as { version: number }).version,
  ).toBe(7);
  await repo.load();
  expect(await repo.recoveryPoints()).toHaveLength(1);
});
