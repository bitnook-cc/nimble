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
  migrate: (character: unknown) => {
    const updatedCharacter = { ...(character as Record<string, unknown>) };

    // Add advantage field to all skills
    if (updatedCharacter._skills && typeof updatedCharacter._skills === "object") {
      const skills = updatedCharacter._skills as Record<string, unknown>;
      for (const skillName in skills) {
        const skill = skills[skillName];
        if (skill && typeof skill === "object") {
          const skillObj = skill as Record<string, unknown>;
          skills[skillName] = {
            ...skillObj,
            advantage: skillObj.advantage ?? 0,
          };
        }
      }
    }

    // Add advantage field to initiative
    if (updatedCharacter._initiative && typeof updatedCharacter._initiative === "object") {
      const initiative = updatedCharacter._initiative as Record<string, unknown>;
      updatedCharacter._initiative = {
        ...initiative,
        advantage: initiative.advantage ?? 0,
      };
    }

    // Update schema version
    updatedCharacter._schemaVersion = 5;

    return updatedCharacter;
  },
};
