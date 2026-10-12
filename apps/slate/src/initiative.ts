import { z } from "zod";
import type { Combatant, Run } from "./model";
import { canAct, isLegendary } from "./legendary";

export const initiativeModeSchema = z.enum(["nimble", "classic"]);
export type InitiativeMode = z.infer<typeof initiativeModeSchema>;

export function nimbleOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort(
    (a, b) => Number(a.side === "enemy") - Number(b.side === "enemy"),
  );
}
export function sortInitiative(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort(
    (a, b) => (b.initiative ?? -Infinity) - (a.initiative ?? -Infinity),
  );
}
export function setInitiativeMode(run: Run, mode: InitiativeMode): Run {
  if (run.mode === mode) return run;
  return {
    ...run,
    mode,
    round: 1,
    status: "ready",
    activeId: null,
    legendaryTurn: undefined,
    combatants:
      mode === "nimble"
        ? nimbleOrder(run.combatants)
        : sortInitiative(run.combatants),
  };
}
export function prepareClassicInitiative(
  run: Run,
  scores: Record<string, number>,
): Run {
  const combatants = run.combatants.map((c) => {
    if (!canAct(c)) return c;
    if (!Number.isFinite(scores[c.id]))
      throw new Error(`Enter initiative for ${c.name}.`);
    return { ...c, initiative: scores[c.id] };
  });
  return {
    ...run,
    mode: "classic",
    status: "ready",
    activeId: null,
    legendaryTurn: undefined,
    combatants: sortInitiative(combatants),
  };
}

// Keep an ongoing pre-mode combat's timing, IDs, round and undo snapshots.
// Ready trackers adopt Nimble; ordinary live combats retain their manual order.
export function migrateInitiativeCampaign(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const campaign = structuredClone(raw) as { tools?: unknown[] };
  const upgrade = (value: unknown) => {
    const run = value as Run;
    if (!Array.isArray(run?.combatants) || run.mode) return value;
    const mode =
      run.status === "ready" ||
      !!run.legendaryTurn ||
      run.combatants.some(
        (c) => isLegendary(c) || c.monster?.record.fields.legendary === true,
      )
        ? "nimble"
        : "classic";
    return { ...run, mode };
  };
  campaign.tools = campaign.tools?.map((value) => {
    const tool = value as { kind: string; run: Run; history: Run[] };
    return tool.kind === "initiative"
      ? { ...tool, run: upgrade(tool.run), history: tool.history.map(upgrade) }
      : value;
  });
  return campaign;
}
