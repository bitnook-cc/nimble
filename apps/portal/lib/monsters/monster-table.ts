export interface MonsterTableRow {
  level: number;
  hp: { none: number; medium: number; heavy: number };
  damagePerRound: number;
  attackSample: { single: string; dual: string | null };
  saveDC: number;
  crEquiv: number;
}

export const MONSTER_TABLE: MonsterTableRow[] = [
  { level: 0.25, hp: { none: 12, medium: 9, heavy: 7 }, damagePerRound: 3, attackSample: { single: "1d4+1", dual: null }, saveDC: 9, crEquiv: 0.125 },
  { level: 0.33, hp: { none: 15, medium: 11, heavy: 8 }, damagePerRound: 5, attackSample: { single: "1d6+2", dual: null }, saveDC: 9, crEquiv: 0.25 },
  { level: 0.5, hp: { none: 18, medium: 15, heavy: 11 }, damagePerRound: 7, attackSample: { single: "1d6+3", dual: null }, saveDC: 10, crEquiv: 0.25 },
  { level: 1, hp: { none: 26, medium: 20, heavy: 16 }, damagePerRound: 11, attackSample: { single: "2d8+2", dual: "1d8+1" }, saveDC: 10, crEquiv: 0.5 },
  { level: 2, hp: { none: 34, medium: 27, heavy: 20 }, damagePerRound: 13, attackSample: { single: "2d8+4", dual: "1d8+3" }, saveDC: 11, crEquiv: 1 },
  { level: 3, hp: { none: 41, medium: 33, heavy: 25 }, damagePerRound: 15, attackSample: { single: "2d8+6", dual: "1d8+4" }, saveDC: 11, crEquiv: 1 },
  { level: 4, hp: { none: 49, medium: 39, heavy: 29 }, damagePerRound: 18, attackSample: { single: "2d8+9", dual: "1d8+5" }, saveDC: 12, crEquiv: 2 },
  { level: 5, hp: { none: 58, medium: 46, heavy: 35 }, damagePerRound: 19, attackSample: { single: "2d8+10", dual: "1d8+6" }, saveDC: 12, crEquiv: 2 },
  { level: 6, hp: { none: 68, medium: 54, heavy: 41 }, damagePerRound: 21, attackSample: { single: "2d8+12", dual: "1d8+7" }, saveDC: 13, crEquiv: 3 },
  { level: 7, hp: { none: 79, medium: 63, heavy: 47 }, damagePerRound: 24, attackSample: { single: "3d8+10", dual: "2d8+4" }, saveDC: 13, crEquiv: 3 },
  { level: 8, hp: { none: 91, medium: 73, heavy: 55 }, damagePerRound: 26, attackSample: { single: "3d8+12", dual: "2d8+5" }, saveDC: 14, crEquiv: 4 },
  { level: 9, hp: { none: 104, medium: 83, heavy: 62 }, damagePerRound: 28, attackSample: { single: "4d8+10", dual: "2d8+6" }, saveDC: 14, crEquiv: 4 },
  { level: 10, hp: { none: 118, medium: 94, heavy: 71 }, damagePerRound: 30, attackSample: { single: "4d8+12", dual: "2d8+7" }, saveDC: 15, crEquiv: 5 },
  { level: 11, hp: { none: 133, medium: 106, heavy: 80 }, damagePerRound: 33, attackSample: { single: "5d8+11", dual: "3d8+3" }, saveDC: 15, crEquiv: 6 },
  { level: 12, hp: { none: 149, medium: 119, heavy: 89 }, damagePerRound: 35, attackSample: { single: "5d8+13", dual: "3d8+4" }, saveDC: 16, crEquiv: 7 },
  { level: 13, hp: { none: 166, medium: 132, heavy: 100 }, damagePerRound: 38, attackSample: { single: "6d8+11", dual: "3d8+6" }, saveDC: 16, crEquiv: 8 },
  { level: 14, hp: { none: 184, medium: 147, heavy: 110 }, damagePerRound: 40, attackSample: { single: "6d8+13", dual: "3d8+7" }, saveDC: 17, crEquiv: 9 },
  { level: 15, hp: { none: 203, medium: 162, heavy: 122 }, damagePerRound: 43, attackSample: { single: "7d8+11", dual: "3d8+8" }, saveDC: 17, crEquiv: 9 },
  { level: 16, hp: { none: 223, medium: 178, heavy: 134 }, damagePerRound: 45, attackSample: { single: "7d8+13", dual: "4d8+5" }, saveDC: 18, crEquiv: 10 },
  { level: 17, hp: { none: 244, medium: 195, heavy: 146 }, damagePerRound: 48, attackSample: { single: "8d8+12", dual: "4d8+6" }, saveDC: 18, crEquiv: 11 },
  { level: 18, hp: { none: 266, medium: 213, heavy: 160 }, damagePerRound: 50, attackSample: { single: "8d8+14", dual: "4d8+7" }, saveDC: 19, crEquiv: 12 },
  { level: 19, hp: { none: 289, medium: 231, heavy: 173 }, damagePerRound: 52, attackSample: { single: "9d8+12", dual: "4d8+8" }, saveDC: 19, crEquiv: 13 },
  { level: 20, hp: { none: 313, medium: 250, heavy: 189 }, damagePerRound: 54, attackSample: { single: "9d8+13", dual: "4d8+9" }, saveDC: 20, crEquiv: 14 },
];

export function getRowByLevel(level: number): MonsterTableRow | undefined {
  return MONSTER_TABLE.find((row) => row.level === level);
}

export function getRowByIndex(index: number): MonsterTableRow {
  const clamped = Math.max(0, Math.min(index, MONSTER_TABLE.length - 1));
  return MONSTER_TABLE[clamped];
}

export function getLevelIndex(level: number): number {
  const idx = MONSTER_TABLE.findIndex((row) => row.level === level);
  return idx >= 0 ? idx : 0;
}

export function getHpForArmor(
  row: MonsterTableRow,
  armor: "None" | "Medium" | "Heavy"
): number {
  const key = armor.toLowerCase() as "none" | "medium" | "heavy";
  return row.hp[key];
}
