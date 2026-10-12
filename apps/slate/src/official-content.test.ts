import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import inventory from "./content/nexus-conversion.json";
import itemSnapshot from "./content/nexus-official-items.json";
import supplement from "./content/nexus-official-supplement.json";
import {
  starterPack,
  monsterPack,
  coreRulesPack,
  gmgPack,
  heroesPack,
  officialPacks,
  remapOfficialReference,
} from "./starter-pack";
import { newApp, newTool, type AppData } from "./model";
import { entries, resolveEntry } from "./content";
import {
  packKey,
  packTarget,
  referenceMarkdown,
  recordSchema,
  packSchema,
  type ContentPack,
} from "./content-schema";
import { migrateApp } from "./migrations";
import { Repository } from "./storage";
import { encodeBackup, decodeBackup, digest } from "./backup";
import { parseExchange, exportRecords } from "./exchange";
import { renderOfficialTable } from "./official-content";
import { addMonsterToRun } from "./monsters";

const oldRevision = "40527955eb7c6f4a242d508586580401f9e0431c";
it("splits all official content by book with working cross-pack links and portable pack exports", () => {
  const app = newApp();
  expect(app.packs.map((pack) => [pack.name, pack.records.length])).toEqual([
    ["Nimble · Core Rules", 350],
    ["Nimble · GMG", 144],
    ["Nimble · Heroes", 50],
  ]);
  expect(gmgPack.records.filter((r) => r.kind === "monster")).toHaveLength(101);
  expect(heroesPack.records.filter((r) => r.kind === "class")).toHaveLength(12);
  expect(
    coreRulesPack.records.some(
      (r) => r.kind === "monster" || r.kind === "class",
    ),
  ).toBe(false);
  const all = entries(app.campaigns[0], app.packs);
  for (const pack of app.packs) {
    expect(packSchema.parse(JSON.parse(JSON.stringify(pack)))).toEqual(pack);
    for (const record of pack.records) {
      for (const link of record.related)
        expect(
          resolveEntry(
            all,
            link.includes("::") ? link : packTarget(pack, link),
          ),
          `${record.id}: ${link}`,
        ).toBeDefined();
      for (const match of record.body.matchAll(/slate:([^\s)]+)/g))
        expect(
          resolveEntry(all, decodeURIComponent(match[1])),
          record.id,
        ).toBeDefined();
      for (const match of record.body.matchAll(/asset:([^\s)]+)/g))
        expect(pack.assets[match[1]], record.id).toBeDefined();
    }
  }
  expect(
    remapOfficialReference(packTarget(starterPack, "rule/conditions#blind")),
  ).toBe(packTarget(coreRulesPack, "rule/conditions#blind"));
  expect(
    remapOfficialReference(
      referenceMarkdown(
        "Bloodied",
        packTarget(starterPack, "rule/legendary-bloodied"),
      ),
    ),
  ).toBe(
    referenceMarkdown(
      "Bloodied",
      packTarget(gmgPack, "rule/legendary-bloodied"),
    ),
  );
});
it("splits schema 14 packs once, retaining source opt-outs and record references", () => {
  const app = newApp();
  app.packs = [starterPack, monsterPack];
  const campaign = app.campaigns[0];
  campaign.packRefs = [packKey(monsterPack)];
  const pin = newTool("reference");
  if (pin.kind !== "reference") throw new Error("fixture");
  pin.target = packTarget(starterPack, "class/berserker");
  campaign.tools.push(pin);
  const next = migrateApp({ ...app, version: 14 });
  expect(next.packs).toEqual(officialPacks);
  expect(next.campaigns[0].packRefs).toEqual([packKey(gmgPack)]);
  expect(next.campaigns[0].tools.at(-1)).toMatchObject({
    target: packTarget(heroesPack, "class/berserker"),
  });
  expect(migrateApp(next)).toEqual(next);
});
function predecessor(pack: ContentPack): ContentPack {
  // An old bundled pack needs only a representative record to exercise identity
  // replacement. No network or generated scratch files are test dependencies.
  return {
    ...pack,
    version: oldRevision,
    records: [{ ...pack.records[0], related: [] }],
    terms: [],
    assets: {},
  };
}
function oldWorkspace() {
  const app = newApp();
  app.packs = [predecessor(starterPack), predecessor(monsterPack)];
  const campaign = app.campaigns[0];
  campaign.packRefs = app.packs.map(packKey);
  const target = packTarget(app.packs[0], "rule/initiative");
  const note = newTool("note"),
    pin = newTool("reference");
  if (note.kind !== "note" || pin.kind !== "reference")
    throw new Error("fixture");
  note.body = referenceMarkdown("Initiative", target);
  pin.target = target;
  campaign.tools.push(note, pin);
  campaign.content.push({
    ...starterPack.records[0],
    id: "edited-rule",
    body: "My campaign edit",
    origin: target,
  });
  const tracker = campaign.tools.find((t) => t.kind === "initiative")!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  const monster = monsterPack.records.find((r) => r.title === "Goblin")!;
  tracker.run = addMonsterToRun(tracker.run, {
    ...monster,
    target: packTarget(app.packs[1], monster.id),
  });
  tracker.run.combatants[0].hp = 2;
  tracker.history = [structuredClone(tracker.run)];
  return { ...app, version: 13 };
}

it("bundles every official seed category, rules/FAQs, all spell schools and official-source items", () => {
  const app = newApp(),
    all = entries(app.campaigns[0], app.packs);
  const counts = Object.fromEntries(
    [...new Set(all.map((r) => r.kind))].map((kind) => [
      kind,
      all.filter((r) => r.kind === kind).length,
    ]),
  );
  expect(counts).toEqual({
    rule: 136,
    spell: 99,
    faq: 18,
    class: 12,
    subclass: 28,
    ancestry: 27,
    background: 31,
    table: 3,
    item: 89,
    monster: 101,
  });
  expect(all).toHaveLength(544);
  expect(inventory.inventory.map((i) => i.file).sort()).toEqual(
    [
      "core/ancestries",
      "core/backgrounds",
      "core/equipment-tables",
      "core/spell-schools",
      "gmg/bestiary",
      "heroes/classes",
      "heroes/story-subclasses",
      "heroes/subclasses",
      "other/hexbinder-class",
      "other/hexbinder-spells",
      "other/hexbinder-subclasses",
    ]
      .map((f) => `data/official/${f}.json`)
      .sort(),
  );
  for (const file of inventory.inventory) {
    expect(file.sha256).toMatch(/^[a-f0-9]{64}$/);
    for (const id of file.ids)
      expect(
        all.some((r) => r.id === id),
        `${file.file}: ${id}`,
      ).toBe(true);
  }
  expect(itemSnapshot.items).toHaveLength(12);
  for (const item of itemSnapshot.items) {
    const record = starterPack.records.find(
      (r) => r.id === `item/nexus/${item.id}`,
    )!;
    expect(record.body).toBe(item.description);
    expect(record.fields.moreInfo).toBe(item.moreInfo);
    expect(record.sources).toEqual([{ book: item.source.name }]);
    expect(record.fields.upstream).toMatchObject({
      source: item.source,
      contributor: item.contributor,
    });
  }
  expect(
    all.filter(
      (r) => r.kind === "spell" && r.fields.school === "Hexbinder Spells",
    ),
  ).toHaveLength(9);
  for (const title of [
    "Omenrime",
    "Vigor Mortis",
    "Celestial Legion",
    "Echoburst",
  ])
    expect(all.some((r) => r.title === title)).toBe(true);
});

it("preserves complete character progression, choice lists, parent links and every equipment row", () => {
  for (const record of starterPack.records.filter((r) =>
    ["class", "subclass"].includes(r.kind),
  )) {
    const levels = record.fields.levels as {
      level: number;
      abilities: { name: string; description: string }[];
    }[];
    if (record.kind === "class")
      expect(levels.map((l) => l.level)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      );
    for (const level of levels) {
      expect(record.body).toContain(`Level ${level.level}`);
      for (const ability of level.abilities ?? []) {
        expect(record.body).toContain(ability.name);
        expect(record.body).toContain(
          ability.description.replace(/\{\{dice:([^}]+)\}\}/g, "[$1](roll:$1)"),
        );
      }
    }
    if (record.kind === "subclass") {
      const parent = starterPack.records.find(
        (r) => r.id === record.related[0],
      )!;
      expect(parent.kind).toBe("class");
      expect(parent.related).toContain(record.id);
      expect(record.body).toContain(
        referenceMarkdown(parent.title, packTarget(starterPack, parent.id)),
      );
    }
  }
  const berserker = starterPack.records.find(
    (r) => r.id === "class/berserker",
  )!;
  expect(berserker.body).toContain("Death Blow");
  expect(berserker.body).toContain("BOUNDLESS RAGE");
  let rows = 0;
  for (const table of starterPack.records.filter((r) => r.kind === "table")) {
    const subtables = table.fields.subtables as {
      rows: { cells: Record<string, string> }[];
    }[];
    const tableRows = subtables.flatMap((s) => s.rows);
    expect(table.related).toHaveLength(tableRows.length);
    for (const row of tableRows)
      for (const value of Object.values(row.cells))
        expect(table.body).toContain(
          value.replaceAll("|", "\\|").replaceAll("\n", " "),
        );
    rows += tableRows.length;
  }
  expect(rows).toBe(77);
  const dagger = starterPack.records.find((r) => r.title === "Dagger")!;
  expect(dagger.fields).toMatchObject({
    damage: "1d4+DEX piercing",
    price: { amount: 3, currency: "gp" },
  });
  expect(dagger.sources).toEqual([{ book: "Core Rules 3.0" }]);
});

it("bundles supplementary live definitions with full statblocks, attribution and per-hero HP", () => {
  const app = newApp(),
    all = entries(app.campaigns[0], app.packs);
  expect(supplement.records).toHaveLength(25);
  for (const source of supplement.records) {
    const record = all.find(
      (entry) =>
        entry.title === source.name &&
        entry.id.endsWith(`/nexus/${source.document.data.id}`),
    )!;
    expect(record.sources).toEqual([{ book: source.source.name }]);
    expect(record.fields.upstream).toMatchObject({
      source: source.source,
      contributor: source.contributor,
      liveSnapshot: true,
    });
    const portable = exportRecords([recordSchema.parse(record)], "slate").value;
    expect(parseExchange(JSON.stringify(portable)).records[0].fields).toEqual(
      record.fields,
    );
  }
  const scorpion = all.find(
    (entry) => entry.title === "Heytet-Seqat, Scorpion Queen",
  )!;
  expect(scorpion.fields.hp).toBeUndefined();
  expect(scorpion.fields.hpPerHero).toBe(64);
  expect(
    addMonsterToRun(
      newApp().campaigns[0].tools.find((t) => t.kind === "initiative")!.run,
      scorpion,
      4,
    ).combatants[0],
  ).toMatchObject({ hp: 256, maxHp: 256 });
  const imported = parseExchange(
    JSON.stringify({
      data: {
        type: "monsters",
        id: "unnamed",
        attributes: {
          name: "Unnamed ability test",
          hp: 10,
          level: 1,
          abilities: [
            { name: "", description: "Always alert." },
            { name: "", description: "" },
          ],
          actions: [],
        },
      },
    }),
  ).records[0];
  expect(imported.body).toContain("Always alert.");
  expect(imported.body).not.toMatch(/^###\s*$/m);
  expect(
    (
      imported.fields.exchange as {
        resource: { attributes: { abilities: unknown[] } };
      }
    ).resource.attributes.abilities,
  ).toHaveLength(2);
});

it("imports and exchanges new definition kinds with structured source fields intact", () => {
  for (const [kind, type] of Object.entries({
    class: "classes",
    subclass: "subclasses",
    ancestry: "ancestries",
    background: "backgrounds",
    table: "random-tables",
  })) {
    const record = starterPack.records.find((r) => r.kind === kind)!;
    const { upstream, ...attributes } = record.fields;
    const source = (upstream as { source: unknown }).source;
    const imported = parseExchange(
      JSON.stringify({ data: [{ type, attributes }], source }),
    ).records[0];
    expect(imported.kind).toBe(kind);
    expect(imported.sources).toEqual(record.sources);
    const exported = exportRecords([imported], "nexus").value as {
      data: { attributes: unknown }[];
    };
    expect(exported.data[0].attributes).toEqual(attributes);
    const slate = exportRecords([imported], "slate");
    expect(parseExchange(JSON.stringify(slate.value)).records).toEqual([
      imported,
    ]);
  }
  expect(
    renderOfficialTable({
      subtables: [
        {
          title: "Odd table",
          columns: [{ id: "a", name: "A|B" }],
          rows: [{ cells: { a: "one|two\nthree" } }],
        },
      ],
    }),
  ).toContain("| one\\|two three |");
});

it("upgrades existing campaigns, pins, notes, edited copies and combat undo without changing game state", () => {
  const old = oldWorkspace(),
    next = migrateApp(old);
  expect(next.packs).toEqual(officialPacks);
  expect(next.campaigns[0].screens).toEqual(old.campaigns[0].screens);
  expect(next.campaigns[0].content[0]).toMatchObject({
    body: "My campaign edit",
    origin: packTarget(coreRulesPack, "rule/initiative"),
  });
  const all = entries(next.campaigns[0], next.packs);
  const pin = next.campaigns[0].tools.find((t) => t.kind === "reference")!;
  if (pin.kind !== "reference") throw new Error("fixture");
  expect(resolveEntry(all, pin.target)?.title).toBe("Initiative");
  const note = next.campaigns[0].tools.find((t) => t.kind === "note")!;
  expect(note.kind === "note" && note.body).toBe(
    referenceMarkdown("Initiative", pin.target),
  );
  const tracker = next.campaigns[0].tools.find((t) => t.kind === "initiative")!;
  if (tracker.kind !== "initiative") throw new Error("fixture");
  expect(tracker.run.combatants[0].hp).toBe(2);
  expect(tracker.history[0]).toEqual(tracker.run);
  expect(JSON.stringify(tracker)).not.toContain(oldRevision);
  expect(migrateApp(next)).toEqual(next);
  old.campaigns[0].packRefs = [];
  old.packs.push(
    ...Array.from({ length: 18 }, (_, i) => ({
      ...predecessor(starterPack),
      id: `custom-${i}`,
      version: "1",
    })),
  );
  const full = migrateApp(old);
  expect(full.packs).toHaveLength(21);
  expect(full.packs.slice(3)).toEqual(old.packs.slice(2));
  expect(full.campaigns[0].packRefs).toEqual([]);
});

it("upgrades a checksummed legacy campaign ZIP after validation, preserving campaign edits", async () => {
  const old = oldWorkspace();
  const files = unzipSync(
    await encodeBackup({
      campaign: old.campaigns[0],
      packs: old.packs,
      assets: [],
    }),
  );
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  files["manifest.json"] = strToU8(
    JSON.stringify({ ...manifest, schemaVersion: 13 }),
  );
  const restored = await decodeBackup(zipSync(files));
  expect(restored.packs).toEqual(officialPacks);
  expect(restored.campaign.content[0].body).toBe("My campaign edit");
  expect(restored.campaign.packRefs).toEqual(officialPacks.map(packKey));
  files["packs.json"] = strToU8("[]");
  await expect(decodeBackup(zipSync(files))).rejects.toThrow("checksum");
  expect(manifest.packsSha256).toBe(
    await digest(strToU8(JSON.stringify(old.packs))),
  );
});

it("persists the browser upgrade once and retains the original version in a recovery point", async () => {
  const name = crypto.randomUUID(),
    old = oldWorkspace();
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 3);
    req.onupgradeneeded = () => {
      for (const store of ["state", "packs", "assets", "recovery"])
        req.result.createObjectStore(store);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["state", "packs"], "readwrite");
    tx.objectStore("state").put({ ...old, packs: [] }, "app");
    for (const pack of old.packs)
      tx.objectStore("packs").put(pack, packKey(pack));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  const repo = await Repository.open(name);
  try {
    const upgraded: AppData = await repo.load();
    expect(upgraded.version).toBe(17);
    expect(upgraded.packs).toHaveLength(3);
    expect(entries(upgraded.campaigns[0], upgraded.packs)).toHaveLength(546); // Bundled entries, edited rule and note.
    const points = await repo.recoveryPoints();
    expect(points).toHaveLength(1);
    expect(points[0].data).toMatchObject({ version: 13 });
    const reloaded = await repo.load();
    expect(reloaded.campaigns).toEqual(upgraded.campaigns);
    expect(reloaded.revision).toBe(upgraded.revision);
    expect(reloaded.packs.map(packKey).sort()).toEqual(
      upgraded.packs.map(packKey).sort(),
    );
    expect(await repo.recoveryPoints()).toHaveLength(1);
  } finally {
    repo.close();
  }
});
