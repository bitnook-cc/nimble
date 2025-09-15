import { Migration } from './types';
import { v0ToV1Migration } from './migrations/v0-to-v1';
import { v1ToV2Migration } from './migrations/v1-to-v2';
import { v2ToV3Migration } from './migrations/v2-to-v3';

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
  v2ToV3Migration,
  // Add new migrations here as the schema evolves
];

/**
 * Get all migrations needed to upgrade from one version to another
 */
export function getMigrationsForVersionRange(fromVersion: number, toVersion: number): Migration[] {
  return migrations.filter(m => m.version > fromVersion && m.version <= toVersion);
}