import { Migration } from "../types";

/**
 * Migration from v3 to v4: Remove freeform abilities
 *
 * Changes:
 * - Removes all freeform abilities from character._abilities array
 * - Freeform abilities have been completely removed from the system
 */
export const v3ToV4Migration: Migration = {
  version: 4,
  description: "Remove freeform abilities",
  migrate: (character: any) => {
    const updatedCharacter = { ...character };

    // Remove any freeform abilities from the _abilities array
    if (updatedCharacter._abilities && Array.isArray(updatedCharacter._abilities)) {
      updatedCharacter._abilities = updatedCharacter._abilities.filter(
        (ability: any) => ability.type !== "freeform",
      );
    }

    // Update schema version
    updatedCharacter._schemaVersion = 4;

    return updatedCharacter;
  },
};
