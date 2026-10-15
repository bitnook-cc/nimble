import "fake-indexeddb/auto";
import officialFixture from "./fixtures/nexus-gmg.json";
import { expect, it } from "vitest";
import { parseExchange, applyExchange, exportRecords } from "./exchange";
import { entries, resolveEntry } from "./content";
import { startEncounter, inspectEncounter } from "./encounters";
import { monsterStatsSchema } from "./monster-schema";
import { itemFieldsSchema } from "./item-schema";
import {
  newApp,
  newRun,
  appSchema,
  newTool,
  changeRun,
  type InitiativeTool,
} from "./model";
import { addMonsterToRun } from "./monsters";
import { copyCampaign } from "./campaigns";
import { encodeBackup, decodeBackup } from "./backup";
import { Repository } from "./storage";
import { packKey } from "./content-schema";

const monster = (id = "guard", attributes: Record<string, unknown> = {}) => ({
  type: "monsters",
  id,
  attributes: {
    name: "Guard",
    hp: 20,
    level: "1/2",
    armor: "medium",
    abilities: [],
    actions: [
      {
        name: "Spear",
        damage: { roll: "1d6+2" },
        description: "On damage: Prone",
      },
    ],
    ...attributes,
  },
});
const item = {
  type: "items",
  id: "sword",
  attributes: {
    name: "Silver blade",
    kind: "Weapon",
    rarity: "rare",
    description: "A shining blade.",
    moreInfo: "Forged by elves.",
    futureProperty: { preserves: true },
  },
};
const encounter = {
  type: "encounters",
  id: "gate",
  attributes: {
    name: "At the gate",
    heroCount: 4,
    heroLevel: 2,
    description: "The guards challenge the party.",
  },
  relationships: {
    monsters: {
      data: [
        {
          type: "monsters",
          id: "guard",
          meta: { quantity: 1, isPerHero: true, heroesPerMonster: 2 },
        },
      ],
    },
  },
};
const doc = (data: unknown, included: unknown[] = []) =>
  JSON.stringify({ data, included });
function imported(input: string) {
  const app = newApp();
  app.campaigns[0] = applyExchange(
    app.campaigns[0],
    parseExchange(input).records,
    "replace",
  );
  return { app, all: entries(app.campaigns[0], app.packs) };
}

it("imports items without inventing unknown mechanics and retains unknown source fields", () => {
  const result = parseExchange(doc(item));
  const record = result.records[0];
  expect(itemFieldsSchema.parse(record.fields)).toMatchObject({
    kind: "Weapon",
    rarity: "rare",
    moreInfo: "Forged by elves.",
  });
  expect(record.fields.price).toBeUndefined();
  expect(record.fields.slots).toBeUndefined();
  expect(result.warnings.join(" ")).toContain("futureProperty");
  const out = exportRecords([record], "nexus").value as {
    data: (typeof item)[];
  };
  expect(out.data[0].attributes.futureProperty).toEqual({ preserves: true });
  expect(parseExchange(JSON.stringify(out)).records[0].body).toBe(record.body);
});
it("validates optional item mechanics and reports every reduced export field", () => {
  const record = parseExchange(doc(item)).records[0];
  record.fields = {
    ...record.fields,
    price: { amount: 0, currency: "gp" },
    slots: 0,
    damage: "1d6",
    armor: "Heavy",
    uses: 3,
    properties: { material: "silver" },
  };
  const output = exportRecords([record], "nexus");
  for (const field of [
    "price",
    "slots",
    "damage",
    "armor",
    "uses",
    "properties",
  ])
    expect(output.warnings.join(" ")).toContain(field);
  expect(() => itemFieldsSchema.parse({ slots: -1 })).toThrow();
  expect(() =>
    itemFieldsSchema.parse({ price: { amount: 4, currency: "" } }),
  ).toThrow();
  const portable = exportRecords([record], "slate");
  expect(parseExchange(JSON.stringify(portable.value)).records).toEqual([
    record,
  ]);
});
it("resolves included families, actions, phases and fractional monster levels", () => {
  const guard = {
    ...monster(),
    relationships: {
      families: { data: [{ type: "families", id: "soldiers" }] },
    },
  };
  const family = {
    type: "families",
    id: "soldiers",
    attributes: {
      name: "Soldiers",
      abilities: [{ name: "Shield wall", description: "Stand together." }],
    },
  };
  const record = parseExchange(doc(guard, [family])).records[0];
  expect(record.body).toContain("Shield wall");
  expect(record.body).toContain("roll:1d6%2B2");
  expect(record.fields.level).toBe("1/2");
  expect(record.fields.incomplete).toBe(false);
  const exported = exportRecords([record], "nexus").value as {
    included: unknown[];
  };
  expect(exported.included).toEqual([family]);
  const legendary = parseExchange(
    doc(
      monster("boss", {
        subtype: "legendary",
        bloodied: { description: "Enraged" },
        lastStand: "Dying",
      }),
    ),
  ).records[0];
  expect(legendary.body).toContain("## Bloodied\n\nEnraged");
  expect(legendary.body).toContain("## Last stand\n\nDying");
});
it("marks mini-statblocks and unresolved families incomplete and blocks starting", () => {
  const mini = {
    type: "monsters",
    id: "guard",
    attributes: { name: "Guard", hp: 20, level: "1" },
  };
  const { all } = imported(doc(encounter, [mini]));
  const e = all.find((e) => e.kind === "encounter")!;
  expect(inspectEncounter(e, all, 4)[0].missing).toBe(true);
  expect(() => startEncounter(e, all, 4)).toThrow(/Missing full/);
  const missingFamily = {
    ...monster(),
    relationships: { family: { data: { type: "families", id: "absent" } } },
  };
  expect(parseExchange(doc(missingFamily)).records[0].fields.incomplete).toBe(
    true,
  );
});
it("preserves encounter quantity rules, rounds visibly and snapshots per-hero HP", () => {
  const { all } = imported(
    doc(encounter, [monster("guard", { hpPerHero: 5 })]),
  );
  const e = all.find((e) => e.kind === "encounter")!;
  const row = inspectEncounter(e, all, 5)[0];
  expect(row).toMatchObject({ rawCount: 2.5, count: 3 });
  const first = startEncounter(e, all, 5),
    second = startEncounter(e, all, 5);
  expect(first.combatants).toHaveLength(3);
  expect(first.combatants[0].maxHp).toBe(25);
  expect(first.combatants[0].id).not.toBe(second.combatants[0].id);
  const tool = changeRun(newTool("initiative") as InitiativeTool, first);
  expect(tool.history[0]).toEqual(newRun());
  all.find(
    (e) => e.kind === "monster" && e.id.endsWith("/guard"),
  )!.fields.hpPerHero = 10;
  expect(first.combatants[0].maxHp).toBe(25);
  expect(first.combatants[0].monster!.record.fields.hpPerHero).toBe(5);
});
it("adds legendary teams as one team with independent member combatants", () => {
  const { all } = imported(
    doc(encounter, [
      monster("guard", {
        subtype: "team",
        legendary: true,
        members: [
          { name: "Red", hp: 30, abilities: [], actions: [] },
          { name: "Blue", hp: 20, hpPerHero: 4, abilities: [], actions: [] },
        ],
      }),
    ]),
  );
  const e = all.find((e) => e.kind === "encounter")!;
  expect(inspectEncounter(e, all, 5)[0].count).toBe(1);
  const run = startEncounter(e, all, 5);
  expect(run.combatants.map((c) => [c.name, c.maxHp])).toEqual([
    ["Red", 30],
    ["Blue", 20],
  ]);
  expect(run.combatants[0].monster!.record.fields.members).toBeUndefined();
});
it("keeps HP-less hazards as separate snapshots without inventing creature fields", () => {
  const h = monster("guard", {
    name: "Flood",
    hazard: true,
    hp: undefined,
    armor: undefined,
  });
  const { all } = imported(doc(encounter, [h]));
  const e = all.find((e) => e.kind === "encounter")!;
  const run = startEncounter(e, all, 4);
  expect(run.combatants).toHaveLength(0);
  expect(run.hazards).toHaveLength(2);
  expect(run.hazards![0].record.fields.hp).toBeUndefined();
  expect(run.hazards![0].record.fields.armor).toBeUndefined();
  expect(
    monsterStatsSchema.parse(run.hazards![0].record.fields).hp,
  ).toBeUndefined();
});
it("rejects a whole oversized encounter without mutating current combat", () => {
  const huge = structuredClone(encounter);
  huge.relationships.monsters.data[0].meta.quantity = 100;
  const { all } = imported(doc(huge, [monster()]));
  const old = newRun();
  expect(() =>
    startEncounter(
      all.find((e) => e.kind === "encounter")!,
      all,
      100,
    ),
  ).toThrow(/100/);
  expect(old).toEqual(newRun());
  const crowded = {
    ...newRun(),
    combatants: Array.from({ length: 99 }, (_, i) => ({
      id: String(i),
      name: "Guard",
      side: "enemy" as const,
      initiative: null,
      hp: 1,
      maxHp: 1,
      conditions: "",
      notes: "",
    })),
  };
  const team = imported(
    doc(
      monster("duo", {
        members: [
          { name: "One", hp: 1 },
          { name: "Two", hp: 1 },
        ],
      }),
    ),
  ).all.find((e) => e.id.endsWith("/duo"))!;
  expect(() => addMonsterToRun(crowded, team)).toThrow(/100/);
  expect(crowded.combatants).toHaveLength(99);
});
it("rejects malformed quantities, duplicate IDs, unsupported versions and oversized files", () => {
  const bad = structuredClone(encounter);
  bad.relationships.monsters.data[0].meta.heroesPerMonster = 0;
  expect(() => parseExchange(doc(bad))).toThrow();
  expect(() =>
    parseExchange(
      doc([
        item,
        { ...item, attributes: { ...item.attributes, name: "Different" } },
      ]),
    ),
  ).toThrow(/Conflicting/);
  expect(() =>
    parseExchange(
      JSON.stringify({
        format: "slate-records",
        schemaVersion: 99,
        records: [],
      }),
    ),
  ).toThrow();
  expect(() => parseExchange(" ".repeat(8 * 1024 * 1024 + 1))).toThrow(/8 MiB/);
});
it("imports independent copies with consistent encounter and Markdown references", () => {
  const withLink = monster("guard", { description: "Carries @item:sword" });
  const preview = parseExchange(doc([encounter, withLink, item]));
  expect(preview.records.find((r) => r.kind === "monster")!.body).toContain(
    "slate:local%3A%3Anexus%2Fitems%2Fsword",
  );
  let campaign = applyExchange(
    newApp().campaigns[0],
    preview.records,
    "replace",
  );
  const once = campaign.content.length;
  expect(applyExchange(campaign, preview.records, "skip").content.length).toBe(
    once,
  );
  campaign = applyExchange(campaign, preview.records, "copy");
  expect(campaign.content).toHaveLength(once * 2);
  const copiedEncounter = campaign.content
    .filter((r) => r.kind === "encounter")
    .at(-1)!;
  const target = (copiedEncounter.fields.entries as { target: string }[])[0]
    .target;
  expect(target).not.toContain("nexus/monsters/guard");
  expect(resolveEntry(entries(campaign, []), target)).toBeDefined();
});
it("round-trips flattened Nimbrew actions and phases and warns on edited exports", () => {
  const raw = {
    name: "Night king",
    CR: "Level 6 Solo",
    armor: "H",
    hp: "30/hero",
    speed: "Fly 8",
    passives: [{ type: "single", name: "Shadow", desc: "Invisible" }],
    actions: [
      {
        type: "multi",
        name: "Choose one",
        actions: [{ type: "single", name: "Strike", desc: "2d6 damage" }],
      },
    ],
    bloodied: "Enraged",
    laststand: "Dying",
    theme: { BGColor: "#000" },
  };
  const record = parseExchange(JSON.stringify(raw)).records[0];
  expect(record.fields).toMatchObject({
    hp: 30,
    hpPerHero: 30,
    legendary: true,
    armor: "heavy",
  });
  expect(record.body).toContain("Strike");
  expect(record.body).toContain("Enraged");
  expect(exportRecords([record], "nimbrew").value).toEqual(raw);
  record.body += "\nA change";
  expect(exportRecords([record], "nimbrew").warnings.length).toBeGreaterThan(0);
});
it("preserves encounter references, item favourites and hazards in copies and ZIP backups", async () => {
  const { app, all } = imported(doc([item, encounter], [monster()]));
  const campaign = app.campaigns[0];
  campaign.itemFavourites = ["local::nexus/items/sword"];
  campaign.tools.push(newTool("items"));
  const run = startEncounter(
    all.find((e) => e.kind === "encounter")!,
    all,
    4,
  );
  const tracker = campaign.tools.find(
    (t) => t.kind === "initiative",
  ) as InitiativeTool;
  tracker.run = run;
  const copy = copyCampaign(campaign);
  expect(copy.itemFavourites[0]).not.toBe(campaign.itemFavourites[0]);
  const copied = entries(copy, app.packs);
  const e = copied.find((e) => e.kind === "encounter")!;
  expect(inspectEncounter(e, copied, 4)[0].missing).toBe(false);
  const restored = await decodeBackup(
    await encodeBackup({ campaign, assets: [], packs: app.packs }),
  );
  expect(restored.campaign).toEqual(campaign);
  expect(
    appSchema.parse({ ...app, campaigns: [restored.campaign] }).version,
  ).toBe(19);
});
it("upgrades v8 transactionally with one recovery checkpoint and retains disabled packs", async () => {
  const previous = { ...newApp(), version: 8 };
  const rawCampaign = { ...previous.campaigns[0] } as Record<string, unknown>;
  delete rawCampaign.itemFavourites;
  rawCampaign.packRefs = [];
  const dbName = crypto.randomUUID();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 3);
    request.onupgradeneeded = () => {
      for (const store of ["state", "assets", "packs", "recovery"])
        request.result.createObjectStore(store);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put(
      { ...previous, campaigns: [rawCampaign], packs: [] },
      "app",
    );
    for (const pack of previous.packs)
      tx.objectStore("packs").put(pack, packKey(pack));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(dbName);
  try {
    const migrated = await repo.load();
    expect(migrated.version).toBe(19);
    expect(migrated.revision).toBe(1);
    expect(migrated.packs).toEqual(previous.packs);
    expect(migrated.campaigns[0].packRefs).toEqual([]);
    expect(migrated.campaigns[0].itemFavourites).toEqual([]);
    await repo.load();
    expect(await repo.recoveryPoints()).toHaveLength(1);
    expect(
      ((await repo.recoveryPoints())[0].data as { version: number }).version,
    ).toBe(8);
  } finally {
    repo.close();
  }
});

it("imports pinned original GMG seed fixtures with families and stable derived IDs", () => {
  const first = parseExchange(JSON.stringify(officialFixture));
  const second = parseExchange(JSON.stringify(officialFixture));
  expect(first.records).toHaveLength(4);
  expect(first.records.map((r) => r.id)).toEqual(
    second.records.map((r) => r.id),
  );
  expect(first.records.every((r) => !r.fields.incomplete)).toBe(true);
  expect(
    first.records.find((r) => r.title === "Bandit Minion")!.fields,
  ).toMatchObject({ hp: 1, level: "1/4", minion: true });
  expect(first.records.find((r) => r.title === "Goblin")!.body).toContain(
    "Goblins",
  );
  const legendary = first.records.find((r) => r.fields.legendary)!;
  expect(legendary.body).toContain("## Last stand");
  expect(legendary.sources).toEqual([{ book: "Nimble GMG" }]);
  expect(
    (legendary.fields.exchange as { documentSource: unknown }).documentSource,
  ).toEqual(officialFixture.source);
});
it("exports independent encounter copies with matching monster identifiers", () => {
  const preview = parseExchange(doc(encounter, [monster()]));
  const campaign = applyExchange(
    newApp().campaigns[0],
    preview.records,
    "copy",
  );
  const portable = exportRecords(campaign.content, "nexus");
  const importedAgain = imported(JSON.stringify(portable.value));
  const e = importedAgain.all.find((e) => e.kind === "encounter")!;
  expect(inspectEncounter(e, importedAgain.all, 4)[0].missing).toBe(false);
});

it("maps references inside additional item prose and remaps them in campaign copies", () => {
  const record = {
    ...item,
    attributes: { ...item.attributes, moreInfo: "Stolen from @monster:guard" },
  };
  const preview = parseExchange(doc([record, monster()]));
  const campaign = applyExchange(
    newApp().campaigns[0],
    preview.records,
    "copy",
  );
  const copied = copyCampaign(campaign);
  const originalItem = campaign.content.find((r) => r.kind === "item")!;
  const copiedItem = copied.content.find((r) => r.kind === "item")!;
  expect(String(originalItem.fields.moreInfo)).toContain("slate:");
  expect(copiedItem.fields.moreInfo).not.toBe(originalItem.fields.moreInfo);
  const target = decodeURIComponent(
    /slate:([^\s)]+)/.exec(String(copiedItem.fields.moreInfo))![1],
  );
  expect(resolveEntry(entries(copied, []), target)?.title).toBe("Guard");
});

it("reconstructs Nexus source tokens from portable item references on export", () => {
  const record = {
    ...item,
    attributes: { ...item.attributes, moreInfo: "Stolen from @monster:guard" },
  };
  const importedRecords = parseExchange(doc([record, monster()])).records;
  const campaign = applyExchange(
    newApp().campaigns[0],
    importedRecords,
    "copy",
  );
  const output = exportRecords(campaign.content, "nexus");
  const reimported = imported(JSON.stringify(output.value));
  const e = reimported.all.find((e) => e.kind === "item")!;
  const target = decodeURIComponent(
    /slate:([^\s)]+)/.exec(String(e.fields.moreInfo))![1],
  );
  expect(resolveEntry(reimported.all, target)?.title).toBe("Guard");
});
