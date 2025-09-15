import { gameConfig } from "../config/game-config";
import { CURRENT_SCHEMA_VERSION } from "../schemas/migration/constants";
import {
  AttributeName,
  Character,
  CharacterConfiguration,
  HitDice,
  HitDieSize,
  Proficiencies,
  Wounds,
} from "../schemas/character";
import { ClassDefinition } from "../schemas/class";
import { Currency } from "../schemas/currency";
import { Inventory } from "../schemas/inventory";

export const createDefaultSkills = () => {
  const defaultSkills: Record<string, any> = {};

  gameConfig.skills.forEach((skill) => {
    defaultSkills[skill.name] = {
      name: skill.label,
      associatedAttribute: skill.attribute as AttributeName,
      modifier: 0,
    };
  });

  return defaultSkills as Record<
    string,
    { name: string; associatedAttribute: AttributeName; modifier: number }
  >;
};

export const createDefaultCurrency = (): Currency => {
  return {
    gold: 0,
    silver: 0,
  };
};

export const createDefaultInventory = (strength: number = 0): Inventory => {
  return {
    maxSize: gameConfig.character.skillModifierRange.max - 2 + strength, // Using max inventory size from game config indirectly
    items: [],
    currency: createDefaultCurrency(),
  };
};

export const createDefaultHitPoints = (startingHP: number = 10) => {
  return {
    current: startingHP,
    max: startingHP,
    temporary: 0,
  };
};

export const createDefaultInitiative = () => {
  return {
    name: "Initiative",
    associatedAttribute: "dexterity" as AttributeName,
    modifier: 0,
  };
};

export const createDefaultActionTracker = () => {
  const defaultActions = 3; // This could be added to gameConfig if needed
  return {
    current: defaultActions,
    base: defaultActions,
    bonus: 0,
  };
};

export const createDefaultHitDice = (level: number = 1, hitDieSize: HitDieSize = 8): HitDice => {
  return {
    size: hitDieSize,
    current: level,
    max: level,
  };
};

export const createDefaultWounds = (maxWounds: number = 6): Wounds => {
  return {
    current: 0,
    max: maxWounds,
  };
};

export const createDefaultCharacterConfiguration = (): CharacterConfiguration => {
  return {
    maxWounds: 6,
    maxInventorySize: 10,
  };
};

export const createDefaultProficiencies = (classDefinition?: ClassDefinition): Proficiencies => {
  return {
    armor: classDefinition?.armorProficiencies || [],
    weapons: classDefinition?.weaponProficiencies || [],
  };
};

/**
 * Creates a complete default character template for merging with invalid characters
 * This provides fallback values for all required character fields
 */
export const createDefaultCharacterTemplate = (): Partial<Character> => {
  const defaultAttributes = {
    strength: gameConfig.character.attributeRange.min + 2, // Start at 0 (min is -2)
    dexterity: gameConfig.character.attributeRange.min + 2,
    intelligence: gameConfig.character.attributeRange.min + 2,
    will: gameConfig.character.attributeRange.min + 2,
  };

  return {
    name: "Unnamed Character",
    level: 1,
    traitSelections: [],
    _schemaVersion: CURRENT_SCHEMA_VERSION,
    _spellTierAccess: 0,
    _resourceDefinitions: [],
    _resourceValues: new Map(),
    _dicePools: [],
    _proficiencies: createDefaultProficiencies(),
    _attributes: defaultAttributes,
    saveAdvantages: {
      strength: "normal",
      dexterity: "normal",
      intelligence: "normal",
      will: "normal",
    },
    hitPoints: createDefaultHitPoints(10),
    _hitDice: createDefaultHitDice(1, 8),
    wounds: createDefaultWounds(6),
    config: createDefaultCharacterConfiguration(),
    _initiative: createDefaultInitiative(),
    speed: gameConfig.character.defaultSpeed,
    actionTracker: createDefaultActionTracker(),
    inEncounter: false,
    _skills: createDefaultSkills(),
    inventory: createDefaultInventory(0),
    _abilities: [],
    _abilityUses: new Map(),
    timestamps: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };
};

/**
 * Deep merge utility for merging partial character data with defaults
 * This ensures all required fields exist while preserving valid existing data
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] != null) {
      if (
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        !(source[key] instanceof Date)
      ) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Merges partial character data with default template to create a valid character
 * This is used for graceful recovery from validation errors or missing fields
 */
export const mergeWithDefaultCharacter = (
  partialCharacter: any,
  characterId: string,
): Character => {
  const defaultTemplate = createDefaultCharacterTemplate();

  // Merge the partial character data with defaults
  const mergedCharacter = deepMerge(defaultTemplate, partialCharacter);

  // Ensure the character has the correct ID
  mergedCharacter.id = characterId;

  // Update timestamps to indicate this was recovered
  if (!mergedCharacter.timestamps) {
    mergedCharacter.timestamps = {};
  }
  mergedCharacter.timestamps.updatedAt = Date.now();

  return mergedCharacter as Character;
};
