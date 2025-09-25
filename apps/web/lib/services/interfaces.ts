import {
  AbilityDefinition,
  ActionAbilityDefinition,
  SpellAbilityDefinition,
} from "../schemas/abilities";
import { LogEntry } from "../schemas/activity-log";
import { AncestryDefinition } from "../schemas/ancestry";
import { BackgroundDefinition } from "../schemas/background";
import {
  ActionTracker,
  AttributeName,
  Attributes,
  Character,
  CharacterConfiguration,
  HitDice,
  PoolFeatureTraitSelection,
  Skill,
  Skills,
  TraitSelection,
  UtilitySpellsTraitSelection,
} from "../schemas/character";
import { ClassDefinition, FeaturePool } from "../schemas/class";
import { DicePoolDefinition, DicePoolInstance } from "../schemas/dice-pools";
import {
  CharacterFeature,
  ClassFeature,
  PickFeatureFromPoolFeatureTrait,
} from "../schemas/features";
import { Item } from "../schemas/inventory";
import { ResourceDefinition, ResourceInstance } from "../schemas/resources";
import { CreateCompleteCharacterOptions } from "../services/character-creation-service";
import { CharacterEvent, CharacterEventType } from "../services/character-service";
import { DiceFormulaResult } from "./dice-service";

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
