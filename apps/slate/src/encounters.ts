import { encounterFieldsSchema } from "./encounter-schema";
import { monsterStatsSchema } from "./monster-schema";
import { resolveEntry, type Entry } from "./content";
import { addMonsterToRun } from "./monsters";
import { newRun, runSchema, type Run } from "./model";
import { addPartyToRun, type Party } from "./party";

export function inspectEncounter(entry: Entry, all: Entry[], heroes: number) {
  const fields = encounterFieldsSchema.parse(entry.fields);
  if (!Number.isInteger(heroes) || heroes < 1 || heroes > 100)
    throw new Error("Choose a party size from 1 to 100.");
  return fields.entries.map((link) => {
    const monster = resolveEntry(all, link.target);
    const stats =
      monster?.kind === "monster"
        ? monsterStatsSchema.parse(monster.fields)
        : undefined;
    const rawCount = stats?.legendary
      ? 1
      : link.isPerHero
        ? (link.quantity * heroes) / link.heroesPerMonster
        : link.quantity;
    // Counts can be fractional in Nexus; make the required rounding visible to the GM.
    const count = Math.ceil(rawCount);
    return {
      ...link,
      monster,
      stats,
      count,
      rawCount,
      missing: !stats || !!stats.incomplete,
    };
  });
}
export function encounterSummary(
  entry: Entry,
  all: Entry[],
  heroes: number,
  party?: Party,
) {
  const rows = inspectEncounter(entry, all, heroes);
  const blockers: string[] = [];
  if (!rows.length) blockers.push("Add at least one creature, team or hazard.");
  let combatants = party?.characters.length ?? 0,
    hazards = 0;
  for (const row of rows) {
    if (row.missing)
      blockers.push(
        `${row.name}: missing full statblock or family dependencies.`,
      );
    if (row.stats?.hazard) hazards += row.count;
    else combatants += row.count * (row.stats?.members?.length ?? 1);
    const members = row.stats?.members ?? (row.stats ? [row.stats] : []);
    if (
      members.some(
        (m) => m.hpPerHero !== undefined && m.hpPerHero * heroes > 99999,
      )
    )
      blockers.push(`${row.name}: scaled HP exceeds 99,999.`);
  }
  if (combatants > 100)
    blockers.push(
      `Resolves to ${combatants} combatants; the limit is 100 including party PCs.`,
    );
  if (hazards > 100)
    blockers.push(`Resolves to ${hazards} hazards; the limit is 100.`);
  return { rows, combatants, hazards, blockers };
}

export function startEncounter(
  entry: Entry,
  all: Entry[],
  heroes: number,
  party?: Party,
): Run {
  if (entry.kind !== "encounter") throw new Error("Choose an encounter.");
  const rows = inspectEncounter(entry, all, heroes);
  if (rows.some((row) => row.missing))
    throw new Error(
      "Missing full statblocks or family dependencies. Import them before starting combat.",
    );
  const summary = encounterSummary(entry, all, heroes, party);
  if (summary.blockers.length) throw new Error(summary.blockers.join(" "));
  let run = { ...newRun(), name: entry.title.slice(0, 100) };
  if (party) run = addPartyToRun(run, party);
  for (const row of rows) {
    if (row.count > 100)
      throw new Error("Resolved encounter exceeds 100 entries.");
    for (let i = 0; i < row.count; i++)
      run = addMonsterToRun(run, row.monster!, heroes);
  }
  return runSchema.parse(run);
}
