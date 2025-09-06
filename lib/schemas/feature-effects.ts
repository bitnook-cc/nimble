import { z } from "zod";

import { flexibleValueSchema } from "./flexible-value";
import { resourceDefinitionSchema } from "./resources";
import { statBonusSchema } from "./stat-bonus";

// Import schemas from class.ts for abilities and resources
const DiceExpressionSchema = z.object({
  count: z.number().int().min(1).max(20),
  sides: z.union([
    z.literal(4),
    z.literal(6),
    z.literal(8),
    z.literal(10),
    z.literal(12),
    z.literal(20),
    z.literal(66),
    z.literal(100),
  ]),
});

const AbilityRollSchema = z.object({
  dice: DiceExpressionSchema,
  modifier: z.number().int().optional(),
  attribute: z.enum(["strength", "dexterity", "intelligence", "will"]).optional(),
});

const ResourceCostSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("fixed"),
    resourceId: z.string(),
    amount: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("variable"),
    resourceId: z.string(),
    minAmount: z.number().int().min(0),
    maxAmount: z.number().int().min(0),
  }),
]);

const ActionAbilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.literal("action"),
  frequency: z.enum(["per_turn", "per_encounter", "per_safe_rest", "at_will"]),
  maxUses: flexibleValueSchema.optional(),
  currentUses: z.number().int().min(0).optional(),
  roll: AbilityRollSchema.optional(),
  actionCost: z.number().int().min(0).max(5).optional(),
  resourceCost: ResourceCostSchema.optional(),
});

const SpellAbilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.literal("spell"),
  school: z.string().min(1),
  tier: z.number().int().min(0).max(9),
  roll: AbilityRollSchema.optional(),
  actionCost: z.number().int().min(0).max(5).optional(),
  resourceCost: ResourceCostSchema.optional(),
});

const AbilitySchema = z.discriminatedUnion("type", [ActionAbilitySchema, SpellAbilitySchema]);

// Shared effect data schemas
const AttributeBoostSchema = z.object({
  attribute: z.array(z.enum(["strength", "dexterity", "intelligence", "will"])),
  amount: z.number().int().min(-5).max(5),
});

const ProficiencyGrantSchema = z.object({
  type: z.enum(["skill", "save", "tool", "language"]),
  name: z.string().min(1),
  bonus: z.number().int().optional(),
});

const SpellSchoolSchema = z.object({
  schoolId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
});

const ResistanceSchema = z.object({
  type: z.enum(["damage", "condition"]),
  name: z.string().min(1),
  description: z.string().optional(),
});

// Removed ResourceDefinitionSchema - using imported resourceDefinitionSchema instead

// Removed StatBonusSchema - using imported statBonusSchema instead

// Feature Effect Schemas
const BaseFeatureEffectSchema = z.object({
  id: z.string().min(1),
});

const AbilityFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("ability"),
  ability: AbilitySchema,
});

const AttributeBoostFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("attribute_boost"),
  allowedAttributes: z.array(z.enum(["strength", "dexterity", "intelligence", "will"])),
  amount: z.number().int().positive(),
});

const StatBonusFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("stat_bonus"),
  statBonus: statBonusSchema,
});

const ProficiencyFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("proficiency"),
  proficiencies: z.array(ProficiencyGrantSchema),
});

const SpellSchoolFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("spell_school"),
  spellSchool: SpellSchoolSchema,
});

const SpellSchoolChoiceFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("spell_school_choice"),
  availableSchools: z.array(z.string()).optional(),
  numberOfChoices: z.number().int().min(1).optional(),
});

const UtilitySpellsFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("utility_spells"),
  schools: z.array(z.string()).min(1),
  spellsPerSchool: z.number().int().min(1).optional(),
});

const SpellTierAccessFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("spell_tier_access"),
  maxTier: z.number().int().min(1).max(9),
});

const ResourceFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("resource"),
  resourceDefinition: resourceDefinitionSchema,
});

const SubclassChoiceFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("subclass_choice"),
});

const PickFeatureFromPoolFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("pick_feature_from_pool"),
  poolId: z.string().min(1),
  choicesAllowed: z.number().int().min(1),
});

const ResistanceFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("resistance"),
  resistances: z.array(ResistanceSchema),
});

export const FeatureEffectSchema = z.discriminatedUnion("type", [
  AbilityFeatureEffectSchema,
  AttributeBoostFeatureEffectSchema,
  StatBonusFeatureEffectSchema,
  ProficiencyFeatureEffectSchema,
  SpellSchoolFeatureEffectSchema,
  SpellSchoolChoiceFeatureEffectSchema,
  UtilitySpellsFeatureEffectSchema,
  SpellTierAccessFeatureEffectSchema,
  ResourceFeatureEffectSchema,
  SubclassChoiceFeatureEffectSchema,
  PickFeatureFromPoolFeatureEffectSchema,
  ResistanceFeatureEffectSchema,
]);

export const FeatureEffectGrantSchema = z.object({
  effectId: z.string().min(1),
  parentFeatureId: z.string().min(1),
  sourceType: z.enum(["class", "subclass", "ancestry", "background"]),
  sourceId: z.string().min(1),
  level: z.number().int().min(1).max(20).optional(),
  effect: FeatureEffectSchema,
});

// Export individual effect schemas for validation
export {
  AbilityFeatureEffectSchema,
  AttributeBoostFeatureEffectSchema,
  StatBonusFeatureEffectSchema,
  ProficiencyFeatureEffectSchema,
  SpellSchoolFeatureEffectSchema,
  SpellSchoolChoiceFeatureEffectSchema,
  UtilitySpellsFeatureEffectSchema,
  SpellTierAccessFeatureEffectSchema,
  ResourceFeatureEffectSchema,
  SubclassChoiceFeatureEffectSchema,
  PickFeatureFromPoolFeatureEffectSchema,
  ResistanceFeatureEffectSchema,
};
