import { Character, CreateCharacterData } from "../schemas/character";
import { NumericalResourceValue } from "../schemas/resources";

export interface ICharacterRepository {
  save(character: Character): Promise<void>;
  load(id: string): Promise<Character | null>;
  list(): Promise<Character[]>;
  delete(id: string): Promise<void>;
  create(data: CreateCharacterData, id?: string): Promise<Character>;
}

export class LocalStorageCharacterRepository implements ICharacterRepository {
  private readonly storageKey = "nimble-navigator-characters";

  async save(character: Character): Promise<void> {
    const characters = await this.list();
    const index = characters.findIndex((c) => c.id === character.id);

    character.updatedAt = new Date();

    // Convert Maps to objects for serialization
    const serializable = {
      ...character,
      _abilityUses: character._abilityUses instanceof Map 
        ? Object.fromEntries(character._abilityUses) 
        : character._abilityUses,
      _resourceValues: character._resourceValues instanceof Map 
        ? Object.fromEntries(character._resourceValues) 
        : character._resourceValues,
    };

    if (index >= 0) {
      characters[index] = serializable as any;
    } else {
      characters.push(serializable as any);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(characters));
  }

  async load(id: string): Promise<Character | null> {
    const characters = await this.list();
    return characters.find((c) => c.id === id) || null;
  }

  async list(): Promise<Character[]> {
    const stored = localStorage.getItem(this.storageKey);
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
            if (typeof value === 'object' && value !== null && 'type' in value) {
              return [key, value];
            }
            // Handle legacy numeric values
            if (typeof value === 'number') {
              return [key, { type: 'numerical' as const, value }];
            }
            // Default fallback
            return [key, { type: 'numerical' as const, value: 0 }];
          })
        ),
      }));
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const characters = await this.list();
    const filtered = characters.filter((c) => c.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  async create(data: CreateCharacterData, id?: string): Promise<Character> {
    const character: Character = {
      id: id || crypto.randomUUID(),
      ...data,
      // Ensure Maps are properly initialized
      _abilityUses: data._abilityUses instanceof Map 
        ? data._abilityUses 
        : new Map(Object.entries(data._abilityUses || {})),
      _resourceValues: data._resourceValues instanceof Map 
        ? data._resourceValues 
        : new Map<string, NumericalResourceValue>(
            Object.entries(data._resourceValues || {}).map(([key, value]) => {
              if (typeof value === 'object' && value !== null && 'type' in value) {
                return [key, value as NumericalResourceValue];
              }
              if (typeof value === 'number') {
                return [key, { type: 'numerical' as const, value }];
              }
              return [key, { type: 'numerical' as const, value: 0 }];
            })
          ),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.save(character);
    return character;
  }
}
