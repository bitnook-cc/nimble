export { calculateAverageDamage } from "@nimble/dice";

export interface AttackFormula {
  formula: string;
  averageDamage: number;
  attacks: number;
}

const DIE_AVERAGES: Record<number, number> = {
  4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5,
  // Double-digit dice: roll two dice, one for tens, one for ones
  // d44: values 11-44, avg = 2.5*10 + 2.5 = 27.5
  // d66: values 11-66, avg = 3.5*10 + 3.5 = 38.5
  // d88: values 11-88, avg = 4.5*10 + 4.5 = 49.5
  44: 27.5, 66: 38.5, 88: 49.5, 100: 50.5,
};

export const DIE_THEMES: { size: number; label: string }[] = [
  { size: 4, label: "d4 — Undead" },
  { size: 6, label: "d6 — Goblins" },
  { size: 8, label: "d8 — Humans (default)" },
  { size: 10, label: "d10 — Beasts" },
  { size: 12, label: "d12 — Giants" },
  { size: 20, label: "d20 — Mightiest" },
];

function roundModifier(raw: number): number {
  const floored = Math.floor(raw);
  if (floored <= 0) return 0;
  if (floored <= 3) return floored;
  return Math.round(floored / 5) * 5;
}

function scoreFormula(
  avg: number,
  target: number,
  modifier: number,
  diceCount: number
): number {
  const deviation = Math.abs(avg - target);
  const modClean = modifier % 5 === 0 || modifier <= 3 ? 0 : 1;
  // Prefer 1-2 dice. Only accept 3+ if modifier is very round (multiple of 5)
  let dicePenalty = 0;
  if (diceCount >= 3) {
    dicePenalty = modifier % 5 === 0 ? 1 : 4;
  }
  return deviation + modClean * 2 + dicePenalty;
}

function formatFormula(count: number, dieSize: number, modifier: number): string {
  if (modifier === 0) return `${count}d${dieSize}`;
  return `${count}d${dieSize}+${modifier}`;
}

export function generateFormulas(damageTarget: number, dieSize: number): AttackFormula[] {
  const avg = DIE_AVERAGES[dieSize];
  if (!avg) return [];

  const results: AttackFormula[] = [];

  // Single-attack options
  for (let count = 1; count <= 6; count++) {
    const diceAvg = count * avg;
    const rawMod = damageTarget - diceAvg;
    if (rawMod < 0) continue;
    const mod = roundModifier(rawMod);
    const actualAvg = diceAvg + mod;
    if (Math.abs(actualAvg - damageTarget) <= 2) {
      results.push({ formula: formatFormula(count, dieSize, mod), averageDamage: actualAvg, attacks: 1 });
    }
  }

  // Dual-attack options
  const halfTarget = damageTarget / 2;
  for (let count = 1; count <= 4; count++) {
    const diceAvg = count * avg;
    const rawMod = halfTarget - diceAvg;
    if (rawMod < 0) continue;
    const mod = roundModifier(rawMod);
    const perHitAvg = diceAvg + mod;
    const totalAvg = perHitAvg * 2;
    if (Math.abs(totalAvg - damageTarget) <= 3) {
      results.push({ formula: `(2×) ${formatFormula(count, dieSize, mod)}`, averageDamage: totalAvg, attacks: 2 });
    }
  }

  // Sort by quality
  results.sort((a, b) => {
    const aParsed = parseDiceCount(a.formula);
    const bParsed = parseDiceCount(b.formula);
    return (
      scoreFormula(a.averageDamage, damageTarget, parseModifier(a.formula), aParsed) -
      scoreFormula(b.averageDamage, damageTarget, parseModifier(b.formula), bParsed)
    );
  });

  const singles = results.filter((r) => r.attacks === 1).slice(0, 2);
  const duals = results.filter((r) => r.attacks === 2).slice(0, 2);
  return [...singles, ...duals];
}

function parseModifier(formula: string): number {
  const clean = formula.replace(/^\(2×\)\s*/, "");
  const match = clean.match(/\+(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Generate the full attack table for a damage target, like the spreadsheet.
 * Shows every valid NdX+M combination across all die sizes.
 * Modifier = floor(target - count * dieAvg), shown only when >= 0.
 */
export interface FullTableRow {
  diceCount: number;
  formulas: Record<number, string | null>; // keyed by die size
}

export function generateFullTable(damageTarget: number): FullTableRow[] {
  const dieSizes = [4, 6, 8, 10, 12, 20];
  const rows: FullTableRow[] = [];

  for (let count = 1; count <= 20; count++) {
    const formulas: Record<number, string | null> = {};
    let hasAny = false;

    for (const die of dieSizes) {
      const avg = DIE_AVERAGES[die];
      if (!avg) continue;
      const rawMod = damageTarget - count * avg;
      if (rawMod < 0) {
        formulas[die] = null;
        continue;
      }
      const mod = Math.floor(rawMod);
      formulas[die] = formatFormula(count, die, mod);
      hasAny = true;
    }

    if (!hasAny) break;
    rows.push({ diceCount: count, formulas });
  }

  return rows;
}

function parseDiceCount(formula: string): number {
  const clean = formula.replace(/^\(2×\)\s*/, "");
  const match = clean.match(/^(\d+)d/);
  return match ? parseInt(match[1], 10) : 1;
}


