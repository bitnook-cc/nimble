import { z } from "zod";
import type { Combatant, Run } from "./model";
import type { ContentRecord } from "./content-schema";

export const legendaryStateSchema = z
  .object({
    phase: z.enum(["normal", "bloodied", "lastStand", "defeated"]),
    bloodiedAt: z.number().int().min(0).max(99999),
    lastStandMaxHp: z.number().int().min(1).max(99999).nullable(),
    lastStandHp: z.number().int().min(0).max(99999).nullable(),
    bloodiedText: z.string().max(100000),
    lastStandText: z.string().max(100000),
    groupId: z.string().min(1).optional(),
  })
  .superRefine((state, ctx) => {
    if (
      state.lastStandHp !== null &&
      (state.lastStandMaxHp === null ||
        state.lastStandHp > state.lastStandMaxHp)
    )
      ctx.addIssue({
        code: "custom",
        message: "Last Stand HP exceeds its maximum",
      });
  });

export const legendaryTurnSchema = z.object({
  afterId: z.string().min(1),
  groups: z
    .array(z.string().min(1))
    .min(1)
    .max(100)
    .refine(
      (groups) => new Set(groups).size === groups.length,
      "Duplicate legendary action groups",
    ),
  resumeId: z.string().min(1).nullable(),
  nextRound: z.boolean(),
});

// Preserve prose. Only recognize unambiguous pool declarations; unusual statblocks
// require a GM-entered pool, rather than inventing HP from a level/chart.
function section(body: string, heading: string) {
  return (
    body
      .match(
        new RegExp(
          "^##\\s+" + heading + "\\s*\\n([\\s\\S]*?)(?=^##\\s|$(?![\\s\\S]))",
          "im",
        ),
      )?.[1]
      .trim() ?? ""
  );
}
function phaseText(value: unknown): string {
  return typeof value === "string"
    ? value
    : value &&
        typeof value === "object" &&
        "description" in value &&
        typeof value.description === "string"
      ? value.description
      : "";
}
export function legendaryState(
  record: ContentRecord | undefined,
  maxHp: number,
  heroes = 1,
): z.infer<typeof legendaryStateSchema> {
  const bloodiedText =
    phaseText(record?.fields.bloodied) ||
    section(record?.body ?? "", "Bloodied");
  const lastStandText =
    phaseText(record?.fields.lastStand) ||
    section(record?.body ?? "", "Last stand");
  const explicit = Number(record?.fields.lastStandHp);
  const perHero = Number(record?.fields.lastStandHpPerHero);
  const declaration = lastStandText.match(/\b(\d+)\s+more damage\s+and\b/i);
  const amount =
    Number.isInteger(perHero) && perHero > 0
      ? perHero * heroes
      : Number.isInteger(explicit) && explicit > 0
        ? explicit
        : declaration
          ? Number(declaration[1])
          : null;
  const statedBloodied = Number(record?.fields.bloodiedAt);
  const bloodiedDeclaration =
    !record?.fields.hpPerHero &&
    bloodiedText.match(/(?:\bat|reduced to)\s+(\d+)\s*HP\b/i);
  const printedBloodied = bloodiedDeclaration
    ? Number(bloodiedDeclaration[1])
    : null;
  return legendaryStateSchema.parse({
    phase: "normal",
    bloodiedAt:
      Number.isInteger(statedBloodied) && statedBloodied >= 0
        ? statedBloodied
        : printedBloodied !== null
          ? printedBloodied
          : Math.floor(maxHp / 2),
    lastStandMaxHp: amount !== null && amount <= 99999 ? amount : null,
    lastStandHp: amount !== null && amount <= 99999 ? amount : null,
    bloodiedText,
    lastStandText,
  });
}

export function isLegendary(c: Combatant) {
  return !!c.legendary;
}
export function canAct(c: Combatant) {
  return c.legendary ? c.legendary.phase !== "defeated" : c.hp > 0;
}
export function legendaryGroup(c: Combatant) {
  return c.legendary?.groupId ?? c.id;
}
export function setCombatantHp(c: Combatant, hp: number): Combatant {
  hp = Math.max(0, Math.min(c.maxHp, hp));
  if (!c.legendary) return { ...c, hp };
  let state = { ...c.legendary };
  if (state.phase !== "defeated" && state.phase !== "lastStand") {
    if (hp === 0)
      state = {
        ...state,
        phase: "lastStand",
        lastStandHp: state.lastStandMaxHp,
      };
    else if (hp <= state.bloodiedAt) state.phase = "bloodied";
  }
  return { ...c, hp, legendary: state };
}
// A GM declaration of death also resolves legendary Last Stand.
export function defeatCombatant(c: Combatant): Combatant {
  return {
    ...c,
    hp: 0,
    ...(c.legendary && {
      legendary: {
        ...c.legendary,
        phase: "defeated" as const,
        lastStandHp: c.legendary.lastStandHp === null ? null : 0,
      },
    }),
  };
}
export function reviveCombatant(c: Combatant): Combatant {
  return {
    ...c,
    hp: 1,
    ...(c.legendary && {
      legendary: {
        ...c.legendary,
        phase:
          c.legendary.bloodiedAt >= 1
            ? ("bloodied" as const)
            : ("normal" as const),
        lastStandHp: c.legendary.lastStandMaxHp,
      },
    }),
  };
}
export function changeCombatantHp(c: Combatant, delta: number): Combatant {
  if (c.legendary?.phase === "lastStand") {
    if (c.legendary.lastStandHp === null) return c;
    const hp = Math.max(
      0,
      Math.min(c.legendary.lastStandMaxHp!, c.legendary.lastStandHp + delta),
    );
    return {
      ...c,
      legendary: {
        ...c.legendary,
        lastStandHp: hp,
        phase: hp === 0 ? "defeated" : "lastStand",
      },
    };
  }
  if (c.legendary?.phase === "defeated") return c;
  return setCombatantHp(c, c.hp + delta);
}

function regular(run: Run) {
  const alive = run.combatants.filter(canAct);
  // Solo actions replace the monster's ordinary initiative slot when heroes are present.
  return alive.some((c) => c.side === "hero")
    ? alive.filter((c) => !isLegendary(c))
    : alive;
}
function nextRegular(run: Run, afterId: string | null) {
  const order = regular(run);
  if (!order.length) return { id: null, wrap: false };
  const index = run.combatants.findIndex((c) => c.id === afterId);
  const next = run.combatants
    .slice(index + 1)
    .find((c) => order.some((o) => o.id === c.id));
  return { id: (next ?? order[0]).id, wrap: !next };
}
function resume(run: Run): Run {
  const pending = run.legendaryTurn!;
  const order = regular(run);
  const chosen = order.find((c) => c.id === pending.resumeId) ?? order[0];
  return {
    ...run,
    legendaryTurn: undefined,
    activeId: chosen?.id ?? null,
    round: run.round + (pending.nextRound && chosen ? 1 : 0),
    status: chosen ? (run.status === "paused" ? "paused" : "active") : "ready",
  };
}
export function repairLegendaryTurn(run: Run): Run {
  if (!run.legendaryTurn) return run;
  const groups = run.legendaryTurn.groups.filter((group) =>
    run.combatants.some(
      (c) => isLegendary(c) && canAct(c) && legendaryGroup(c) === group,
    ),
  );
  if (!groups.length) return resume(run);
  const active = run.combatants.find(
    (c) =>
      c.id === run.activeId && canAct(c) && legendaryGroup(c) === groups[0],
  );
  const first =
    active ??
    run.combatants.find(
      (c) => isLegendary(c) && canAct(c) && legendaryGroup(c) === groups[0],
    )!;
  return {
    ...run,
    activeId: first.id,
    legendaryTurn: { ...run.legendaryTurn, groups },
  };
}
export function advanceCombat(run: Run): Run {
  if (run.status === "paused" || run.status === "finished") return run;
  if (run.legendaryTurn) {
    const [current, ...groups] = run.legendaryTurn.groups;
    // A defeated/removed actor is skipped without consuming another group's action.
    const completed = run.combatants.find((c) => c.id === run.activeId);
    if (
      !completed ||
      legendaryGroup(completed) !== current ||
      !canAct(completed)
    )
      return repairLegendaryTurn(run);
    return groups.length
      ? repairLegendaryTurn({
          ...run,
          legendaryTurn: { ...run.legendaryTurn, groups },
        })
      : resume(run);
  }
  const order = regular(run);
  if (!order.length) return { ...run, activeId: null, status: "ready" };
  if (!run.activeId || run.status === "ready")
    return { ...run, activeId: order[0].id, status: "active" };
  const completed = run.combatants.find((c) => c.id === run.activeId);
  const next = nextRegular(run, run.activeId);
  if (completed?.side === "hero") {
    const groups = [
      ...new Set(
        run.combatants
          .filter((c) => isLegendary(c) && canAct(c))
          .map(legendaryGroup),
      ),
    ];
    if (groups.length)
      return repairLegendaryTurn({
        ...run,
        legendaryTurn: {
          afterId: completed.id,
          groups,
          resumeId: next.id,
          nextRound: next.wrap,
        },
      });
  }
  return {
    ...run,
    activeId: next.id,
    round: run.round + (next.wrap ? 1 : 0),
    status: "active",
  };
}
export function removeFromCombat(run: Run, id: string): Run {
  const combatants = run.combatants.filter((c) => c.id !== id);
  if (run.legendaryTurn) return repairLegendaryTurn({ ...run, combatants });
  if (run.activeId !== id) return { ...run, combatants };
  const next = nextRegular(run, id);
  const order = regular({ ...run, combatants });
  const chosen = order.find((c) => c.id === next.id) ?? order[0];
  return {
    ...run,
    combatants,
    activeId: chosen?.id ?? null,
    round: run.round + (next.wrap && chosen ? 1 : 0),
    status: chosen ? run.status : "ready",
  };
}

// Upgrade live runs and undo snapshots without advancing combat or refilling an
// already-zero legendary monster's unknown Last Stand pool.
export function migrateLegendaryCampaign(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const campaign = structuredClone(raw) as { tools?: unknown[] };
  const upgradeRun = (value: unknown) => {
    const run = value as Run;
    if (!Array.isArray(run?.combatants)) return value;
    return {
      ...run,
      combatants: run.combatants.map((c) => {
        if (c.legendary || c.monster?.record.fields.legendary !== true)
          return c;
        const state = legendaryState(c.monster.record, c.maxHp);
        state.phase =
          c.hp === 0
            ? "lastStand"
            : c.hp <= state.bloodiedAt
              ? "bloodied"
              : "normal";
        if (c.hp === 0) state.lastStandHp = null;
        return { ...c, legendary: state };
      }),
    };
  };
  campaign.tools = campaign.tools?.map((value) => {
    const tool = value as { kind: string; run: Run; history: Run[] };
    return tool.kind === "initiative"
      ? {
          ...tool,
          run: upgradeRun(tool.run),
          history: tool.history.map(upgradeRun),
        }
      : value;
  });
  return campaign;
}
