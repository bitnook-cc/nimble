import { Migration } from "../types";

/**
 * Migration from v3 to v4
 * Renames maxSize to maxDice in dice pool definitions
 */
export const v3ToV4Migration: Migration = {
  version: 4,
  description: "Rename maxSize to maxDice in dice pool definitions",
  migrate: (character: any) => {
    const migrated = { ...character };
    
    // Update schema version
    migrated._schemaVersion = 4;
    
    // Migrate dice pools if they exist
    if (migrated._dicePools && Array.isArray(migrated._dicePools)) {
      migrated._dicePools = migrated._dicePools.map((pool: any) => {
        if (pool.definition && pool.definition.maxSize !== undefined) {
          const updatedPool = {
            ...pool,
            definition: {
              ...pool.definition,
              maxDice: pool.definition.maxSize,
            }
          };
          // Remove the old maxSize property
          delete updatedPool.definition.maxSize;
          return updatedPool;
        }
        return pool;
      });
    }
    
    return migrated;
  },
};