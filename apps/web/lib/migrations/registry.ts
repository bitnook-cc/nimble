import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import { Migration } from './types';

/**
 * Migration from version 0 to version 1
 * Renames all effect-related fields to trait-related fields
 */
const v0ToV1Migration: Migration = {
  version: 1,
  description: 'Rename effect fields to trait fields',
  migrate: (character: any) => {
    const migrated = { ...character };
    
    // Add schema version (v0 characters don't have it)
    migrated._schemaVersion = 1;
    
    // Rename effectSelections to traitSelections
    if ('effectSelections' in migrated) {
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
        if ('grantedByEffectId' in updatedSelection) {
          updatedSelection.grantedByTraitId = updatedSelection.grantedByEffectId;
          delete updatedSelection.grantedByEffectId;
        }
        
        return updatedSelection;
      });
    }
    
    return migrated;
  }
};

/**
 * Migration from version 1 to version 2
 * Converts non-UUID character IDs to UUIDs
 */
const v1ToV2Migration: Migration = {
  version: 2,
  description: 'Convert character IDs to UUIDs',
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
  }
};

/**
 * Registry of all character migrations
 * 
 * Add new migrations here in order. Each migration should:
 * 1. Have a version number that's one higher than the previous
 * 2. Transform a character from version N-1 to version N
 * 3. Be idempotent (safe to run multiple times)
 */
export const migrations: Migration[] = [
  v0ToV1Migration,
  v1ToV2Migration,
  // Add new migrations here as the schema evolves
];

/**
 * Get all migrations needed to upgrade from one version to another
 */
export function getMigrationsForVersionRange(fromVersion: number, toVersion: number): Migration[] {
  return migrations.filter(m => m.version > fromVersion && m.version <= toVersion);
}