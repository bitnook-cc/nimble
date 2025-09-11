import { DiceExpression, DiceType } from "../schemas/dice";

/**
 * Parses a dice expression string (e.g., "2d6", "d20") into a DiceExpression object
 * @param expression The dice expression string to parse
 * @returns DiceExpression object or null if invalid
 */
export function parseDiceExpression(expression: string): DiceExpression | null {
  const match = expression.match(/^(\d+)?d(\d+)$/i);
  if (!match) return null;

  const count = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]) as DiceType;

  if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) return null;

  return { count, sides };
}
