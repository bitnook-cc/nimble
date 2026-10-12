import {
  stopwatchStateSchema,
  timerStateSchema,
  newUtility,
} from "./utility-schema";
import { z } from "zod";
const id = z.string().min(1).max(500);
const number = z.number().finite();
const base = z.object({ id, name: z.string().trim().min(1).max(80) });
const clockToolSchema = base
  .extend({
    kind: z.literal("clock"),
    segments: number.int().min(2).max(24),
    filled: number.int().min(0).max(24),
  })
  .refine(
    (t) => t.filled <= t.segments,
    "Filled segments exceed the clock size.",
  );
const countdownToolSchema = base.extend({
  kind: z.literal("countdown"),
  initial: number.int().min(1).max(99999),
  remaining: number.int().min(0).max(99999),
  epoch: number.int().min(0),
  link: z
    .object({
      trackerId: id,
      event: z.enum(["turn", "round"]),
      paused: z.boolean(),
    })
    .nullable(),
});

const counterToolSchema = base
  .extend({
    kind: z.literal("counter"),
    value: number.min(-1e9).max(1e9),
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
      t.target !== null &&
      ((t.min !== null && t.target < t.min) ||
        (t.max !== null && t.target > t.max))
    )
      ctx.addIssue({
        code: "custom",
        message: "Target lies outside the bounds.",
      });
  });

const oldChange = z.object({
  toolId: id,
  epoch: number.int().min(0),
  amount: number.int().min(1).max(99999),
});
type RecordData = Record<string, unknown>;
const record = (value: unknown): RecordData =>
  z.record(z.string(), z.unknown()).parse(value);
const list = (value: unknown): unknown[] => z.array(z.unknown()).parse(value);
const kind = (value: unknown) =>
  value === "clock" || value === "countdown" ? "counter" : value;
const placement = (value: unknown) => {
  const w = record(value);
  return { ...w, kind: kind(w.kind) };
};
const layout = (value: unknown) => {
  const l = record(value);
  return { ...l, widgets: list(l.widgets).map(placement) };
};
export function migrateCounters(value: unknown) {
  const c = record(value);
  return {
    ...c,
    tools: list(c.tools).map((value) => {
      const t = record(value);
      if (t.kind === "clock") {
        const old = clockToolSchema.parse(t);
        return {
          id: old.id,
          name: old.name,
          kind: "counter",
          value: old.filled,
          initial: 0,
          epoch: 0,
          link: null,
          unit: "",
          step: 1,
          min: 0,
          max: old.segments,
          target: old.segments,
        };
      }
      if (t.kind === "countdown") {
        const old = countdownToolSchema.parse(t);
        return {
          id: old.id,
          name: old.name,
          kind: "counter",
          value: old.remaining,
          initial: old.initial,
          epoch: old.epoch,
          link: old.link ? { ...old.link, direction: "decrement" } : null,
          unit: "",
          step: 1,
          min: 0,
          max: 99999,
          target: 0,
        };
      }
      if (t.kind === "counter") {
        const old = counterToolSchema.parse(t);
        return {
          ...old,
          initial: Math.min(old.max ?? 1e9, Math.max(old.min ?? -1e9, 0)),
          epoch: 0,
          link: null,
        };
      }
      if (t.kind === "initiative" && t.utilityHistory !== undefined)
        return {
          ...t,
          utilityHistory: list(t.utilityHistory).map((changes) =>
            list(changes).map((value) => {
              const old = oldChange.parse(value);
              return {
                toolId: old.toolId,
                epoch: old.epoch,
                delta: -old.amount,
              };
            }),
          ),
        };
      return t;
    }),
    screens: list(c.screens).map((value) => {
      const s = record(value);
      return {
        ...layout(s),
        undo: list(s.undo).map(layout),
        redo: list(s.redo).map(layout),
      };
    }),
    layoutPresets: list(c.layoutPresets).map((value) => {
      const p = record(value);
      return { ...layout(p), tools: list(p.tools).map(placement) };
    }),
  };
}

const oldStopwatch = stopwatchStateSchema.extend({
  id,
  name: base.shape.name,
  kind: z.literal("stopwatch"),
});
const oldTimer = timerStateSchema.extend({
  id,
  name: base.shape.name,
  kind: z.literal("timer"),
});
const timePlacement = (value: unknown) => {
  const w = record(value);
  return {
    ...w,
    kind: w.kind === "stopwatch" || w.kind === "timer" ? "time" : w.kind,
  };
};
const timeLayout = (value: unknown) => {
  const l = record(value);
  return { ...l, widgets: list(l.widgets).map(timePlacement) };
};
export function migrateTimeTools(value: unknown) {
  const c = record(value);
  return {
    ...c,
    tools: list(c.tools).map((value) => {
      const t = record(value);
      if (t.kind === "stopwatch") {
        const old = oldStopwatch.parse(t),
          fresh = newUtility("time", old.id);
        return {
          ...fresh,
          name: old.name,
          mode: "stopwatch",
          stopwatch: stopwatchStateSchema.parse(old),
        };
      }
      if (t.kind === "timer") {
        const old = oldTimer.parse(t),
          fresh = newUtility("time", old.id);
        return {
          ...fresh,
          name: old.name,
          mode: "timer",
          timer: timerStateSchema.parse(old),
        };
      }
      return t;
    }),
    screens: list(c.screens).map((value) => {
      const s = record(value);
      return {
        ...timeLayout(s),
        undo: list(s.undo).map(timeLayout),
        redo: list(s.redo).map(timeLayout),
      };
    }),
    layoutPresets: list(c.layoutPresets).map((value) => {
      const p = record(value);
      return { ...timeLayout(p), tools: list(p.tools).map(timePlacement) };
    }),
  };
}
