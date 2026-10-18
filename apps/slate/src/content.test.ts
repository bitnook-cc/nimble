import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import { strToU8, zipSync, unzipSync, strFromU8 } from "fflate";
import { newApp, newTool, appSchema, campaignSchema } from "./model";
import {
  appSchema as oldAppSchema,
  campaignSchema as oldCampaignSchema,
} from "./model-v3";
import { migrateApp } from "./migrations";
import {
  packKey,
  packTarget,
  parsePack,
  referenceMarkdown,
  mergePacks,
  type ContentPack,
} from "./content-schema";
import { starterPack, coreRulesPack, officialPacks } from "./starter-pack";
import {
  entries,
  searchContent,
  resolveEntry,
  backlinks,
  removeCampaignContent,
} from "./content";
import { Repository, AppStore } from "./storage";
import { decodeBackup, encodeBackup, digest } from "./backup";
import { copyCampaign } from "./campaigns";
import { newNote } from "./notes";
const repos: Repository[] = [];
it("deleting a note removes its widgets from screens, layout history and presets while preserving other references", () => {
  const campaign = newApp().campaigns[0],
    note = newTool("note"),
    pin = newTool("reference");
  if (note.kind !== "note" || pin.kind !== "reference")
    throw new Error("fixture");
  campaign.tools.push(note, pin);
  campaign.content.push(newNote(note.name, note.noteId));
  pin.target = `local::${note.noteId}`;
  const screen = campaign.screens[0];
  const widget = {
    ...screen.widgets[0],
    id: crypto.randomUUID(),
    toolId: note.id,
    kind: "note" as const,
  };
  // An alternate valid layout holds the note alone, including saved presets.
  const layout = { grid: screen.grid, widgets: [widget] };
  screen.undo.push(layout);
  screen.redo.push(layout);
  campaign.layoutPresets.push({
    id: crypto.randomUUID(),
    name: "Notes",
    ...layout,
    tools: [note],
  });
  campaign.content.push({
    ...extra.records[0],
    id: "linked",
    body: referenceMarkdown("Notes", pin.target),
  });
  const before = structuredClone(campaign);
  const result = campaignSchema.parse(
    removeCampaignContent(campaign, note.noteId),
  );
  expect(campaign).toEqual(before);
  expect(result.tools).not.toContainEqual(note);
  expect(result.tools).toContainEqual(pin);
  expect(result.screens[0].widgets).toEqual(before.screens[0].widgets);
  expect(result.screens[0].undo[0].widgets).toEqual([]);
  expect(result.screens[0].redo[0].widgets).toEqual([]);
  expect(result.layoutPresets[0].widgets).toEqual([]);
  expect(result.content[0].body).toBe(before.content[1].body);
});
afterEach(() => repos.splice(0).forEach((r) => r.close()));
const extra: ContentPack = {
  format: "slate-content",
  schemaVersion: 1,
  id: "test",
  version: "1",
  name: "Table rules",
  source: {
    url: "https://example.com",
    revision: "1",
    license: "Test fixture",
  },
  terms: [],
  assets: {},
  records: [
    {
      id: "rule/test",
      title: "Table rule",
      kind: "rule",
      body: "Always bring snacks.",
      tags: ["table"],
      category: "House rules",
      sources: [],
      related: [],
      fields: {},
    },
  ],
};
async function repo() {
  const r = await Repository.open(crypto.randomUUID());
  repos.push(r);
  return r;
}
it("migrates a genuine schema 3 state and ZIP without changing existing views or tools", async () => {
  const app = newApp(),
    c = app.campaigns[0];
  const oldC = oldCampaignSchema.parse({
    id: c.id,
    name: c.name,
    archivedAt: c.archivedAt,
    assets: c.assets,
    screens: c.screens.map((screen) => ({
      ...screen,
      grid: { ...screen.grid, cellHeight: 88 },
    })),
    activeScreenId: c.activeScreenId,
    tools: c.tools,
    layoutPresets: c.layoutPresets,
  });
  const old = oldAppSchema.parse({
    version: 3,
    revision: 9,
    appearance: app.appearance,
    palette: app.palette,
    activeCampaignId: c.id,
    campaigns: [oldC],
  });
  const next = migrateApp(old);
  expect(next.version).toBe(19);
  expect(next.campaigns[0].screens).toEqual(c.screens);
  expect(next.packs).toHaveLength(3);
  const bytes = strToU8(JSON.stringify(oldC));
  const zip = zipSync({
    "campaign.json": bytes,
    "manifest.json": strToU8(
      JSON.stringify({
        format: "slate-campaign",
        version: 1,
        schemaVersion: 3,
        createdAt: new Date().toISOString(),
        campaignId: c.id,
        campaignSha256: await digest(bytes),
        assets: [],
      }),
    ),
  });
  const restored = await decodeBackup(zip);
  expect(restored.campaign.tools).toEqual(c.tools);
  expect(restored.packs).toEqual(officialPacks);
});
it("installs pack data in the dedicated store and hydrates it without network access", async () => {
  const r = await repo(),
    data = await r.load();
  data.packs.push(extra);
  data.campaigns[0].packRefs.push(packKey(extra));
  await r.save(data, data.revision);
  const loaded = await r.load();
  expect(loaded.packs).toHaveLength(4);
  expect(
    resolveEntry(
      entries(loaded.campaigns[0], loaded.packs),
      packTarget(extra, "rule/test"),
    )?.body,
  ).toContain("snacks");
  const raw = await r.raw();
  expect(raw.packs).toHaveLength(4);
});
it("rejects pack replacement at the same version atomically", async () => {
  const r = await repo(),
    data = await r.load();
  const before = await r.raw();
  data.packs[0] = structuredClone(data.packs[0]);
  data.packs[0].records[0].body = "Changed";
  await expect(r.save(data, data.revision)).rejects.toThrow(
    "different content",
  );
  expect(await r.raw()).toEqual(before);
  expect(() =>
    mergePacks([extra], [{ ...extra, name: "Replacement" }]),
  ).toThrow();
});
it("restores non-bundled pack dependencies and custom links into a fresh campaign", async () => {
  const data = newApp(),
    c = data.campaigns[0],
    note = newTool("note");
  if (note.kind !== "note") throw new Error();
  const local = { ...extra.records[0], id: crypto.randomUUID() };
  c.content.push(local);
  const document = newNote(note.name, note.noteId);
  document.body =
    referenceMarkdown(local.title, "local::" + local.id) +
    " " +
    referenceMarkdown("Table rule", packTarget(extra, "rule/test"));
  c.tools.push(note);
  c.content.push(document);
  c.packRefs.push(packKey(extra));
  const decoded = await decodeBackup(
    await encodeBackup({
      campaign: c,
      assets: [],
      packs: [...officialPacks, extra],
    }),
  );
  const r = await repo(),
    store = new AppStore(async () => r);
  await store.init();
  await store.restore(decoded, "copy");
  const restored = store.getSnapshot().data!;
  const campaign = restored.campaigns.find(
    (x) => x.id === restored.activeCampaignId,
  )!;
  const body = campaign.content.find((r) => r.kind === "note")!;
  expect(body.body).toContain(
    encodeURIComponent("local::" + campaign.content[0].id).replaceAll(
      "%3A",
      ":",
    ),
  );
  expect(restored.packs.some((p) => p.id === "test")).toBe(true);
  expect((await r.bundle(campaign.id, restored.revision)).packs).toHaveLength(
    4,
  );
});
it("detects corrupted or missing pack backup data before mutation", async () => {
  const data = newApp(),
    bytes = await encodeBackup({ campaign: data.campaigns[0], assets: [] });
  const files = unzipSync(bytes);
  files["packs.json"] = strToU8("[]");
  await expect(decodeBackup(zipSync(files))).rejects.toThrow("checksum");
  const broken = structuredClone(extra);
  broken.terms = [
    { term: "Lost", aliases: [], target: "rule/missing", preview: "Lost" },
  ];
  expect(() => parsePack(JSON.stringify(broken))).toThrow();
  expect(() =>
    parsePack(
      JSON.stringify({
        ...extra,
        source: { ...extra.source, url: "javascript:alert(1)" },
      }),
    ),
  ).toThrow();
});
it("Nexus terms, section anchors, full text and typed spell data resolve locally", () => {
  const data = newApp(),
    all = entries(data.campaigns[0], data.packs);
  const blind = searchContent(all, "Blinded").find((e) =>
    e.target.endsWith("#blind"),
  );
  expect(blind?.title).toBe("Blind");
  expect(blind?.body).toContain("Blind");
  expect(
    resolveEntry(
      all,
      packTarget(coreRulesPack, "rule/conditions#not-a-section"),
    ),
  ).toBeUndefined();
  const spell = searchContent(all, "Flame Dart", "spell")[0];
  expect(spell.fields).toMatchObject({
    tier: 0,
    actions: 1,
    school: "Fire Spells",
  });
  const initiative = resolveEntry(
    all,
    packTarget(coreRulesPack, "rule/initiative"),
  )!;
  expect(initiative.sources[0]).toEqual({ book: "Core Rules v2", pages: [15] });
  expect(initiative.body).toContain("roll:1d20");
});
it("campaign copies remap local note links and pinned content while preserving pack identity", () => {
  const c = newApp().campaigns[0],
    note = newTool("note"),
    ref = newTool("reference");
  if (note.kind !== "note" || ref.kind !== "reference") throw new Error();
  const record = { ...extra.records[0], id: crypto.randomUUID() };
  c.content.push(record);
  c.content.push({
    ...newNote(note.name, note.noteId),
    body: referenceMarkdown(record.title, "local::" + record.id),
  });
  ref.target = "local::" + record.id;
  c.tools.push(note, ref);
  const copy = copyCampaign(c);
  expect(copy.packRefs).toEqual(c.packRefs);
  expect(copy.tools.find((t) => t.kind === "reference")).toMatchObject({
    target: "local::" + copy.content[0].id,
  });
  expect(
    backlinks(entries(copy, [starterPack]), "local::" + copy.content[0].id),
  ).toHaveLength(1);
  const renamed = {
    ...copy,
    content: copy.content.map((r) => ({ ...r, title: "Renamed" })),
  };
  expect(
    resolveEntry(
      entries(renamed, [starterPack]),
      "local::" + copy.content[0].id,
    )?.title,
  ).toBe("Renamed");
});
it("all bundled links point to installed records and images remain packaged", () => {
  const all = entries(newApp().campaigns[0], officialPacks);
  for (const r of all)
    for (const match of r.body.matchAll(/slate:([^\s)]+)/g)) {
      const target = decodeURIComponent(match[1]);
      expect(resolveEntry(all, target), `${r.title}: ${target}`).toBeDefined();
    }
  expect(Object.keys(starterPack.assets)).toHaveLength(6);
  expect(appSchema.parse(newApp()).version).toBe(19);
});
it("current backups identify their content dependency checksum", async () => {
  const c = newApp().campaigns[0],
    files = unzipSync(await encodeBackup({ campaign: c, assets: [] }));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  expect(manifest.schemaVersion).toBe(19);
  expect(manifest.packsSha256).toBe(await digest(files["packs.json"]));
});
