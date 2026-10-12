import { z } from "zod";

export const encounterFieldsSchema = z
  .object({
    heroCount: z.number().int().min(1).max(100).default(4),
    heroLevel: z.number().finite().min(0).max(100).default(1),
    annotations: z.string().max(100000).default(""),
    entries: z
      .array(
        z.object({
          id: z.string().min(1).max(160),
          target: z.string().min(1).max(500),
          name: z.string().min(1).max(160),
          quantity: z.number().finite().positive().max(100),
          isPerHero: z.boolean(),
          heroesPerMonster: z.number().int().min(1).max(100).default(1),
        }),
      )
      .max(100),
    missing: z.array(z.string().max(500)).max(1000).default([]),
    extensions: z.record(z.string(), z.unknown()).default({}),
  })
  .superRefine((value, ctx) => {
    if (new Set(value.entries.map((e) => e.id)).size !== value.entries.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate encounter entry IDs",
      });
  });
export type EncounterFields = z.infer<typeof encounterFieldsSchema>;
