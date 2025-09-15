import { v4 as uuidv4, validate as validateUuid } from "uuid";

import { Migration } from "../types";

/**
 * Migration from version 1 to version 2
 * Converts non-UUID character IDs to UUIDs
 */
export const v1ToV2Migration: Migration = {
  version: 2,
  description: "Convert character IDs to UUIDs",
  migrate: (character: any) => {
    const migrated = { ...character };

    // Update schema version
    migrated._schemaVersion = 2;

    // Convert ID to UUID if it's not already a valid UUID
    if (migrated.id && !validateUuid(migrated.id)) {
      // Keep a mapping for potential future reference (could be stored elsewhere)
      const oldId = migrated.id;
      migrated.id = uuidv4();
      // Optionally store old ID in metadata (not part of schema, for debugging)
      migrated._oldId = oldId;
    }

    return migrated;
  },
};
