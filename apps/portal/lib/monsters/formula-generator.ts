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
export function calculateAverageDamage(formula: string): number | null {
  if (!formula || !formula.trim()) return null;

  try {
    const tokens = tokenize(formula.trim());
    if (tokens.length === 0) return null;

    // Evaluate the token stream using standard math order of operations.
    // Convert dice tokens to their average value, then evaluate the expression.
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

    for (const token of tokens) {
      if (token.type === "static") {
        values.push(token.value);
      } else if (token.type === "dice") {
        const avg = diceTokenAverage(token.count, token.sides, token.modifiers);
        values.push(avg);
      } else if (token.type === "operator") {
        if (token.operator === "(") {
          ops.push("(");
        } else if (token.operator === ")") {
          while (ops.length > 0 && ops[ops.length - 1] !== "(") applyOp();
          ops.pop(); // remove "("
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

    const result = values[0];
    if (result === undefined || isNaN(result)) return null;

    // Round to 1 decimal place for display
    return Math.round(result * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Calculate the average value of a dice token, accounting for modifiers.
 * - Exploding (! or !!): each die has a chance to explode, adding avg(die) * (1/sides) recursively
 * - Vicious (v): on a crit (max roll), adds one extra die. Probability = 1/sides per die.
 */
function diceTokenAverage(count: number, sides: number, modifiers: string[]): number {
  const baseAvg = DIE_AVERAGES[sides];
  if (baseAvg === undefined) return 0;

  const hasExplode = modifiers.includes("!") || modifiers.includes("!!");
  const hasVicious = modifiers.includes("v");

  // Base average per die
  let perDie = baseAvg;

  if (hasExplode) {
    // Exploding: expected value = avg + (1/sides) * avg + (1/sides)^2 * avg + ...
    // Geometric series: avg / (1 - 1/sides) = avg * sides / (sides - 1)
    perDie = baseAvg * sides / (sides - 1);
  }

  let total = count * perDie;

  if (hasVicious) {
    // Each die has a 1/sides chance of being a crit, adding one extra non-exploding die
    const critChance = 1 / sides;
    const extraDice = count * critChance;
    total += extraDice * baseAvg;
  }

  return total;
}
