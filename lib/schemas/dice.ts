import { z } from "zod";

// Dice type schema
const diceTypeSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(10),
  z.literal(12),
  z.literal(20),
  z.literal(66),
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
      description: "Type of dice (d4, d6, d8, d10, d12, d20, d66, d100)",
    }),
  })
  .meta({ title: "Dice Expression", description: "Dice expression for rolling" });

// Single die schema
export const singleDieSchema = z.object({
  type: diceTypeSchema,
  result: z.number().positive(),
  isCritical: z.boolean().optional(),
});

// Export inferred types
export type DiceType = z.infer<typeof diceTypeSchema>;
export type DiceExpression = z.infer<typeof diceExpressionSchema>;
export type SingleDie = z.infer<typeof singleDieSchema>;
