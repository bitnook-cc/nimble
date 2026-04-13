import { tokenize } from "@nimble/dice";

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

/**
 * Calculate the expected average damage of a dice formula string.
 * Uses the @nimble/dice tokenizer to support the full formula syntax:
 * NdX, NdX+M, (2d6+3)*2, exploding crits (!), vicious (v), etc.
 * Returns null if the formula is empty or unparseable.
 */
/**
 * Calculate the expected average damage of a dice formula string.
 *
 * When nimbleDice=true, applies Nimble attack rules:
 * - First die rolling 1 = miss (entire attack does 0 damage including modifier)
 * - First die rolling max = crit (roll one extra exploding die)
 * - Vicious (v): crit adds an additional non-exploding die
 *
 * When nimbleDice=false, uses naive averages (N * avg(dX) + M).
 */
export function calculateAverageDamage(
  formula: string,
  nimbleDice = false
): number | null {
  if (!formula || !formula.trim()) return null;

  try {
    const tokens = tokenize(formula.trim());
    if (tokens.length === 0) return null;

    const values: number[] = [];
    const ops: string[] = [];

    function applyOp() {
      const op = ops.pop()!;
      const b = values.pop()!;
      const a = values.pop()!;
      switch (op) {
        case "+": values.push(a + b); break;
        case "-": values.push(a - b); break;
        case "*": values.push(a * b); break;
        case "/": values.push(b !== 0 ? a / b : 0); break;
      }
    }

    const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

    // In Nimble mode, we need to handle the entire expression as an attack.
    // Miss-on-1 means the whole result is 0 with probability 1/sides of the first dice token.
    // Crit-on-max means add an extra exploding die with probability 1/sides.
    // We find the first dice token to determine the die size for miss/crit.
    let firstDiceSides: number | null = null;
    let firstDiceModifiers: string[] = [];

    for (const token of tokens) {
      if (token.type === "static") {
        values.push(token.value);
      } else if (token.type === "dice") {
        if (nimbleDice && firstDiceSides === null) {
          firstDiceSides = token.sides;
          firstDiceModifiers = token.modifiers;
        }
        const avg = diceTokenAverage(token.count, token.sides, token.modifiers);
        values.push(avg);
      } else if (token.type === "operator") {
        if (token.operator === "(") {
          ops.push("(");
        } else if (token.operator === ")") {
          while (ops.length > 0 && ops[ops.length - 1] !== "(") applyOp();
          ops.pop();
        } else {
          while (
            ops.length > 0 &&
            ops[ops.length - 1] !== "(" &&
            (precedence[ops[ops.length - 1]] ?? 0) >= (precedence[token.operator] ?? 0)
          ) {
            applyOp();
          }
          ops.push(token.operator);
        }
      }
    }

    while (ops.length > 0) applyOp();

    let result = values[0];
    if (result === undefined || isNaN(result)) return null;

    // Apply Nimble attack rules if enabled and we found a dice token
    if (nimbleDice && firstDiceSides !== null) {
      const s = firstDiceSides;
      const baseAvg = DIE_AVERAGES[s];
      if (baseAvg !== undefined) {
        const pMiss = 1 / s;
        const pCrit = 1 / s;
        const pHit = 1 - pMiss; // includes crit

        // On a hit, the naive average is the base result
        // On a crit, add an extra exploding die
        const explodingExtra = baseAvg * s / (s - 1);

        // Vicious: on crit, add one more non-exploding die
        const hasVicious = firstDiceModifiers.includes("v");
        const viciousExtra = hasVicious ? baseAvg : 0;

        result = pHit * result + pCrit * (explodingExtra + viciousExtra);
      }
    }

    return Math.round(result * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Calculate the naive average value of a dice token (no miss/crit rules).
 * Used as building blocks for the expression evaluator.
 */
function diceTokenAverage(count: number, sides: number, _modifiers: string[]): number {
  const baseAvg = DIE_AVERAGES[sides];
  if (baseAvg === undefined) return 0;

  return count * baseAvg;
}
