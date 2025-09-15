import { v4 as uuidv4 } from "uuid";

import { Character, CreateCharacterData } from "../schemas/character";
import { IStorageService } from "../services/storage-service";
import { ICharacterRepository } from "./character-repository";

/**
 * Character repository implementation that uses the injected storage service
 * This allows us to swap between localStorage and in-memory storage for testing
 */
export class StorageBasedCharacterRepository implements ICharacterRepository {
  private readonly storageKey = "nimble-navigator-characters";

  constructor(private storage: IStorageService) {}

  async save(character: Character): Promise<void> {
    const characters = await this.list();
    const index = characters.findIndex((c) => c.id === character.id);

    // Update timestamp
    if (!character.timestamps) {
      character.timestamps = {};
    }
    character.timestamps.updatedAt = Date.now();

    // Convert Maps to objects for serialization
    const serializable = {
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

    if (index >= 0) {
      characters[index] = serializable as any;
    } else {
      characters.push(serializable as any);
    }

    this.storage.setItem(this.storageKey, JSON.stringify(characters));
  }

  async load(id: string): Promise<Character | null> {
    const characters = await this.list();
    return characters.find((c) => c.id === id) || null;
  }

  async list(): Promise<Character[]> {
    const stored = this.storage.getItem(this.storageKey);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return parsed.map((char: any) => ({
        ...char,
        createdAt: new Date(char.createdAt),
        updatedAt: new Date(char.updatedAt),
        // Convert objects back to Maps
        _abilityUses: new Map(Object.entries(char._abilityUses || {})),
        _resourceValues: new Map(
          Object.entries(char._resourceValues || {}).map(([key, value]) => {
            // Ensure the value has the correct structure
            if (typeof value === "object" && value !== null && "type" in value) {
              return [key, value];
            }
            // Handle legacy numeric values
            if (typeof value === "number") {
              return [key, { type: "numerical" as const, value }];
            }
            // Default fallback
            return [key, { type: "numerical" as const, value: 0 }];
          }),
        ),
      }));
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const characters = await this.list();
    const filtered = characters.filter((c) => c.id !== id);
    this.storage.setItem(this.storageKey, JSON.stringify(filtered));
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
    this.storage.setItem(this.storageKey, JSON.stringify([]));
  }
}
