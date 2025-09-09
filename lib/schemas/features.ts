import { z } from "zod";

import { flexibleValueSchema } from "./flexible-value";
import { resourceDefinitionSchema } from "./resources";
import { statBonusSchema } from "./stat-bonus";
import { diceExpressionSchema } from "./dice";

// ========================================
// Feature Effect Schemas
// ========================================


const AbilityRollSchema = z.object({
  dice: diceExpressionSchema,
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
  category: z.enum(["combat", "utility"]),
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
  schoolId: z.string().min(1),
});

const SpellSchoolChoiceFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("spell_school_choice"),
  availableSchools: z.array(z.string()).optional(),
  numberOfChoices: z.number().int().min(1).default(1),
});

const UtilitySpellsFeatureEffectSchema = BaseFeatureEffectSchema.extend({
  type: z.literal("utility_spells"),
  schools: z.array(z.string()).optional(), // If empty, use all character's schools
  selectionMode: z.enum(["per_school", "total"]).default("total"),
  numberOfSpells: z.number().int().min(1).optional(), // Used when selectionMode is "per_school"
  totalSpells: z.number().int().min(1).optional(), // Used when selectionMode is "total"
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

// ========================================
// Character Feature Schemas
// ========================================

// Base Character Feature Schema - shared by all feature types
export const CharacterFeatureSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the feature" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the feature" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the feature" }),
    effects: z
      .array(FeatureEffectSchema)
      .meta({ title: "Effects", description: "Array of effects this feature provides" }),
  })
  .meta({ title: "Character Feature", description: "A feature that provides effects to characters" });

// Class Feature Schema - extends CharacterFeature with level
export const ClassFeatureSchema = CharacterFeatureSchema.extend({
  level: z
    .number()
    .int()
    .min(1)
    .max(20)
    .meta({ title: "Level", description: "Level at which this feature is gained" }),
})
  .meta({ title: "Class Feature", description: "A class feature that provides effects to characters at specific levels" });

// ========================================
// Export Inferred Types
// ========================================

// Feature Effect Types
export type FeatureEffectType = 
  | "ability"
  | "attribute_boost"
  | "stat_bonus"
  | "proficiency"
  | "spell_school"
  | "spell_school_choice"
  | "utility_spells"
  | "spell_tier_access"
  | "resource"
  | "subclass_choice"
  | "pick_feature_from_pool"
  | "resistance";

export type EffectSource = "feature" | "item";

export type ProficiencyGrant = z.infer<typeof ProficiencyGrantSchema>;
export type SpellSchool = z.infer<typeof SpellSchoolSchema>;
export type Resistance = z.infer<typeof ResistanceSchema>;

export type AbilityFeatureEffect = z.infer<typeof AbilityFeatureEffectSchema>;
export type AttributeBoostFeatureEffect = z.infer<typeof AttributeBoostFeatureEffectSchema>;
export type StatBonusFeatureEffect = z.infer<typeof StatBonusFeatureEffectSchema>;
export type ProficiencyFeatureEffect = z.infer<typeof ProficiencyFeatureEffectSchema>;
export type SpellSchoolFeatureEffect = z.infer<typeof SpellSchoolFeatureEffectSchema>;
export type SpellSchoolChoiceFeatureEffect = z.infer<typeof SpellSchoolChoiceFeatureEffectSchema>;
export type UtilitySpellsFeatureEffect = z.infer<typeof UtilitySpellsFeatureEffectSchema>;
export type SpellTierAccessFeatureEffect = z.infer<typeof SpellTierAccessFeatureEffectSchema>;
export type ResourceFeatureEffect = z.infer<typeof ResourceFeatureEffectSchema>;
export type SubclassChoiceFeatureEffect = z.infer<typeof SubclassChoiceFeatureEffectSchema>;
export type PickFeatureFromPoolFeatureEffect = z.infer<typeof PickFeatureFromPoolFeatureEffectSchema>;
export type ResistanceFeatureEffect = z.infer<typeof ResistanceFeatureEffectSchema>;

export type FeatureEffect = z.infer<typeof FeatureEffectSchema>;

// Character Feature Types
export type CharacterFeature = z.infer<typeof CharacterFeatureSchema>;
export type ClassFeature = z.infer<typeof ClassFeatureSchema>;
