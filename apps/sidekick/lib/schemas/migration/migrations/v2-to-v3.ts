import { Migration } from "../types";

/**
 * Migration from v2 to v3
 * Adds the _dicePools field for managing dice pool resources
 */
export const v2ToV3Migration: Migration = {
  version: 3,
  description: "Add dice pools field for managing pool-based resources",
  migrate: (character: unknown) => {
    const char = character as Record<string, unknown>;
    return {
      ...char,
      // Add empty dice pools array if it doesn't exist
      _dicePools: char._dicePools || [],
      _schemaVersion: 3,
    };
  },
};
