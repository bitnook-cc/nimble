import { z } from "zod";

import { flexibleValueSchema } from "./flexible-value";

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
      maxAmount: z.int().int().min(0).optional().meta({
        title: "Maximum Amount",
        description: "Maximum amount of resource to consume (integer). If not specified, defaults to the max amount of the resource.",
      }),
    }),
  ])
  .meta({ title: "Resource Cost", description: "Resource cost for using this ability" });

// Ability frequency schema
export const AbilityFrequencySchema = z.enum([
  "per_turn",
  "per_encounter",
  "per_safe_rest",
  "at_will",
]);

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
  diceFormula: z.string().optional().meta({
    title: "Dice Formula",
    description: "Dice formula (e.g., '1d20+5', '2d6+STR', 'STRd6')",
  }),
}).meta({ title: "Action Ability", description: "Non-spell ability that characters can use" });

// Spell ability schema
export const SpellAbilitySchema = UsableAbilityDefinitionSchema.extend({
  type: z.literal("spell"),
  school: z.string().min(1),
  tier: z.number().int().min(0).max(9),
  category: z.enum(["combat", "utility"]),
  diceFormula: z.string().optional().meta({
    title: "Dice Formula",
    description: "Dice formula (e.g., '1d20+5', '2d6+STR', 'STRd6')",
  }),
  scalingBonus: z.string().optional().meta({
    title: "Scaling Bonus",
    description: "Bonus dice formula per scaling multiplier (e.g., '+5', '+1d4', '+INT')",
  }),
  upcastBonus: z.string().optional().meta({
    title: "Upcast Bonus",
    description: "Bonus dice formula per extra resource spent (e.g., '+10', '+2d6', '+WIL')",
  }),
}).meta({ title: "Spell Ability", description: "Spell that characters can cast" });

// Combined ability schema
export const AbilityDefinitionSchema = z.discriminatedUnion("type", [
  FreeformAbilitySchema,
  ActionAbilitySchema,
  SpellAbilitySchema,
]);

// Legacy schema for class features (includes currentUses)
export const AbilitySchema = z.discriminatedUnion("type", [
  ActionAbilitySchema,
  SpellAbilitySchema,
]);

// Export inferred types
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
