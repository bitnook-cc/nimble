import { v4 as uuidv4 } from "uuid";

import type { Character } from "../../schemas/character";
import type { ResourceDefinition } from "../../schemas/resources";
import { getCharacterCreation, getCharacterService } from "../service-factory";

/**
 * Test utilities for creating characters and managing resources in tests
 */

/**
 * Standard resource definitions commonly used in tests
 */
export const TEST_RESOURCES = {
  mana: {
    id: "mana",
    name: "Mana",
    description: "Magical energy for casting spells",
    colorScheme: "blue-magic",
    icon: "sparkles",
    resetCondition: "safe_rest" as const,
    resetType: "to_max" as const,
    minValue: { type: "fixed" as const, value: 0 },
    maxValue: { type: "fixed" as const, value: 10 },
  },
  fury: {
    id: "fury",
    name: "Fury",
    description: "Battle rage for berserker abilities",
    colorScheme: "red-fury",
    icon: "flame",
    resetCondition: "safe_rest" as const,
    resetType: "to_max" as const,
    minValue: { type: "fixed" as const, value: 0 },
    maxValue: { type: "fixed" as const, value: 8 },
  },
  focus: {
    id: "focus",
    name: "Focus",
    description: "Mental concentration for special techniques",
    colorScheme: "purple-mystic",
    icon: "eye",
    resetCondition: "encounter_end" as const,
    resetType: "to_max" as const,
    minValue: { type: "fixed" as const, value: 0 },
    maxValue: { type: "fixed" as const, value: 6 },
  },
} as const;

/**
 * Creates a test character using CharacterCreationService with sensible defaults
 */
export async function createTestCharacter(
  options: {
    name?: string;
    classId?: string;
    ancestryId?: string;
    backgroundId?: string;
    level?: number;
    attributes?: {
      strength?: number;
      dexterity?: number;
      intelligence?: number;
      will?: number;
    };
    spellTierAccess?: number;
  } = {},
): Promise<Character> {
  const {
    name = "Test Character",
    classId = "mage",
    ancestryId = "human",
    backgroundId = "fearless",
    level = 1,
    attributes = {},
    spellTierAccess,
  } = options;

  // Get character creation service from service factory
  const characterCreationService = getCharacterCreation();

  // Create character with creation service
  const character = await characterCreationService.createCompleteCharacter({
    name,
    ancestryId,
    backgroundId,
    classId,
    attributes: {
      strength: 0,
      dexterity: 1,
      intelligence: 2,
      will: 1,
      ...attributes,
    },
    skillAllocations: {},
    traitSelections: [],
    selectedEquipment: [],
  });

  // Set spell tier access if specified
  if (spellTierAccess !== undefined) {
    character._spellTierAccess = spellTierAccess;
  }

  return character;
}

/**
 * Creates a spellcaster character with mana resource and spell tier access
 */
export async function createTestSpellcaster(
  options: {
    name?: string;
    classId?: string;
    manaAmount?: number;
    maxMana?: number;
    spellTierAccess?: number;
    level?: number;
  } = {},
): Promise<Character> {
  const {
    name = "Test Spellcaster",
    classId = "mage",
    manaAmount = 5,
    maxMana = 10,
    spellTierAccess = 2,
    level = 1,
  } = options;

  // Create base character
  const character = await createTestCharacter({
    name,
    classId,
    level,
    attributes: {
      intelligence: 3, // High INT for spellcasters
      will: 2,
    },
    spellTierAccess,
  });

  // Add mana resource
  await grantResource(character, "mana", manaAmount, maxMana);

  return character;
}

/**
 * Grants a resource to a character
 */
export async function grantResource(
  character: Character,
  resourceId: keyof typeof TEST_RESOURCES,
  currentAmount: number,
  maxAmount?: number,
): Promise<void> {
  const resourceDefinition = { ...TEST_RESOURCES[resourceId] };

  // Update max value if specified
  if (maxAmount !== undefined) {
    (resourceDefinition as any).maxValue = { type: "fixed" as const, value: maxAmount };
  }

  // Add resource definition if not already present
  if (!character._resourceDefinitions.find((r) => r.id === resourceId)) {
    character._resourceDefinitions.push(resourceDefinition);
  }

  // Set resource value
  character._resourceValues.set(resourceId, { type: "numerical", value: currentAmount });

  // Update character in storage
  const characterService = getCharacterService();
  await characterService.updateCharacter(character);
}

/**
 * Grants multiple resources to a character
 */
export async function grantResources(
  character: Character,
  resources: Record<keyof typeof TEST_RESOURCES, { current: number; max?: number }>,
): Promise<void> {
  for (const [resourceId, { current, max }] of Object.entries(resources) as [
    keyof typeof TEST_RESOURCES,
    { current: number; max?: number },
  ][]) {
    await grantResource(character, resourceId, current, max);
  }
}

/**
 * Sets up a character with common spellcaster configuration
 */
export async function setupSpellcasterCharacter(
  character: Character,
  options: {
    manaAmount?: number;
    maxMana?: number;
    spellTierAccess?: number;
  } = {},
): Promise<void> {
  const { manaAmount = 5, maxMana = 10, spellTierAccess = 2 } = options;

  // Grant mana and spell access
  await grantResource(character, "mana", manaAmount, maxMana);
  character._spellTierAccess = spellTierAccess;

  // Update character
  const characterService = getCharacterService();
  await characterService.updateCharacter(character);
}

/**
 * Loads a character into the character service for testing
 */
export async function loadCharacterForTesting(character: Character): Promise<void> {
  const characterService = getCharacterService();
  await characterService.loadCharacter(character.id);
}

/**
 * Gets the current amount of a resource for a character
 */
export function getResourceAmount(character: Character, resourceId: string): number {
  const resourceValue = character._resourceValues.get(resourceId);
  if (resourceValue && resourceValue.type === "numerical") {
    return resourceValue.value;
  }
  return 0;
}

/**
 * Checks if a character has a specific resource
 */
export function hasResource(character: Character, resourceId: string): boolean {
  return character._resourceDefinitions.some((r) => r.id === resourceId);
}

/**
 * Creates a test character with berserker configuration (fury resource)
 */
export async function createTestBerserker(
  options: {
    name?: string;
    furyAmount?: number;
    maxFury?: number;
  } = {},
): Promise<Character> {
  const { name = "Test Berserker", furyAmount = 4, maxFury = 8 } = options;

  const character = await createTestCharacter({
    name,
    classId: "berserker",
    attributes: {
      strength: 3, // High STR for berserkers
      will: 2,
    },
  });

  await grantResource(character, "fury", furyAmount, maxFury);
  return character;
}

/**
 * Creates a test character with rogue configuration (focus resource)
 */
export async function createTestRogue(
  options: {
    name?: string;
    focusAmount?: number;
    maxFocus?: number;
  } = {},
): Promise<Character> {
  const { name = "Test Rogue", focusAmount = 3, maxFocus = 6 } = options;

  const character = await createTestCharacter({
    name,
    classId: "rogue",
    attributes: {
      dexterity: 3, // High DEX for rogues
      intelligence: 2,
    },
  });

  await grantResource(character, "focus", focusAmount, maxFocus);
  return character;
}
