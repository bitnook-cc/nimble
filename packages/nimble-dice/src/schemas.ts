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

// Token schemas for tokenized formula evaluation
export const staticTokenSchema = z.object({
  type: z.literal("static"),
  value: z.number(),
  originalText: z.string(),
  isVariable: z.boolean().optional(),
});

export const diceTokenSchema = z.object({
  type: z.literal("dice"),
  notation: z.string(),
  count: z.number(),
  sides: z.number(),
  modifiers: z.array(z.string()),
});

export const operatorTokenSchema = z.object({
  type: z.literal("operator"),
  operator: z.enum(["+", "-", "*", "/", "(", ")"]),
});

export const formulaTokenSchema = z.discriminatedUnion("type", [
  staticTokenSchema,
  diceTokenSchema,
  operatorTokenSchema,
]);

export const diceTokenResultSchema = diceTokenSchema.extend({
  diceData: diceRollDataSchema,
});

export const formulaTokenResultsSchema = z.discriminatedUnion("type", [
  staticTokenSchema,
  diceTokenResultSchema,
  operatorTokenSchema,
]);

// Updated dice formula result schema with tokens
export const diceFormulaResultSchema = z.object({
  tokens: z.array(formulaTokenResultsSchema),
  displayString: z.string(),
  total: z.number(),
  formula: z.string(),
  substitutedFormula: z.string().optional(),
  numCriticals: z.number(),
  isFumble: z.boolean(),
});

// Export inferred types
export type DiceType = z.infer<typeof diceTypeSchema>;
export type DiceCategory = z.infer<typeof diceCategorySchema>;
export type CategorizedDie = z.infer<typeof categorizedDieSchema>;
export type DiceRollData = z.infer<typeof diceRollDataSchema>;
export type DiceFormulaOptions = z.infer<typeof diceFormulaOptionsSchema>;
export type StaticToken = z.infer<typeof staticTokenSchema>;
export type DiceToken = z.infer<typeof diceTokenSchema>;
export type OperatorToken = z.infer<typeof operatorTokenSchema>;
export type FormulaToken = z.infer<typeof formulaTokenSchema>;
export type DiceTokenResult = z.infer<typeof diceTokenResultSchema>;
export type FormulaTokenResults = z.infer<typeof formulaTokenResultsSchema>;
export type DiceFormulaResult = z.infer<typeof diceFormulaResultSchema>;
