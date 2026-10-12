import { z } from "zod";

const hp = z.number().int().min(1).max(99999);
const memberSchema = z.object({
  name: z.string().trim().min(1).max(160),
  hp,
  hpPerHero: hp.optional(),
  lastStandHp: hp.optional(),
  lastStandHpPerHero: hp.optional(),
  armor: z.string().max(80).default("none"),
  size: z.string().max(80).default("medium"),
  saves: z.string().max(240).default(""),
  body: z.string().max(100000).default(""),
});
export const monsterStatsSchema = z
  .object({
    hp: hp.optional(),
    hpPerHero: hp.optional(),
    level: z.string().trim().min(1).max(40),
    armor: z.string().max(80).optional(),
    size: z.string().max(80).optional(),
    kind: z.string().max(160).default(""),
    movement: z.string().max(240).default(""),
    saves: z.string().max(240).default(""),
    legendary: z.boolean().default(false),
    bloodied: z.string().max(100000).optional(),
    lastStand: z.string().max(100000).optional(),
    bloodiedAt: z.number().int().min(0).max(99999).optional(),
    lastStandHp: hp.optional(),
    lastStandHpPerHero: hp.optional(),
    minion: z.boolean().default(false),
    hazard: z.boolean().optional(),
    members: z.array(memberSchema).min(1).max(20).optional(),
    incomplete: z.boolean().optional(),
    missing: z.array(z.string().max(500)).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      !value.hazard &&
      !value.hp &&
      !value.hpPerHero &&
      !value.members?.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["hp"],
        message: "A creature requires HP, HP per hero or team members",
      });
  });
