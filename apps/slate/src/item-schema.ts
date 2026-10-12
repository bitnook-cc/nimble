import { z } from "zod";

export const rarities = [
  "unspecified",
  "common",
  "uncommon",
  "rare",
  "very_rare",
  "legendary",
] as const;
// Optional mechanics are definition data, never owned quantities or remaining charges.
export const itemFieldsSchema = z.object({
  kind: z.string().trim().max(160).default(""),
  rarity: z.enum(rarities).default("unspecified"),
  moreInfo: z.string().max(100000).default(""),
  price: z
    .object({
      amount: z.number().finite().nonnegative().max(1e9),
      currency: z.string().trim().min(1).max(40),
    })
    .optional(),
  slots: z.number().finite().nonnegative().max(99999).optional(),
  damage: z.string().max(1000).optional(),
  armor: z.string().max(160).optional(),
  uses: z.number().int().nonnegative().max(99999).optional(),
  properties: z
    .record(z.string().max(100), z.string().max(2000))
    .refine(
      (value) => Object.keys(value).length <= 100,
      "Use at most 100 custom properties",
    )
    .default({}),
});
export type ItemFields = z.infer<typeof itemFieldsSchema>;
export const itemFilterSchema = z.object({
  query: z.string().max(500).default(""),
  type: z.string().max(160).default("all"),
  rarity: z.enum(["all", ...rarities]).default("all"),
  favouritesOnly: z.boolean().default(false),
});
