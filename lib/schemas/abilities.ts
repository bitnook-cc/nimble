import { z } from "zod";

import { diceExpressionSchema } from "./dice";
import { flexibleValueSchema } from "./flexible-value";

export const AbilityRollSchema = z
  .object({
    dice: diceExpressionSchema.meta({
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

export const ResourceCostSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("fixed").meta({ title: "Fixed Cost", description: "Fixed resource cost" }),
      resourceId: z
        .string()
        .meta({ title: "Resource ID", description: "ID of the resource to consume" }),
      amount: z
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
      minAmount: z.int().int().min(0).meta({
        title: "Minimum Amount",
        description: "Minimum amount of resource to consume (integer)",
      }),
      maxAmount: z.int().int().min(0).meta({
        title: "Maximum Amount",
        description: "Maximum amount of resource to consume (integer)",
      }),
    }),
  ])
  .meta({ title: "Resource Cost", description: "Resource cost for using this ability" });

// Ability frequency schema
export const AbilityFrequencySchema = z.enum(["per_turn", "per_encounter", "per_safe_rest", "at_will"]);

// Base ability schemas
export const BaseAbilityDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
});

export const UsableAbilityDefinitionSchema = BaseAbilityDefinitionSchema.extend({
  actionCost: z.number().int().min(0).max(5).optional(),
  resourceCost: ResourceCostSchema.optional(),
});

// Freeform ability schema
export const FreeformAbilitySchema = BaseAbilityDefinitionSchema.extend({
  type: z.literal("freeform"),
});

// Action ability schema
export const ActionAbilitySchema = UsableAbilityDefinitionSchema.extend({
  type: z.literal("action"),
  frequency: AbilityFrequencySchema,
  maxUses: flexibleValueSchema.optional(),
  roll: AbilityRollSchema.optional(),
})
  .meta({ title: "Action Ability", description: "Non-spell ability that characters can use" });

// Keep the old ActionAbilitySchema for class features with currentUses
export const ClassActionAbilitySchema = z
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
    actionCost: z.number().int().min(0).max(5).optional().meta({
      title: "Action Cost",
      description: "Action cost (0=bonus, 1=action, 2=full turn, integer)",
    }),
    resourceCost: ResourceCostSchema.optional().meta({
      title: "Resource Cost",
      description: "Resource cost to use the ability",
    }),
  })
  .meta({ title: "Action Ability", description: "Non-spell ability that characters can use" });

// Spell ability schema
export const SpellAbilitySchema = UsableAbilityDefinitionSchema.extend({
  type: z.literal("spell"),
  school: z.string().min(1),
  tier: z.number().int().min(0).max(9),
  category: z.enum(["combat", "utility"]),
  roll: AbilityRollSchema.optional(),
})
  .meta({ title: "Spell Ability", description: "Spell that characters can cast" });

// Combined ability schema
export const AbilityDefinitionSchema = z.discriminatedUnion("type", [
  FreeformAbilitySchema,
  ActionAbilitySchema,
  SpellAbilitySchema,
]);

// Legacy schema for class features (includes currentUses)
export const AbilitySchema = z.discriminatedUnion("type", [ClassActionAbilitySchema, SpellAbilitySchema]);

// Export inferred types
export type AbilityRoll = z.infer<typeof AbilityRollSchema>;
export type ResourceCost = z.infer<typeof ResourceCostSchema>;
export type FixedResourceCost = Extract<ResourceCost, { type: "fixed" }>;
export type VariableResourceCost = Extract<ResourceCost, { type: "variable" }>;
export type AbilityFrequency = z.infer<typeof AbilityFrequencySchema>;
export type BaseAbilityDefinition = z.infer<typeof BaseAbilityDefinitionSchema>;
export type UsableAbilityDefinition = z.infer<typeof UsableAbilityDefinitionSchema>;
export type FreeformAbilityDefinition = z.infer<typeof FreeformAbilitySchema>;
export type ActionAbilityDefinition = z.infer<typeof ActionAbilitySchema>;
export type SpellAbilityDefinition = z.infer<typeof SpellAbilitySchema>;
export type AbilityDefinition = z.infer<typeof AbilityDefinitionSchema>;