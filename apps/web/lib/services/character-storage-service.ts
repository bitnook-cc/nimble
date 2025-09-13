import { v4 as uuidv4 } from 'uuid';
import { characterSchema } from "../schemas/character";
import { Character, CreateCharacterData } from "../schemas/character";
import { ICharacterRepository } from "../storage/character-repository";
import { StorageBasedCharacterRepository } from "../storage/storage-based-character-repository";
import { mergeWithDefaultCharacter } from "../utils/character-defaults";
import { IStorageService, LocalStorageService } from "./storage-service";
import { MigrationService } from "./migration-service";
import { CURRENT_SCHEMA_VERSION } from "../migrations/constants";

export class CharacterStorageService {
  private readonly characterListStorageKey = "nimble-navigator-character-list";
  private repository: ICharacterRepository;
  private migrationService: MigrationService;

  constructor(storageService?: IStorageService) {
    // If a storage service is provided, use it; otherwise use default localStorage
    const storage = storageService || new LocalStorageService();
    this.repository = new StorageBasedCharacterRepository(storage);
    this.migrationService = MigrationService.getInstance();
  }

  async createCharacter(character: Character, id?: string): Promise<Character> {
    // Ensure new characters have the current schema version
    const characterWithVersion = {
      ...character,
      _schemaVersion: CURRENT_SCHEMA_VERSION
    };
    const validated = characterSchema.parse(characterWithVersion);
    return this.repository.create(validated, id);
  }

  async getCharacter(id: string): Promise<Character | null> {
    const character = await this.repository.load(id);
    if (!character) return null;

    return this.validateOrRecoverCharacter(character, id);
  }

  async getAllCharacters(): Promise<Character[]> {
    try {
      const characters = await this.repository.list();
      const validCharacters: Character[] = [];

      for (const char of characters) {
        const validatedChar = await this.validateOrRecoverCharacter(
          char,
          char.id || uuidv4(),
        );
        if (validatedChar) {
          validCharacters.push(validatedChar);
        }
      }

      return validCharacters;
    } catch (error) {
      console.error("Failed to load character list:", error);
      return [];
    }
  }

  async updateCharacter(character: Character): Promise<void> {
    const validated = characterSchema.parse(character);
    await this.repository.save(validated);
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateLastPlayed(characterId: string): Promise<void> {
    const character = await this.getCharacter(characterId);
    if (character) {
      if (!character.timestamps) {
        character.timestamps = {};
      }
      character.timestamps.updatedAt = Date.now();
      await this.updateCharacter(character);
    }
  }

  /**
   * Check if any characters need migration
   * @returns Array of characters that need migration
   */
  async getCharactersNeedingMigration(): Promise<any[]> {
    try {
      const allCharacters = await this.repository.list();
      return allCharacters.filter(char => this.migrationService.needsMigration(char));
    } catch (error) {
      console.error("Failed to check for characters needing migration:", error);
      return [];
    }
  }

  /**
   * Replace all characters with a new set, validating each one
   * Used for sync operations
   */
  async replaceAllCharacters(characters: Character[]): Promise<void> {
    console.log(`[CharacterStorage] Replacing all characters with ${characters.length} new characters`);
    
    // Validate all characters first
    const validatedCharacters: Character[] = [];
    for (const char of characters) {
      try {
        const validated = characterSchema.parse(char);
        validatedCharacters.push(validated);
      } catch (error) {
        console.error(`[CharacterStorage] Failed to validate character ${char.id}:`, error);
        // Try to recover the character
        const recovered = await this.validateOrRecoverCharacter(char, char.id || uuidv4());
        if (recovered) {
          validatedCharacters.push(recovered);
        }
      }
    }
    
    // Clear existing characters and save the new ones
    // This is done through the repository which handles the storage
    await this.repository.clear();
    for (const char of validatedCharacters) {
      await this.repository.save(char);
    }
    
    console.log(`[CharacterStorage] Successfully replaced with ${validatedCharacters.length} validated characters`);
  }

  /**
   * Validates a character or attempts recovery by merging with defaults
   * @param character Raw character data from storage
   * @param id Character ID for recovery purposes
   * @returns Validated character or null if recovery fails
   */
  private async validateOrRecoverCharacter(character: any, id: string): Promise<Character | null> {
    try {
      // First, check if the character needs migration
      if (this.migrationService.needsMigration(character)) {
        console.info(`Character ${id} needs migration from version ${character._schemaVersion || 0} to ${CURRENT_SCHEMA_VERSION}`);
        
        try {
          character = await this.migrationService.migrateCharacter(character);
          console.info(`Successfully migrated character ${id}`);
        } catch (migrationError) {
          console.error(`Failed to migrate character ${id}:`, migrationError);
          // Continue with recovery attempt below
        }
      }

      return characterSchema.parse(character);
    } catch (error) {
      console.warn(
        `Character ${id} failed validation, attempting recovery by merging with defaults:`,
        error,
      );

      try {
        // Attempt to recover by merging with default character template
        const recoveredCharacter = mergeWithDefaultCharacter(character, id);
        
        // Ensure the recovered character has the current schema version
        recoveredCharacter._schemaVersion = CURRENT_SCHEMA_VERSION;

        // Validate the recovered character
        const validatedCharacter = characterSchema.parse(recoveredCharacter);

        // Save the recovered character back to storage
        await this.repository.save(validatedCharacter);

        console.info(`Successfully recovered character ${id} by merging with defaults`);
        return validatedCharacter;
      } catch (recoveryError) {
        console.error(
          `Failed to recover character ${id} even after merging with defaults:`,
          recoveryError,
        );
        return null;
      }
    }
  }
}

export const characterStorageService = new CharacterStorageService();
