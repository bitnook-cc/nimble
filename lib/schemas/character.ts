import { z } from "zod";

import { gameConfig } from "../config/game-config";
import { ClassFeatureSchema } from "./class";
import { currencySchema } from "./currency";
import { flexibleValueSchema } from "./flexible-value";
import { resourceDefinitionSchema } from "./resources";
import { statBonusSchema } from "./stat-bonus";

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

const baseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  size: z.int().min(0),
  description: z.string().optional(),
  cost: currencySchema.optional(),
  statBonus: statBonusSchema.optional(),
});

export const itemSchema = z.discriminatedUnion("type", [
  baseItemSchema.extend({
    type: z.literal("weapon"),
    equipped: z.boolean().optional(),
    attribute: attributeNameSchema.optional(),
    damage: z.string().optional(),
    damageType: z.enum(["Slashing", "Piercing", "Bludgeoning"]).optional(),
    vicious: z.boolean().optional(),
    properties: z.array(z.string()).optional(),
  }),
  baseItemSchema.extend({
    type: z.literal("armor"),
    equipped: z.boolean().optional(),
    armor: z.int().optional(),
    maxDexBonus: z.int().optional(),
    isMainArmor: z.boolean().optional(),
    properties: z.array(z.string()).optional(),
  }),
  baseItemSchema.extend({
    type: z.literal("freeform"),
  }),
  baseItemSchema.extend({
    type: z.literal("consumable"),
    count: z.int().min(1),
  }),
  baseItemSchema.extend({
    type: z.literal("ammunition"),
    count: z.int().min(1),
  }),
]);

export const inventorySchema = z.object({
  maxSize: z.int().min(0),
  items: z.array(itemSchema),
  currency: currencySchema,
});

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

const diceExpressionSchema = z.object({
  count: z.int().min(1),
  sides: z.union([
    z.literal(4),
    z.literal(6),
    z.literal(8),
    z.literal(10),
    z.literal(12),
    z.literal(20),
    z.literal(100),
  ]),
});

const abilityRollSchema = z.object({
  dice: diceExpressionSchema,
  modifier: z.int().optional(),
  attribute: attributeNameSchema.optional(),
});

const fixedResourceCostSchema = z.object({
  type: z.literal("fixed"),
  resourceId: z.string().min(1),
  amount: z.int().min(1),
});

const variableResourceCostSchema = z
  .object({
    type: z.literal("variable"),
    resourceId: z.string().min(1),
    minAmount: z.int().min(1),
    maxAmount: z.int().min(1),
  })
  .refine((data) => data.maxAmount >= data.minAmount, {
    message: "maxAmount must be greater than or equal to minAmount",
    path: ["maxAmount"],
  });

const resourceCostSchema = z.discriminatedUnion("type", [
  fixedResourceCostSchema,
  variableResourceCostSchema,
]);

export const abilitySchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string(),
    type: z.literal("freeform"),
  }),
  z
    .object({
      id: z.string(),
      name: z.string().min(1),
      description: z.string(),
      type: z.literal("action"),
      frequency: z.enum(["per_turn", "per_encounter", "per_safe_rest", "at_will"]),
      maxUses: abilityUsesSchema.optional(),
      roll: abilityRollSchema.optional(),
      actionCost: z.int().min(0).optional(),
      resourceCost: resourceCostSchema.optional(),
    })
    .refine(
      (data) => {
        // Non-at_will abilities must have maxUses defined
        if (data.frequency !== "at_will" && data.maxUses === undefined) {
          return false;
        }
        return true;
      },
      {
        message: "Abilities with frequency other than 'at_will' must specify maxUses",
        path: ["maxUses"],
      },
    ),
  z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string(),
    type: z.literal("spell"),
    school: z.string().min(1),
    tier: z.int().min(1).max(9),
    category: z.enum(["combat", "utility"]),
    roll: abilityRollSchema.optional(),
    actionCost: z.int().min(0).optional(),
    resourceCost: resourceCostSchema.optional(),
  }),
]);

export const abilitiesSchema = z.array(abilitySchema);

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
  featureId: z.string().min(1),
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
  _abilities: z.array(abilitySchema),
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

// Export inferred types for inventory
export type ItemType = "weapon" | "armor" | "freeform" | "consumable" | "ammunition";
export type BaseItem = z.infer<typeof baseItemSchema>;
export type Item = z.infer<typeof itemSchema>;
export type WeaponItem = Extract<Item, { type: "weapon" }>;
export type ArmorItem = Extract<Item, { type: "armor" }>;
export type FreeformItem = Extract<Item, { type: "freeform" }>;
export type ConsumableItem = Extract<Item, { type: "consumable" }>;
export type AmmunitionItem = Extract<Item, { type: "ammunition" }>;
export type Inventory = z.infer<typeof inventorySchema>;

// Export other inferred types
export type AttributeName = z.infer<typeof attributeNameSchema>;
export type Attributes = z.infer<typeof attributeSchema>;
export type Skill = z.infer<typeof skillSchema>;
