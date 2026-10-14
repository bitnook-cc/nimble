import { legendaryState } from "./legendary";
import { monsterStatsSchema, isReferenceMonster } from "./monster-schema";
import { recordSchema } from "./content-schema";
import type { Entry } from "./content";
import type { Run, Combatant } from "./model";

export function addMonsterToRun(run: Run, entry: Entry, heroes = 1): Run {
  if (isReferenceMonster(entry))
    throw new Error(
      "Reference-only monsters cannot be added to Nimble combat.",
    );
  if (entry.kind !== "monster") throw new Error("Choose a monster statblock.");
  const record = recordSchema.parse(entry);
  const stats = monsterStatsSchema.parse(record.fields);
  if (stats.incomplete)
    throw new Error(
      "This statblock is incomplete. Import its full record and dependencies first.",
    );
  if (stats.hazard) {
    if ((run.hazards?.length ?? 0) >= 100)
      throw new Error("An encounter supports up to 100 hazards.");
    return {
      ...run,
      hazards: [
        ...(run.hazards ?? []),
        {
          id: crypto.randomUUID(),
          target: entry.target,
          record: structuredClone(record),
        },
      ],
    };
  }
  const members = stats.members ?? [
    {
      name: record.title,
      hp: stats.hp!,
      hpPerHero: stats.hpPerHero,
      armor: stats.armor,
      size: stats.size,
      saves: stats.saves,
      body: record.body,
    },
  ];
  if (run.combatants.length + members.length > 100)
    throw new Error(
      "An encounter supports up to 100 combatants. Remove a combatant first.",
    );
  if (!Number.isInteger(heroes) || heroes < 1 || heroes > 100)
    throw new Error("Choose a party size from 1 to 100.");
  const groupId =
    stats.legendary && stats.members ? crypto.randomUUID() : undefined;
  const added: Combatant[] = members.map((member) => {
    const maxHp =
      member.hpPerHero === undefined ? member.hp : member.hpPerHero * heroes;
    if (maxHp > 99999) throw new Error("Resolved HP exceeds the combat limit.");
    return {
      id: crypto.randomUUID(),
      name: member.name.slice(0, 80),
      side: "enemy",
      initiative: null,
      hp: maxHp,
      maxHp,
      conditions: "",
      notes: "",
      ...(stats.legendary
        ? {
            legendary: {
              ...legendaryState(
                {
                  ...record,
                  body: record.body + "\n\n" + member.body,
                  fields: { ...record.fields, ...member },
                },
                maxHp,
                heroes,
              ),
              ...(groupId ? { groupId } : {}),
            },
          }
        : {}),
      monster: {
        target: entry.target,
        record: structuredClone(
          stats.members
            ? {
                ...record,
                title: member.name,
                body: record.body + "\n\n" + member.body,
                fields: {
                  ...record.fields,
                  members: undefined,
                  hp: maxHp,
                  hpPerHero: undefined,
                  armor: member.armor,
                  size: member.size,
                  saves: member.saves,
                },
              }
            : record,
        ),
      },
    };
  });
  return { ...run, combatants: [...run.combatants, ...added] };
}
