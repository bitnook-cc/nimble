export interface LegendaryTableRow {
  level: number;
  hp: { medium: number; heavy: number };
  hpLastStand: number;
  saveDC: number;
  damageSmall: number;
  damageBig: number;
}

export const LEGENDARY_TABLE: LegendaryTableRow[] = [
  { level: 1, hp: { medium: 50, heavy: 35 }, hpLastStand: 10, saveDC: 10, damageSmall: 8, damageBig: 16 },
  { level: 2, hp: { medium: 75, heavy: 55 }, hpLastStand: 20, saveDC: 11, damageSmall: 9, damageBig: 18 },
  { level: 3, hp: { medium: 100, heavy: 75 }, hpLastStand: 30, saveDC: 11, damageSmall: 10, damageBig: 20 },
  { level: 4, hp: { medium: 125, heavy: 95 }, hpLastStand: 40, saveDC: 12, damageSmall: 11, damageBig: 22 },
  { level: 5, hp: { medium: 150, heavy: 115 }, hpLastStand: 50, saveDC: 12, damageSmall: 12, damageBig: 24 },
  { level: 6, hp: { medium: 175, heavy: 135 }, hpLastStand: 60, saveDC: 13, damageSmall: 13, damageBig: 26 },
  { level: 7, hp: { medium: 200, heavy: 155 }, hpLastStand: 70, saveDC: 13, damageSmall: 14, damageBig: 28 },
  { level: 8, hp: { medium: 225, heavy: 175 }, hpLastStand: 80, saveDC: 14, damageSmall: 15, damageBig: 30 },
  { level: 9, hp: { medium: 250, heavy: 195 }, hpLastStand: 90, saveDC: 14, damageSmall: 16, damageBig: 32 },
  { level: 10, hp: { medium: 275, heavy: 215 }, hpLastStand: 100, saveDC: 15, damageSmall: 17, damageBig: 34 },
  { level: 11, hp: { medium: 300, heavy: 235 }, hpLastStand: 110, saveDC: 15, damageSmall: 18, damageBig: 36 },
  { level: 12, hp: { medium: 325, heavy: 255 }, hpLastStand: 120, saveDC: 16, damageSmall: 19, damageBig: 38 },
  { level: 13, hp: { medium: 350, heavy: 275 }, hpLastStand: 130, saveDC: 16, damageSmall: 20, damageBig: 40 },
  { level: 14, hp: { medium: 375, heavy: 295 }, hpLastStand: 140, saveDC: 17, damageSmall: 21, damageBig: 42 },
  { level: 15, hp: { medium: 400, heavy: 315 }, hpLastStand: 150, saveDC: 17, damageSmall: 22, damageBig: 44 },
  { level: 16, hp: { medium: 425, heavy: 335 }, hpLastStand: 160, saveDC: 18, damageSmall: 23, damageBig: 46 },
  { level: 17, hp: { medium: 450, heavy: 355 }, hpLastStand: 170, saveDC: 18, damageSmall: 24, damageBig: 48 },
  { level: 18, hp: { medium: 475, heavy: 375 }, hpLastStand: 180, saveDC: 19, damageSmall: 25, damageBig: 50 },
  { level: 19, hp: { medium: 500, heavy: 395 }, hpLastStand: 190, saveDC: 19, damageSmall: 26, damageBig: 52 },
  { level: 20, hp: { medium: 525, heavy: 415 }, hpLastStand: 200, saveDC: 20, damageSmall: 27, damageBig: 54 },
];

export function getLegendaryRowByLevel(level: number): LegendaryTableRow | undefined {
  return LEGENDARY_TABLE.find((row) => row.level === level);
}

export function getLegendaryHpForArmor(
  row: LegendaryTableRow,
  armor: "Medium" | "Heavy"
): number {
  return row.hp[armor.toLowerCase() as "medium" | "heavy"];
}
