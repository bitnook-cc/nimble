import { z } from "zod";

import { flexibleValueSchema } from "./flexible-value";

export const attributeBonusesSchema = z
  .object({
    strength: flexibleValueSchema.optional(),
    dexterity: flexibleValueSchema.optional(),
    intelligence: flexibleValueSchema.optional(),
    will: flexibleValueSchema.optional(),
  })
  .optional();

export const skillBonusSchema = z.object({
  bonus: flexibleValueSchema.optional(),
  advantage: flexibleValueSchema.optional(),
});

// Bonus schema that allows negative values (e.g., Fiendish Boon's -1 hit dice)
const signedFlexibleValueSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("fixed"),
    value: z.number().int(),
  }),
  z.object({
    type: z.literal("formula"),
    expression: z.string().min(1).max(100),
  }),
]);

export const statBonusSchema = z.object({
  // Core attributes
  attributes: attributeBonusesSchema,

  // Skills (by skill name)
  skillBonuses: z.record(z.string(), skillBonusSchema).optional(),

  // Combat and health stats
  maxHpBonus: flexibleValueSchema.optional(),
  hitDieSizeOverride: z
    .union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12), z.literal(20)])
    .optional(),
  hitDieSizeStep: z.number().int().optional(),
  hitDiceBonus: signedFlexibleValueSchema.optional(),
  maxWoundsBonus: flexibleValueSchema.optional(),
  armorBonus: flexibleValueSchema.optional(),
  initiativeBonus: skillBonusSchema.optional(),
  speedBonus: flexibleValueSchema.optional(),

  // Resource bonuses (by resource definition id)
  resourceMaxBonuses: z.record(z.string(), flexibleValueSchema).optional(),
  resourceMinBonuses: z.record(z.string(), flexibleValueSchema).optional(),
});

// Export inferred types
export type AttributeBonuses = z.infer<typeof attributeBonusesSchema>;
export type SkillBonus = z.infer<typeof skillBonusSchema>;
export type StatBonus = z.infer<typeof statBonusSchema>;
