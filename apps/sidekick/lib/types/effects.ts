import { z } from "zod";

// Effect type enum
export const effectTypeSchema = z.enum([
  "damage",
  "healing",
  "tempHP",
  "resourceChange",
  "dicePoolChange",
]);

export type EffectType = z.infer<typeof effectTypeSchema>;

// Base effect interface
interface BaseEffect {
  type: EffectType;
}

// Damage effect
export interface DamageEffect extends BaseEffect {
  type: "damage";
  diceFormula: string;
}

// Healing effect
export interface HealingEffect extends BaseEffect {
  type: "healing";
  diceFormula: string;
}

// Temporary HP effect
export interface TempHPEffect extends BaseEffect {
  type: "tempHP";
  diceFormula: string;
}

// Resource change effect
export interface ResourceChangeEffect extends BaseEffect {
  type: "resourceChange";
  resourceId: string;
  diceFormula: string;
}

// Dice pool change effect
export interface DicePoolChangeEffect extends BaseEffect {
  type: "dicePoolChange";
  poolId: string;
  diceFormula: string;
}

// Union type for all effects
export type Effect =
  | DamageEffect
  | HealingEffect
  | TempHPEffect
  | ResourceChangeEffect
  | DicePoolChangeEffect;

// Effect result for tracking applied effects
export interface EffectResult {
  effect: Effect;
  value: number;
  success: boolean;
  error?: string;
}

// Effect preview for UI display
export interface EffectPreview {
  type: EffectType;
  description: string;
  icon: string;
}
