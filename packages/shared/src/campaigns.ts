import { z } from "zod";
import { anyMonsterSchema } from "./monsters/schemas.js";

const id = z.string().min(1).max(100);
const title = z.string().trim().min(1).max(120);
const prose = z.string().max(10000);
const count = z.number().int().min(1).max(999);
export const partyItemSchema = z
  .object({
    id,
    name: title,
    type: z.enum(["freeform", "weapon", "armor", "consumable", "ammunition"]),
    size: z.number().int().min(0).max(1000),
    description: prose.optional(),
    damage: z.string().max(100).optional(),
    armor: z.number().int().min(0).max(100).optional(),
  })
  .passthrough()
  .refine(
    (item) => item.type !== "weapon" || !!item.damage,
    "Weapons need a damage formula",
  );
export const stashSchema = z.object({
  id,
  item: partyItemSchema,
  quantity: count,
  location: title,
  hidden: z.boolean(),
});
export const journalSchema = z.object({
  id,
  title,
  body: prose,
  kind: z.enum(["note", "quest", "handout"]),
  visibility: z.enum(["party", "gm"]),
  completed: z.boolean(),
});
export const sessionSchema = z.object({
  id,
  title,
  scheduledFor: z.string().max(100),
  status: z.enum(["planned", "active", "completed"]),
  summary: prose,
  gmNotes: prose,
});
export const encounterSchema = z
  .object({
    id,
    name: title,
    objective: prose,
    environment: prose,
    rewards: prose,
    gmNotes: prose,
    monsters: z
      .array(
        z.object({
          monsterId: id,
          count: z.number().int().min(1).max(30),
          wave: z.number().int().min(1).max(20),
        }),
      )
      .max(30),
  })
  .refine(
    (e) => e.monsters.reduce((sum, m) => sum + m.count, 0) <= 60,
    "An encounter can have at most 60 enemies",
  );
export const combatantSchema = z.object({
  id,
  name: title,
  monster: anyMonsterSchema,
  hp: z.number().int().min(0).max(100000),
  actions: z.number().int().min(0).max(20),
  conditions: z.string().max(500),
  wave: z.number().int().min(1).max(20),
  revealed: z.boolean(),
  phase: z.enum(["normal", "bloodied", "lastStand"]),
});
export const runSchema = z.object({
  id,
  encounterId: id,
  sessionId: id.nullable(),
  name: title,
  round: z.number().int().min(1).max(10000),
  status: z.enum(["active", "completed"]),
  objective: prose,
  environment: prose,
  combatants: z.array(combatantSchema).max(60),
});
export const stateSchema = z.object({
  description: prose,
  items: z.array(stashSchema).max(200),
  treasury: z.object({
    gold: z.number().int().min(0).max(100000000),
    silver: z.number().int().min(0).max(100000000),
  }),
  journal: z.array(journalSchema).max(200),
  sessions: z.array(sessionSchema).max(100),
  monsters: z.array(anyMonsterSchema).max(200),
  encounters: z.array(encounterSchema).max(100),
  runs: z.array(runSchema).max(100),
  activity: z
    .array(
      z.object({
        id,
        at: z.string(),
        actor: z.string(),
        message: z.string().max(1000),
        gmOnly: z.boolean(),
      }),
    )
    .max(500),
});
export type CampaignState = z.infer<typeof stateSchema>;
export type PartyItem = z.infer<typeof partyItemSchema>;
export type Encounter = z.infer<typeof encounterSchema>;
export type Combatant = z.infer<typeof combatantSchema>;
export const emptyState = (): CampaignState => ({
  description: "",
  items: [],
  treasury: { gold: 0, silver: 0 },
  journal: [],
  sessions: [],
  monsters: [],
  encounters: [],
  runs: [],
  activity: [],
});

// Mutations are commands, never an arbitrary replacement of the shared document.
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("settings"), name: title, description: prose }),
  z.object({
    type: z.literal("attach"),
    characterId: id.nullable(),
    shareNotes: z.boolean(),
  }),
  z.object({
    type: z.literal("member"),
    userId: id,
    action: z.enum(["remove", "GM", "PLAYER"]),
  }),
  z.object({ type: z.literal("stash"), entry: stashSchema }),
  z.object({
    type: z.literal("transfer"),
    direction: z.enum(["deposit", "claim"]),
    userId: id,
    itemId: id,
    quantity: count,
    inventoryRevision: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("currency"),
    direction: z.enum(["deposit", "claim", "award"]),
    userId: id,
    currency: z.enum(["gold", "silver"]),
    amount: z.number().int().min(1).max(1000000),
    inventoryRevision: z.number().int().min(0),
  }),
  z.object({ type: z.literal("journal"), entry: journalSchema }),
  z.object({ type: z.literal("session"), entry: sessionSchema }),
  z.object({ type: z.literal("monster"), entry: anyMonsterSchema }),
  z.object({ type: z.literal("encounter"), entry: encounterSchema }),
  z.object({
    type: z.literal("delete"),
    collection: z.enum([
      "items",
      "journal",
      "sessions",
      "monsters",
      "encounters",
      "runs",
    ]),
    id,
  }),
  z.object({
    type: z.literal("start"),
    encounterId: id,
    sessionId: id.nullable(),
  }),
  z.object({ type: z.literal("round"), runId: id }),
  z.object({ type: z.literal("finish"), runId: id }),
  z.object({
    type: z.literal("combatant"),
    runId: id,
    combatantId: id,
    hp: z.number().int().min(0).max(100000),
    actions: z.number().int().min(0).max(20),
    conditions: z.string().max(500),
    revealed: z.boolean(),
    phase: z.enum(["normal", "bloodied", "lastStand"]),
  }),
]);
export type Command = z.infer<typeof commandSchema>;
export const mutationSchema = z.object({
  operationId: z.string().uuid(),
  expectedRevision: z.number().int().min(0),
  command: commandSchema,
});
export type Mutation = z.infer<typeof mutationSchema>;
export const createSchema = z.object({
  name: title,
  description: prose.default(""),
});
export const inviteSchema = z.object({
  days: z.number().int().min(1).max(30),
  maxUses: z.number().int().min(1).max(20),
  expectedRevision: z.number().int().min(0),
});
export interface MemberView {
  userId: string;
  name: string;
  role: "GM" | "PLAYER";
  characterId: string | null;
  shareNotes: boolean;
  character: Record<string, unknown> | null;
  syncedAt: string | null;
  inventoryRevision: number;
}
export interface CampaignView {
  id: string;
  name: string;
  ownerId: string;
  revision: number;
  isGM: boolean;
  members: MemberView[];
  state: Omit<CampaignState, "runs"> & {
    runs: (Omit<CampaignState["runs"][number], "combatants"> & {
      combatants: (Omit<Combatant, "monster"> & {
        monster?: Combatant["monster"];
      })[];
    })[];
  };
  invites: {
    id: string;
    expiresAt: string;
    uses: number;
    maxUses: number;
    revoked: boolean;
  }[];
}
export interface CampaignSummary {
  id: string;
  name: string;
  role: string;
  revision: number;
}
export const channelName = (campaignId: string, userId: string) =>
  `private-campaign-${campaignId}-user-${userId}`;
