import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { newCampaign, newApp, campaignSchema, v2CampaignSchema } from "./model";
import {
  builtInPresets,
  createScreen,
  duplicateScreen,
  editScreen,
  savePreset,
  undoLayout,
} from "./screens";
import { copyCampaign } from "./campaigns";
import { decodeBackup, digest, encodeBackup } from "./backup";
import { migrateApp, migrateCampaign } from "./migrations";
import { Repository } from "./storage";
const repos: Repository[] = [];
afterEach(() => repos.splice(0).forEach((r) => r.close()));
function v2Fixture() {
  const c = newCampaign("Old table");
  return v2CampaignSchema.parse({
    id: c.id,
    name: c.name,
    archivedAt: c.archivedAt,
    assets: c.assets,
    grid: c.screens[0].grid,
    widgets: c.screens[0].widgets,
    tools: c.tools,
  });
}
describe("screen migration and portability", () => {
  it("discards legacy minimization and pixel heights in screens, history and presets while preserving tool data", () => {
    const campaign = newCampaign("Old minimized widgets");
    const screen = campaign.screens[0];
    const minimized = screen.widgets.map((widget) => ({
      ...widget,
      collapsed: true,
    }));
    const oldGrid = { ...screen.grid, cellHeight: 160 };
    const old = {
      ...campaign,
      screens: [
        {
          ...screen,
          grid: oldGrid,
          widgets: minimized,
          undo: [{ grid: oldGrid, widgets: minimized }],
          redo: [{ grid: oldGrid, widgets: minimized }],
        },
      ],
      layoutPresets: [
        {
          id: "old-layout",
          name: "Old layout",
          grid: oldGrid,
          widgets: minimized,
          tools: campaign.tools.map(({ id, kind, name }) => ({
            id,
            kind,
            name,
          })),
        },
      ],
    };
    const restored = migrateCampaign(old, 5);
    expect(restored.screens[0].widgets).toEqual(screen.widgets);
    expect(restored.screens[0].undo[0].widgets).toEqual(screen.widgets);
    expect(restored.screens[0].redo[0].widgets).toEqual(screen.widgets);
    expect(restored.layoutPresets[0].widgets).toEqual(screen.widgets);
    expect(restored.tools).toEqual(campaign.tools);
    expect(restored.screens[0].grid).toEqual(screen.grid);
    expect(restored.screens[0].undo[0].grid).toEqual(screen.grid);
    expect(restored.screens[0].redo[0].grid).toEqual(screen.grid);
    expect(restored.layoutPresets[0].grid).toEqual(screen.grid);
  });
  it("moves the v2 layout into one stable screen without changing tool/widget IDs", () => {
    const old = v2Fixture();
    const next = migrateCampaign(old, 2);
    expect(next.screens).toHaveLength(1);
    expect(next.screens[0].id).toBe(next.activeScreenId);
    expect(next.screens[0]).toMatchObject({
      name: "Session screen",
      grid: old.grid,
      widgets: old.widgets,
      undo: [],
      redo: [],
    });
    expect(next.tools).toMatchObject(old.tools);
    expect(migrateCampaign(old, 2)).toEqual(next);
    expect(
      migrateApp({
        ...(({ packs, ...rest }) => {
          void packs;
          return rest;
        })(newApp()),
        version: 2,
        activeCampaignId: old.id,
        campaigns: [old],
      }).campaigns[0],
    ).toEqual({ ...next, packRefs: newApp().campaigns[0].packRefs });
  });
  it("accepts a genuine milestone 1 ZIP with schema v2 and preserves its source IDs", async () => {
    const old = v2Fixture();
    const records = strToU8(JSON.stringify(old));
    const zip = zipSync({
      "campaign.json": records,
      "manifest.json": strToU8(
        JSON.stringify({
          format: "slate-campaign",
          version: 1,
          schemaVersion: 2,
          createdAt: new Date().toISOString(),
          campaignId: old.id,
          campaignSha256: await digest(records),
          assets: [],
        }),
      ),
    });
    const bundle = await decodeBackup(zip);
    expect(bundle.campaign).toEqual({
      ...migrateCampaign(old, 2),
      packRefs: newApp().campaigns[0].packRefs,
    });
  });
  it("round-trips multiple screens, shared records, view settings, custom presets and layout history", async () => {
    let c = newCampaign("Several screens");
    const first = c.screens[0].id;
    c = duplicateScreen(c, first);
    c = editScreen(c, first, (l) => ({
      ...l,
      widgets: l.widgets.map((w) => ({
        ...w,
        title: "Session view",
      })),
    }));
    c = savePreset(c, first, "My layout");
    const decoded = await decodeBackup(
      await encodeBackup({ campaign: c, assets: [] }),
    );
    expect(decoded.campaign).toEqual(c);
    const repo = await Repository.open(crypto.randomUUID());
    repos.push(repo);
    const data = await repo.load();
    await repo.save(
      { ...data, campaigns: [c], activeCampaignId: c.id },
      data.revision,
    );
    expect((await repo.load()).campaigns[0]).toEqual(c);
  });
});
describe("screen layouts and shared tools", () => {
  it("duplicates views while preserving shared tool references and isolating layout changes", () => {
    let c = newCampaign("Test");
    const first = c.screens[0];
    c = duplicateScreen(c, first.id);
    expect(c.tools).toHaveLength(2);
    expect(c.screens[1].widgets[0].id).not.toBe(first.widgets[0].id);
    expect(c.screens[1].widgets[0].toolId).toBe(first.widgets[0].toolId);
    c = editScreen(c, c.activeScreenId, (l) => ({ ...l, widgets: [] }));
    expect(c.screens[0].widgets).toEqual(first.widgets);
    expect(c.tools).toHaveLength(2);
  });
  it("undoes grid, view settings, additions and removals without reverting tool data", () => {
    let c = newCampaign("Test");
    const id = c.activeScreenId;
    const original = structuredClone(c.screens[0]);
    c = editScreen(c, id, (l) => ({
      ...l,
      grid: { ...l.grid, columns: 14 },
      widgets: l.widgets.map((w) => ({ ...w, title: "Session view" })),
    }));
    c = editScreen(c, id, (l) => ({ ...l, widgets: [] }));
    const dice = c.tools.find((t) => t.kind === "dice")!;
    if (dice.kind === "dice") dice.formula = "2d6+9";
    c = undoLayout(c, id);
    expect(c.screens[0].widgets[0].title).toBe("Session view");
    c = undoLayout(c, id);
    expect(c.screens[0].widgets).toEqual(original.widgets);
    expect(c.screens[0].grid).toEqual(original.grid);
    expect(c.tools.find((t) => t.kind === "dice")).toMatchObject({
      formula: "2d6+9",
    });
    c = undoLayout(c, id, true);
    expect(c.screens[0].grid.columns).toBe(14);
    c = editScreen(c, id, (l) => ({ ...l, grid: { ...l.grid, rows: 9 } }));
    expect(c.screens[0].redo).toHaveLength(0);
  });
  it("does not record no-op gestures and rejects invalid layouts", () => {
    const c = newCampaign("Test");
    expect(
      editScreen(c, c.activeScreenId, (l) => l).screens[0].undo,
    ).toHaveLength(0);
    expect(() =>
      editScreen(c, c.activeScreenId, (l) => ({
        ...l,
        grid: { ...l.grid, columns: 4 },
      })),
    ).toThrow();
    for (let i = 0; i < 22; i++)
      c.screens[0] = editScreen(c, c.activeScreenId, (l) => ({
        ...l,
        grid: { ...l.grid, rows: 8 + (i % 2) },
      })).screens[0];
    expect(c.screens[0].undo).toHaveLength(20);
  });
  it("presets create fresh tools, retain shared slots, and do not carry combat or roll state", () => {
    let c = newCampaign("Test");
    const first = c.screens[0];
    const tracker = c.tools.find((t) => t.kind === "initiative")!;
    if (tracker.kind === "initiative") tracker.run.round = 9;
    c = editScreen(c, first.id, (l) => ({
      ...l,
      widgets: [
        ...l.widgets,
        { ...l.widgets[1], id: "another-view", x: 0, y: 5, h: 4 },
      ],
      grid: { ...l.grid, rows: 10 },
    }));
    c = savePreset(c, first.id, "Saved");
    c = createScreen(c, "Town", c.layoutPresets[0]);
    const screen = c.screens.at(-1)!;
    expect(screen.widgets[1].toolId).toBe(screen.widgets[2].toolId);
    expect(screen.widgets[0].toolId).not.toBe(tracker.id);
    expect(
      c.tools.find((t) => t.id === screen.widgets[0].toolId),
    ).toMatchObject({ run: { round: 1 } });
    expect(c.tools.find((t) => t.id === tracker.id)).toMatchObject({
      run: { round: 9 },
    });
    c = createScreen(c, "Empty", builtInPresets[0]);
    expect(c.screens.at(-1)!.widgets).toHaveLength(0);
  });
  it("campaign copying remaps screen, widget, tool, history and preset links consistently", () => {
    let c = newCampaign("Test");
    c = duplicateScreen(c, c.activeScreenId);
    c = editScreen(c, c.activeScreenId, (l) => ({ ...l, widgets: [] }));
    c = savePreset(c, c.screens[0].id, "Saved");
    const copy = copyCampaign(c);
    expect(copy.screens[1].id).toBe(copy.activeScreenId);
    expect(copy.screens[0].widgets[0].toolId).toBe(copy.tools[0].id);
    expect(copy.screens[1].undo[0].widgets[0].toolId).toBe(copy.tools[0].id);
    expect(copy.screens[1].undo[0].widgets[0].id).not.toBe(
      c.screens[1].undo[0].widgets[0].id,
    );
    expect(copy.layoutPresets[0].widgets[0].toolId).toBe(
      copy.layoutPresets[0].tools[0].id,
    );
    expect(campaignSchema.parse(copy)).toEqual(copy);
  });
  it("rejects missing shared records, including references hidden in undo history", () => {
    let c = newCampaign("Test");
    c = editScreen(c, c.activeScreenId, (l) => ({ ...l, widgets: [] }));
    c.tools = [];
    expect(campaignSchema.safeParse(c).success).toBe(false);
  });
});
