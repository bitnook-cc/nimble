import type { Monster, LegendaryMonster, AnyMonster } from "./types";

export function createDefaultMonster(
  overrides?: Partial<Omit<Monster, "kind" | "id" | "timestamps">>
): Monster {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: "standard",
    name: "",
    level: 1,
    size: "Medium",
    hitPoints: 10,
    armor: "None",
    speed: 6,
    passives: [],
    actions: [],
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

export function createDefaultLegendaryMonster(
  overrides?: Partial<Omit<LegendaryMonster, "kind" | "id" | "timestamps">>
): LegendaryMonster {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    kind: "legendary",
    name: "",
    level: 5,
    size: "Large",
    hitPoints: 50,
    armor: "Medium",
    speed: 6,
    passives: [],
    actions: [],
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
    ...overrides,
  };
}

export function createDefaultByKind(
  kind: "standard" | "legendary"
): AnyMonster {
  return kind === "legendary"
    ? createDefaultLegendaryMonster()
    : createDefaultMonster();
}
