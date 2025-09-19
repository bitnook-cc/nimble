import { Migration } from "../types";

/**
 * Migration from v4 to v5: Add advantage field to skills
 *
 * Changes:
 * - Adds `advantage: 0` to all skill objects in character._skills
 * - Adds `advantage: 0` to character._initiative
 */
export const v4ToV5Migration: Migration = {
  version: 5,
  description: "Add advantage field to skills",
  migrate: (character: any) => {
    const updatedCharacter = { ...character };

    // Add advantage field to all skills
    if (updatedCharacter._skills && typeof updatedCharacter._skills === "object") {
      for (const skillName in updatedCharacter._skills) {
        const skill = updatedCharacter._skills[skillName];
        if (skill && typeof skill === "object") {
          updatedCharacter._skills[skillName] = {
            ...skill,
            advantage: skill.advantage ?? 0,
          };
        }
      }
    }

    // Add advantage field to initiative
    if (updatedCharacter._initiative && typeof updatedCharacter._initiative === "object") {
      updatedCharacter._initiative = {
        ...updatedCharacter._initiative,
        advantage: updatedCharacter._initiative.advantage ?? 0,
      };
    }

    // Update schema version
    updatedCharacter._schemaVersion = 5;

    return updatedCharacter;
  },
};
