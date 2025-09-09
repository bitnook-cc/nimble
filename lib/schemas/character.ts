import { z } from "zod";

import { gameConfig } from "../config/game-config";
import { AbilityDefinition, AbilityDefinitionSchema } from "./abilities";
import { ClassFeatureSchema } from "./features";
import { flexibleValueSchema } from "./flexible-value";
import { inventorySchema, Inventory } from "./inventory";
import { resourceDefinitionSchema, ResourceDefinition, ResourceValue } from "./resources";

const attributeNameSchema = z.enum(["strength", "dexterity", "intelligence", "will"]);

const saveAdvantageTypeSchema = z.enum(["advantage", "disadvantage", "normal"]);

const saveAdvantageMapSchema = z
  .object({
    strength: saveAdvantageTypeSchema.optional(),
    dexterity: saveAdvantageTypeSchema.optional(),
    intelligence: saveAdvantageTypeSchema.optional(),
    will: saveAdvantageTypeSchema.optional(),
  })
  .default({});

// Type alias for backward compatibility and semantic clarity
const abilityUsesSchema = flexibleValueSchema;

export const attributeSchema = z.object({
  strength: z
    .int()
    .min(gameConfig.character.attributeRange.min)
    .max(gameConfig.character.attributeRange.max),
  dexterity: z
    .int()
    .min(gameConfig.character.attributeRange.min)
    .max(gameConfig.character.attributeRange.max),
  intelligence: z
    .int()
    .min(gameConfig.character.attributeRange.min)
    .max(gameConfig.character.attributeRange.max),
  will: z
    .int()
    .min(gameConfig.character.attributeRange.min)
    .max(gameConfig.character.attributeRange.max),
});

export const skillSchema = z.object({
  name: z.string(),
  associatedAttribute: attributeNameSchema,
  modifier: z
    .int()
    .min(gameConfig.character.skillModifierRange.min)
    .max(gameConfig.character.skillModifierRange.max),
});

export const hitPointsSchema = z.object({
  current: z.int().min(0),
  max: z.int().min(1),
  temporary: z.int().min(0),
});

export const actionTrackerSchema = z.object({
  current: z.int().min(0),
  base: z.int().min(1),
  bonus: z.int().min(0),
});

export const hitDiceSchema = z.object({
  size: z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
  current: z.int().min(0),
  max: z.int().min(1),
});

export const woundsSchema = z.object({
  current: z.int().min(0),
  max: z.int().min(1),
});


// Resource value schemas for the new model
const numericalResourceValueSchema = z.object({
  type: z.literal("numerical"),
  value: z.number(),
});

const resourceValueSchema = numericalResourceValueSchema; // Extensible for future types

export const characterConfigurationSchema = z.object({
  maxWounds: z.int().min(1),
  maxInventorySize: z.int().min(1),
});


const armorProficiencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("cloth") }),
  z.object({ type: z.literal("leather") }),
  z.object({ type: z.literal("mail") }),
  z.object({ type: z.literal("plate") }),
  z.object({ type: z.literal("shields") }),
  z.object({ type: z.literal("freeform"), name: z.string().min(1) }),
]);

const weaponProficiencySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("strength_weapons") }),
  z.object({ type: z.literal("dexterity_weapons") }),
  z.object({ type: z.literal("freeform"), name: z.string().min(1) }),
]);

export const proficienciesSchema = z.object({
  armor: z.array(armorProficiencySchema),
  weapons: z.array(weaponProficiencySchema),
});

// Base schema for all effect selections
const baseEffectSelectionSchema = z.object({
  grantedByEffectId: z.string().min(1),
});

// Individual effect selection schemas
const poolFeatureEffectSelectionSchema = baseEffectSelectionSchema.extend({
  type: z.literal("pool_feature"),
  poolId: z.string().min(1),
  feature: ClassFeatureSchema,
});

const spellSchoolEffectSelectionSchema = baseEffectSelectionSchema.extend({
  type: z.literal("spell_school"),
  schoolId: z.string().min(1),
});

const attributeBoostEffectSelectionSchema = baseEffectSelectionSchema.extend({
  type: z.literal("attribute_boost"),
  attribute: attributeNameSchema,
  amount: z.number().int().positive(),
});

const utilitySpellsEffectSelectionSchema = baseEffectSelectionSchema.extend({
  type: z.literal("utility_spells"),
  spellIds: z.array(z.string().min(1)),
  fromSchools: z.array(z.string().min(1)),
});

const subclassEffectSelectionSchema = baseEffectSelectionSchema.extend({
  type: z.literal("subclass"),
  subclassId: z.string().min(1),
});

// Union of all effect selection types
const effectSelectionSchema = z.discriminatedUnion("type", [
  poolFeatureEffectSelectionSchema,
  spellSchoolEffectSelectionSchema,
  attributeBoostEffectSelectionSchema,
  utilitySpellsEffectSelectionSchema,
  subclassEffectSelectionSchema,
]);

// Helper schemas for Map transformations
// These handle both Map objects and plain objects (from JSON)
const abilityUsesMapSchema = z.union([
  z.map(z.string(), z.number()),
  z.record(z.string(), z.number()).transform((obj) => new Map(Object.entries(obj))),
]);

const resourceValuesMapSchema = z.union([
  z.map(z.string(), resourceValueSchema),
  z.record(z.string(), resourceValueSchema).transform((obj) => new Map(Object.entries(obj))),
]);

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  ancestryId: z.string().min(1),
  backgroundId: z.string().min(1),
  level: z.int().min(1).max(20),
  classId: z.string().min(1),
  effectSelections: z.array(effectSelectionSchema),
  _spellTierAccess: z.int().min(0).max(9),
  _proficiencies: proficienciesSchema,
  _attributes: attributeSchema,
  _initiative: skillSchema,
  _skills: z.record(z.string(), skillSchema),
  _abilities: z.array(AbilityDefinitionSchema),
  _abilityUses: abilityUsesMapSchema,
  _hitDice: hitDiceSchema,
  saveAdvantages: saveAdvantageMapSchema,
  hitPoints: hitPointsSchema,
  wounds: woundsSchema,
  _resourceDefinitions: z.array(resourceDefinitionSchema),
  _resourceValues: resourceValuesMapSchema,
  config: characterConfigurationSchema,
  speed: z.number().min(0),
  actionTracker: actionTrackerSchema,
  inEncounter: z.boolean(),
  inventory: inventorySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ValidatedCharacter = z.infer<typeof characterSchema>;

// Export other inferred types
export type AttributeName = z.infer<typeof attributeNameSchema>;
export type SaveAdvantageType = z.infer<typeof saveAdvantageTypeSchema>;
export type SaveAdvantageMap = z.infer<typeof saveAdvantageMapSchema>;
export type Attributes = z.infer<typeof attributeSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type HitDieSize = 4 | 6 | 8 | 10 | 12;
export type HitPoints = z.infer<typeof hitPointsSchema>;
export type ActionTracker = z.infer<typeof actionTrackerSchema>;
export type HitDice = z.infer<typeof hitDiceSchema>;
export type Wounds = z.infer<typeof woundsSchema>;
export type CharacterConfiguration = z.infer<typeof characterConfigurationSchema>;
export type Proficiencies = z.infer<typeof proficienciesSchema>;

// Effect selection types
export type BaseEffectSelection = z.infer<typeof baseEffectSelectionSchema>;
export type PoolFeatureEffectSelection = z.infer<typeof poolFeatureEffectSelectionSchema>;
export type SpellSchoolEffectSelection = z.infer<typeof spellSchoolEffectSelectionSchema>;
export type AttributeBoostEffectSelection = z.infer<typeof attributeBoostEffectSelectionSchema>;
export type UtilitySpellsEffectSelection = z.infer<typeof utilitySpellsEffectSelectionSchema>;
export type SubclassEffectSelection = z.infer<typeof subclassEffectSelectionSchema>;
export type EffectSelection = z.infer<typeof effectSelectionSchema>;

// Character type
export type Character = z.infer<typeof characterSchema>;
export type Skills = Record<string, Skill>;
export type SkillName = keyof Skills;

// CreateCharacterData - used for character creation
// This is an interface rather than inferred type because it's a subset/variant of Character
export interface CreateCharacterData {
  name: string;
  ancestryId: string;
  backgroundId: string;
  level: number;
  classId: string;
  subclassId?: string;
  effectSelections: EffectSelection[];
  _spellTierAccess: number;
  _proficiencies: Proficiencies;
  _attributes: Attributes;
  _initiative: Skill;
  _skills: Skills;
  _abilities: AbilityDefinition[];
  _abilityUses: Map<string, number>;
  _hitDice: HitDice;
  saveAdvantages: SaveAdvantageMap;
  hitPoints: HitPoints;
  wounds: Wounds;
  _resourceDefinitions: ResourceDefinition[];
  _resourceValues: Map<string, ResourceValue>;
  config: CharacterConfiguration;
  speed: number;
  actionTracker: ActionTracker;
  inEncounter: boolean;
  inventory: Inventory;
}
