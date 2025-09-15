/**
 * Character Migration System Types
 */

/**
 * Represents a single migration from one schema version to the next
 */
export interface Migration {
  /** The target version this migration upgrades to */
  version: number;

  /** Human-readable description of what this migration does */
  description: string;

  /**
   * The migration function that transforms a character from the previous version
   * @param character - The character data in the previous version format
   * @returns The migrated character data in the new version format
   */
  migrate: (character: any) => any;
}

/**
 * Progress information for migration operations
 */
export interface MigrationProgress {
  /** Current character being migrated */
  currentCharacter: string;

  /** Index of current character (0-based) */
  currentCharacterIndex: number;

  /** Total number of characters to migrate */
  totalCharacters: number;

  /** Current migration being applied */
  currentMigration: string;

  /** Index of current migration (0-based) */
  currentMigrationIndex: number;

  /** Total number of migrations to apply */
  totalMigrations: number;

  /** Overall progress percentage (0-100) */
  overallProgress: number;
}

/**
 * Result of a migration operation
 */
export interface MigrationResult {
  /** Whether the migration succeeded */
  success: boolean;

  /** Error message if migration failed */
  error?: string;

  /** Characters that failed to migrate (for download) */
  failedCharacters?: any[];

  /** Number of characters successfully migrated */
  migratedCount?: number;
}

/**
 * Migration error with context
 */
export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly version: number,
    public readonly characterId: string,
    public readonly characterName: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "MigrationError";
  }
}
