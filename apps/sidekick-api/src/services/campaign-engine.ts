import { randomUUID } from "node:crypto";
import { characterInventory } from "@nimble/shared";
const { itemSchema } = characterInventory;
import { campaigns } from "@nimble/shared";

export class CampaignError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireCampaign(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new CampaignError(status, message);
}

export function publicState(
  state: campaigns.CampaignState,
  isGM: boolean,
): campaigns.CampaignView["state"] {
  if (isGM) return state;
  return {
    ...state,
    items: state.items.filter((i) => !i.hidden),
    journal: state.journal.filter((j) => j.visibility === "party"),
    sessions: state.sessions.map((s) => ({ ...s, gmNotes: "" })),
    monsters: [],
    encounters: [],
    runs: state.runs.map((r) => ({
      ...r,
      combatants: r.combatants
        .filter((c) => c.revealed)
        .map((c) => ({ ...c, monster: undefined })),
    })),
    activity: state.activity.filter((a) => !a.gmOnly),
  };
}

export function characterView(
  data: Record<string, unknown>,
  full: boolean,
  notes: boolean,
) {
  const keys = full
    ? [
        "id",
        "name",
        "level",
        "classId",
        "subclassId",
        "ancestryId",
        "backgroundId",
        "hitPoints",
        "wounds",
        "_attributes",
        "_skills",
        "_initiative",
        "speed",
        "_hitDice",
        "_abilities",
        "_abilityUses",
        "_resourceDefinitions",
        "_resourceValues",
        "_proficiencies",
        "_dicePools",
        "inventory",
        "actionTracker",
        "inEncounter",
        "timestamps",
      ]
    : [
        "id",
        "name",
        "level",
        "classId",
        "ancestryId",
        "hitPoints",
        "wounds",
        "timestamps",
      ];
  if (full && notes) keys.push("notes");
  return Object.fromEntries(
    keys.filter((key) => key in data).map((key) => [key, data[key]]),
  );
}

export function applyCampaignCommand(
  state: campaigns.CampaignState,
  command: campaigns.Command,
) {
  const put = <T extends { id: string }>(entries: T[], entry: T) => {
    const index = entries.findIndex((e) => e.id === entry.id);
    if (index === -1) entries.push(entry);
    else entries[index] = entry;
  };
  switch (command.type) {
    case "settings":
      state.description = command.description;
      break;
    case "stash":
      {
        const validItem = itemSchema.safeParse({
          ...command.entry.item,
          count: command.entry.quantity,
        });
        requireCampaign(
          validItem.success,
          400,
          "Item properties are invalid. Check the item details.",
        );
        put(state.items, { ...command.entry, item: validItem.data });
      }
      break;
    case "journal":
      put(state.journal, command.entry);
      break;
    case "session":
      put(state.sessions, command.entry);
      break;
    case "monster":
      put(state.monsters, command.entry);
      break;
    case "encounter":
      requireCampaign(
        command.entry.monsters.every((m) =>
          state.monsters.some((t) => t.id === m.monsterId),
        ),
        400,
        "An enemy was removed from the library. Refresh the encounter.",
      );
      put(state.encounters, command.entry);
      break;
    case "delete": {
      if (command.collection === "monsters")
        requireCampaign(
          !state.encounters.some((e) =>
            e.monsters.some((m) => m.monsterId === command.id),
          ),
          409,
          "Remove this monster from encounter plans first.",
        );
      if (command.collection === "sessions")
        requireCampaign(
          !state.runs.some((r) => r.sessionId === command.id),
          409,
          "This session has encounter history and cannot be deleted.",
        );
      if (command.collection === "runs")
        requireCampaign(
          !state.runs.some((r) => r.id === command.id && r.status === "active"),
          409,
          "Finish the encounter first.",
        );
      const entries = state[command.collection];
      const index = entries.findIndex((e) => e.id === command.id);
      requireCampaign(index >= 0, 404, "Entry no longer exists.");
      entries.splice(index, 1);
      break;
    }
    case "start": {
      requireCampaign(
        !state.runs.some((r) => r.status === "active"),
        409,
        "Finish the current encounter first.",
      );
      const encounter = state.encounters.find(
        (e) => e.id === command.encounterId,
      );
      requireCampaign(encounter, 404, "Encounter not found.");
      requireCampaign(
        command.sessionId === null ||
          state.sessions.some(
            (s) => s.id === command.sessionId && s.status !== "completed",
          ),
        400,
        "Choose an open session.",
      );
      const combatants = encounter.monsters.flatMap((group) => {
        const monster = state.monsters.find((m) => m.id === group.monsterId);
        requireCampaign(monster, 409, "An enemy is missing from the library.");
        return Array.from({ length: group.count }, (_, i) => ({
          id: randomUUID(),
          name: `${monster.name}${group.count > 1 ? ` ${i + 1}` : ""}`,
          monster: structuredClone(monster),
          hp: monster.hitPoints,
          actions: 0,
          conditions: "",
          wave: group.wave,
          revealed: false,
          phase: "normal" as const,
        }));
      });
      state.runs.push({
        id: randomUUID(),
        encounterId: encounter.id,
        sessionId: command.sessionId,
        name: encounter.name,
        round: 1,
        status: "active",
        objective: encounter.objective,
        environment: encounter.environment,
        combatants,
      });
      break;
    }
    case "round":
    case "finish":
    case "combatant": {
      const run = state.runs.find((r) => r.id === command.runId);
      requireCampaign(
        run && run.status === "active",
        409,
        "This encounter is no longer active.",
      );
      if (command.type === "round") {
        run.round++;
        run.combatants.forEach((c) => {
          c.actions = 0;
        });
      } else if (command.type === "finish") run.status = "completed";
      else {
        const c = run.combatants.find((c) => c.id === command.combatantId);
        requireCampaign(c, 404, "Enemy not found.");
        requireCampaign(
          command.phase === "normal" || c.monster.kind === "legendary",
          400,
          "Only legendary enemies have phases.",
        );
        Object.assign(c, {
          hp: command.hp,
          actions: command.actions,
          conditions: command.conditions,
          revealed: command.revealed,
          phase: command.phase,
        });
      }
      break;
    }
  }
}

type Inventory = {
  items: campaigns.PartyItem[];
  currency: { gold?: number; silver?: number };
  [key: string]: unknown;
};
export function transferItem(
  state: campaigns.CampaignState,
  inventory: Inventory,
  command: Extract<campaigns.Command, { type: "transfer" }>,
) {
  const stackable = (item: campaigns.PartyItem) =>
    item.type === "consumable" || item.type === "ammunition";
  if (command.direction === "deposit") {
    const index = inventory.items.findIndex((i) => i.id === command.itemId);
    requireCampaign(index >= 0, 404, "Item no longer exists on the character.");
    const item = inventory.items[index];
    const quantity = stackable(item) ? Number(item.count) : 1;
    requireCampaign(
      Number.isSafeInteger(quantity) && quantity >= command.quantity,
      409,
      "The character does not have that quantity.",
    );
    if (quantity === command.quantity) inventory.items.splice(index, 1);
    else item.count = quantity - command.quantity;
    const stashItem: campaigns.PartyItem = {
      ...structuredClone(item),
      id: randomUUID(),
      equipped: false,
    };
    if (stackable(item)) stashItem.count = command.quantity;
    state.items.push({
      id: randomUUID(),
      item: stashItem,
      quantity: command.quantity,
      location: "Party stash",
      hidden: false,
    });
  } else {
    const index = state.items.findIndex((i) => i.id === command.itemId);
    requireCampaign(index >= 0, 404, "Item is no longer in the stash.");
    const entry = state.items[index];
    requireCampaign(
      entry.quantity >= command.quantity,
      409,
      "There are not enough items in the stash.",
    );
    const item: campaigns.PartyItem = {
      ...structuredClone(entry.item),
      id: randomUUID(),
      equipped: false,
    };
    if (stackable(item)) {
      item.count = command.quantity;
      inventory.items.push(item);
    } else
      for (let n = 0; n < command.quantity; n++)
        inventory.items.push({ ...item, id: randomUUID() });
    entry.quantity -= command.quantity;
    if (entry.quantity === 0) state.items.splice(index, 1);
    requireCampaign(
      inventory.items.length <= 500,
      400,
      "Character inventory is full.",
    );
  }
  if (Array.isArray(inventory.itemOrder))
    inventory.itemOrder = inventory.items.map((i) => i.id);
}
