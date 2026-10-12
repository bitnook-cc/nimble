import {
  advance,
  changeRun,
  uid,
  type Campaign,
  type Tool,
  type InitiativeTool,
} from "./model";
import { roll } from "./rolls";
import {
  utilitySchema,
  tableDefinitionSchema,
  tableOutcomes,
  type TableTool,
  type TimerState,
  type StopwatchState,
} from "./utility-schema";
export const elapsed = (tool: StopwatchState, now: number) =>
  tool.elapsedMs +
  (tool.startedAt === null ? 0 : Math.max(0, now - tool.startedAt));
export const remaining = (tool: TimerState, now: number) =>
  tool.deadline === null ? tool.remainingMs : Math.max(0, tool.deadline - now);
export function toggleStopwatch(
  t: StopwatchState,
  now: number,
): StopwatchState {
  return t.startedAt === null
    ? { ...t, startedAt: now }
    : { ...t, elapsedMs: elapsed(t, now), startedAt: null };
}
export function toggleTimer(t: TimerState, now: number): TimerState {
  return t.deadline === null
    ? {
        ...t,
        deadline: now + (t.remainingMs || t.durationMs),
        acknowledged: false,
      }
    : { ...t, remainingMs: remaining(t, now), deadline: null };
}
export function timeText(ms: number) {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
export function clockText(
  now: number,
  format: "24h" | "12h",
  locale?: string,
  timeZone?: string,
) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: format === "24h" ? "h23" : "h12",
    timeZone,
  }).format(now);
}
export function counterValue(
  t: Extract<Tool, { kind: "counter" }>,
  value: number,
) {
  return Math.min(
    t.max ?? 1e9,
    Math.max(t.min ?? -1e9, Math.round(value * 1e6) / 1e6),
  );
}
// Uniform weighted selection using the existing engine's standard d100 rolls.
// Rejection sampling avoids modulo bias without adding arbitrary dice to Nimble.
export function weightedOutcome(
  total: number,
  sample: (formula: string) => number,
): number {
  if (!Number.isSafeInteger(total) || total < 1 || total > 2000000)
    throw new Error("Weighted totals must be between 1 and 2,000,000.");
  let span = 100,
    digits = 1;
  while (span < total) {
    span *= 100;
    digits++;
  }
  const ceiling = Math.floor(span / total) * total;
  for (let attempt = 0; attempt < 64; attempt++) {
    let value = 0;
    for (let digit = 0; digit < digits; digit++) {
      const die = sample("1d100");
      if (!Number.isInteger(die) || die < 1 || die > 100)
        throw new Error("Invalid weighted die result.");
      value = value * 100 + die - 1;
    }
    if (value < ceiling) return (value % total) + 1;
  }
  throw new Error("Unable to resolve weighted selection. Try rolling again.");
}
export function rollTable(
  root: TableTool,
  tools: TableTool[],
  manualId?: string,
  sample = (formula: string) =>
    roll(formula, {
      advantageLevel: 0,
      allowCriticals: false,
      allowFumbles: false,
    }).result.total,
) {
  const steps: TableTool["history"][number]["steps"] = [],
    seen = new Set<string>();
  let table: TableTool | undefined = root;
  while (table) {
    if (seen.has(table.id)) throw new Error("Linked tables contain a cycle.");
    if (steps.length >= 8)
      throw new Error("Linked tables exceed the eight-table limit.");
    seen.add(table.id);
    const def = tableDefinitionSchema.parse(table.definition);
    const outcomes = tableOutcomes(def);
    const weight = outcomes.at(-1)!.to;
    const formula = def.mode !== "ranges" ? `1–${weight}` : def.formula;
    // A one-outcome weighted table needs no die; the shared engine requires at least two sides.
    const total =
      manualId && steps.length === 0
        ? null
        : def.mode !== "ranges"
          ? weight === 1
            ? 1
            : weightedOutcome(weight, sample)
          : sample(formula);
    const row =
      total === null
        ? def.rows.find((r) => r.id === manualId)
        : outcomes.find(
            (outcome) => total >= outcome.from && total <= outcome.to,
          )?.row;
    if (!row) throw new Error("This outcome has no table row.");
    steps.push({
      tableId: table.id,
      tableName: table.name,
      rowId: row.id,
      name: row.name,
      body: row.body,
      roll: total,
      formula,
    });
    table = undefined;
    if (row.tableId) {
      const next = tools.find(
        (t) => t.id === row.tableId && t.kind === "table",
      );
      if (!next || next.kind !== "table")
        throw new Error("A linked table is unavailable in this campaign.");
      table = next;
    }
  }
  return { id: uid(), at: new Date().toISOString(), manual: !!manualId, steps };
}
export function parseTableImport(text: string) {
  if (new TextEncoder().encode(text).length > 4 * 1024 * 1024)
    throw new Error("Table files must be 4 MiB or smaller.");
  const raw = JSON.parse(text);
  if (
    raw.format !== "slate-table" ||
    raw.version !== 1 ||
    typeof raw.name !== "string" ||
    !raw.name.trim() ||
    raw.name.length > 80
  )
    throw new Error("Expected a Slate table export, version 1.");
  const definition = tableDefinitionSchema.parse(raw.definition);
  if (definition.rows.some((r) => r.tableId))
    throw new Error(
      "Standalone table files cannot contain campaign table links. Use a campaign backup for linked tables.",
    );
  return { name: raw.name.trim(), definition };
}
export function applyToolUpdate(
  c: Campaign,
  id: string,
  edit: (tool: Tool) => Tool,
): Campaign {
  const current = c.tools.find((t) => t.id === id);
  if (!current) return c;
  let next = edit(current),
    tools = c.tools;
  if (current.kind === "initiative" && next.kind === "initiative") {
    if (
      current.history.length &&
      next.run === current.history[0] &&
      next.history.length === current.history.length - 1
    ) {
      const changes = current.utilityHistory?.[0] ?? [];
      tools = tools.map((t) => {
        const delta = changes.find((d) => d.toolId === t.id);
        return t.kind === "counter" &&
          delta &&
          t.epoch === delta.epoch &&
          t.link?.trackerId === id
          ? { ...t, value: counterValue(t, t.value - delta.delta) }
          : t;
      });
      next = { ...next, utilityHistory: current.utilityHistory?.slice(1) };
    } else if (next.history[0] === current.run)
      next = {
        ...next,
        utilityHistory: [
          [],
          ...(current.utilityHistory ?? current.history.map(() => [])),
        ].slice(0, 30),
      };
  }
  return { ...c, tools: tools.map((t) => (t.id === id ? next : t)) };
}
export function advanceCampaign(c: Campaign, id: string): Campaign {
  const tracker = c.tools.find((t) => t.id === id) as
    InitiativeTool | undefined;
  if (!tracker || tracker.kind !== "initiative") return c;
  const run = advance(tracker.run);
  if (run === tracker.run) return c;
  const turn = tracker.run.status === "active" && run.activeId !== null;
  const round =
    tracker.run.status === "active" && run.round > tracker.run.round;
  const changes: NonNullable<InitiativeTool["utilityHistory"]>[number] = [];
  const tools = c.tools.map((t) => {
    if (
      t.kind !== "counter" ||
      !t.link ||
      t.link.paused ||
      t.link.trackerId !== id ||
      !(t.link.event === "turn" ? turn : round)
    )
      return t;
    const value = counterValue(
      t,
      t.value + (t.link.direction === "increment" ? t.step : -t.step),
    );
    if (value === t.value) return t;
    changes.push({ toolId: t.id, epoch: t.epoch, delta: value - t.value });
    return { ...t, value };
  });
  const next = {
    ...changeRun(tracker, run),
    utilityHistory: [
      changes,
      ...(tracker.utilityHistory ?? tracker.history.map(() => [])),
    ].slice(0, 30),
  };
  return { ...c, tools: tools.map((t) => (t.id === id ? next : t)) };
}
export function validateUtility(value: unknown) {
  return utilitySchema.parse(value);
}
