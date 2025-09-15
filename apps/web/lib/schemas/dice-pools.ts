import { z } from "zod";

import { ICON_IDS } from "../utils/icon-utils";
import { diceTypeSchema } from "./dice";
import { flexibleValueSchema } from "./flexible-value";

// Resource reset condition schema (shared with resources)
export const resourceResetConditionSchema = z.enum([
  "safe_rest",
  "encounter_end",
  "turn_end",
  "never",
  "manual",
]);

// Dice pool reset type schema
export const dicePoolResetTypeSchema = z.enum(["to_zero", "to_max"]);

// Dice pool definition schema
export const dicePoolDefinitionSchema = z.object({
  id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the dice pool" }),
  name: z.string().min(1).meta({ title: "Name", description: "Display name of the dice pool" }),
  description: z
    .string()
    .optional()
    .meta({ title: "Description", description: "Optional description of the dice pool" }),
  colorScheme: z
    .string()
    .min(1)
    .meta({ title: "Color Scheme", description: "Color scheme ID (e.g., blue-magic, red-fury)" }),
  icon: z
    .enum(ICON_IDS as [string, ...string[]])
    .optional()
    .meta({ title: "Icon", description: "Icon identifier (e.g., sparkles, flame, gem)" }),
  diceSize: diceTypeSchema.meta({
    title: "Dice Size",
    description: "Size of dice in the pool (d4, d6, d8, etc.)",
  }),
  maxDice: flexibleValueSchema.meta({
    title: "Maximum Dice",
    description: "Maximum number of dice that can be stored in the pool",
  }),
  resetCondition: resourceResetConditionSchema.meta({
    title: "Reset Condition",
    description: "When this dice pool resets",
  }),
  resetType: dicePoolResetTypeSchema.meta({
    title: "Reset Type",
    description: "How the pool resets (to_zero clears all dice, to_max fills the pool)",
  }),
});

// Dice pool instance schema
export const dicePoolInstanceSchema = z.object({
  definition: dicePoolDefinitionSchema,
  currentDice: z.array(z.number().int().positive()),
  sortOrder: z.number().int().min(0),
});

// Export inferred types
export type ResourceResetCondition = z.infer<typeof resourceResetConditionSchema>;
export type DicePoolResetType = z.infer<typeof dicePoolResetTypeSchema>;
export type DicePoolDefinition = z.infer<typeof dicePoolDefinitionSchema>;
export type DicePoolInstance = z.infer<typeof dicePoolInstanceSchema>;
