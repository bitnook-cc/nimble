import { z } from "zod";
export const utilityKinds = [
  "table",
  "time",
  "counter",
  "image",
  "checklist",
] as const;
export const utilityTitles = {
  table: "Random table",
  time: "Clock & timer",
  counter: "Counter",
  image: "Image card",
  checklist: "Checklist",
};
const id = z.string().min(1).max(500);
const number = z.number().finite();
const timestamp = number.min(0).max(8640000000000000);
const base = z.object({ id, name: z.string().trim().min(1).max(80) });
export const tableRowSchema = z.object({
  id,
  name: z.string().trim().min(1).max(160),
  body: z.string().max(10000),
  weight: number.int().min(1).max(10000),
  from: number.int().min(-20000).max(20000),
  to: number.int().min(-20000).max(20000),
  tableId: id.optional(),
});
export function tableBounds(formula: string) {
  const match = /^(\d+)d(\d+)([+-]\d+)?$/i.exec(formula.replace(/\s/g, ""));
  if (!match)
    throw new Error("Use a bounded formula such as 1d6, 2d6 or 1d100+2.");
  const count = Number(match[1]),
    sides = Number(match[2]),
    offset = Number(match[3] ?? 0);
  if (
    count < 1 ||
    count > 20 ||
    ![4, 6, 8, 10, 12, 20, 100].includes(sides) ||
    Math.abs(offset) > 10000
  )
    throw new Error(
      "Use 1–20 standard dice (d4, d6, d8, d10, d12, d20 or d100) and an offset within 10,000.",
    );
  return { min: count + offset, max: count * sides + offset };
}
export const tableDefinitionSchema = z
  .object({
    mode: z.enum(["list", "weighted", "ranges"]),
    formula: z.string().max(100),
    rows: z.array(tableRowSchema).min(1).max(200),
  })
  .superRefine((table, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    if (new Set(table.rows.map((r) => r.id)).size !== table.rows.length)
      issue("Duplicate table row IDs.");
    if (table.mode !== "ranges") return;
    let bounds;
    try {
      bounds = tableBounds(table.formula);
    } catch (e) {
      issue((e as Error).message);
      return;
    }
    const rows = [...table.rows].sort((a, b) => a.from - b.from);
    let next = bounds.min;
    for (const row of rows) {
      if (row.to < row.from) issue("Range end cannot precede its start.");
      if (row.from < bounds.min || row.to > bounds.max)
        issue("A range lies outside the dice outcomes.");
      if (row.from < next) issue("Dice ranges overlap.");
      if (row.from > next) issue("Dice ranges leave uncovered outcomes.");
      next = Math.max(next, row.to + 1);
    }
    if (next <= bounds.max) issue("Dice ranges leave uncovered outcomes.");
  });
export const tableResultSchema = z.object({
  id,
  at: z.string(),
  manual: z.boolean(),
  steps: z
    .array(
      z.object({
        tableId: id,
        tableName: z.string().max(80),
        rowId: id,
        name: z.string().max(160),
        body: z.string().max(10000),
        roll: number.int().nullable(),
        formula: z.string().max(100),
      }),
    )
    .min(1)
    .max(8),
});
export const tableToolSchema = base.extend({
  kind: z.literal("table"),
  definition: tableDefinitionSchema,
  history: z.array(tableResultSchema).max(20),
});
// Definitions belong to content. The tool only keeps a reference and results.
export const tableWidgetSchema = base.extend({
  kind: z.literal("table"),
  target: id.nullable(),
  history: z.array(tableResultSchema).max(20),
});
export type TableWidgetTool = z.infer<typeof tableWidgetSchema>;
export type TableDefinition = z.infer<typeof tableDefinitionSchema>;
export function tableOutcomes(definition: TableDefinition) {
  let next = 1;
  return definition.rows.map((row) => {
    const from = definition.mode === "ranges" ? row.from : next;
    const to =
      definition.mode === "ranges"
        ? row.to
        : from + (definition.mode === "list" ? 1 : row.weight) - 1;
    next = to + 1;
    return { row, from, to };
  });
}
export function defaultTableDefinition(): TableDefinition {
  return {
    mode: "list",
    formula: "1d6",
    rows: [
      {
        id: crypto.randomUUID(),
        name: "Quiet",
        body: "Nothing stirs.",
        weight: 1,
        from: 1,
        to: 3,
      },
      {
        id: crypto.randomUUID(),
        name: "Footsteps",
        body: "Someone approaches.",
        weight: 1,
        from: 4,
        to: 6,
      },
    ],
  };
}
export const stopwatchStateSchema = z.object({
  elapsedMs: number.min(0).max(8640000000000000),
  startedAt: timestamp.nullable(),
});
export const timerStateSchema = z.object({
  durationMs: number.int().min(1000).max(604800000),
  remainingMs: number.min(0).max(604800000),
  deadline: timestamp.nullable(),
  acknowledged: z.boolean(),
});
export const timeToolSchema = base.extend({
  kind: z.literal("time"),
  mode: z.enum(["clock", "timer", "stopwatch"]),
  clockFormat: z.enum(["24h", "12h"]),
  stopwatch: stopwatchStateSchema,
  timer: timerStateSchema,
});
export const counterToolSchema = base
  .extend({
    kind: z.literal("counter"),
    value: number.min(-1e9).max(1e9),
    initial: number.min(-1e9).max(1e9),
    epoch: number.int().min(0),
    link: z
      .object({
        trackerId: id,
        event: z.enum(["turn", "round"]),
        direction: z.enum(["increment", "decrement"]),
        paused: z.boolean(),
      })
      .nullable(),
    unit: z.string().trim().max(40),
    step: number.min(0.000001).max(1e9),
    min: number.min(-1e9).max(1e9).nullable(),
    max: number.min(-1e9).max(1e9).nullable(),
    target: number.min(-1e9).max(1e9).nullable(),
  })
  .superRefine((t, ctx) => {
    if (t.min !== null && t.max !== null && t.min > t.max)
      ctx.addIssue({
        code: "custom",
        message: "Minimum cannot exceed maximum.",
      });
    if (
      (t.min !== null && t.value < t.min) ||
      (t.max !== null && t.value > t.max)
    )
      ctx.addIssue({
        code: "custom",
        message: "Value lies outside the bounds.",
      });
    if (
      (t.min !== null && t.initial < t.min) ||
      (t.max !== null && t.initial > t.max)
    )
      ctx.addIssue({
        code: "custom",
        message: "Starting value lies outside the bounds.",
      });
    if (
      t.target !== null &&
      ((t.min !== null && t.target < t.min) ||
        (t.max !== null && t.target > t.max))
    )
      ctx.addIssue({
        code: "custom",
        message: "Target lies outside the bounds.",
      });
  });
export const imageToolSchema = base.extend({
  kind: z.literal("image"),
  assetId: id.nullable(),
  caption: z.string().max(1000),
  fit: z.enum(["contain", "cover"]),
  zoom: number.min(1).max(4),
  panX: number.min(-300).max(300),
  panY: number.min(-300).max(300),
});
export const checklistToolSchema = base
  .extend({
    kind: z.literal("checklist"),
    entries: z
      .array(
        z.object({
          id,
          text: z.string().trim().min(1).max(500),
          checked: z.boolean(),
          indent: number.int().min(0).max(3),
        }),
      )
      .max(200),
  })
  .refine(
    (t) => new Set(t.entries.map((e) => e.id)).size === t.entries.length,
    "Duplicate checklist entry IDs.",
  );
export const utilitySchemas = [
  tableWidgetSchema,
  timeToolSchema,
  counterToolSchema,
  imageToolSchema,
  checklistToolSchema,
] as const;
export const utilitySchema = z.discriminatedUnion("kind", utilitySchemas);
export type Utility = z.infer<typeof utilitySchema>;
export type TableTool = z.infer<typeof tableToolSchema>;
export type TimerState = z.infer<typeof timerStateSchema>;
export type StopwatchState = z.infer<typeof stopwatchStateSchema>;
export type TimeTool = z.infer<typeof timeToolSchema>;
export const linkedChangeSchema = z.object({
  toolId: id,
  epoch: number.int().min(0),
  delta: number.min(-1e9).max(1e9),
});
export function newUtility(
  kind: (typeof utilityKinds)[number],
  id: string,
): Utility {
  const base = { id, kind, name: utilityTitles[kind] };
  switch (kind) {
    case "table":
      return {
        ...base,
        kind,
        target: null,
        history: [],
      };
    case "time":
      return {
        ...base,
        kind,
        mode: "clock",
        clockFormat: "24h",
        stopwatch: { elapsedMs: 0, startedAt: null },
        timer: {
          durationMs: 300000,
          remainingMs: 300000,
          deadline: null,
          acknowledged: false,
        },
      };
    case "counter":
      return {
        ...base,
        kind,
        value: 0,
        initial: 0,
        epoch: 0,
        link: null,
        unit: "",
        step: 1,
        min: 0,
        max: null,
        target: null,
      };
    case "image":
      return {
        ...base,
        kind,
        assetId: null,
        caption: "",
        fit: "contain",
        zoom: 1,
        panX: 0,
        panY: 0,
      };
    case "checklist":
      return { ...base, kind, entries: [] };
  }
}
