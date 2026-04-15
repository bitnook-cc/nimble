import type { MONSTER_SIZES, ARMOR_TYPES, MONSTER_KINDS } from "./constants";

export type MonsterSize = (typeof MONSTER_SIZES)[number];
export type ArmorType = (typeof ARMOR_TYPES)[number];
export type MonsterKind = (typeof MONSTER_KINDS)[number];

export interface MonsterPassive {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  reach?: number;
  diceFormula?: string;
}

export interface MonsterPhase {
  description: string;
  passives?: MonsterPassive[];
  actions?: MonsterAction[];
}

export interface BuilderConfig {
  baseLevel: number;
  hpLevelOffset: number;
  damageLevelOffset: number;
  dieSize: number;
  nimbleDice?: boolean;
}

export interface MonsterBase {
  id: string;
  name: string;
  kind: MonsterKind;
  level: number;
  size: MonsterSize;
  type?: string;
  group?: string;
  hitPoints: number;
  armor: ArmorType;
  speed: number;
  saves?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    will?: number;
  };
  passives: MonsterPassive[];
  actions: MonsterAction[];
  notes?: string;
  builderConfig?: BuilderConfig;
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface Monster extends MonsterBase {
  kind: "standard";
}

export interface LegendaryMonster extends MonsterBase {
  kind: "legendary";
  bloodied?: MonsterPhase;
  lastStand?: MonsterPhase;
  lastStandHp?: number;
}

export type AnyMonster = Monster | LegendaryMonster;
