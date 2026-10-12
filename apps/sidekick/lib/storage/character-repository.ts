import { Character, CreateCharacterData } from "../schemas/character";

export interface ICharacterRepository {
  save(character: Character, preserveTimestamp?: boolean): Promise<void>;
  updateAll(transform: (characters: Character[]) => Character[]): Promise<Character[]>;
  load(id: string): Promise<Character | null>;
  list(): Promise<Character[]>;
  delete(id: string): Promise<void>;
  create(data: CreateCharacterData, id?: string): Promise<Character>;
  clear(): Promise<void>;
}

// LocalStorageCharacterRepository has been replaced by StorageBasedCharacterRepository
// which uses the injected storage service for better testability
