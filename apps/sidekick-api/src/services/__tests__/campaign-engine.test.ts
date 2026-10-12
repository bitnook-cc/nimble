import { describe, it, expect } from "vitest";
import { campaigns } from "@nimble/shared";
import { randomUUID } from "node:crypto";
import {
  applyCampaignCommand,
  characterView,
  publicState,
  transferItem,
} from "../campaign-engine.js";

const monster = () => ({
  id: randomUUID(),
  name: "Ogre",
  kind: "legendary" as const,
  level: 2,
  size: "Large" as const,
  hitPoints: 30,
  armor: "None" as const,
  speed: 6,
  actions: [{ name: "Secret spell", description: "Spoiler" }],
  passives: [],
  notes: "Secret weakness",
  timestamps: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});
const setup = () => {
  const state = campaigns.emptyState();
  const enemy = monster();
  state.monsters.push(enemy);
  state.encounters.push({
    id: "encounter",
    name: "Ambush",
    objective: "Hold the bridge",
    environment: "River",
    rewards: "Secret treasure",
    gmNotes: "Secret reinforcements",
    monsters: [{ monsterId: enemy.id, count: 2, wave: 1 }],
  });
  return state;
};
describe("campaign privacy and encounters", () => {
  it("never sends GM notes, plans, monster stats, or hidden enemies to players", () => {
    const state = setup();
    state.journal.push({
      id: "private",
      title: "Secret twist",
      body: "Spoiler",
      kind: "note",
      visibility: "gm",
      completed: false,
    });
    state.sessions.push({
      id: "session",
      title: "First game",
      scheduledFor: "",
      status: "planned",
      summary: "Public recap",
      gmNotes: "Secret twist",
    });
    state.activity.push({
      id: "event",
      at: "now",
      actor: "GM",
      message: "Secret supplies",
      gmOnly: true,
    });
    applyCampaignCommand(state, {
      type: "start",
      encounterId: "encounter",
      sessionId: "session",
    });
    expect(publicState(state, false).runs[0].combatants).toHaveLength(0);
    state.runs[0].combatants[0].revealed = true;
    const visible = publicState(state, false);
    expect(visible.runs[0].combatants).toHaveLength(1);
    expect(visible.runs[0].combatants[0].monster).toBeUndefined();
    expect(JSON.stringify(visible)).not.toMatch(/Secret|Spoiler/);
    expect(publicState(state, true)).toEqual(state);
  });
  it("shares private notes only by opt-in, and limits other players to a summary", () => {
    const data = {
      id: "hero",
      name: "Hero",
      hitPoints: { current: 4 },
      notes: ["Secret"],
      inventory: { items: [] },
      config: { private: "Secret" },
      unknownSecret: "Secret",
    };
    expect(characterView(data, false, true)).toEqual({
      id: "hero",
      name: "Hero",
      hitPoints: { current: 4 },
    });
    expect(characterView(data, true, false)).not.toHaveProperty("notes");
    expect(characterView(data, true, true)).toHaveProperty("notes", ["Secret"]);
    expect(characterView(data, true, true)).not.toHaveProperty("config");
    expect(characterView(data, true, true)).not.toHaveProperty("unknownSecret");
  });
  it("keeps combat state separate from reusable templates and later library edits", () => {
    const state = setup();
    applyCampaignCommand(state, {
      type: "start",
      encounterId: "encounter",
      sessionId: null,
    });
    const run = state.runs[0];
    const c = run.combatants[0];
    applyCampaignCommand(state, {
      type: "combatant",
      runId: run.id,
      combatantId: c.id,
      hp: 3,
      actions: 2,
      conditions: "Prone",
      revealed: true,
      phase: "bloodied",
    });
    expect(state.monsters[0].hitPoints).toBe(30);
    state.monsters[0].name = "Renamed";
    expect(c.monster.name).toBe("Ogre");
    applyCampaignCommand(state, { type: "round", runId: run.id });
    expect(run.round).toBe(2);
    expect(c.actions).toBe(0);
    expect(c.hp).toBe(3);
    expect(c.conditions).toBe("Prone");
    applyCampaignCommand(state, { type: "finish", runId: run.id });
    expect(() =>
      applyCampaignCommand(state, { type: "round", runId: run.id }),
    ).toThrow("no longer active");
  });
  it("enforces encounter size and valid references", () => {
    const state = setup();
    expect(
      campaigns.encounterSchema.safeParse({
        ...state.encounters[0],
        monsters: Array.from({ length: 3 }, () => ({
          monsterId: "m",
          count: 30,
          wave: 1,
        })),
      }).success,
    ).toBe(false);
    expect(() =>
      applyCampaignCommand(state, {
        type: "encounter",
        entry: {
          ...state.encounters[0],
          monsters: [{ monsterId: "missing", count: 1, wave: 1 }],
        },
      }),
    ).toThrow("removed");
    expect(() =>
      applyCampaignCommand(state, {
        type: "delete",
        collection: "monsters",
        id: state.monsters[0].id,
      }),
    ).toThrow("plans first");
  });
});
describe("party item transfers", () => {
  it("conserves quantities through partial deposits and claims without sharing IDs", () => {
    const state = campaigns.emptyState();
    const inventory = {
      items: [
        {
          id: "potion",
          name: "Potion",
          type: "consumable" as const,
          size: 1,
          count: 5,
        },
      ],
      currency: {},
      itemOrder: ["potion"],
    };
    transferItem(state, inventory, {
      type: "transfer",
      direction: "deposit",
      userId: "owner",
      itemId: "potion",
      quantity: 3,
      inventoryRevision: 0,
    });
    expect(inventory.items[0].count).toBe(2);
    expect(state.items[0].quantity).toBe(3);
    transferItem(state, inventory, {
      type: "transfer",
      direction: "claim",
      userId: "owner",
      itemId: state.items[0].id,
      quantity: 2,
      inventoryRevision: 1,
    });
    expect(state.items[0].quantity).toBe(1);
    expect(inventory.items.reduce((sum, i) => sum + i.count, 0)).toBe(4);
    expect(new Set(inventory.items.map((i) => i.id)).size).toBe(2);
    expect(inventory.itemOrder).toEqual(inventory.items.map((i) => i.id));
  });
  it("rejects overdraw and never deposits multiple copies of one weapon", () => {
    const inventory = {
      items: [
        {
          id: "sword",
          name: "Sword",
          type: "weapon" as const,
          size: 1,
          damage: "d6",
        },
      ],
      currency: {},
    };
    const state = campaigns.emptyState();
    expect(() =>
      transferItem(state, inventory, {
        type: "transfer",
        direction: "deposit",
        userId: "owner",
        itemId: "sword",
        quantity: 2,
        inventoryRevision: 0,
      }),
    ).toThrow("quantity");
    expect(inventory.items).toHaveLength(1);
    expect(state.items).toHaveLength(0);
  });
});
