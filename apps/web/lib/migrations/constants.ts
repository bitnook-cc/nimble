/**
 * Current schema version for character data
 * 
 * Increment this when making breaking changes to the character schema
 * and create a corresponding migration in the migrations/ directory
 */
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Minimum supported schema version
 * Characters below this version cannot be migrated
 */
export const MIN_SUPPORTED_VERSION = 0;