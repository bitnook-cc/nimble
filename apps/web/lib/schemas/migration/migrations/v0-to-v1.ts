import { Migration } from "../types";

/**
 * Migration from version 0 to version 1
 * Renames all effect-related fields to trait-related fields
 */
export const v0ToV1Migration: Migration = {
  version: 1,
  description: "Rename effect fields to trait fields",
  migrate: (character: any) => {
    const migrated = { ...character };

    // Add schema version (v0 characters don't have it)
    migrated._schemaVersion = 1;

    // Rename effectSelections to traitSelections
    if ("effectSelections" in migrated) {
      migrated.traitSelections = migrated.effectSelections;
      delete migrated.effectSelections;
    }

    // Ensure traitSelections exists even if empty
    if (!migrated.traitSelections) {
      migrated.traitSelections = [];
    }

    // Migrate each trait selection's internal structure
    if (Array.isArray(migrated.traitSelections)) {
      migrated.traitSelections = migrated.traitSelections.map((selection: any) => {
        const updatedSelection = { ...selection };

        // Rename grantedByEffectId to grantedByTraitId
        if ("grantedByEffectId" in updatedSelection) {
          updatedSelection.grantedByTraitId = updatedSelection.grantedByEffectId;
          delete updatedSelection.grantedByEffectId;
        }

        return updatedSelection;
      });
    }

    return migrated;
  },
};
