import { z } from "zod";

// Dice type schema
export const diceTypeSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(10),
  z.literal(12),
  z.literal(20),
  z.literal(44),
  z.literal(66),
  z.literal(88),
  z.literal(100),
]);

// Dice category enum for categorizing dice results
export const diceCategorySchema = z.enum([
  "normal",
  "critical",
  "explosion",
  "vicious",
  "dropped",
  "fumble",
]);

// Schema for categorized dice data
export const categorizedDieSchema = z.object({
  value: z.number(),
  size: z.number(),
  kept: z.boolean(),
  category: diceCategorySchema,
  index: z.number(),
});

// Schema for dice roll data with rich information
export const diceRollDataSchema = z.object({
  dice: z.array(categorizedDieSchema),
  beforeExpression: z.string().optional(),
  afterExpression: z.string().optional(),
  total: z.number(),
  isDoubleDigit: z.boolean().optional(),
  isFumble: z.boolean().optional(),
  advantageLevel: z.number().optional(),
  criticalHits: z.number().optional(),
});

// Dice formula options schema
export const diceFormulaOptionsSchema = z.object({
  advantageLevel: z.number().optional(),
  allowCriticals: z.boolean().optional(),
  allowFumbles: z.boolean().optional(),
  vicious: z.boolean().optional(),
  explodeAll: z.boolean().optional(),
});

// Dice formula result schema
export const diceFormulaResultSchema = z.object({
  displayString: z.string(),
  diceData: diceRollDataSchema.optional(),
  total: z.number(),
  formula: z.string(),
  substitutedFormula: z.string().optional(),
});

// Export inferred types
export type DiceType = z.infer<typeof diceTypeSchema>;
export type DiceCategory = z.infer<typeof diceCategorySchema>;
export type CategorizedDie = z.infer<typeof categorizedDieSchema>;
export type DiceRollData = z.infer<typeof diceRollDataSchema>;
export type DiceFormulaOptions = z.infer<typeof diceFormulaOptionsSchema>;
export type DiceFormulaResult = z.infer<typeof diceFormulaResultSchema>;
