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

export const statBonusSchema = z.object({
  // Core attributes
  attributes: attributeBonusesSchema,

  // Skills (by skill name)
  skillBonuses: z.record(z.string(), flexibleValueSchema).optional(),

  // Combat and health stats
  hitDiceBonus: flexibleValueSchema.optional(),
  maxWoundsBonus: flexibleValueSchema.optional(),
  armorBonus: flexibleValueSchema.optional(),
  initiativeBonus: flexibleValueSchema.optional(),
  speedBonus: flexibleValueSchema.optional(),

  // Resource bonuses (by resource definition id)
  resourceMaxBonuses: z.record(z.string(), flexibleValueSchema).optional(),
  resourceMinBonuses: z.record(z.string(), flexibleValueSchema).optional(),
});

export type ValidatedStatBonus = z.infer<typeof statBonusSchema>;

// Export inferred types
export type AttributeBonuses = z.infer<typeof attributeBonusesSchema>;
export type StatBonus = z.infer<typeof statBonusSchema>;
