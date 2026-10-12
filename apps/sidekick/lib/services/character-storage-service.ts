import { v4 as uuidv4 } from "uuid";

import { characterSchema } from "../schemas/character";
import { Character } from "../schemas/character";
import { CURRENT_SCHEMA_VERSION } from "../schemas/migration/constants";
import { ICharacterRepository } from "../storage/character-repository";
import { StorageBasedCharacterRepository } from "../storage/storage-based-character-repository";
import { mergeWithDefaultCharacter } from "../utils/character-defaults";
import { mergeSyncResponse } from "../utils/character-serialization";
import { MigrationService } from "./migration-service";
import { IStorageService, LocalStorageService } from "./storage-service";

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
      _schemaVersion: CURRENT_SCHEMA_VERSION,
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
        const validatedChar = await this.validateOrRecoverCharacter(char, char.id || uuidv4());
        if (validatedChar) {
          validCharacters.push(validatedChar);
        } else {
          throw new Error(
            `Character ${char.id} could not be recovered; sync stopped to preserve stored data`,
          );
        }
      }

      return validCharacters;
    } catch (error) {
      console.error("Failed to load character list:", error);
      throw error;
    }
  }

  async updateCharacter(character: Character): Promise<void> {
    const validated = characterSchema.parse(character);
    await this.repository.save(validated);
  }

  async acceptCampaignInventory(
    characterId: string,
    inventory: Character["inventory"],
    revision: number,
  ): Promise<void> {
    await this.repository.updateAll((current) =>
      current.map((character) => {
        if (character.id !== characterId) return character;
        if ((character._inventoryRevision || 0) > revision)
          throw new Error("Inventory changed again. Refresh before accepting it.");
        return characterSchema.parse({
          ...character,
          inventory,
          _inventoryRevision: revision,
          timestamps: {
            ...character.timestamps,
            updatedAt: Math.max(Date.now(), (character.timestamps?.updatedAt || 0) + 1),
          },
        });
      }),
    );
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateLastPlayed(_characterId: string): Promise<void> {
    // Viewing a character is not an edit and must not change its sync revision.
  }

  /**
   * Check if any characters need migration
   * @returns Array of characters that need migration
   */
  async getCharactersNeedingMigration(): Promise<Character[]> {
    try {
      const allCharacters = await this.repository.list();
      return allCharacters.filter((char) => this.migrationService.needsMigration(char));
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
    const validated = characters.map((c) => characterSchema.parse(c));
    await this.repository.updateAll(() => validated);
  }

  async mergeSyncedCharacters(snapshot: Character[], remote: Character[]): Promise<Character[]> {
    // Reject the whole response before changing stored data if any entry is invalid.
    const validated = remote.map((c) => characterSchema.parse(c));
    return this.repository.updateAll((current) => mergeSyncResponse(snapshot, validated, current));
  }

  /**
   * Validates a character or attempts recovery by merging with defaults
   * @param character Raw character data from storage
   * @param id Character ID for recovery purposes
   * @returns Validated character or null if recovery fails
   */
  private async validateOrRecoverCharacter(
    character: Partial<Character>,
    id: string,
  ): Promise<Character | null> {
    const needsMigration = this.migrationService.needsMigration(character);
    try {
      // First, check if the character needs migration
      if (needsMigration) {
        console.info(
          `Character ${id} needs migration from version ${character._schemaVersion || 0} to ${CURRENT_SCHEMA_VERSION}`,
        );

        try {
          character = await this.migrationService.migrateCharacter(character);
          console.info(`Successfully migrated character ${id}`);
        } catch (migrationError) {
          console.error(`Failed to migrate character ${id}:`, migrationError);
          // Continue with recovery attempt below
        }
      }

      const validatedCharacter = characterSchema.parse(character);

      // Persist only a migration, retaining the original modification time.
      if (needsMigration) await this.repository.save(validatedCharacter, true);

      if (validatedCharacter.id !== id) {
        await this.repository.delete(id); // Remove old entry if ID changed during migration
      }

      return validatedCharacter;
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
        await this.repository.save(validatedCharacter, true);

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
