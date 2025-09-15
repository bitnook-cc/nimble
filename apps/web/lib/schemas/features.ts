import { z } from "zod";

import { AbilitySchema } from "./abilities"
import { dicePoolDefinitionSchema } from "./dice-pools";
import { resourceDefinitionSchema } from "./resources";
import { statBonusSchema } from "./stat-bonus";

// ========================================
// Feature Trait Schemas
// ========================================

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

// Feature Trait Schemas
const BaseFeatureTraitSchema = z.object({
  id: z.string().min(1),
});

const AbilityFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("ability"),
  ability: AbilitySchema,
});

const AttributeBoostFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("attribute_boost"),
  allowedAttributes: z.array(z.enum(["strength", "dexterity", "intelligence", "will"])),
  amount: z.number().int().positive(),
});

const StatBonusFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("stat_bonus"),
  statBonus: statBonusSchema,
});

const ProficiencyFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("proficiency"),
  proficiencies: z.array(ProficiencyGrantSchema),
});

const SpellSchoolFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("spell_school"),
  schoolId: z.string().min(1),
});

const SpellSchoolChoiceFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("spell_school_choice"),
  availableSchools: z.array(z.string()).optional(),
  numberOfChoices: z.number().int().min(1).default(1),
});

const UtilitySpellsFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("utility_spells"),
  schools: z.array(z.string()).optional(), // If empty, use all character's schools
  selectionMode: z.enum(["per_school", "total", "full_school"]).default("total"),
  numberOfSpells: z.number().int().min(1).optional(), // Used when selectionMode is "per_school"
  totalSpells: z.number().int().min(1).optional(), // Used when selectionMode is "total"
});

const SpellTierAccessFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("spell_tier_access"),
  maxTier: z.number().int().min(1).max(9),
});

const ResourceFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("resource"),
  resourceDefinition: resourceDefinitionSchema,
});

const SubclassChoiceFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("subclass_choice"),
});

const PickFeatureFromPoolFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("pick_feature_from_pool"),
  poolId: z.string().min(1),
  choicesAllowed: z.number().int().min(1),
});

const ResistanceFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("resistance"),
  resistances: z.array(ResistanceSchema),
});

const SpellScalingFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("spell_scaling"),
  multiplier: z.number().int().min(1).max(4),
});

const DicePoolFeatureTraitSchema = BaseFeatureTraitSchema.extend({
  type: z.literal("dice_pool"),
  poolDefinition: dicePoolDefinitionSchema,
});

export const FeatureTraitSchema = z.discriminatedUnion("type", [
  AbilityFeatureTraitSchema,
  AttributeBoostFeatureTraitSchema,
  StatBonusFeatureTraitSchema,
  ProficiencyFeatureTraitSchema,
  SpellSchoolFeatureTraitSchema,
  SpellSchoolChoiceFeatureTraitSchema,
  UtilitySpellsFeatureTraitSchema,
  SpellTierAccessFeatureTraitSchema,
  ResourceFeatureTraitSchema,
  DicePoolFeatureTraitSchema,
  SubclassChoiceFeatureTraitSchema,
  PickFeatureFromPoolFeatureTraitSchema,
  ResistanceFeatureTraitSchema,
  SpellScalingFeatureTraitSchema,
]);

// Export individual trait schemas for validation
export {
  AbilityFeatureTraitSchema,
  AttributeBoostFeatureTraitSchema,
  StatBonusFeatureTraitSchema,
  ProficiencyFeatureTraitSchema,
  SpellSchoolFeatureTraitSchema,
  SpellSchoolChoiceFeatureTraitSchema,
  UtilitySpellsFeatureTraitSchema,
  SpellTierAccessFeatureTraitSchema,
  ResourceFeatureTraitSchema,
  DicePoolFeatureTraitSchema,
  SubclassChoiceFeatureTraitSchema,
  PickFeatureFromPoolFeatureTraitSchema,
  ResistanceFeatureTraitSchema,
  SpellScalingFeatureTraitSchema,
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
    traits: z
      .array(FeatureTraitSchema)
      .meta({ title: "Traits", description: "Array of traits this feature provides" }),
  })
  .meta({
    title: "Character Feature",
    description: "A feature that provides traits to characters",
  });

// Class Feature Schema - extends CharacterFeature with level
export const ClassFeatureSchema = CharacterFeatureSchema.extend({
  level: z
    .number()
    .int()
    .min(1)
    .max(20)
    .meta({ title: "Level", description: "Level at which this feature is gained" }),
}).meta({
  title: "Class Feature",
  description: "A class feature that provides traits to characters at specific levels",
});

// ========================================
// Export Inferred Types
// ========================================

// Feature Trait Types
export type FeatureTraitType =
  | "ability"
  | "attribute_boost"
  | "stat_bonus"
  | "proficiency"
  | "spell_school"
  | "spell_school_choice"
  | "utility_spells"
  | "spell_tier_access"
  | "resource"
  | "dice_pool"
  | "subclass_choice"
  | "pick_feature_from_pool"
  | "resistance"
  | "spell_scaling";

export type TraitSource = "feature" | "item";

export type ProficiencyGrant = z.infer<typeof ProficiencyGrantSchema>;
export type SpellSchool = z.infer<typeof SpellSchoolSchema>;
export type Resistance = z.infer<typeof ResistanceSchema>;

export type AbilityFeatureTrait = z.infer<typeof AbilityFeatureTraitSchema>;
export type AttributeBoostFeatureTrait = z.infer<typeof AttributeBoostFeatureTraitSchema>;
export type StatBonusFeatureTrait = z.infer<typeof StatBonusFeatureTraitSchema>;
export type ProficiencyFeatureTrait = z.infer<typeof ProficiencyFeatureTraitSchema>;
export type SpellSchoolFeatureTrait = z.infer<typeof SpellSchoolFeatureTraitSchema>;
export type SpellSchoolChoiceFeatureTrait = z.infer<typeof SpellSchoolChoiceFeatureTraitSchema>;
export type UtilitySpellsFeatureTrait = z.infer<typeof UtilitySpellsFeatureTraitSchema>;
export type SpellTierAccessFeatureTrait = z.infer<typeof SpellTierAccessFeatureTraitSchema>;
export type ResourceFeatureTrait = z.infer<typeof ResourceFeatureTraitSchema>;
export type DicePoolFeatureTrait = z.infer<typeof DicePoolFeatureTraitSchema>;
export type SubclassChoiceFeatureTrait = z.infer<typeof SubclassChoiceFeatureTraitSchema>;
export type PickFeatureFromPoolFeatureTrait = z.infer<
  typeof PickFeatureFromPoolFeatureTraitSchema
>;
export type ResistanceFeatureTrait = z.infer<typeof ResistanceFeatureTraitSchema>;
export type SpellScalingFeatureTrait = z.infer<typeof SpellScalingFeatureTraitSchema>;

export type FeatureTrait = z.infer<typeof FeatureTraitSchema>;

// Character Feature Types
export type CharacterFeature = z.infer<typeof CharacterFeatureSchema>;
export type ClassFeature = z.infer<typeof ClassFeatureSchema>;
