import { z } from "zod";

// Effect schemas for validation
export const damageEffectSchema = z.object({
  type: z.literal("damage"),
  diceFormula: z.string().min(1),
});

export const healingEffectSchema = z.object({
  type: z.literal("healing"),
  diceFormula: z.string().min(1),
});

export const tempHPEffectSchema = z.object({
  type: z.literal("tempHP"),
  diceFormula: z.string().min(1),
});

export const resourceChangeEffectSchema = z.object({
  type: z.literal("resourceChange"),
  resourceId: z.string().min(1),
  diceFormula: z.string().min(1),
});

export const dicePoolChangeEffectSchema = z.object({
  type: z.literal("dicePoolChange"),
  poolId: z.string().min(1),
  diceFormula: z.string().min(1),
});

// Union schema for all effects
export const effectSchema = z.discriminatedUnion("type", [
  damageEffectSchema,
  healingEffectSchema,
  tempHPEffectSchema,
  resourceChangeEffectSchema,
  dicePoolChangeEffectSchema,
]);

// Array of effects schema
export const effectsSchema = z.array(effectSchema);

// Export inferred types
export type DamageEffect = z.infer<typeof damageEffectSchema>;
export type HealingEffect = z.infer<typeof healingEffectSchema>;
export type TempHPEffect = z.infer<typeof tempHPEffectSchema>;
export type ResourceChangeEffect = z.infer<typeof resourceChangeEffectSchema>;
export type DicePoolChangeEffect = z.infer<typeof dicePoolChangeEffectSchema>;
export type Effect = z.infer<typeof effectSchema>;
