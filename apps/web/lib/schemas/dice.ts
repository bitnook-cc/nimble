import { z } from "zod";

// Dice type schema
const diceTypeSchema = z.union([
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

// Dice expression schema with metadata
export const diceExpressionSchema = z
  .object({
    count: z
      .int()
      .min(1)
      .max(20)
      .meta({ title: "Dice Count", description: "Number of dice to roll (integer)" }),
    sides: diceTypeSchema.meta({
      title: "Dice Type",
      description: "Type of dice (d4, d6, d8, d10, d12, d20, d44, d66, d88, d100)",
    }),
  })
  .meta({ title: "Dice Expression", description: "Dice expression for rolling" });

// Single die schema
export const singleDieSchema = z.object({
  type: diceTypeSchema,
  result: z.number().positive(),
  isCritical: z.boolean().optional(),
});

// Dice category enum for reuse
export const diceCategorySchema = z.enum(["normal", "critical", "vicious", "dropped", "fumble"]);

// Schema for categorized dice data
export const categorizedDieSchema = z.object({
  value: z.number(),
  size: z.number(),
  kept: z.boolean(),
  category: diceCategorySchema,
  index: z.number(),
});

// Schema for dice roll data
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

// Export inferred types
export type DiceType = z.infer<typeof diceTypeSchema>;
export type DiceExpression = z.infer<typeof diceExpressionSchema>;
export type SingleDie = z.infer<typeof singleDieSchema>;
export type DiceCategory = z.infer<typeof diceCategorySchema>;
export type CategorizedDie = z.infer<typeof categorizedDieSchema>;
export type DiceRollData = z.infer<typeof diceRollDataSchema>;
