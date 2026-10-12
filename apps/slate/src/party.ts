import { z } from "zod";
import type { Run } from "./model";

// Local identity stays stable when a character is later linked to Sidekick.
export const characterSourceSchema = z.object({
  provider: z.literal("sidekick"),
  characterId: z.string().min(1).max(100),
  campaignId: z.string().min(1).max(100).optional(),
  lastSyncedAt: z.iso.datetime().optional(),
});
export const partyCharacterSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    playerName: z.string().trim().max(80),
    level: z.number().int().min(1).max(20),
    hp: z.number().int().min(0).max(99999),
    maxHp: z.number().int().min(1).max(99999),
    notes: z.string().max(500),
    source: characterSourceSchema.nullable(),
  })
  .refine(
    (character) => character.hp <= character.maxHp,
    "Current HP cannot exceed maximum HP.",
  );
export type PartyCharacter = z.infer<typeof partyCharacterSchema>;
export const partySchema = z
  .object({ characters: z.array(partyCharacterSchema).max(100) })
  .refine(
    (party) =>
      new Set(party.characters.map((character) => character.id)).size ===
      party.characters.length,
    "Duplicate party character IDs.",
  );
export type Party = z.infer<typeof partySchema>;

// A structural projection accepts Sidekick's full character model without making
// Slate depend on its Next.js app or online services. Live sync remains future work.
type SidekickCharacter = {
  id: string;
  name: string;
  level: number;
  hitPoints: { current: number; max: number };
};
export function characterFromSidekick(
  character: SidekickCharacter,
  localId: string,
  options: {
    playerName?: string;
    notes?: string;
    campaignId?: string;
    lastSyncedAt?: string;
  } = {},
): PartyCharacter {
  return partyCharacterSchema.parse({
    id: localId,
    name: character.name,
    level: character.level,
    hp: character.hitPoints.current,
    maxHp: character.hitPoints.max,
    playerName: options.playerName ?? "",
    notes: options.notes ?? "",
    source: {
      provider: "sidekick",
      characterId: character.id,
      ...(options.campaignId ? { campaignId: options.campaignId } : {}),
      ...(options.lastSyncedAt ? { lastSyncedAt: options.lastSyncedAt } : {}),
    },
  });
}

export function missingPartyCharacters(run: Run, party: Party) {
  const present = new Set(
    run.combatants.map((combatant) => combatant.partyCharacterId),
  );
  return party.characters.filter((character) => !present.has(character.id));
}
export function addPartyToRun(run: Run, party: Party): Run {
  const missing = missingPartyCharacters(run, party);
  if (!missing.length) return run;
  if (run.combatants.length + missing.length > 100)
    throw new Error(
      "There is not enough room for the party. An encounter supports up to 100 combatants. Remove combatants first.",
    );
  return {
    ...run,
    combatants: [
      ...run.combatants,
      ...missing.map((character) => ({
        id: crypto.randomUUID(),
        partyCharacterId: character.id,
        name: character.name,
        side: "hero" as const,
        initiative: null,
        hp: character.hp,
        maxHp: character.maxHp,
        notes: character.notes,
        conditions: "",
      })),
    ],
  };
}
