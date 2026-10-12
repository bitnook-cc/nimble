import { diceService, type DiceFormulaOptions } from "@nimble/dice";
import { uid, type Roll } from "./model";

export function addDieToFormula(formula: string, sides: number): string {
  const current = formula.trim();
  const append = () =>
    current
      ? `${current}${/[+\-*/(]$/.test(current) ? " " : " + "}1d${sides}`
      : `1d${sides}`;
  // Finish an incomplete term before looking for dice to increment.
  if (!current || /[+\-*/(]$/.test(current)) return append();

  let depth = 0;
  let start = 0;
  let positive = true;
  for (let index = 0; index <= current.length; index++) {
    const char = current[index];
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (index !== current.length && (depth !== 0 || !/[+-]/.test(char)))
      continue;
    const term = current.slice(start, index);
    const dice = term.match(/^(\s*)(\d*)[dD](\d+)(\s*)$/);
    // Only combine plain additive dice: negative, multiplied, grouped or
    // individually modified dice must retain their original meaning.
    if (positive && dice && Number(dice[3]) === sides) {
      const count = dice[2] ? Number(dice[2]) : 1;
      if (Number.isSafeInteger(count + 1)) {
        const countStart = start + dice[1].length;
        return `${current.slice(0, countStart)}${count + 1}${current.slice(countStart + dice[2].length)}`;
      }
    }
    positive =
      char === "+" &&
      !/[+\-*/]/.test(current.slice(0, index).trim().at(-1) ?? "");
    start = index + 1;
  }
  return append();
}

export function roll(formula: string, options: DiceFormulaOptions): Roll {
  if (!formula.trim()) throw new Error("Enter a dice formula first.");
  // Reject characters the shared tokenizer could otherwise skip. Evaluation and
  // all dice semantics remain in @nimble/dice.
  if (/[^a-zA-Z0-9\s.+\-*/()!]/.test(formula))
    throw new Error(
      "Use dice notation, numbers and arithmetic operators only.",
    );
  const tokens = diceService.tokenize(formula);
  if (tokens.some((token) => token.type === "static" && token.isVariable))
    throw new Error("Replace attribute names with numbers before rolling.");
  const result = diceService.evaluateTokenizedFormula(tokens, options);
  return {
    id: uid(),
    at: new Date().toISOString(),
    formula,
    options: { ...options },
    result,
  };
}
