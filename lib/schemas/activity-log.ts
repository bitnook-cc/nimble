import { z } from "zod";

// Import SingleDie type from dice schemas
import { singleDieSchema } from "./dice";

// Base log entry schema
export const baseLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.date(),
  description: z.string().min(1),
});

// Dice roll log entry schema
export const diceRollEntrySchema = z
  .object({
    type: z.literal("roll"),
    dice: z.array(singleDieSchema),
    droppedDice: z.array(singleDieSchema).optional(),
    modifier: z.number(),
    total: z.number(),
    rollExpression: z.string().min(1),
    isMiss: z.boolean().optional(),
    criticalHits: z.number().optional(),
    advantageLevel: z.number().optional(),
  })
  .merge(baseLogEntrySchema);

// Damage log entry schema
export const damageEntrySchema = z
  .object({
    type: z.literal("damage"),
    amount: z.number().positive(),
    targetType: z.enum(["hp", "temp_hp"]),
  })
  .merge(baseLogEntrySchema);

// Healing log entry schema
export const healingEntrySchema = z
  .object({
    type: z.literal("healing"),
    amount: z.number().positive(),
  })
  .merge(baseLogEntrySchema);

// Temporary HP log entry schema
export const tempHPEntrySchema = z
  .object({
    type: z.literal("temp_hp"),
    amount: z.number().positive(),
    previous: z.number().optional(),
  })
  .merge(baseLogEntrySchema);

// Initiative log entry schema
export const initiativeEntrySchema = z
  .object({
    type: z.literal("initiative"),
    total: z.number(),
    actionsGranted: z.number().positive(),
  })
  .merge(baseLogEntrySchema);

// Ability usage log entry schema
export const abilityUsageEntrySchema = z
  .object({
    type: z.literal("ability_usage"),
    abilityName: z.string().min(1),
    frequency: z.enum(["per_turn", "per_encounter", "per_safe_rest", "at_will"]),
    usesRemaining: z.number().min(0),
    maxUses: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Safe rest log entry schema
export const safeRestEntrySchema = z
  .object({
    type: z.literal("safe_rest"),
    healingAmount: z.number().min(0),
    hitDiceRestored: z.number().min(0),
    woundsRemoved: z.number().min(0),
    abilitiesReset: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Catch breath log entry schema
export const catchBreathEntrySchema = z
  .object({
    type: z.literal("catch_breath"),
    hitDiceSpent: z.number().min(0),
    healingAmount: z.number().min(0),
    abilitiesReset: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Make camp log entry schema
export const makeCampEntrySchema = z
  .object({
    type: z.literal("make_camp"),
    healingAmount: z.number().min(0),
    hitDiceRestored: z.number().min(0),
    abilitiesReset: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Resource usage log entry schema
export const resourceUsageEntrySchema = z
  .object({
    type: z.literal("resource"),
    resourceId: z.string().min(1),
    resourceName: z.string().min(1),
    amount: z.number().positive(),
    action: z.enum(["spent", "restored"]),
    currentAmount: z.number().min(0),
    maxAmount: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Spell cast log entry schema
export const spellCastEntrySchema = z
  .object({
    type: z.literal("spell_cast"),
    spellName: z.string().min(1),
    school: z.string().min(1),
    tier: z.number().min(0).max(9),
    resourceCost: z
      .object({
        resourceId: z.string().min(1),
        resourceName: z.string().min(1),
        amount: z.number().positive(),
      })
      .optional(),
    actionCost: z.number().min(0),
  })
  .merge(baseLogEntrySchema);

// Item consumption log entry schema
export const itemConsumptionEntrySchema = z
  .object({
    type: z.literal("item_consumption"),
    itemName: z.string().min(1),
    itemType: z.enum(["consumable", "ammunition"]),
    countBefore: z.number().positive(),
    countAfter: z.number().min(0),
    itemRemoved: z.boolean(),
  })
  .merge(baseLogEntrySchema);

// Union schema for all log entries
export const logEntrySchema = z.discriminatedUnion("type", [
  diceRollEntrySchema,
  damageEntrySchema,
  healingEntrySchema,
  tempHPEntrySchema,
  initiativeEntrySchema,
  abilityUsageEntrySchema,
  safeRestEntrySchema,
  catchBreathEntrySchema,
  makeCampEntrySchema,
  resourceUsageEntrySchema,
  spellCastEntrySchema,
  itemConsumptionEntrySchema,
]);

// Export inferred types
export type BaseLogEntry = z.infer<typeof baseLogEntrySchema>;
export type DiceRollEntry = z.infer<typeof diceRollEntrySchema>;
export type DamageEntry = z.infer<typeof damageEntrySchema>;
export type HealingEntry = z.infer<typeof healingEntrySchema>;
export type TempHPEntry = z.infer<typeof tempHPEntrySchema>;
export type InitiativeEntry = z.infer<typeof initiativeEntrySchema>;
export type AbilityUsageEntry = z.infer<typeof abilityUsageEntrySchema>;
export type SafeRestEntry = z.infer<typeof safeRestEntrySchema>;
export type CatchBreathEntry = z.infer<typeof catchBreathEntrySchema>;
export type MakeCampEntry = z.infer<typeof makeCampEntrySchema>;
export type ResourceUsageEntry = z.infer<typeof resourceUsageEntrySchema>;
export type SpellCastEntry = z.infer<typeof spellCastEntrySchema>;
export type ItemConsumptionEntry = z.infer<typeof itemConsumptionEntrySchema>;

export type LogEntry = z.infer<typeof logEntrySchema>;
export type ValidatedLogEntry = LogEntry;