import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import {
  duplicateEncounter,
  saveEncounterDefinition,
} from "./encounter-builder";
import {
  encounterSummary,
  inspectEncounter,
  startEncounter,
} from "./encounters";
import { encounterFieldsSchema } from "./encounter-schema";
import { recordSchema } from "./content-schema";
import { entries, type Entry } from "./content";
import { newApp, appSchema, uid } from "./model";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";
import { Repository } from "./storage";
import { applyExchange, exportRecords, parseExchange } from "./exchange";

const creature = (id: string, fields: Record<string, unknown> = {}): Entry => ({
  id,
  target: `local::${id}`,
  kind: "monster",
  title: id,
  body: "Complete abilities.",
  tags: [],
  category: "",
  related: [],
  sources: [],
  fields: { hp: 12, level: "1/2", armor: "none", ...fields },
});
const guard = creature("guard", { hpPerHero: 4 });
const team = creature("team", {
  legendary: true,
  members: [
    { name: "Ash", hp: 20 },
    { name: "Snow", hp: 10, hpPerHero: 3 },
  ],
});
const hazard = creature("mist", { hp: undefined, hazard: true });
const all = [guard, team, hazard];
const link = (
  monster: Entry,
  quantity = 1,
  isPerHero = false,
  heroesPerMonster = 1,
) => ({
  id: uid(),
  name: monster.title,
  target: monster.target,
  quantity,
  isPerHero,
  heroesPerMonster,
});
const create = (
  links = [link(guard, 1, true, 2)],
  overrides: Record<string, unknown> = {},
) => {
  const fields = encounterFieldsSchema.parse({
    heroCount: 5,
    heroLevel: 2,
    entries: links,
    ...overrides,
  });
  const record = saveEncounterDefinition(
    undefined,
    { title: "Moon gate", body: "GM plan.", fields },
    all,
  );
  return { ...record, target: `local::${record.id}` } as Entry;
};

it("authors a definition with stable IDs and current dependency notes without changing its source", () => {
  const entry = create();
  entry.fields = {
    ...entry.fields,
    missing: ["old import warning"],
    extensions: { futureWave: [1, 2] },
    exchange: { resource: { id: "source" } },
    futureKey: { keep: true },
  };
  const before = structuredClone(entry);
  const edited = saveEncounterDefinition(
    recordSchema.parse(entry),
    {
      title: "Edited gate",
      body: "New plan",
      fields: encounterFieldsSchema.parse(entry.fields),
    },
    all,
  );
  expect(edited.id).toBe(entry.id);
  expect(edited.fields).toMatchObject({
    entries: entry.fields.entries,
    missing: [],
    extensions: { futureWave: [1, 2] },
    exchange: entry.fields.exchange,
    futureKey: { keep: true },
  });
  expect(entry).toEqual(before);
});

it("scales fractional quantities and HP, counts team members and keeps hazards separate", () => {
  const entry = create([
    link(guard, 1, true, 2),
    link(team, 50, true),
    link(hazard, 2),
  ]);
  const summary = encounterSummary(entry, all, 5);
  expect(summary).toMatchObject({ combatants: 5, hazards: 2, blockers: [] });
  expect(summary.rows[0]).toMatchObject({ rawCount: 2.5, count: 3 });
  expect(summary.rows[1].count).toBe(1);
  const run = startEncounter(entry, all, 5);
  expect(run.combatants.map((c) => [c.name, c.hp])).toEqual([
    ["guard", 20],
    ["guard", 20],
    ["guard", 20],
    ["Ash", 20],
    ["Snow", 15],
  ]);
  expect(run.hazards).toHaveLength(2);
  expect(new Set(run.combatants.map((c) => c.id)).size).toBe(5);
});

it("saves incomplete and empty drafts but blocks starting either", () => {
  const empty = create([]);
  expect(encounterSummary(empty, all, 4).blockers.join()).toContain(
    "at least one",
  );
  expect(() => startEncounter(empty, all, 4)).toThrow(/at least one/);
  const missing = create([link(creature("unknown"))]);
  expect(missing.fields.missing).toEqual(["local::unknown"]);
  expect(() => startEncounter(missing, all, 4)).toThrow(/Missing full/);
  const mini = creature("mini", {
    incomplete: true,
    missing: ["family/soldiers"],
  });
  const incomplete = create([link(mini)]);
  expect(inspectEncounter(incomplete, [...all, mini], 4)[0].missing).toBe(true);
});

it("preflights aggregate combatant limits, including party PCs and every team member", () => {
  const many = create([link(guard, 100)]);
  const pc = {
    id: uid(),
    name: "Mira",
    playerName: "",
    level: 2,
    hp: 10,
    maxHp: 10,
    notes: "",
    source: null,
  };
  const party = { characters: [pc] };
  expect(encounterSummary(many, all, 4, party).blockers.join()).toContain(
    "101 combatants",
  );
  expect(() => startEncounter(many, all, 4, party)).toThrow(/101 combatants/);
  expect(startEncounter(many, all, 4).combatants).toHaveLength(100);
  const regularTeam = creature("pair", {
    members: [
      { name: "One", hp: 20 },
      { name: "Two", hp: 20 },
    ],
  });
  const teams = create([link(regularTeam, 51)]);
  expect(() => startEncounter(teams, [...all, regularTeam], 4)).toThrow(
    /102 combatants/,
  );
});

it("preflights aggregate hazards and scaled HP limits without affecting the saved definition", () => {
  const hazards = create([link(hazard, 100), link(hazard)]);
  expect(() => startEncounter(hazards, all, 4)).toThrow(/101 hazards/);
  const large = creature("large", { hpPerHero: 99999 });
  const entry = create([link(large)]);
  const before = structuredClone(entry);
  expect(() => startEncounter(entry, [...all, large], 2)).toThrow(/scaled HP/);
  expect(entry).toEqual(before);
});

it("duplicates independent rows and preserves provenance, source metadata and pack targets", () => {
  const app = newApp(),
    pack = app.packs[0];
  const source = {
    ...create(),
    pack,
    target: `${pack.id}@${pack.version}::gate`,
    related: ["rule"],
  };
  source.fields.extensions = { future: { wave: 1 } };
  const copy = duplicateEncounter(source);
  expect(copy.origin).toBe(source.target);
  expect(copy.id).not.toBe(source.id);
  expect(copy.related).toEqual([`${pack.id}@${pack.version}::rule`]);
  const originalRow = encounterFieldsSchema.parse(source.fields).entries[0];
  const copiedRow = encounterFieldsSchema.parse(copy.fields).entries[0];
  expect(copiedRow.id).not.toBe(originalRow.id);
  expect(copiedRow.target).toBe(originalRow.target);
  (copy.fields.entries as (typeof copiedRow)[])[0].quantity = 10;
  expect(originalRow.quantity).toBe(1);
  (copy.fields.extensions as { future: { wave: number } }).future.wave = 2;
  expect(source.fields.extensions).toEqual({ future: { wave: 1 } });
  expect(copy).not.toHaveProperty("pack");
});

it("rejects malformed authoring data and duplicate entry IDs", () => {
  const row = link(guard);
  for (const bad of [
    { heroCount: 2.5 },
    { heroLevel: -1 },
    { entries: [{ ...row, quantity: 0 }] },
    { entries: [{ ...row, heroesPerMonster: 1.5 }] },
    { entries: [row, row] },
  ])
    expect(() => create([row], bad)).toThrow();
  const entry = create();
  expect(() =>
    saveEncounterDefinition(
      undefined,
      {
        title: " ",
        body: "",
        fields: encounterFieldsSchema.parse(entry.fields),
      },
      all,
    ),
  ).toThrow();
  expect(() => duplicateEncounter(guard)).toThrow(/Choose an encounter/);
});

it("keeps active combat independent across edits and creates fresh runs when started again", () => {
  const entry = create();
  const run = startEncounter(entry, all, 5);
  run.combatants[0].hp = 1;
  const edited = saveEncounterDefinition(
    recordSchema.parse(entry),
    {
      title: "Tomorrow",
      body: "",
      fields: encounterFieldsSchema.parse({
        ...entry.fields,
        entries: [link(guard, 8)],
      }),
    },
    all,
  );
  expect(run.combatants).toHaveLength(3);
  expect(run.combatants[0].hp).toBe(1);
  const fresh = startEncounter(
    { ...edited, target: `local::${edited.id}` },
    all,
    4,
  );
  expect(fresh.combatants).toHaveLength(8);
  expect(fresh.combatants[0].id).not.toBe(run.combatants[0].id);
});

it("survives schema validation, browser persistence, campaign copying, JSON and complete ZIP restore", async () => {
  const app = newApp(),
    campaign = app.campaigns[0],
    entry = create();
  campaign.content.push(
    ...all.map((r) => recordSchema.parse(r)),
    recordSchema.parse(entry),
  );
  const dbName = `builder-${uid()}`;
  const repository = await Repository.open(dbName);
  const initialized = await repository.load();
  await repository.save(
    appSchema.parse({ ...app, revision: initialized.revision }),
    initialized.revision,
  );
  repository.close();
  const reopened = await Repository.open(dbName);
  const loaded = (await reopened.load())!;
  const restoredCampaign = loaded.campaigns[0];
  const restoredAll = entries(restoredCampaign, loaded.packs);
  expect(
    startEncounter(
      restoredAll.find((r) => r.kind === "encounter")!,
      restoredAll,
      5,
    ).combatants,
  ).toHaveLength(3);
  const copied = copyCampaign(restoredCampaign);
  const copiedAll = entries(copied, loaded.packs);
  expect(
    startEncounter(
      copiedAll.find((r) => r.kind === "encounter")!,
      copiedAll,
      5,
    ).combatants,
  ).toHaveLength(3);
  const zip = await encodeBackup({
    campaign: restoredCampaign,
    packs: loaded.packs.filter((p) =>
      restoredCampaign.packRefs.includes(`${p.id}@${p.version}`),
    ),
    assets: [],
  });
  const zipCampaign = (await decodeBackup(zip)).campaign;
  expect(zipCampaign.content).toEqual(restoredCampaign.content);
  const portable = exportRecords(restoredCampaign.content, "slate");
  const imported = applyExchange(
    newApp().campaigns[0],
    parseExchange(JSON.stringify(portable.value)).records,
    "copy",
  );
  const importedAll = entries(imported, loaded.packs);
  expect(
    startEncounter(
      importedAll.find((r) => r.kind === "encounter")!,
      importedAll,
      5,
    ).combatants,
  ).toHaveLength(3);
  const nexus = exportRecords(restoredCampaign.content, "nexus", restoredAll);
  const nexusCampaign = applyExchange(
    newApp().campaigns[0],
    parseExchange(JSON.stringify(nexus.value)).records,
    "replace",
  );
  const nexusAll = entries(nexusCampaign, loaded.packs);
  expect(
    startEncounter(
      nexusAll.find((r) => r.kind === "encounter")!,
      nexusAll,
      5,
    ).combatants,
  ).toHaveLength(3);
  reopened.close();
});

it("warns when selected encounter JSON omits full statblocks, without claiming a portable backup", () => {
  const entry = recordSchema.parse(create());
  const selected = exportRecords([entry], "slate", all);
  expect(selected.warnings.join()).toContain(
    "guard is referenced but not included",
  );
  expect(selected.warnings.join()).toContain("campaign ZIP");
  expect(
    exportRecords([entry, recordSchema.parse(guard)], "slate", all).warnings,
  ).toEqual([]);
  const mini = recordSchema.parse({
    ...guard,
    fields: { ...guard.fields, incomplete: true },
  });
  expect(exportRecords([entry, mini], "slate", all).warnings.join()).toContain(
    "incomplete statblock",
  );
});
