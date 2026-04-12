import { z } from "zod";
import { MONSTER_SIZES, ARMOR_TYPES } from "./constants";

export const monsterPassiveSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

export const monsterActionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  reach: z.number().int().positive().optional(),
  diceFormula: z.string().optional(),
});

export const monsterPhaseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  passives: z.array(monsterPassiveSchema).optional(),
  actions: z.array(monsterActionSchema).optional(),
});

const savesSchema = z
  .object({
    strength: z.number().int().optional(),
    dexterity: z.number().int().optional(),
    intelligence: z.number().int().optional(),
    will: z.number().int().optional(),
  })
  .optional();

const timestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const builderConfigSchema = z
  .object({
    baseLevel: z.number(),
    hpLevelOffset: z.number().int(),
    damageLevelOffset: z.number().int(),
    dieSize: z.number().int().positive(),
  })
  .optional();

const monsterBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  level: z.number().min(0),
  size: z.enum(MONSTER_SIZES),
  type: z.string().optional(),
  group: z.string().optional(),
  hitPoints: z.number().int().positive(),
  armor: z.enum(ARMOR_TYPES),
  speed: z.number().int().positive(),
  saves: savesSchema,
  passives: z.array(monsterPassiveSchema),
  actions: z.array(monsterActionSchema),
  notes: z.string().optional(),
  builderConfig: builderConfigSchema,
  timestamps: timestampsSchema,
});

export const monsterSchema = monsterBaseSchema.extend({
  kind: z.literal("standard"),
});

export const legendaryMonsterSchema = monsterBaseSchema.extend({
  kind: z.literal("legendary"),
  bloodied: monsterPhaseSchema.optional(),
  lastStand: monsterPhaseSchema.optional(),
});

export const anyMonsterSchema = z.discriminatedUnion("kind", [
  monsterSchema,
  legendaryMonsterSchema,
]);

export type MonsterFormData = z.infer<typeof monsterSchema>;
export type LegendaryMonsterFormData = z.infer<typeof legendaryMonsterSchema>;
export type AnyMonsterFormData = z.infer<typeof anyMonsterSchema>;
