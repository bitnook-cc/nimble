import { v4 as uuidv4 } from "uuid";

import { Character, CreateCharacterData } from "../schemas/character";
import { IStorageService } from "../services/storage-service";
import { ICharacterRepository } from "./character-repository";

// Type for serialized character (with Maps converted to objects)
type SerializedCharacter = Omit<Character, "_abilityUses" | "_resourceValues" | "timestamps"> & {
  _abilityUses: Record<string, unknown>;
  _resourceValues: Record<string, unknown>;
  timestamps?: {
    createdAt?: number;
    updatedAt?: number;
  };
};

/**
 * Character repository implementation that uses the injected storage service
 * This allows us to swap between localStorage and in-memory storage for testing
 */
export class StorageBasedCharacterRepository implements ICharacterRepository {
  private readonly storageKey = "sheets-characters";
  private readonly oldStorageKeys = ["nimble-navigator-characters"];

  constructor(private storage: IStorageService) {
    this.migrateFromOldKeys();
  }

  /**
   * Migrate data from old storage keys to new key
   */
  private migrateFromOldKeys(): void {
    // Check if new key already has data
    const existingData = this.storage.getItem(this.storageKey);
    if (existingData) {
      return; // Already migrated or has data
    }

    // Try to find data in old keys
    for (const oldKey of this.oldStorageKeys) {
      const oldData = this.storage.getItem(oldKey);
      if (oldData) {
        // Copy to new key
        this.storage.setItem(this.storageKey, oldData);
        // Remove old key
        this.storage.removeItem(oldKey);
        console.log(`Migrated character data from ${oldKey} to ${this.storageKey}`);
        return;
      }
    }
  }

  async save(character: Character): Promise<void> {
    const serializedCharacters = await this.getSerializedCharacters();
    const index = serializedCharacters.findIndex((c) => c.id === character.id);

    // Update timestamp
    if (!character.timestamps) {
      character.timestamps = {};
    }
    character.timestamps.updatedAt = Date.now();

    // Convert to serializable format
    const serializable = this.serializeCharacter(character);

    if (index >= 0) {
      serializedCharacters[index] = serializable;
    } else {
      serializedCharacters.push(serializable);
    }

    await this.saveSerializedCharacters(serializedCharacters);
  }

  async load(id: string): Promise<Character | null> {
    const characters = await this.list();
    return characters.find((c) => c.id === id) || null;
  }

  async list(): Promise<Character[]> {
    const serializedCharacters = await this.getSerializedCharacters();
    return serializedCharacters.map((char) => this.deserializeCharacter(char));
  }

  async delete(id: string): Promise<void> {
    const serializedCharacters = await this.getSerializedCharacters();
    const filtered = serializedCharacters.filter((c) => c.id !== id);
    await this.saveSerializedCharacters(filtered);
  }

  async create(data: CreateCharacterData, id?: string): Promise<Character> {
    const character: Character = {
      ...data,
      id: id || uuidv4(),
      timestamps: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    } as Character;

    await this.save(character);
    return character;
  }

  async clear(): Promise<void> {
    await this.saveSerializedCharacters([]);
  }

  /**
   * Private method to get raw serialized characters from storage
   */
  private async getSerializedCharacters(): Promise<SerializedCharacter[]> {
    const stored = this.storage.getItem(this.storageKey);
    if (!stored) return [];

    try {
      return JSON.parse(stored) as SerializedCharacter[];
    } catch {
      return [];
    }
  }

  /**
   * Private method to save serialized characters to storage
   */
  private async saveSerializedCharacters(characters: SerializedCharacter[]): Promise<void> {
    this.storage.setItem(this.storageKey, JSON.stringify(characters));
  }

  /**
   * Private method to convert Character to SerializedCharacter
   */
  private serializeCharacter(character: Character): SerializedCharacter {
    return {
      ...character,
      _abilityUses:
        character._abilityUses instanceof Map
          ? Object.fromEntries(character._abilityUses)
          : character._abilityUses,
      _resourceValues:
        character._resourceValues instanceof Map
          ? Object.fromEntries(character._resourceValues)
          : character._resourceValues,
    };
  }

  /**
   * Private method to convert SerializedCharacter to Character
   */
  private deserializeCharacter(char: SerializedCharacter): Character {
    return {
      ...char,
      timestamps: {
        createdAt: char.timestamps?.createdAt || Date.now(),
        updatedAt: char.timestamps?.updatedAt || Date.now(),
      },
      // Convert objects back to Maps, handling both correct serialization and legacy formats
      _abilityUses: new Map(
        char._abilityUses instanceof Map
          ? char._abilityUses // Already a Map (shouldn't happen but defensive)
          : Object.entries(char._abilityUses || {}).filter(
              ([key, value]) => key && value !== undefined && value !== null,
            ),
      ),
      _resourceValues: new Map(
        Object.entries(char._resourceValues || {}).map(([key, value]) => {
          // Ensure the value has the correct structure
          if (typeof value === "object" && value !== null && "type" in value) {
            return [key, value] as [string, { type: "numerical"; value: number }];
          }
          // Handle legacy numeric values
          if (typeof value === "number") {
            return [key, { type: "numerical" as const, value }];
          }
          // Default fallback
          return [key, { type: "numerical" as const, value: 0 }];
        }),
      ),
    } as Character;
  }
}
