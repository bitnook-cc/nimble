import { expect, it, vi } from "vitest";
import { fetchNexusImport, nexusLink } from "./nexus-import";
import {
  prepareContentImport,
  contentImportPack,
  installContentImportPack,
} from "./content-import";
import { applyExchange, exportRecords, parseExchange } from "./exchange";
import { entries, contentKind, searchContent } from "./content";
import { inspectEncounter } from "./encounters";
import { newApp, appSchema } from "./model";
import {
  blankDefinition,
  generatorRecord,
  exportGeneratorPack,
} from "./generator-content";
import { generatorDefinitionSchema } from "@nimble/generators";
import { nexusPlatform, nexusCredit } from "./nexus-attribution";
import {
  packKey,
  packTarget,
  referenceMarkdown,
  type ContentPack,
} from "./content-schema";

const monster = {
  type: "monsters",
  id: "guard",
  attributes: {
    name: "Nexus guard",
    hp: 20,
    level: "1/2",
    armor: "medium",
    abilities: [],
    actions: [{ name: "Spear", damage: { roll: "1d6+2" } }],
  },
  relationships: {
    families: { data: [{ type: "families", id: "soldiers" }] },
    creator: { data: { type: "users", id: "author" } },
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
const author = {
  type: "users",
  id: "author",
  attributes: { displayName: "Test creator" },
  relationships: {
    monsters: { data: [{ type: "monsters", id: "unrelated" }] },
  },
};
const item = {
  type: "items",
  id: "lantern",
  attributes: {
    name: "Nexus lantern",
    kind: "Wondrous",
    rarity: "rare",
    description: "Silver light.",
  },
};
const encounter = {
  type: "encounters",
  id: "gate",
  attributes: { name: "Nexus gate", heroCount: 4, heroLevel: 2 },
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
const mini = {
  ...monster,
  attributes: { name: "Nexus guard", hp: 20, level: "1/2" },
};
function api(documents: Record<string, unknown>) {
  return vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname.replace("/api/", "");
    return new Response(
      JSON.stringify(documents[path] ?? { error: "missing" }),
      {
        status: documents[path] ? 200 : 404,
        headers: { "Content-Type": "application/vnd.api+json" },
      },
    );
  });
}
const documents = {
  "encounters/gate": { data: encounter, included: [mini] },
  "monsters/guard": { data: monster, included: [family] },
  "users/author": { data: author },
  "items/lantern": { data: item },
};

it("imports hazard links through the monster API without inventing HP or losing the hazard on export", async () => {
  const hazard = {
    type: "monsters",
    id: "falling-stones",
    attributes: {
      name: "Falling stones",
      hazard: true,
      level: "3",
      abilities: [
        { name: "Warning", description: "Dust falls from the ceiling." },
      ],
      actions: [
        {
          name: "Collapse",
          description: "Dodge the debris.",
          damage: { roll: "2d6" },
        },
      ],
    },
  };
  expect(nexusLink("https://nimble.nexus/hazards/falling-stones")).toEqual({
    type: "monsters",
    id: hazard.id,
    url: "https://nimble.nexus/hazards/falling-stones",
  });
  const fetcher = api({ "monsters/falling-stones": { data: hazard } });
  const preview = await fetchNexusImport(
    "https://nimble.nexus/hazards/falling-stones",
    [],
    undefined,
    fetcher,
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(String(fetcher.mock.calls[0][0])).toContain(
    "/api/monsters/falling-stones",
  );
  const record = preview.records[0];
  expect(record).toMatchObject({
    kind: "monster",
    fields: { hazard: true, level: "3" },
  });
  expect(record.fields.hp).toBeUndefined();
  expect(record.fields.nexus).toMatchObject({
    url: "https://nimble.nexus/hazards/falling-stones",
  });
  expect(record.body).toContain("Dust falls from the ceiling.");
  expect(record.body).toContain("roll:2d6");
  const app = newApp();
  const campaign = applyExchange(app.campaigns[0], preview.records, "skip");
  const all = entries(campaign, app.packs);
  const found = searchContent(all, "Falling stones", "hazard");
  expect(found).toHaveLength(1);
  expect(contentKind(found[0])).toBe("hazard");
  expect(searchContent(all, "Falling stones", "monster")).toEqual(found);
  const exported = exportRecords(preview.records, "nexus").value;
  const restored = parseExchange(JSON.stringify(exported)).records[0];
  expect(restored.fields.exchange).toMatchObject({
    resource: { ...hazard, attributes: { ...hazard.attributes, level: 3 } },
  });
  expect(restored.fields.hazard).toBe(true);
  expect(restored.fields.hp).toBeUndefined();
});

it("accepts canonical, readable, legacy and API links without trusting other origins", () => {
  const id = "2pmns04a9n8brtjcfx0s462hzt";
  expect(
    nexusLink(
      ` https://nimble.nexus/monsters/magma-hound-${id}?tab=json#actions `,
    ),
  ).toEqual({
    type: "monsters",
    id,
    url: `https://nimble.nexus/monsters/${id}`,
  });
  expect(nexusLink("https://nimble.monster/m/guard").type).toBe("monsters");
  expect(nexusLink("https://nimble.nexus/api/items/lantern").id).toBe(
    "lantern",
  );
  for (const link of [
    "https://evil.test/items/a",
    "https://nimble.nexus.evil.test/items/a",
    "http://nimble.nexus/items/a",
    "https://user@nimble.nexus/items/a",
    "https://nimble.nexus:8080/items/a",
    "https://nimble.nexus/monsters",
    "https://nimble.nexus/rules/combat",
    "https://nimble.nexus/items/%zz",
  ])
    expect(() => nexusLink(link)).toThrow();
});
it("upgrades encounter mini-statblocks, shares families, preserves quantity and author, and does not crawl a creator's catalog", async () => {
  const fetcher = api(documents);
  const preview = await fetchNexusImport(
    "https://nimble.nexus/encounters/gate",
    [],
    undefined,
    fetcher,
  );
  expect(preview.records.map((r) => r.kind)).toEqual(["encounter", "monster"]);
  const guard = preview.records.find((r) => r.kind === "monster")!;
  expect(guard.body).toContain("Shield wall");
  expect(guard.body).toContain("roll:1d6%2B2");
  expect(guard.fields.incomplete).toBe(false);
  expect(guard.fields.nexus).toMatchObject({
    creator: "Test creator",
    url: "https://nimble.nexus/monsters/guard",
    platform: nexusPlatform,
  });
  expect(guard.sources).toContainEqual({ book: "Nimble Nexus · Test creator" });
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    credentials: "omit",
    redirect: "error",
    headers: { Accept: "application/vnd.api+json" },
  });
  const app = newApp();
  const original = structuredClone(app);
  const packaged = contentImportPack(preview, "Gate pack").value;
  expect(app).toEqual(original);
  expect(packaged.source.url).toBe(preview.sourceUrl);
  expect(packaged.source.license).toContain(nexusCredit);
  const roundTrip = await prepareContentImport(
    JSON.stringify(exportRecords(preview.records, "slate").value),
  );
  expect(
    roundTrip.records.find((record) => record.kind === "monster")?.fields.nexus,
  ).toMatchObject({ platform: nexusPlatform, creator: "Test creator" });
  const saved = installContentImportPack(app, app.campaigns[0].id, packaged);
  const all = entries(saved.campaigns[0], saved.packs);
  const gate = all.find((e) => e.title === "Nexus gate")!;
  const rows = inspectEncounter(gate, all, 5);
  expect(rows[0]).toMatchObject({
    count: 3,
    missing: false,
    heroesPerMonster: 2,
  });
  expect(rows[0].target).toBe(packTarget(packaged, guard.id));
});

it("credits the Nexus platform for JSON file imports without treating its developer as each item's author", async () => {
  const preview = await prepareContentImport(JSON.stringify({ data: item }));
  expect(preview.records[0].fields.nexus).toEqual({ platform: nexusPlatform });
  expect(preview.records[0].sources).not.toContainEqual({
    book: "Nimble Nexus · byteslicer",
  });
  const exported = contentImportPack(preview, "Lanterns").value;
  expect(exported.source).toMatchObject({ url: nexusPlatform.url });
  expect(exported.source.license).toContain(nexusCredit);
});
it("imports collection monsters and items and resolves missing family dependencies once", async () => {
  const collection = {
    type: "collections",
    id: "mixed",
    attributes: { name: "Mixed pack" },
    relationships: {
      monsters: { data: [{ type: "monsters", id: "guard" }] },
      items: { data: [{ type: "items", id: "lantern" }] },
    },
  };
  const fetcher = api({
    ...documents,
    "collections/mixed": { data: collection, included: [monster, item] },
    "families/soldiers": { data: family },
  });
  const preview = await fetchNexusImport(
    "https://nimble.nexus/collections/mixed",
    [],
    undefined,
    fetcher,
  );
  expect(preview.name).toBe("Mixed pack");
  expect(preview.records.map((r) => r.title)).toEqual([
    "Nexus guard",
    "Nexus lantern",
  ]);
  expect(fetcher).toHaveBeenCalledTimes(3);
});
it("rejects inaccessible dependencies, incomplete statblocks and mismatched response IDs", async () => {
  await expect(
    fetchNexusImport(
      "https://nimble.nexus/encounters/gate",
      [],
      undefined,
      api({ "encounters/gate": documents["encounters/gate"] }),
    ),
  ).rejects.toThrow("missing or private");
  await expect(
    fetchNexusImport(
      "https://nimble.nexus/monsters/guard",
      [],
      undefined,
      api({ "monsters/guard": { data: { ...monster, id: "other" } } }),
    ),
  ).rejects.toThrow("unexpected content");
  await expect(
    fetchNexusImport(
      "https://nimble.nexus/monsters/guard",
      [],
      undefined,
      api({
        "monsters/guard": { data: mini },
        "families/soldiers": { data: family },
        "users/author": { data: author },
      }),
    ),
  ).rejects.toThrow("required statblocks");
});
it("rejects oversized and non-JSON responses and obeys cancellation", async () => {
  const oversized = vi.fn<typeof fetch>(
    async () =>
      new Response(" ".repeat(8 * 1024 * 1024 + 1), {
        headers: { "Content-Type": "application/json" },
      }),
  );
  await expect(
    fetchNexusImport(
      "https://nimble.nexus/items/lantern",
      [],
      undefined,
      oversized,
    ),
  ).rejects.toThrow("exceeds 8 MiB");
  const html = vi.fn<typeof fetch>(
    async () =>
      new Response("<html>sign in</html>", {
        headers: { "Content-Type": "text/html" },
      }),
  );
  await expect(
    fetchNexusImport("https://nimble.nexus/items/lantern", [], undefined, html),
  ).rejects.toThrow("JSON document");
  const controller = new AbortController();
  controller.abort();
  const fetcher = api(documents);
  await expect(
    fetchNexusImport(
      "https://nimble.nexus/items/lantern",
      [],
      controller.signal,
      fetcher,
    ),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("copies pack files into editable campaign records with stable IDs, local links, assets and attribution", async () => {
  const records = parseExchange(
    JSON.stringify({
      data: encounter,
      included: [{ ...monster, relationships: undefined }],
    }),
  ).records;
  const pack = exportRecords(records, "pack", [], "Gate pack")
    .value as ContentPack;
  pack.records[0].body =
    referenceMarkdown("Guard", packTarget(pack, records[1].id)) +
    "\n\n![Map](map.png)";
  pack.assets["map.png"] = "data:image/png;base64,AAAA";
  pack.terms = [
    {
      term: "Gate alias",
      aliases: ["Secret gate"],
      target: records[0].id,
      preview: "",
    },
  ];
  pack.records[0].fields.annotations = records[1].id;
  const preview = await prepareContentImport(JSON.stringify(pack));
  expect(contentImportPack(preview, "Ignored").value).toEqual(pack);
  expect(preview.records[0].body).toContain(
    encodeURIComponent("local::" + preview.records[1].id),
  );
  expect(preview.records[0].fields.annotations).toBe(records[1].id);
  expect(preview.records[0].importedFrom).toMatchObject({
    name: "Gate pack",
    assets: pack.assets,
    source: { license: pack.source.license },
  });
  expect(preview.records[0].tags).toContain("Secret gate");
  const again = await prepareContentImport(JSON.stringify(pack));
  expect(again.records.map((r) => r.id)).toEqual(
    preview.records.map((r) => r.id),
  );
  const app = newApp();
  const campaign = applyExchange(app.campaigns[0], preview.records, "skip");
  const all = entries(campaign, app.packs);
  expect(
    inspectEncounter(
      all.find((e) => e.title === "Nexus gate")!,
      all,
      4,
    )[0].missing,
  ).toBe(false);
  expect(app.campaigns[0].content).toHaveLength(0);
  expect(appSchema.parse({ ...app, campaigns: [campaign] })).toBeDefined();
  const exportedCopy = exportRecords(
    preview.records,
    "pack",
    [],
    "Campaign copies",
  ).value;
  const restoredCopy = await prepareContentImport(JSON.stringify(exportedCopy));
  expect(restoredCopy.records[0].importedFrom).toEqual(
    preview.records[0].importedFrom,
  );
});
it("installs packs atomically and only enables them for the selected campaign", () => {
  const app = newApp();
  app.campaigns.push({ ...structuredClone(app.campaigns[0]), id: "second" });
  const preview = parseExchange(JSON.stringify({ data: item }));
  const pack = contentImportPack(preview, "Lanterns").value;
  const saved = installContentImportPack(app, app.campaigns[0].id, pack);
  expect(saved.campaigns[0].packRefs).toContain(packKey(pack));
  expect(saved.campaigns[1].packRefs).not.toContain(packKey(pack));
  expect(
    installContentImportPack(saved, app.campaigns[0].id, pack).packs,
  ).toHaveLength(saved.packs.length);
  expect(() =>
    installContentImportPack(saved, app.campaigns[0].id, {
      ...pack,
      name: "Conflict",
    }),
  ).toThrow();
  expect(() => installContentImportPack(app, "deleted", pack)).toThrow(
    "no longer available",
  );
  expect(app.packs.some((p) => p.id === pack.id)).toBe(false);
});

it("retains strict NPC generator tables when copying packs into campaigns", async () => {
  const campaign = newApp().campaigns[0];
  campaign.content.push(
    generatorRecord("people", "Harbour people", blankDefinition()),
  );
  const pack = exportGeneratorPack(campaign, "people", "1", "Harbour pack");
  const preview = await prepareContentImport(JSON.stringify(pack));
  expect(generatorDefinitionSchema.parse(preview.records[0].fields)).toEqual(
    blankDefinition(),
  );
  expect(preview.records[0].importedFrom?.source).toEqual(pack.source);
  expect(contentImportPack(preview, "ignored").value).toEqual(pack);
});
