import {
  type CategorizedDie,
  type DiceCategory,
  type DiceRollData,
  type DiceType,
  categorizedDieSchema,
  diceCategorySchema,
  diceRollDataSchema,
  diceTypeSchema,
} from "@nimble/dice";
import { z } from "zod";

// Re-export imported types for backward compatibility
export {
  diceTypeSchema,
  diceCategorySchema,
  categorizedDieSchema,
  diceRollDataSchema,
  type DiceType,
  type DiceCategory,
  type CategorizedDie,
  type DiceRollData,
};

// Web-specific schemas that aren't in the shared package

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

// Export web-specific types
export type DiceExpression = z.infer<typeof diceExpressionSchema>;
export type SingleDie = z.infer<typeof singleDieSchema>;
