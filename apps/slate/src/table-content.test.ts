import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { newApp, newTool, SCHEMA_VERSION } from "./model";
import {
  defaultTableDefinition,
  tableDefinitionSchema,
  tableOutcomes,
} from "./utility-schema";
import { recordSchema, parsePack, packKey, packTarget } from "./content-schema";
import { entries, searchContent, backlinks } from "./content";
import { migrateApp } from "./migrations";
import {
  tableDefinition,
  rollContentTable,
  referenceTableDefinition,
  makeRandomTableCopy,
} from "./table-content";
import { officialPacks } from "./starter-pack";
import { exportRecords, applyExchange, parseExchange } from "./exchange";
import { copyCampaign } from "./campaigns";
import { Repository } from "./storage";
import { encodeBackup, decodeBackup } from "./backup";

const record = (id = "weather") =>
  recordSchema.parse({
    id,
    kind: "table",
    title: "Weather",
    body: "",
    tags: [],
    fields: { definition: defaultTableDefinition() },
  });
it("roll numbers agree with displayed intervals for lists, weights and explicit ranges", () => {
  const campaign = newApp().campaigns[0],
    table = record();
  const definition = tableDefinition(table)!;
  definition.mode = "weighted";
  definition.rows[0].weight = 3;
  definition.rows[1].weight = 1;
  table.fields.definition = definition;
  campaign.content = [table];
  expect(tableOutcomes(definition).map(({ from, to }) => [from, to])).toEqual([
    [1, 3],
    [4, 4],
  ]);
  const all = entries(campaign, []);
  for (const outcome of [1, 2, 3, 4]) {
    const result = rollContentTable(all[0], all, undefined, () => outcome)
      .steps[0];
    expect(result.roll).toBe(outcome);
    expect(result.formula).toBe("1–4");
    expect(result.name).toBe(outcome <= 3 ? "Quiet" : "Footsteps");
  }
  definition.mode = "list";
  expect(tableOutcomes(definition).map(({ from, to }) => [from, to])).toEqual([
    [1, 1],
    [2, 2],
  ]);
  definition.mode = "ranges";
  definition.formula = "1d10-1";
  definition.rows[0].from = 0;
  definition.rows[0].to = 8;
  definition.rows[1].from = 9;
  definition.rows[1].to = 9;
  expect(tableOutcomes(definition).map(({ from, to }) => [from, to])).toEqual([
    [0, 8],
    [9, 9],
  ]);
  expect(
    rollContentTable(
      entries(campaign, [])[0],
      entries(campaign, []),
      undefined,
      () => 0,
    ).steps[0],
  ).toMatchObject({ roll: 0, name: "Quiet" });
});
it("turns catalog rows into an explicit rollable campaign copy without changing the official source", () => {
  const sourcePack = officialPacks.find((pack) =>
    pack.records.some((record) => record.id === "table/weapons"),
  )!;
  const source = sourcePack.records.find(
    (record) => record.id === "table/weapons",
  )!;
  const original = structuredClone(source);
  const entry = {
    ...source,
    pack: sourcePack,
    target: packTarget(sourcePack, source.id),
  };
  expect(tableDefinition(entry)).toBeNull();
  const copy = makeRandomTableCopy(entry);
  const definition = tableDefinition(copy)!;
  expect(source).toEqual(original);
  expect(copy.origin).toBe(entry.target);
  expect(copy.title).toBe("Weapons (random)");
  expect(copy.sources).toEqual(source.sources);
  expect(definition.mode).toBe("list");
  expect(definition.rows).toHaveLength(23);
  expect(definition.rows[0]).toMatchObject({ name: "Dagger", weight: 1 });
  expect(definition.rows[0].body).toContain("**Damage:** 1d4+DEX piercing");
  expect(definition.rows[0].body).toContain("**Category:** Melee Weapons");
  expect(definition.rows.at(-1)!.body).toContain("Ranged Weapons");
  expect(copy.related.every((target) => target.includes("::"))).toBe(true);
  const campaign = newApp().campaigns[0];
  campaign.content.push(copy);
  const all = entries(campaign, officialPacks);
  expect(rollContentTable(all[0], all, undefined, () => 1).steps[0].name).toBe(
    "Dagger",
  );
  const exported = exportRecords([copy], "slate");
  expect(
    tableDefinition(parseExchange(JSON.stringify(exported.value)).records[0]),
  ).toEqual(definition);
});
it("declines to guess mappings for unstructured, malformed or oversized reference tables", () => {
  const table = { ...record(), fields: {} };
  expect(referenceTableDefinition(table)).toBeNull();
  expect(() =>
    makeRandomTableCopy({ ...table, target: "local::weather" }),
  ).toThrow(/structured rows/);
  const fields = {
    subtables: [
      { title: "Bad table", columns: [], rows: [{ cells: { item: "Item" } }] },
    ],
  };
  expect(referenceTableDefinition({ ...table, fields })).toBeNull();
  const oversized = {
    subtables: [
      {
        title: "Too many",
        columns: [{ id: "item", name: "Item" }],
        rows: Array.from({ length: 201 }, () => ({ cells: { item: "Item" } })),
      },
    ],
  };
  expect(referenceTableDefinition({ ...table, fields: oversized })).toBeNull();
});
it("validates rollable table content and allows existing Markdown reference tables", () => {
  expect(recordSchema.parse({ ...record(), fields: {} }).kind).toBe("table");
  expect(() =>
    recordSchema.parse({
      ...record(),
      fields: { definition: { ...defaultTableDefinition(), rows: [] } },
    }),
  ).toThrow();
  const def = {
    ...defaultTableDefinition(),
    mode: "ranges",
    formula: "1d100-1",
  };
  def.rows[0] = { ...def.rows[0], from: 0, to: 9 };
  def.rows[1] = { ...def.rows[1], from: 10, to: 99 };
  expect(tableDefinitionSchema.safeParse(def).success).toBe(true);
  def.rows[1].from = 9;
  expect(tableDefinitionSchema.safeParse(def).success).toBe(false);
});
it("lists ignore saved weights while weighted and zero-based ranges select inclusive outcomes", () => {
  const campaign = newApp().campaigns[0],
    table = record();
  const definition = tableDefinition(table)!;
  definition.rows[0].weight = 10;
  table.fields.definition = definition;
  campaign.content.push(table);
  let all = entries(campaign, []);
  expect(rollContentTable(all[0], all, undefined, () => 2).steps[0].name).toBe(
    "Footsteps",
  );
  definition.mode = "weighted";
  all = entries(campaign, []);
  expect(rollContentTable(all[0], all, undefined, () => 2).steps[0].name).toBe(
    "Quiet",
  );
  definition.mode = "ranges";
  definition.formula = "1d100-1";
  definition.rows[0].from = 0;
  definition.rows[0].to = 9;
  definition.rows[1].from = 10;
  definition.rows[1].to = 99;
  all = entries(campaign, []);
  for (const value of [0, 9])
    expect(
      rollContentTable(all[0], all, undefined, () => value).steps[0].name,
    ).toBe("Quiet");
  for (const value of [10, 99])
    expect(
      rollContentTable(all[0], all, undefined, () => value).steps[0].name,
    ).toBe("Footsteps");
});
it("content packs preserve definitions, nested targets and reference Markdown without widgets", () => {
  const a = record("a"),
    b = record("b");
  const definition = tableDefinition(a)!;
  definition.rows[0].tableId = "local::b";
  definition.rows[0].body = "[Second table](slate:local%3A%3Ab)";
  a.fields.definition = definition;
  const exported = exportRecords([a, b], "pack");
  expect(exported.warnings).toEqual([]);
  const pack = parsePack(JSON.stringify(exported.value));
  const campaign = newApp().campaigns[0];
  campaign.packRefs = [packKey(pack)];
  const all = entries(campaign, [pack]);
  const result = rollContentTable(all[0], all, undefined, () => 1);
  expect(result.steps).toHaveLength(2);
  expect(result.steps[0].body).toContain(
    encodeURIComponent(`${packKey(pack)}::b`),
  );
  expect(campaign.tools.some((tool) => tool.kind === "table")).toBe(false);
  expect(result.steps[1].tableId).toBe(`${packKey(pack)}::b`);
});
it("table row prose is searchable and supplies backlinks; legacy standalone files import as content", () => {
  const campaign = newApp().campaigns[0],
    a = record("a"),
    b = record("b");
  const definition = tableDefinition(a)!;
  definition.rows[0].body = "Thunder [Weather](slate:local%3A%3Ab)";
  a.fields.definition = definition;
  campaign.content = [a, b];
  const all = entries(campaign, []);
  expect(
    searchContent(all, "Thunder", "table").map((entry) => entry.id),
  ).toEqual(["a"]);
  expect(backlinks(all, "local::b").map((entry) => entry.id)).toEqual(["a"]);
  const imported = parseExchange(
    JSON.stringify({
      format: "slate-table",
      version: 1,
      name: "Weather",
      definition,
    }),
  );
  expect(imported.records[0].kind).toBe("table");
  expect(tableDefinition(imported.records[0])).toEqual(definition);
  expect(() => exportRecords([a], "nexus")).toThrow(/Slate content pack/);
});
it("copied campaigns and record imports remap table content and widget references together", () => {
  const campaign = newApp().campaigns[0],
    a = record("a"),
    b = record("b");
  const def = tableDefinition(a)!;
  def.rows[0].tableId = "local::b";
  a.fields.definition = def;
  campaign.content = [a, b];
  const tool = newTool("table");
  if (tool.kind !== "table") throw new Error();
  tool.target = "local::a";
  campaign.tools.push(tool);
  const copied = copyCampaign(campaign);
  const copiedTool = copied.tools.find((entry) => entry.kind === "table")!;
  expect(copiedTool.kind === "table" && copiedTool.target).toBe(
    `local::${copied.content[0].id}`,
  );
  expect(tableDefinition(copied.content[0])!.rows[0].tableId).toBe(
    `local::${copied.content[1].id}`,
  );
  const imported = applyExchange(campaign, [a, b], "copy");
  expect(tableDefinition(imported.content[2])!.rows[0].tableId).toBe(
    `local::${imported.content[3].id}`,
  );
});
it("schema 15 migrates embedded tables once, preserving links and result snapshots", async () => {
  const app = newApp(),
    campaign = app.campaigns[0];
  const a = { ...newTool("table"), definition: defaultTableDefinition() },
    b = { ...newTool("table"), definition: defaultTableDefinition() };
  a.definition.rows[0].tableId = b.id;
  const raw = {
    ...app,
    version: 15,
    campaigns: [{ ...campaign, tools: [...campaign.tools, a, b] }],
  };
  const original = structuredClone(raw);
  const upgraded = migrateApp(raw);
  expect(raw).toEqual(original);
  expect(upgraded.version).toBe(SCHEMA_VERSION);
  expect(upgraded.campaigns[0].content).toHaveLength(2);
  expect(upgraded.campaigns[0].tools.at(-2)).not.toHaveProperty("definition");
  const all = entries(upgraded.campaigns[0], []);
  expect(rollContentTable(all[0], all, undefined, () => 1).steps).toHaveLength(
    2,
  );
  expect(migrateApp(upgraded)).toEqual(upgraded);
  const databaseName = "table-migration-" + crypto.randomUUID();
  const repo = await Repository.open(databaseName);
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    const tx = database.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...raw, packs: [] }, "app");
    for (const pack of raw.packs)
      tx.objectStore("packs").put(pack, packKey(pack));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const loaded = await repo.load();
    expect(loaded.campaigns[0].content).toHaveLength(2);
    expect((await repo.load()).revision).toBe(loaded.revision);
    expect(await repo.recoveryPoints()).toHaveLength(1);
    const restored = await decodeBackup(
      await encodeBackup({
        campaign: loaded.campaigns[0],
        assets: [],
        packs: loaded.packs,
      }),
    );
    expect(restored.campaign.content).toEqual(loaded.campaigns[0].content);
  } finally {
    database.close();
    repo.close();
  }
});
