import { z } from "zod";

import { FeatureEffectSchema } from "./feature-effects";
import { flexibleValueSchema } from "./flexible-value";

// Basic building blocks with metadata
const DiceExpressionSchema = z
  .object({
    count: z
      .int()
      .int()
      .min(1)
      .max(20)
      .meta({ title: "Dice Count", description: "Number of dice to roll (integer)" }),
    sides: z
      .union([
        z.literal(4),
        z.literal(6),
        z.literal(8),
        z.literal(10),
        z.literal(12),
        z.literal(20),
        z.literal(66),
        z.literal(100),
      ])
      .meta({
        title: "Dice Type",
        description: "Type of dice (d4, d6, d8, d10, d12, d20, d66, d100)",
      }),
  })
  .meta({ title: "Dice Expression", description: "Dice expression for rolling" });

const AbilityRollSchema = z
  .object({
    dice: DiceExpressionSchema.meta({
      title: "Dice",
      description: "Dice to roll for this ability",
    }),
    modifier: z
      .int()
      .int()
      .optional()
      .meta({ title: "Modifier", description: "Fixed modifier to add to the roll (integer)" }),
    attribute: z
      .enum(["strength", "dexterity", "intelligence", "will"])
      .optional()
      .meta({ title: "Attribute", description: "Attribute to add to the roll" }),
  })
  .meta({ title: "Ability Roll", description: "Roll configuration for abilities" });

const ResourceCostSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("fixed").meta({ title: "Fixed Cost", description: "Fixed resource cost" }),
      resourceId: z
        .string()
        .meta({ title: "Resource ID", description: "ID of the resource to consume" }),
      amount: z
        .int()
        .int()
        .min(0)
        .meta({ title: "Amount", description: "Amount of resource to consume (integer)" }),
    }),
    z.object({
      type: z
        .literal("variable")
        .meta({ title: "Variable Cost", description: "Variable resource cost" }),
      resourceId: z
        .string()
        .meta({ title: "Resource ID", description: "ID of the resource to consume" }),
      minAmount: z
        .int()
        .int()
        .min(0)
        .meta({
          title: "Minimum Amount",
          description: "Minimum amount of resource to consume (integer)",
        }),
      maxAmount: z
        .int()
        .int()
        .min(0)
        .meta({
          title: "Maximum Amount",
          description: "Maximum amount of resource to consume (integer)",
        }),
    }),
  ])
  .meta({ title: "Resource Cost", description: "Resource cost for using this ability" });

// Armor proficiency schemas
const ArmorProficiencySchema = z.union([
  z.object({ type: z.literal("cloth") }),
  z.object({ type: z.literal("leather") }),
  z.object({ type: z.literal("mail") }),
  z.object({ type: z.literal("plate") }),
  z.object({ type: z.literal("shields") }),
  z.object({
    type: z.literal("freeform"),
    name: z.string().min(1),
  }),
]);

// Weapon proficiency schemas
const WeaponProficiencySchema = z.union([
  z.object({ type: z.literal("strength_weapons") }),
  z.object({ type: z.literal("dexterity_weapons") }),
  z.object({
    type: z.literal("freeform"),
    name: z.string().min(1),
  }),
]);

// Ability schemas (for class features)
const ActionAbilitySchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the ability" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the ability" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of what the ability does" }),
    type: z
      .literal("action")
      .meta({ title: "Type", description: 'Must be "action" for action abilities' }),
    frequency: z
      .enum(["per_turn", "per_encounter", "per_safe_rest", "at_will"])
      .meta({ title: "Frequency", description: "How often the ability can be used" }),
    maxUses: flexibleValueSchema.optional(),
    currentUses: z
      .number()
      .int()
      .min(0)
      .optional()
      .meta({ title: "Current Uses", description: "Current remaining uses (integer)" }),
    roll: AbilityRollSchema.optional().meta({
      title: "Roll",
      description: "Dice roll configuration for the ability",
    }),
    actionCost: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .meta({
        title: "Action Cost",
        description: "Action cost (0=bonus, 1=action, 2=full turn, integer)",
      }),
    resourceCost: ResourceCostSchema.optional().meta({
      title: "Resource Cost",
      description: "Resource cost to use the ability",
    }),
  })
  .meta({ title: "Action Ability", description: "Non-spell ability that characters can use" });

const SpellAbilitySchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the spell" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the spell" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the spell's effects" }),
    type: z
      .literal("spell")
      .meta({ title: "Type", description: 'Must be "spell" for spell abilities' }),
    school: z
      .string()
      .min(1)
      .meta({ title: "School", description: "ID of the spell school this belongs to" }),
    tier: z
      .number()
      .int()
      .min(0)
      .max(9)
      .meta({ title: "Tier", description: "Spell tier/level (0-9, integer)" }),
    roll: AbilityRollSchema.optional().meta({
      title: "Roll",
      description: "Dice roll configuration for the spell",
    }),
    actionCost: z
      .number()
      .int()
      .min(0)
      .max(5)
      .optional()
      .meta({
        title: "Action Cost",
        description: "Action cost (0=bonus, 1=action, 2=full turn, integer)",
      }),
    resourceCost: ResourceCostSchema.optional().meta({
      title: "Resource Cost",
      description: "Resource cost to cast the spell",
    }),
  })
  .meta({ title: "Spell Ability", description: "Spell that characters can cast" });

const AbilitySchema = z.discriminatedUnion("type", [ActionAbilitySchema, SpellAbilitySchema]);

// Class Feature Schema - now uses effects array
export const ClassFeatureSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the feature" }),
    level: z
      .number()
      .int()
      .min(1)
      .max(20)
      .meta({ title: "Level", description: "Level at which this feature is gained" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the feature" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the feature" }),
    effects: z
      .array(FeatureEffectSchema)
      .meta({ title: "Effects", description: "Array of effects this feature provides" }),
  })
  .meta({ title: "Class Feature", description: "A feature that provides effects to characters" });

const FeaturePoolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  features: z.array(ClassFeatureSchema),
});

// Main schemas
export const ClassDefinitionSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the class" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the class" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the class" }),
    hitDieSize: z
      .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)])
      .meta({
        title: "Hit Die Size",
        description: "Hit die size for this class (d4, d6, d8, d10, d12, integer)",
      }),
    keyAttributes: z
      .array(z.enum(["strength", "dexterity", "intelligence", "will"]))
      .meta({ title: "Key Attributes", description: "Primary attributes for this class" }),
    startingHP: z
      .number()
      .int()
      .min(1)
      .meta({ title: "Starting HP", description: "Base hit points at level 1 (integer)" }),
    armorProficiencies: z
      .array(ArmorProficiencySchema)
      .meta({ title: "Armor Proficiencies", description: "Types of armor this class can use" }),
    weaponProficiencies: z
      .array(WeaponProficiencySchema)
      .meta({ title: "Weapon Proficiencies", description: "Types of weapons this class can use" }),
    saveAdvantages: z
      .object({
        strength: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Strength Saves", description: "Saving throw modifier for strength" }),
        dexterity: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Dexterity Saves", description: "Saving throw modifier for dexterity" }),
        intelligence: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({
            title: "Intelligence Saves",
            description: "Saving throw modifier for intelligence",
          }),
        will: z
          .enum(["advantage", "disadvantage", "normal"])
          .optional()
          .meta({ title: "Will Saves", description: "Saving throw modifier for will" }),
      })
      .meta({ title: "Save Advantages", description: "Saving throw advantages/disadvantages" }),
    startingEquipment: z
      .array(z.string())
      .meta({
        title: "Starting Equipment",
        description: "Array of repository item IDs for starting equipment",
      }),
    features: z
      .array(ClassFeatureSchema)
      .meta({ title: "Features", description: "Array of class features by level" }),
    featurePools: z
      .array(FeaturePoolSchema)
      .optional()
      .meta({ title: "Feature Pools", description: "Pools of features for player selection" }),
    subclasses: z
      .array(
        z.object({
          id: z
            .string()
            .min(1)
            .meta({ title: "ID", description: "Unique identifier for the subclass" }),
          name: z
            .string()
            .min(1)
            .meta({ title: "Name", description: "Display name of the subclass" }),
          description: z
            .string()
            .min(1)
            .meta({ title: "Description", description: "Detailed description of the subclass" }),
          parentClassId: z
            .string()
            .min(1)
            .meta({ title: "Parent Class ID", description: "ID of the parent class" }),
          features: z
            .array(ClassFeatureSchema)
            .meta({ title: "Features", description: "Array of subclass features by level" }),
        }),
      )
      .optional()
      .meta({ title: "Subclasses", description: "Available subclasses for this class" }),
  })
  .meta({
    title: "Class Definition",
    description: "Character class definition with features, proficiencies, and progression",
  });

export const SubclassDefinitionSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the subclass" }),
    name: z.string().min(1).meta({ title: "Name", description: "Display name of the subclass" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Detailed description of the subclass" }),
    parentClassId: z
      .string()
      .min(1)
      .meta({ title: "Parent Class ID", description: "ID of the parent class" }),
    features: z
      .array(ClassFeatureSchema)
      .meta({ title: "Features", description: "Array of subclass features by level" }),
  })
  .meta({ title: "Subclass Definition", description: "Character subclass specialization" });

export const SpellSchoolDefinitionSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .meta({ title: "ID", description: "Unique identifier for the spell school" }),
    name: z
      .string()
      .min(1)
      .meta({ title: "Name", description: "Display name of the spell school" }),
    description: z
      .string()
      .min(1)
      .meta({ title: "Description", description: "Description of the school's magical focus" }),
    spells: z
      .array(SpellAbilitySchema)
      .meta({ title: "Spells", description: "Array of spells in this school" }),
    utilitySpells: z
      .array(SpellAbilitySchema)
      .optional()
      .default([])
      .meta({
        title: "Utility Spells",
        description: "Array of utility spells that must be learned separately",
      }),
  })
  .meta({
    title: "Spell School Definition",
    description: "School of magic with associated spells",
  });

// Export individual schemas for content validation
export {
  ActionAbilitySchema,
  SpellAbilitySchema,
  DiceExpressionSchema,
  AbilityRollSchema,
  ResourceCostSchema,
};
