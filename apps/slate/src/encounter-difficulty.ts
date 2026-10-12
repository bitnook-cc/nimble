import { encounterFieldsSchema } from "./encounter-schema";
import { inspectEncounter } from "./encounters";
import type { Entry } from "./content";

// GMG v1 pp. 25–26, 42–43, as published on Nimble Nexus. The guide gives
// landmarks, not exact cutoffs in the gaps; keep those gaps visible.
export const difficultyRules = {
  difficulties: "https://nimble.nexus/rules/encounter-difficulties",
  levels: "https://nimble.nexus/rules/monster-levels",
  solo: "https://nimble.nexus/rules/legendary-monster-builder",
  minions: "https://nimble.nexus/rules/balancing-with-minions",
};
export function numericLevel(text: string): number | null {
  const value = text.trim();
  const fraction = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  const n = fraction
    ? Number(fraction[1]) / Number(fraction[2])
    : /^\d+(?:\.\d+)?$/.test(value)
      ? Number(value)
      : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
export function difficultyLabel(ratio: number) {
  if (ratio < 0.5) return "Easy";
  if (ratio < 0.75) return "Easy–medium";
  if (ratio === 0.75) return "Medium";
  if (ratio < 1) return "Medium–hard";
  if (ratio === 1) return "Hard";
  if (ratio <= 1.25) return "Deadly";
  if (ratio < 1.5) return "Deadly–very deadly";
  return "Very deadly";
}
export function encounterDifficulty(
  entry: Entry,
  all: Entry[],
  heroes: number,
  heroLevel?: number,
) {
  const fields = encounterFieldsSchema.parse(entry.fields);
  const level = heroLevel ?? fields.heroLevel;
  const partyBudget = Math.round(heroes * level * 1e6) / 1e6;
  const rows = inspectEncounter(entry, all, heroes);
  let monsterBudget = 0,
    ordinary = 0,
    minions = 0,
    solos = 0;
  const blockers: string[] = [],
    notes: string[] = [];
  if (!rows.length) blockers.push("Add a creature to estimate difficulty.");
  if (!(partyBudget > 0))
    blockers.push("Set a party level above zero to estimate difficulty.");
  for (const row of rows) {
    if (row.missing || !row.stats) {
      blockers.push(row.name + ": full statblock is missing.");
      continue;
    }
    if (row.stats.hazard) {
      blockers.push(row.name + ": hazards have no level-budget rating.");
      continue;
    }
    if (row.stats.minion) {
      minions += row.count;
      continue;
    }
    const monsterLevel = numericLevel(row.stats.level);
    if (monsterLevel === null) {
      blockers.push(row.name + ": monster level is not numeric.");
      continue;
    }
    if (row.stats.legendary) {
      solos += row.count;
      // A solo/team's printed level is compared to average hero level, not
      // the sum of hero levels. Count the team's level once, not per member.
      monsterBudget += monsterLevel * row.count;
    } else {
      if (row.stats.members)
        blockers.push(
          row.name +
            ": a non-legendary team has no declared individual member levels.",
        );
      ordinary += row.count * (row.stats.members?.length ?? 1);
      monsterBudget +=
        monsterLevel * row.count * (row.stats.members?.length ?? 1);
    }
  }
  if (solos)
    notes.push(
      "Legendary levels compare to average hero level. A solo or team at the party's level is a hard fight.",
    );
  if (solos && (ordinary || minions || solos > 1))
    blockers.push(
      "Mixed or multiple legendary groups need GM assessment; the guide does not give a combined difficulty formula.",
    );
  if (minions) {
    const perHero = minions / heroes;
    notes.push(
      minions +
        " minions (" +
        Number(perHero.toFixed(2)) +
        "/hero) add tactical pressure beyond the level budget: 1/hero slightly harder, 2–3/hero noticeably harder, 4/hero much harder.",
    );
    if (!ordinary && !solos)
      blockers.push(
        "Minion-only encounters have no numeric level-budget rating in GMG v1.",
      );
  }
  if (ordinary && !solos && (ordinary < heroes || ordinary > heroes * 4))
    notes.push(
      "Outside the usual 1–4 non-minion monsters per hero; action economy can change the difficulty.",
    );
  notes.push(
    "Estimate assumes a capable party; resources, terrain, abilities and tactics can change the outcome.",
  );
  monsterBudget = Math.round(monsterBudget * 1e6) / 1e6;
  const ratio =
    !blockers.length && partyBudget > 0
      ? Math.round((monsterBudget / (solos ? level : partyBudget)) * 1e6) / 1e6
      : null;
  const label =
    blockers.length || ratio === null
      ? "Unrated"
      : solos
        ? ratio === 1
          ? "Hard solo"
          : ratio < 1
            ? "Easier solo"
            : "Harder solo"
        : difficultyLabel(ratio);
  return {
    partyBudget,
    monsterBudget,
    heroLevel: level,
    ratio,
    label,
    blockers,
    notes,
    minions,
    solos,
  };
}
