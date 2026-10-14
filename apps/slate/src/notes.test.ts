import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { addCampaignTool, newNote, updateNote } from "./notes";
import {
  appSchema,
  campaignSchema,
  newApp,
  newTool,
  SCHEMA_VERSION,
} from "./model";
import { migrateApp } from "./migrations";
import {
  entries,
  backlinks,
  removeCampaignContent,
  resolveEntry,
} from "./content";
import { referenceMarkdown, packKey } from "./content-schema";
import { copyCampaign } from "./campaigns";
import { decodeBackup, digest, encodeBackup } from "./backup";
import { applyExchange, exportRecords, parseExchange } from "./exchange";
import { prepareContentImport } from "./content-import";
import { Repository } from "./storage";
import { createScreen, editScreen, undoLayout, savePreset } from "./screens";

function legacy() {
  const app = newApp();
  const campaign = app.campaigns[0];
  const note = {
    id: "original-note",
    kind: "note" as const,
    name: "Greyhaven",
    body: "# Harbour\n\nThe Ashen Court owns the docks.",
    tags: ["location", "port"],
  };
  const second = {
    ...note,
    id: "other-note",
    name: "Ashen Court",
    body: referenceMarkdown("Harbour", "local::original-note#harbour"),
  };
  const widget = {
    ...campaign.screens[0].widgets[0],
    id: "note-widget",
    toolId: note.id,
    kind: "note" as const,
  };
  const layout = { grid: campaign.screens[0].grid, widgets: [widget] };
  return {
    ...app,
    version: 17,
    campaigns: [
      {
        ...campaign,
        tools: [...campaign.tools, note, second],
        screens: [
          {
            ...campaign.screens[0],
            widgets: [widget],
            undo: [layout],
            redo: [layout],
          },
        ],
        layoutPresets: [
          {
            id: "preset",
            name: "Notes",
            ...layout,
            tools: [{ id: note.id, kind: note.kind, name: note.name }],
          },
        ],
      },
    ],
  };
}

it("promotes legacy notes once, preserving IDs, content, links and all layouts without mutating the original", () => {
  const old = legacy(),
    original = structuredClone(old);
  const migrated = migrateApp(old);
  const campaign = migrated.campaigns[0];
  expect(old).toEqual(original);
  expect(migrated.version).toBe(SCHEMA_VERSION);
  expect(campaign.screens).toEqual(old.campaigns[0].screens);
  expect(campaign.layoutPresets).toEqual(old.campaigns[0].layoutPresets);
  expect(campaign.tools.find((tool) => tool.id === "original-note")).toEqual({
    id: "original-note",
    kind: "note",
    name: "Greyhaven",
    noteId: "original-note",
  });
  expect(
    campaign.content.find((record) => record.id === "original-note"),
  ).toMatchObject({
    kind: "note",
    title: "Greyhaven",
    tags: ["location", "port"],
    body: "# Harbour\n\nThe Ashen Court owns the docks.",
  });
  const all = entries(campaign, migrated.packs);
  expect(resolveEntry(all, "local::original-note#harbour")?.body).toContain(
    "owns the docks",
  );
  expect(
    backlinks(all, "local::original-note").map((entry) => entry.title),
  ).toEqual(["Ashen Court"]);
  expect(all.filter((entry) => entry.kind === "note")).toHaveLength(2);
  expect(migrateApp(migrated)).toEqual(migrated);
});

it("migrates a real schema 17 ZIP and stored state, retains a recovery point, and saves documents offline", async () => {
  const old = legacy(),
    campaignBytes = strToU8(JSON.stringify(old.campaigns[0])),
    packBytes = strToU8(JSON.stringify(old.packs));
  const restored = await decodeBackup(
    zipSync({
      "campaign.json": campaignBytes,
      "packs.json": packBytes,
      "manifest.json": strToU8(
        JSON.stringify({
          format: "slate-campaign",
          version: 1,
          schemaVersion: 17,
          createdAt: new Date().toISOString(),
          campaignId: old.campaigns[0].id,
          campaignSha256: await digest(campaignBytes),
          packsSha256: await digest(packBytes),
          assets: [],
        }),
      ),
    }),
  );
  expect(
    restored.campaign.content.filter((record) => record.kind === "note"),
  ).toHaveLength(2);
  const name = crypto.randomUUID(),
    repo = await Repository.open(name);
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
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
    const loaded = await repo.load();
    expect(loaded.campaigns[0]).toEqual(restored.campaign);
    expect((await repo.raw()).data).toMatchObject({ version: SCHEMA_VERSION });
    expect(await repo.recoveryPoints()).toHaveLength(1);
    loaded.campaigns[0] = updateNote(
      loaded.campaigns[0],
      "original-note",
      (note) => ({ ...note, body: "Updated offline" }),
    );
    await repo.save(loaded, loaded.revision);
    const bundle = await repo.bundle(
      loaded.activeCampaignId!,
      loaded.revision + 1,
    );
    const decoded = await decodeBackup(await encodeBackup(bundle));
    expect(
      decoded.campaign.content.find((record) => record.id === "original-note")
        ?.body,
    ).toBe("Updated offline");
  } finally {
    repo.close();
  }
});

it("creates independent documents, shares edits across note tools, and keeps notes through widget removal and layout undo", () => {
  const tool = newTool("note");
  if (tool.kind !== "note") throw new Error("fixture");
  let campaign = addCampaignTool(newApp().campaigns[0], tool);
  const second = { ...tool, id: "second-view" };
  campaign = addCampaignTool(campaign, second);
  expect(campaign.content).toHaveLength(1);
  campaign = updateNote(campaign, tool.noteId, (note) => ({
    ...note,
    title: "Greyhaven",
    body: "A quiet port",
    tags: ["location"],
  }));
  expect(
    campaign.tools
      .filter((tool) => tool.kind === "note")
      .every((tool) => tool.name === "Greyhaven"),
  ).toBe(true);
  expect(campaign.tools.find((t) => t.id === tool.id)).not.toHaveProperty(
    "body",
  );
  const screen = campaign.screens[0];
  campaign = editScreen(campaign, screen.id, (layout) => ({
    ...layout,
    widgets: [
      {
        id: "view",
        toolId: tool.id,
        kind: "note",
        x: 0,
        y: 0,
        w: 4,
        h: 4,
        title: "",
      },
    ],
  }));
  campaign = editScreen(campaign, screen.id, (layout) => ({
    ...layout,
    widgets: [],
  }));
  expect(
    entries(campaign, []).find((entry) => entry.id === tool.noteId)?.body,
  ).toBe("A quiet port");
  campaign = undoLayout(campaign, screen.id);
  expect(campaign.screens[0].widgets[0].toolId).toBe(tool.id);
  expect(() => campaignSchema.parse(campaign)).not.toThrow();
  const invalid = structuredClone(campaign);
  invalid.content = [];
  expect(() => campaignSchema.parse(invalid)).toThrow("missing note");
});

it("copies note identities and links together while presets create new independent blank notes", () => {
  const campaign = migrateApp(legacy()).campaigns[0],
    copy = copyCampaign(campaign);
  const note = copy.content.find((record) => record.title === "Greyhaven")!;
  expect(note.id).not.toBe("original-note");
  const view = copy.tools.find(
    (tool) => tool.kind === "note" && tool.name === note.title,
  )!;
  expect(view).toMatchObject({ noteId: note.id });
  expect(backlinks(entries(copy, []), `local::${note.id}`)).toHaveLength(1);
  expect(
    copy.content.find((record) => record.title === "Ashen Court")?.body,
  ).toContain(encodeURIComponent(`local::${note.id}#harbour`));
  const saved = savePreset(campaign, campaign.activeScreenId, "Note layout");
  const next = createScreen(
    saved,
    "Another screen",
    saved.layoutPresets.at(-1)!,
  );
  expect(next.content.filter((record) => record.kind === "note")).toHaveLength(
    3,
  );
  expect(next.content.at(-1)?.body).toBe("");
  expect(
    next.content.find((record) => record.id === "original-note")?.body,
  ).toContain("Ashen Court");
});

it("exports notes with their linked documents, installs them as a pack, and imports editable campaign copies", async () => {
  const source = migrateApp(legacy()).campaigns[0];
  const records = source.content;
  const exported = exportRecords(
    records,
    "pack",
    entries(source, []),
    "Greyhaven world",
  );
  const preview = await prepareContentImport(
    JSON.stringify(exported.value),
    [],
  );
  expect(preview.records.every((record) => record.kind === "note")).toBe(true);
  const imported = applyExchange(
    newApp().campaigns[0],
    preview.records,
    "skip",
  );
  expect(imported.tools.some((tool) => tool.kind === "note")).toBe(false);
  const target = imported.content.find(
    (record) => record.title === "Greyhaven",
  )!;
  expect(backlinks(entries(imported, []), `local::${target.id}`)).toHaveLength(
    1,
  );
  expect(
    parseExchange(JSON.stringify(exportRecords(records, "slate").value))
      .records,
  ).toEqual(records);
  expect(() => exportRecords(records, "nexus")).toThrow();
});

it("deleting a document removes every editing view from current and historical layouts, keeping other links intact", () => {
  let campaign = migrateApp(legacy()).campaigns[0];
  campaign.tools.push({
    id: "second-view",
    kind: "note",
    name: "Greyhaven",
    noteId: "original-note",
  });
  campaign.screens[0].widgets.push({
    ...campaign.screens[0].widgets[0],
    id: "second-widget",
    toolId: "second-view",
    x: 6,
  });
  campaign = removeCampaignContent(campaign, "original-note");
  expect(
    campaign.tools.some(
      (tool) => tool.kind === "note" && tool.noteId === "original-note",
    ),
  ).toBe(false);
  expect(campaign.screens[0].widgets).toHaveLength(0);
  expect(campaign.screens[0].undo[0].widgets).toHaveLength(0);
  expect(campaign.layoutPresets[0].widgets).toHaveLength(0);
  expect(campaign.content[0].body).toContain("original-note");
  expect(() => campaignSchema.parse(campaign)).not.toThrow();
});

it("rejects legacy ID collisions without discarding content, including at the old combined capacity", () => {
  const old = legacy();
  old.campaigns[0].content.push(
    newNote("Conflicting document", "original-note"),
  );
  const before = structuredClone(old);
  expect(() => migrateApp(old)).toThrow("conflicting content ID");
  expect(old).toEqual(before);
  const full = legacy();
  full.campaigns[0].content = Array.from({ length: 1000 }, (_, i) => ({
    ...newNote("Standalone", `existing-${i}`),
    kind: "rule" as const,
  }));
  full.campaigns[0].tools.push(
    ...Array.from({ length: 996 }, (_, i) => ({
      id: `legacy-${i}`,
      kind: "note" as const,
      name: "Notes",
      body: `Note ${i}`,
      tags: [],
    })),
  );
  expect(appSchema.parse(migrateApp(full)).campaigns[0].content).toHaveLength(
    1998,
  );
});

it("keeps valid legacy note IDs that were not constrained to content-pack keys", () => {
  const old = legacy();
  old.campaigns[0].tools.push({
    id: "session:old notes",
    kind: "note",
    name: "Old scratchpad",
    body: "Keep this.",
    tags: [],
  });
  expect(
    migrateApp(old).campaigns[0].content.find(
      (record) => record.id === "session:old notes",
    )?.body,
  ).toBe("Keep this.");
});
