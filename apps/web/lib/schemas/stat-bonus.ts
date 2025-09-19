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

export const statBonusSchema = z.object({
  // Core attributes
  attributes: attributeBonusesSchema,

  // Skills (by skill name)
  skillBonuses: z.record(z.string(), skillBonusSchema).optional(),

  // Combat and health stats
  hitDiceBonus: flexibleValueSchema.optional(),
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
