import type { Character } from "../schemas/character";

/** One wire format for browser storage, exports, and cloud sync. */
export function serializeCharacter(character: Character) {
  return {
    ...character,
    _abilityUses:
      character._abilityUses instanceof Map
        ? Object.fromEntries(character._abilityUses)
        : character._abilityUses,
    _resourceValues:
      character._resourceValues instanceof Map
        ? Object.fromEntries(character._resourceValues)
        : character._resourceValues,
  };
}

export function characterFingerprint(character: Character): string {
  return JSON.stringify(serializeCharacter(character));
}

/** Preserve changes and deletions made since the request started. */
export function mergeSyncResponse(
  snapshot: Character[],
  remote: Character[],
  current: Character[],
): Character[] {
  const sent = new Map(snapshot.map((c) => [c.id, characterFingerprint(c)]));
  const local = new Map(current.map((c) => [c.id, c]));
  const merged = new Map<string, Character>();
  for (const character of remote) {
    const latest = local.get(character.id);
    if (sent.has(character.id) && !latest) continue;
    merged.set(
      character.id,
      latest && sent.get(character.id) !== characterFingerprint(latest) ? latest : character,
    );
  }
  for (const character of current)
    if (!merged.has(character.id)) merged.set(character.id, character);
  return [...merged.values()];
}
