import { Syncable } from './syncable';

/**
 * Helper to check if one syncable entity is newer than another
 * Used for timestamp-based conflict resolution
 */
export function isNewerThan(a: Syncable, b: Syncable): boolean {
  const aTime = a.timestamps?.updatedAt || a.timestamps?.createdAt || 0;
  const bTime = b.timestamps?.updatedAt || b.timestamps?.createdAt || 0;
  return aTime > bTime;
}