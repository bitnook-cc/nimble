import { characterSchema } from "../schemas/character";
import {
  ICharacterRepository,
  LocalStorageCharacterRepository,
} from "../storage/character-repository";
import { Character, CreateCharacterData } from "../schemas/character";
import { mergeWithDefaultCharacter } from "../utils/character-defaults";

export class CharacterStorageService {
  private readonly characterListStorageKey = "nimble-navigator-character-list";

  constructor(private repository: ICharacterRepository = new LocalStorageCharacterRepository()) {}

  async createCharacter(character: Character, id?: string): Promise<Character> {
    const validated = characterSchema.parse(character);
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
          char.id || `recovered-${Date.now()}`,
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
      character.updatedAt = new Date();
      await this.updateCharacter(character);
    }
  }

  /**
   * Validates a character or attempts recovery by merging with defaults
   * @param character Raw character data from storage
   * @param id Character ID for recovery purposes
   * @returns Validated character or null if recovery fails
   */
  private async validateOrRecoverCharacter(character: any, id: string): Promise<Character | null> {
    try {
      return characterSchema.parse(character);
    } catch (error) {
      console.warn(
        `Character ${id} failed validation, attempting recovery by merging with defaults:`,
        error,
      );

      try {
        // Attempt to recover by merging with default character template
        const recoveredCharacter = mergeWithDefaultCharacter(character, id);

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
