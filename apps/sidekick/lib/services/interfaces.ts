import { Attributes, Character } from "../schemas/character";
import { CreateCompleteCharacterOptions } from "../services/character-creation-service";

/**
 * Character Storage Interface
 * Handles persistence and retrieval of character data
 */
export interface ICharacterStorage {
  getCharacter(id: string): Promise<Character | null>;
  getAllCharacters(): Promise<Character[]>;
  createCharacter(character: Character): Promise<Character>;
  updateCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
  updateLastPlayed(id: string): Promise<void>;
  replaceAllCharacters(characters: Character[]): Promise<void>;
}

/**
 * Character Creation Service Interface
 * Handles character creation and initialization
 */
export interface ICharacterCreation {
  quickCreateCharacter(options: QuickCreateOptions): Promise<Character>;
  createCompleteCharacter(options: CreateCompleteCharacterOptions): Promise<Character>; // Using any temporarily to avoid circular dependency
  applyStartingEquipment(characterId: string, equipmentIds: string[]): Promise<void>;
  getClassStartingEquipment(classId: string): string[];
}

export interface QuickCreateOptions {
  name?: string; // Optional - will be generated if not provided
  ancestryId?: string; // Optional - will be random if not provided
  backgroundId?: string; // Optional - will be random if not provided
  classId: string;
  level?: number;
  attributes?: Attributes;
}
