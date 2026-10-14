import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import {
  catalogSchema,
  fetchCatalog,
  fetchCatalogPack,
  boundedDownload,
} from "./pack-catalog";
import {
  packSchema,
  packKey,
  packTarget,
  readTarget,
  recordSchema,
} from "./content-schema";
import { digest, encodeBackup, decodeBackup } from "./backup";
import { newApp } from "./model";
import { entries, resolveEntry, searchContent, contentKind } from "./content";
import { exportRecords } from "./exchange";
import { inspectEncounter } from "./encounters";
import {
  installContentImportPack,
  prepareContentImport,
} from "./content-import";
import { addMonsterToRun } from "./monsters";
import { newRun } from "./model";

const raw = readFileSync(
  new URL(
    "../public/content-packs/srd-5-2024-5.2.1.2.slate-content.json",
    import.meta.url,
  ),
);
const pack = packSchema.parse(JSON.parse(raw.toString()));
const catalog = catalogSchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../public/content-packs/catalog.json", import.meta.url),
      "utf8",
    ),
  ),
);
const entry = {
  ...catalog.packs[0],
  url: "https://slate.test/content-packs/" + catalog.packs[0].url,
};
const signal = () => new AbortController().signal;
const fetcher = (body: Uint8Array | string, status = 200) =>
  vi.fn<typeof fetch>(
    async () =>
      new Response(body as BodyInit, {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );

it("ships a complete, attributed reference library separately from the initial campaign", async () => {
  expect(pack).toMatchObject({
    system: "dnd-5e-2024",
    referenceOnly: true,
    records: expect.any(Array),
  });
  expect(pack.records).toHaveLength(1309);
  expect(raw.length).toBe(entry.bytes);
  expect(await digest(raw)).toBe(entry.sha256);
  expect(pack.source.license).toContain(
    "Creative Commons Attribution 4.0 International License",
  );
  expect(pack.source.license).toContain("Markdown conversion by your5e");
  for (const [kind, count] of [
    ["spell", 339],
    ["class", 12],
    ["subclass", 12],
    ["background", 4],
    ["ancestry", 9],
  ] as const)
    expect(pack.records.filter((r) => r.kind === kind)).toHaveLength(count);
  const fireball = pack.records.find((r) => r.title === "Fireball")!;
  expect(fireball.fields).toMatchObject({
    level: 3,
    school: "Evocation",
    range: "150 feet",
    castingTime: "Action",
  });
  expect(fireball.body).toContain("8d6 Fire damage");
  expect(
    pack.records.find((r) => r.title === "Bag of Holding")?.fields.rarity,
  ).toBe("uncommon");
  const aboleth = pack.records.find((r) => r.title === "Aboleth")!;
  expect(aboleth).toMatchObject({
    kind: "monster",
    category: "Monsters",
    fields: { referenceType: "monster", referenceOnly: true },
  });
  expect(aboleth.body).toContain("**AC** 17");
  expect(aboleth.body).toContain("Legendary Actions");
  expect(() =>
    addMonsterToRun(newRun(), {
      ...aboleth,
      target: packTarget(pack, aboleth.id),
      pack,
    }),
  ).toThrow("Reference-only monsters cannot be added");
  expect(pack.records.filter((r) => r.kind === "monster")).toHaveLength(330);
  expect(
    recordSchema.safeParse({ ...aboleth, fields: { system: "dnd-5e-2024" } })
      .success,
  ).toBe(false);
  expect(
    recordSchema.safeParse({ ...aboleth, fields: { referenceOnly: true } })
      .success,
  ).toBe(false);
  for (const format of ["nexus", "nimbrew"] as const)
    expect(() => exportRecords([aboleth], format)).toThrow(
      "Reference-only monsters require Slate",
    );
  expect(exportRecords([aboleth], "slate").value).toMatchObject({
    records: [{ kind: "monster", fields: { referenceOnly: true } }],
  });
  expect(
    pack.records.find((r) => r.title === "Path of the Berserker")?.related,
  ).toContain("classes/barbarian/barbarian");
  const app = newApp();
  expect(app.packs.some((p) => p.id === pack.id)).toBe(false);
  expect(app.campaigns[0].packRefs).not.toContain(packKey(pack));
  const all = entries(app.campaigns[0], [pack]).concat(
    pack.records.map((r) => ({ ...r, target: packTarget(pack, r.id), pack })),
  );
  for (const record of pack.records) {
    expect(record.body).not.toContain("\ufffd");
    for (const match of record.body.matchAll(/\]\((slate:[^\s)]+)\)/g))
      expect(resolveEntry(all, readTarget(match[1])!)).toBeDefined();
  }
});

it("classifies installed first-version SRD monsters without rewriting immutable pack data or importing Nimble stats", () => {
  const legacy = packSchema.parse(
    JSON.parse(
      readFileSync(
        new URL(
          "../public/content-packs/srd-5-2024-5.2.1.1.slate-content.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
  const campaign = { ...newApp().campaigns[0], packRefs: [packKey(legacy)] };
  const all = entries(campaign, [legacy]);
  const monster = searchContent(all, "Aboleth", "monster").find(
    (r) => r.title === "Aboleth",
  )!;
  expect(monster).toBeDefined();
  expect(contentKind(monster)).toBe("monster");
  expect(monster.target).toBe(packTarget(legacy, "monsters/aboleth"));
  expect(
    searchContent(all, "Aboleth", "rule").some(
      (r) => r.target === monster.target,
    ),
  ).toBe(false);
  expect(legacy.records.find((r) => r.id === monster.id)?.kind).toBe("rule");
  expect(() => addMonsterToRun(newRun(), monster)).toThrow(
    "Reference-only monsters",
  );
  const encounter = {
    ...monster,
    kind: "encounter" as const,
    fields: {
      entries: [
        {
          id: "one",
          target: monster.target,
          name: monster.title,
          quantity: 1,
          isPerHero: false,
        },
      ],
    },
  };
  expect(inspectEncounter(encounter, all, 4)[0]).toMatchObject({
    missing: true,
    stats: undefined,
  });
});

it("installs only by choice, scopes enabled content to a campaign, and preserves its identity in backups and copies", async () => {
  const app = newApp();
  app.campaigns.push({ ...structuredClone(app.campaigns[0]), id: "other" });
  const installed = installContentImportPack(app, app.campaigns[0].id, pack);
  expect(installed.campaigns[0].packRefs).toContain(packKey(pack));
  expect(installed.campaigns[1].packRefs).not.toContain(packKey(pack));
  expect(app.packs.some((p) => p.id === pack.id)).toBe(false);
  const backup = await encodeBackup({
    campaign: installed.campaigns[0],
    packs: installed.packs,
    assets: [],
  });
  const restored = await decodeBackup(backup);
  expect(restored.packs?.find((p) => p.id === pack.id)).toEqual(pack);
  const copies = await prepareContentImport(raw.toString());
  const subclass = copies.records.find(
    (r) => r.title === "Path of the Berserker",
  )!;
  const parent = copies.records.find((r) => r.title === "Barbarian")!;
  expect(subclass.related).toContain(`local::${parent.id}`);
  expect(parent.fields.system).toBe("dnd-5e-2024");
});

it("downloads and validates catalog entries and exact pack bytes before returning any content", async () => {
  const download = fetcher(JSON.stringify(catalog));
  const result = await fetchCatalog(
    "https://slate.test/content-packs/catalog.json",
    signal(),
    download,
  );
  expect(result[0].url).toBe(entry.url);
  expect(download.mock.calls[0][1]).toMatchObject({
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
  });
  expect(await fetchCatalogPack(result[0], signal(), fetcher(raw))).toEqual(
    pack,
  );
});

it("rejects corrupted, mismatched, oversized and cross-origin downloads without installing", async () => {
  await expect(
    fetchCatalogPack(entry, signal(), fetcher(raw.subarray(0, raw.length - 1))),
  ).rejects.toThrow("integrity check");
  await expect(
    fetchCatalogPack({ ...entry, records: 1 }, signal(), fetcher(raw)),
  ).rejects.toThrow("does not match");
  await expect(
    fetchCatalogPack(entry, signal(), fetcher("missing", 404)),
  ).rejects.toThrow("404");
  const malicious = structuredClone(catalog);
  malicious.packs[0].url = "https://elsewhere.test/pack.json";
  await expect(
    fetchCatalog(
      "https://slate.test/content-packs/catalog.json",
      signal(),
      fetcher(JSON.stringify(malicious)),
    ),
  ).rejects.toThrow("same content-pack server");
  await expect(
    fetchCatalog("http://unsafe.test/catalog.json", signal(), fetcher("{}")),
  ).rejects.toThrow("HTTPS");
  await expect(
    boundedDownload(entry.url, 3, signal(), fetcher("four")),
  ).rejects.toThrow("size limit");
  const active = new AbortController();
  active.abort();
  await expect(
    fetchCatalogPack(entry, active.signal, fetcher(raw)),
  ).rejects.toThrow();
});
