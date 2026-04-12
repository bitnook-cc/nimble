export interface AttackFormula {
  formula: string;
  averageDamage: number;
  attacks: number;
}

const DIE_AVERAGES: Record<number, number> = {
  4: 2.5, 6: 3.5, 8: 4.5, 10: 5.5, 12: 6.5, 20: 10.5,
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
  if (raw <= 0) return 0;
  if (raw <= 3) return raw;
  return Math.round(raw / 5) * 5;
}

function scoreFormula(avg: number, target: number, modifier: number): number {
  const deviation = Math.abs(avg - target);
  const modClean = modifier % 5 === 0 || modifier <= 3 ? 0 : 1;
  return deviation + modClean * 2;
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
    const aMod = parseModifier(a.formula);
    const bMod = parseModifier(b.formula);
    return scoreFormula(a.averageDamage, damageTarget, aMod) - scoreFormula(b.averageDamage, damageTarget, bMod);
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
