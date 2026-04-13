import type { Monster, LegendaryMonster, AnyMonster } from "./types";
import { getRowByLevel, getHpForArmor } from "./monster-table";
import { getLegendaryRowByLevel, getLegendaryHpForArmor } from "./legendary-table";

export function createDefaultMonster(
  overrides?: Partial<Omit<Monster, "kind" | "id" | "timestamps">>
): Monster {
  const now = new Date().toISOString();
  const level = overrides?.level ?? 1;
  const armor = overrides?.armor ?? "None";
  const row = getRowByLevel(level);
  const hp = row ? getHpForArmor(row, armor) : 10;

  return {
    id: crypto.randomUUID(),
    kind: "standard",
    name: "",
    level,
    size: "Medium",
    hitPoints: hp,
    armor,
    speed: 6,
    passives: [],
    actions: [],
    builderConfig: {
      baseLevel: level,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
      dieSize: 8,
    },
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
  const level = overrides?.level ?? 5;
  const armor = overrides?.armor ?? "Medium";
  const row = getLegendaryRowByLevel(level);
  const hp = row ? getLegendaryHpForArmor(row, armor as "Medium" | "Heavy") : 150;

  return {
    id: crypto.randomUUID(),
    kind: "legendary",
    name: "",
    level,
    size: "Large",
    hitPoints: hp,
    lastStandHp: row?.hpLastStand ?? 50,
    armor: armor as "Medium" | "Heavy",
    speed: 6,
    passives: [],
    actions: [],
    builderConfig: {
      baseLevel: level,
      hpLevelOffset: 0,
      damageLevelOffset: 0,
      dieSize: 8,
    },
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
