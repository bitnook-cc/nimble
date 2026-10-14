import {
  legendaryStateSchema,
  legendaryTurnSchema,
  advanceCombat,
  removeFromCombat,
} from "./legendary";
import { packSchema, packKey, recordSchema } from "./content-schema";
import { officialPacks } from "./starter-pack";
import { z } from "zod";
import {
  utilityKinds,
  utilitySchemas,
  linkedChangeSchema,
  newUtility,
} from "./utility-schema";
import { itemFilterSchema } from "./item-schema";
import { isCombatMonster } from "./monster-schema";
import { partySchema } from "./party";
import {
  diceFormulaOptionsSchema,
  diceFormulaResultSchema,
} from "@nimble/dice";

import { generatedNpcSchema, npcOptionsSchema } from "@nimble/generators";
import { initiativeModeSchema, type InitiativeMode } from "./initiative";

export const SCHEMA_VERSION = 17;
const id = z.string().min(1);
const integer = z.number().int();
export const placementSchema = z.object({
  x: integer.min(0),
  y: integer.min(0),
  w: integer.min(1),
  h: integer.min(1),
});
export const legacyWidgetSchema = placementSchema.extend({
  id,
  toolId: id,
  kind: z.enum(["dice", "initiative"]),
});
export const widgetSchema = legacyWidgetSchema.extend({
  kind: z.enum([
    "dice",
    "initiative",
    "note",
    "reference",
    "npc",
    "items",
    ...utilityKinds,
  ]),
  title: z.string().trim().max(80).default(""),
});
export type Widget = z.infer<typeof widgetSchema>;
export type Placement = z.infer<typeof placementSchema>;
export const gridSchema = z.object({
  columns: integer.min(4).max(24),
  rows: integer.min(4).max(30),
});
export type Grid = z.infer<typeof gridSchema>;
const combatantSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    side: z.enum(["hero", "enemy", "ally"]),
    partyCharacterId: id.optional(),
    legendary: legendaryStateSchema.optional(),
    monster: z
      .object({
        target: z.string().min(1).max(500),
        record: recordSchema.refine(
          isCombatMonster,
          "Expected a monster statblock",
        ),
      })
      .optional(),
    initiative: z.number().finite().nullable(),
    hp: integer.min(0).max(99999),
    maxHp: integer.min(1).max(99999),
    conditions: z.string().max(240),
    notes: z.string().max(500),
  })
  .refine((c) => c.hp <= c.maxHp, "HP cannot exceed maximum HP");
export type Combatant = z.infer<typeof combatantSchema>;
export const runSchema = z
  .object({
    name: z.string().max(100),
    mode: initiativeModeSchema.default("nimble"),
    round: integer.min(1),
    activeId: id.nullable(),
    legendaryTurn: legendaryTurnSchema.optional(),
    status: z.enum(["ready", "active", "paused", "finished"]),
    combatants: z.array(combatantSchema).max(100),
    hazards: z
      .array(
        z.object({
          id,
          target: z.string().max(500),
          record: recordSchema.refine(
            (r) => isCombatMonster(r) && r.fields.hazard === true,
            "Expected a hazard",
          ),
        }),
      )
      .max(100)
      .optional(),
  })
  .superRefine((run, ctx) => {
    if (new Set(run.combatants.map((c) => c.id)).size !== run.combatants.length)
      ctx.addIssue({ code: "custom", message: "Duplicate combatant IDs" });
    if (
      new Set(run.hazards?.map((h) => h.id)).size !== (run.hazards?.length ?? 0)
    )
      ctx.addIssue({ code: "custom", message: "Duplicate hazard IDs" });
    const partyIds = run.combatants.flatMap((c) =>
      c.partyCharacterId ? [c.partyCharacterId] : [],
    );
    if (new Set(partyIds).size !== partyIds.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate party characters in combat",
      });
    if (run.activeId && !run.combatants.some((c) => c.id === run.activeId))
      ctx.addIssue({ code: "custom", message: "Missing active combatant" });
  });
export type Run = z.infer<typeof runSchema>;
const rollSchema = z.object({
  id,
  at: z.string(),
  formula: z.string(),
  options: diceFormulaOptionsSchema,
  result: diceFormulaResultSchema,
});
export type Roll = z.infer<typeof rollSchema>;
const presetSchema = z.object({
  id,
  name: z.string().min(1).max(50),
  formula: z.string().max(1000),
  options: diceFormulaOptionsSchema,
});
const diceToolSchema = z.object({
  id,
  kind: z.literal("dice"),
  formula: z.string().max(1000),
  options: diceFormulaOptionsSchema,
  rolls: z.array(rollSchema).max(50),
  presets: z.array(presetSchema).max(30),
});
const initiativeToolSchema = z.object({
  id,
  kind: z.literal("initiative"),
  run: runSchema,
  history: z.array(runSchema).max(30),
  utilityHistory: z
    .array(z.array(linkedChangeSchema).max(1000))
    .max(30)
    .optional(),
});

export const legacyCampaignSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    grid: gridSchema,
    widgets: z.array(legacyWidgetSchema).max(100),
    tools: z.array(
      z.discriminatedUnion("kind", [diceToolSchema, initiativeToolSchema]),
    ),
  })
  .superRefine((campaign, ctx) => {
    const ids = campaign.tools.map((t) => t.id);
    if (
      new Set(ids).size !== ids.length ||
      new Set(campaign.widgets.map((w) => w.id)).size !==
        campaign.widgets.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate widget or tool IDs" });
    for (const widget of campaign.widgets) {
      if (
        !campaign.tools.some(
          (t) => t.id === widget.toolId && t.kind === widget.kind,
        )
      )
        ctx.addIssue({
          code: "custom",
          message: "Widget refers to a missing tool",
        });
      if (
        widget.x + widget.w > campaign.grid.columns ||
        widget.y + widget.h > campaign.grid.rows
      )
        ctx.addIssue({
          code: "custom",
          message: "Widget lies outside the grid",
        });
      if (
        campaign.widgets.some(
          (other) => other.id !== widget.id && overlaps(widget, other),
        )
      )
        ctx.addIssue({ code: "custom", message: "Widgets overlap" });
    }
  });
export const legacyAppSchema = z
  .object({
    version: z.literal(1),
    revision: integer.min(0),
    activeCampaignId: id,
    campaigns: z.array(legacyCampaignSchema).min(1),
    appearance: z.enum(["system", "light", "dark"]),
    palette: z.enum(["parchment", "stone"]),
  })
  .superRefine((app, ctx) => {
    if (!app.campaigns.some((c) => c.id === app.activeCampaignId))
      ctx.addIssue({ code: "custom", message: "Missing active campaign" });
    if (new Set(app.campaigns.map((c) => c.id)).size !== app.campaigns.length)
      ctx.addIssue({ code: "custom", message: "Duplicate campaigns" });
  });
export const MAX_ASSET_BYTES = 10 * 1024 * 1024;
export const MAX_CAMPAIGN_ASSET_BYTES = 64 * 1024 * 1024;
export const assetSchema = z.strictObject({
  id,
  name: z.string().min(1).max(200),
  mime: z.string().max(160),
  size: integer.min(0).max(MAX_ASSET_BYTES),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
export type Asset = z.infer<typeof assetSchema>;
export const v2CampaignSchema = legacyCampaignSchema
  .safeExtend({
    archivedAt: z.iso.datetime().nullable(),
    assets: z.array(assetSchema).max(100),
  })
  .superRefine((campaign, ctx) => {
    if (
      new Set(campaign.assets.map((a) => a.id)).size !== campaign.assets.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate attachment IDs" });
    if (
      campaign.assets.reduce((sum, a) => sum + a.size, 0) >
      MAX_CAMPAIGN_ASSET_BYTES
    )
      ctx.addIssue({
        code: "custom",
        message: "Campaign attachments exceed 64 MiB",
      });
  });

export const v2AppSchema = z
  .strictObject({
    version: z.literal(2),
    revision: integer.min(0),
    activeCampaignId: id.nullable(),
    campaigns: z.array(v2CampaignSchema).max(100),
    appearance: z.enum(["system", "light", "dark"]),
    palette: z.enum(["parchment", "stone"]),
  })
  .superRefine((app, ctx) => {
    if (
      app.activeCampaignId !== null &&
      !app.campaigns.some((c) => c.id === app.activeCampaignId && !c.archivedAt)
    )
      ctx.addIssue({ code: "custom", message: "Missing active campaign" });
    if (new Set(app.campaigns.map((c) => c.id)).size !== app.campaigns.length)
      ctx.addIssue({ code: "custom", message: "Duplicate campaigns" });
  });
const namedDiceSchema = diceToolSchema.extend({
  name: z.string().trim().min(1).max(80),
});
const namedInitiativeSchema = initiativeToolSchema.extend({
  name: z.string().trim().min(1).max(80),
});
const noteToolSchema = z.object({
  id,
  kind: z.literal("note"),
  name: z.string().trim().min(1).max(80),
  body: z.string().max(100000),
  tags: z.array(z.string().max(100)).max(30),
});
const referenceToolSchema = z.object({
  id,
  kind: z.literal("reference"),
  name: z.string().trim().min(1).max(80),
  target: z.string().max(500),
});
const itemLibraryToolSchema = z.object({
  id,
  kind: z.literal("items"),
  name: z.string().trim().min(1).max(80),
  filter: itemFilterSchema,
});
export type ItemLibraryTool = z.infer<typeof itemLibraryToolSchema>;
const npcEntrySchema = generatedNpcSchema.extend({ id, at: z.iso.datetime() });
const npcToolSchema = z
  .object({
    id,
    kind: z.literal("npc"),
    name: z.string().trim().min(1).max(80),
    options: npcOptionsSchema,
    current: npcEntrySchema.nullable(),
    history: z.array(npcEntrySchema).max(20),
    saved: z.array(npcEntrySchema).max(100),
  })
  .superRefine((tool, ctx) => {
    for (const collection of [tool.history, tool.saved])
      if (new Set(collection.map((npc) => npc.id)).size !== collection.length)
        ctx.addIssue({ code: "custom", message: "Duplicate NPC IDs" });
  });
export type NpcEntry = z.infer<typeof npcEntrySchema>;
export type NpcTool = z.infer<typeof npcToolSchema>;
export type NoteTool = z.infer<typeof noteToolSchema>;
export type DiceTool = z.infer<typeof namedDiceSchema>;
export type InitiativeTool = z.infer<typeof namedInitiativeSchema>;
export const layoutSchema = z
  .object({ grid: gridSchema, widgets: z.array(widgetSchema).max(100) })
  .superRefine((layout, ctx) => {
    if (new Set(layout.widgets.map((w) => w.id)).size !== layout.widgets.length)
      ctx.addIssue({ code: "custom", message: "Duplicate widget IDs" });
    for (const w of layout.widgets) {
      if (w.x + w.w > layout.grid.columns || w.y + w.h > layout.grid.rows)
        ctx.addIssue({
          code: "custom",
          message: "Widget lies outside the grid",
        });
      if (
        layout.widgets.some((other) => other.id !== w.id && overlaps(w, other))
      )
        ctx.addIssue({ code: "custom", message: "Widgets overlap" });
    }
  });
export type Layout = z.infer<typeof layoutSchema>;
export const screenSchema = layoutSchema.safeExtend({
  id,
  name: z.string().trim().min(1).max(80),
  undo: z.array(layoutSchema).max(20),
  redo: z.array(layoutSchema).max(20),
});
export type Screen = z.infer<typeof screenSchema>;
export const presetSchemaForScreen = layoutSchema
  .safeExtend({
    id,
    name: z.string().trim().min(1).max(80),
    tools: z
      .array(
        z.object({
          id,
          kind: z.enum([
            "dice",
            "initiative",
            "note",
            "reference",
            "npc",
            "items",
            ...utilityKinds,
          ]),
          name: z.string().trim().min(1).max(80),
        }),
      )
      .max(100),
  })
  .superRefine((preset, ctx) => {
    if (
      new Set(preset.tools.map((t) => t.id)).size !== preset.tools.length ||
      preset.widgets.some(
        (w) =>
          !preset.tools.some((t) => t.id === w.toolId && t.kind === w.kind),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Invalid preset tool references",
      });
  });
export type ScreenPreset = z.infer<typeof presetSchemaForScreen>;
export const campaignSchema = z
  .strictObject({
    id,
    party: partySchema,
    name: z.string().trim().min(1).max(80),
    archivedAt: z.iso.datetime().nullable(),
    assets: z.array(assetSchema).max(100),
    content: z.array(recordSchema).max(1000),
    itemFavourites: z.array(z.string().min(1).max(500)).max(3000).default([]),
    packRefs: z.array(z.string().min(1).max(330)).max(24),
    screens: z.array(screenSchema).min(1).max(20),
    activeScreenId: id,
    tools: z
      .array(
        z.discriminatedUnion("kind", [
          namedDiceSchema,
          namedInitiativeSchema,
          noteToolSchema,
          referenceToolSchema,
          npcToolSchema,
          itemLibraryToolSchema,
          ...utilitySchemas,
        ]),
      )
      .max(1000),
    layoutPresets: z.array(presetSchemaForScreen).max(20),
  })
  .superRefine((c, ctx) => {
    for (const collection of [
      c.tools,
      c.screens,
      c.assets,
      c.layoutPresets,
      c.content,
    ])
      if (new Set(collection.map((x) => x.id)).size !== collection.length)
        ctx.addIssue({ code: "custom", message: "Duplicate record IDs" });
    if (!c.screens.some((s) => s.id === c.activeScreenId))
      ctx.addIssue({ code: "custom", message: "Missing active screen" });
    if (c.assets.reduce((sum, a) => sum + a.size, 0) > MAX_CAMPAIGN_ASSET_BYTES)
      ctx.addIssue({
        code: "custom",
        message: "Campaign attachments exceed 64 MiB",
      });
    const widgets = c.screens.flatMap((s) => s.widgets);
    if (new Set(widgets.map((w) => w.id)).size !== widgets.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate widget IDs across screens",
      });
    for (const screen of c.screens)
      for (const layout of [screen, ...screen.undo, ...screen.redo]) {
        if (
          layout.widgets.some(
            (w) => !c.tools.some((t) => t.id === w.toolId && t.kind === w.kind),
          )
        )
          ctx.addIssue({
            code: "custom",
            message: "Widget refers to a missing tool",
          });
      }
  });
export type Campaign = z.infer<typeof campaignSchema>;
export const appSchema = z
  .strictObject({
    ...v2AppSchema.shape,
    version: z.literal(SCHEMA_VERSION),
    packs: z.array(packSchema).max(24),
    campaigns: z.array(campaignSchema).max(100),
  })
  .superRefine((app, ctx) => {
    if (
      app.activeCampaignId !== null &&
      !app.campaigns.some((c) => c.id === app.activeCampaignId && !c.archivedAt)
    )
      ctx.addIssue({ code: "custom", message: "Missing active campaign" });
    if (new Set(app.campaigns.map((c) => c.id)).size !== app.campaigns.length)
      ctx.addIssue({ code: "custom", message: "Duplicate campaigns" });
  })
  .superRefine((app, ctx) => {
    const keys = app.packs.map(packKey);
    if (new Set(keys).size !== keys.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate content pack versions",
      });
    for (const campaign of app.campaigns)
      if (campaign.packRefs.some((ref) => !keys.includes(ref)))
        ctx.addIssue({
          code: "custom",
          message: "Campaign content pack is missing",
        });
  });
export type AppData = z.infer<typeof appSchema>;
export type Tool = Campaign["tools"][number];
export const uid = () => crypto.randomUUID();
export const defaultSpan = {
  table: { w: 4, h: 4 },
  time: { w: 3, h: 2 },
  counter: { w: 3, h: 3 },
  image: { w: 4, h: 4 },
  checklist: { w: 4, h: 4 },
  items: { w: 4, h: 5 },
  npc: { w: 4, h: 5 },
  dice: { w: 4, h: 5 },
  initiative: { w: 6, h: 5 },
  note: { w: 4, h: 4 },
  reference: { w: 4, h: 5 },
};

export function overlaps(a: Placement, b: Placement) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
export function canPlace(
  campaign: { grid: Grid; widgets: (Placement & { id: string })[] },
  rect: Placement,
  ignoreId?: string,
) {
  return (
    [rect.x, rect.y, rect.w, rect.h].every(Number.isInteger) &&
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.w > 0 &&
    rect.h > 0 &&
    rect.x + rect.w <= campaign.grid.columns &&
    rect.y + rect.h <= campaign.grid.rows &&
    !campaign.widgets.some((w) => w.id !== ignoreId && overlaps(w, rect))
  );
}
export function findSpace(
  campaign: { grid: Grid; widgets: (Placement & { id: string })[] },
  span: { w: number; h: number },
): Placement | null {
  for (let y = 0; y <= campaign.grid.rows - span.h; y++)
    for (let x = 0; x <= campaign.grid.columns - span.w; x++) {
      const rect = { x, y, ...span };
      if (canPlace(campaign, rect)) return rect;
    }
  return null;
}
export function newRun(mode: InitiativeMode = "nimble"): Run {
  return {
    name: "New encounter",
    mode,
    round: 1,
    activeId: null,
    status: "ready",
    combatants: [],
  };
}
export function newTool(kind: Widget["kind"]): Tool {
  if (utilityKinds.includes(kind as (typeof utilityKinds)[number]))
    return newUtility(kind as (typeof utilityKinds)[number], uid());
  if (kind === "items")
    return {
      id: uid(),
      kind,
      name: "Item library",
      filter: { query: "", type: "all", rarity: "all", favouritesOnly: false },
    };
  if (kind === "npc")
    return {
      id: uid(),
      kind,
      name: "NPC generator",
      options: { style: "generic", gender: "any" },
      current: null,
      history: [],
      saved: [],
    };
  if (kind === "note")
    return { id: uid(), kind, name: "Notes", body: "", tags: [] };
  if (kind === "reference")
    return { id: uid(), kind, name: "Reference", target: "" };
  return kind === "dice"
    ? {
        id: uid(),
        kind,
        name: "Dice roller",
        formula: "1d20",
        options: {
          advantageLevel: 0,
          allowCriticals: false,
          allowFumbles: false,
        },
        rolls: [],
        presets: [],
      }
    : {
        id: uid(),
        kind: "initiative",
        name: "Initiative tracker",
        run: newRun(),
        history: [],
      };
}
export function newCampaign(name: string): Campaign {
  const initiative = newTool("initiative");
  const dice = newTool("dice");
  const screenId = uid();
  return {
    id: uid(),
    name,
    archivedAt: null,
    assets: [],
    party: { characters: [] },
    tools: [initiative, dice],
    layoutPresets: [],
    content: [],
    itemFavourites: [],
    packRefs: officialPacks.map(packKey),
    activeScreenId: screenId,
    screens: [
      {
        id: screenId,
        name: "Session screen",
        grid: { columns: 12, rows: 8 },
        undo: [],
        redo: [],
        widgets: [
          {
            id: uid(),
            toolId: initiative.id,
            kind: "initiative",
            x: 0,
            y: 0,
            ...defaultSpan.initiative,
            title: "",
          },
          {
            id: uid(),
            toolId: dice.id,
            kind: "dice",
            x: 6,
            y: 0,
            ...defaultSpan.dice,
            title: "",
          },
        ],
      },
    ],
  };
}
export function newApp(): AppData {
  const campaign = newCampaign("My Campaign");
  return {
    version: SCHEMA_VERSION,
    packs: [...officialPacks],
    revision: 0,
    activeCampaignId: campaign.id,
    campaigns: [campaign],
    appearance: "system",
    palette: "parchment",
  };
}

export function advance(run: Run): Run {
  return advanceCombat(run);
}
export function removeCombatant(run: Run, id: string): Run {
  return removeFromCombat(run, id);
}
export function changeRun(tool: InitiativeTool, run: Run): InitiativeTool {
  return {
    ...tool,
    run: runSchema.parse(run),
    history: [tool.run, ...tool.history].slice(0, 30),
  };
}
