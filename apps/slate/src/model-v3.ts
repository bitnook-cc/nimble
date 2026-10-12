import { z } from "zod";
import {
  diceFormulaOptionsSchema,
  diceFormulaResultSchema,
} from "@nimble/dice";

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
  title: z.string().trim().max(80).default(""),
  collapsed: z.boolean().default(false),
});
export type Widget = z.infer<typeof widgetSchema>;
export type Placement = z.infer<typeof placementSchema>;
export const gridSchema = z.object({
  columns: integer.min(4).max(24),
  rows: integer.min(4).max(30),
  cellHeight: integer.min(64).max(160),
});
export type Grid = z.infer<typeof gridSchema>;
const combatantSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(80),
    side: z.enum(["hero", "enemy", "ally"]),
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
    round: integer.min(1),
    activeId: id.nullable(),
    status: z.enum(["ready", "active", "paused", "finished"]),
    combatants: z.array(combatantSchema).max(100),
  })
  .superRefine((run, ctx) => {
    if (new Set(run.combatants.map((c) => c.id)).size !== run.combatants.length)
      ctx.addIssue({ code: "custom", message: "Duplicate combatant IDs" });
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
export type DiceTool = z.infer<typeof namedDiceSchema>;
export type InitiativeTool = z.infer<typeof namedInitiativeSchema>;
export const layoutSchema = z
  .object({ grid: gridSchema, widgets: z.array(widgetSchema).max(100) })
  .superRefine((layout, ctx) => {
    if (new Set(layout.widgets.map((w) => w.id)).size !== layout.widgets.length)
      ctx.addIssue({ code: "custom", message: "Duplicate widget IDs" });
    for (const w of layout.widgets) {
      if (w.w < minimumSpan[w.kind].w || w.h < minimumSpan[w.kind].h)
        ctx.addIssue({
          code: "custom",
          message: "Widget is below its minimum size",
        });
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
          kind: z.enum(["dice", "initiative"]),
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
    name: z.string().trim().min(1).max(80),
    archivedAt: z.iso.datetime().nullable(),
    assets: z.array(assetSchema).max(100),
    screens: z.array(screenSchema).min(1).max(20),
    activeScreenId: id,
    tools: z
      .array(
        z.discriminatedUnion("kind", [namedDiceSchema, namedInitiativeSchema]),
      )
      .max(1000),
    layoutPresets: z.array(presetSchemaForScreen).max(20),
  })
  .superRefine((c, ctx) => {
    for (const collection of [c.tools, c.screens, c.assets, c.layoutPresets])
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
    version: z.literal(3),
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
  });
export const minimumSpan = { dice: { w: 3, h: 4 }, initiative: { w: 4, h: 4 } };
export const defaultSpan = { dice: { w: 4, h: 5 }, initiative: { w: 6, h: 5 } };

export function overlaps(a: Placement, b: Placement) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}
