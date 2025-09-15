import { Character } from "../schemas/character";
import { CURRENT_SCHEMA_VERSION, MIN_SUPPORTED_VERSION } from "../schemas/migration/constants";
import { getMigrationsForVersionRange } from "../schemas/migration/registry";
import { MigrationError, MigrationProgress, MigrationResult } from "../schemas/migration/types";

/**
 * Service for handling character schema migrations
 */
export class MigrationService {
  private static instance: MigrationService;
  private progressCallback?: (progress: MigrationProgress) => void;

  private constructor() {}

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Set a callback to receive migration progress updates
   */
  setProgressCallback(callback: (progress: MigrationProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Clear the progress callback
   */
  clearProgressCallback() {
    this.progressCallback = undefined;
  }

  /**
   * Check if a character needs migration
   */
  needsMigration(character: any): boolean {
    const version = character._schemaVersion || 0;
    return version < CURRENT_SCHEMA_VERSION;
  }

  /**
   * Check if a character can be migrated
   */
  canMigrate(character: any): boolean {
    const version = character._schemaVersion || 0;
    return version >= MIN_SUPPORTED_VERSION;
  }

  /**
   * Get the schema version of a character
   */
  getCharacterVersion(character: any): number {
    return character._schemaVersion || 0;
  }

  /**
   * Migrate a single character to the current schema version
   */
  async migrateCharacter(character: any): Promise<any> {
    const currentVersion = this.getCharacterVersion(character);

    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      return character;
    }

    if (currentVersion < MIN_SUPPORTED_VERSION) {
      throw new MigrationError(
        `Character schema version ${currentVersion} is too old to migrate (minimum supported: ${MIN_SUPPORTED_VERSION})`,
        currentVersion,
        character.id,
        character.name,
      );
    }

    const migrations = getMigrationsForVersionRange(currentVersion, CURRENT_SCHEMA_VERSION);
    let migratedCharacter = { ...character };

    for (const migration of migrations) {
      try {
        migratedCharacter = migration.migrate(migratedCharacter);
        // Ensure the version is updated
        migratedCharacter._schemaVersion = migration.version;
      } catch (error) {
        throw new MigrationError(
          `Failed to migrate character from version ${migration.version - 1} to ${migration.version}: ${error instanceof Error ? error.message : String(error)}`,
          migration.version,
          character.id,
          character.name,
          error instanceof Error ? error : undefined,
        );
      }
    }

    return migratedCharacter;
  }

  /**
   * Migrate multiple characters with progress tracking
   */
  async migrateCharacters(characters: any[]): Promise<MigrationResult> {
    const failedCharacters: any[] = [];
    let migratedCount = 0;
    const totalCharacters = characters.length;

    // Filter characters that need migration
    const charactersToMigrate = characters.filter((c) => this.needsMigration(c));

    if (charactersToMigrate.length === 0) {
      return {
        success: true,
        migratedCount: 0,
      };
    }

    // Calculate total migrations needed
    const totalMigrations = charactersToMigrate.reduce((sum, char) => {
      const currentVersion = this.getCharacterVersion(char);
      const migrations = getMigrationsForVersionRange(currentVersion, CURRENT_SCHEMA_VERSION);
      return sum + migrations.length;
    }, 0);

    let completedMigrations = 0;

    for (let charIndex = 0; charIndex < charactersToMigrate.length; charIndex++) {
      const character = charactersToMigrate[charIndex];
      const characterName = character.name || "Unknown Character";
      const currentVersion = this.getCharacterVersion(character);
      const migrations = getMigrationsForVersionRange(currentVersion, CURRENT_SCHEMA_VERSION);

      try {
        let migratedCharacter = { ...character };

        for (let migIndex = 0; migIndex < migrations.length; migIndex++) {
          const migration = migrations[migIndex];

          // Report progress
          if (this.progressCallback) {
            this.progressCallback({
              currentCharacter: characterName,
              currentCharacterIndex: charIndex,
              totalCharacters: charactersToMigrate.length,
              currentMigration: migration.description,
              currentMigrationIndex: migIndex,
              totalMigrations: migrations.length,
              overallProgress: Math.round((completedMigrations / totalMigrations) * 100),
            });
          }

          // Apply migration
          migratedCharacter = migration.migrate(migratedCharacter);
          migratedCharacter._schemaVersion = migration.version;
          completedMigrations++;
        }

        // Update the character in the original array
        const originalIndex = characters.indexOf(character);
        if (originalIndex !== -1) {
          characters[originalIndex] = migratedCharacter;
        }
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate character ${characterName}:`, error);
        failedCharacters.push(character);
      }
    }

    if (failedCharacters.length > 0) {
      return {
        success: false,
        error: `Failed to migrate ${failedCharacters.length} character(s)`,
        failedCharacters,
        migratedCount,
      };
    }

    return {
      success: true,
      migratedCount,
    };
  }

  /**
   * Create a downloadable JSON backup of characters
   */
  createBackupJson(characters: any[]): string {
    return JSON.stringify(characters, null, 2);
  }

  /**
   * Trigger download of character backup
   */
  downloadBackup(characters: any[], filename: string = "character-backup.json") {
    const json = this.createBackupJson(characters);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
