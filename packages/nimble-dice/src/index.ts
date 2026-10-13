/**
 * Nimble Dice - Standalone dice rolling engine
 * Supports standard dice notation with extensions:
 * - Basic dice: 2d6, 1d20, etc.
 * - Modifiers: 2d6+5, 1d20-3
 * - Exploding criticals: 1d20! (explodes on max roll)
 * - Vicious: 1d8v (adds extra die on critical)
 * - Double-digit dice: 1d44, 1d66, 1d88, 1d100
 * - Advantage/disadvantage system
 */

import {
  CategorizedDie,
  DiceCategory,
  DiceFormulaOptions,
  DiceFormulaResult,
  FormulaToken,
  FormulaTokenResults,
  DiceToken,
  DiceTokenResult,
} from "./schemas.js";
import { diceConfig } from "./config.js";

// Re-export all types from schemas
export * from "./schemas.js";

interface ParsedDiceNotation {
  count: number;
  sides: number;
  fullMatch: string;
  hasExplodingCrits?: boolean;
  allDiceExplode?: boolean;
  isVicious?: boolean;
  advantageLevel?: number; // Positive for advantage, negative for disadvantage
}

export class DiceService {
  private readonly config = diceConfig;

  /**
   * Tokenizes a dice formula into an array of tokens for external processing
   */
  public tokenize(formula: string): FormulaToken[] {
    if (typeof formula !== "string" || formula.length > this.config.maxFormulaLength) {
      throw new Error(`Formula must be at most ${this.config.maxFormulaLength} characters`);
    }
    const cleanedFormula = this.sanitizeExpression(formula);
    const tokens = this.parseTokens(cleanedFormula);
    this.validateRoll(tokens);
    return tokens;
  }

  /** Validate before allocating dice, including callers supplying tokens directly. */
  public validateRoll(tokens: FormulaToken[], options: DiceFormulaOptions = {}): number {
    if (!Array.isArray(tokens) || tokens.length > this.config.maxTokens) {
      throw new Error(`A formula may contain at most ${this.config.maxTokens} tokens`);
    }
    const validateAdvantage = (value: number) => {
      if (!Number.isSafeInteger(value) || Math.abs(value) > this.config.maxAdvantage) {
        throw new Error(
          `Advantage must be an integer between -${this.config.maxAdvantage} and ${this.config.maxAdvantage}`,
        );
      }
    };
    validateAdvantage(options.advantageLevel ?? 0);
    let dice = 0;
    for (const token of tokens) {
      if (token.type === "static" && !Number.isFinite(token.value))
        throw new Error("Invalid number");
      if (token.type !== "dice") continue;
      if (
        !Number.isSafeInteger(token.count) ||
        token.count < 1 ||
        token.count > this.config.maxDiceCount
      ) {
        throw new Error(`Dice count must be between 1 and ${this.config.maxDiceCount}`);
      }
      if (
        ![...this.config.validDiceTypes, ...this.config.doubleDigitDiceTypes].some(
          (sides) => sides === token.sides,
        )
      ) {
        throw new Error("Invalid dice type");
      }
      const advantage = this.parseTokenModifiers(token.modifiers, options).advantageLevel ?? 0;
      validateAdvantage(advantage);
      const doubleDigit = this.config.doubleDigitDiceTypes.some((sides) => sides === token.sides);
      if (doubleDigit && token.sides !== 100 && token.count !== 1)
        throw new Error(`Double-digit dice (d${token.sides}) can only be rolled one at a time.`);
      dice += doubleDigit
        ? token.count * (2 + Math.abs(advantage))
        : token.count + Math.abs(advantage);
      if (dice > this.config.maxTotalDice)
        throw new Error(
          `A roll may use at most ${this.config.maxTotalDice} dice including advantage`,
        );
    }
    return Math.max(1, dice);
  }

  /**
   * Evaluates a pre-tokenized formula (after variable substitution)
   */
  public evaluateTokenizedFormula(
    tokens: FormulaToken[],
    options: DiceFormulaOptions = {},
  ): DiceFormulaResult {
    try {
      this.validateRoll(tokens, options);
      // Check for unsubstituted variables (when not using tokenized externally)
      const hasUnsubstitutedVariables = tokens.some(
        (token) => token.type === "static" && token.isVariable && token.value === 0,
      );
      if (hasUnsubstitutedVariables) {
        throw new Error("Invalid characters in expression");
      }

      // Transform input tokens to result tokens
      const resultTokens: FormulaTokenResults[] = [];
      let totalCriticalHits = 0;
      let hasFumble = false;

      for (const token of tokens) {
        if (token.type === "static" || token.type === "operator") {
          // Static and operator tokens pass through unchanged
          resultTokens.push(token);
        } else if (token.type === "dice") {
          // Convert token modifiers to options
          const tokenOptions = this.parseTokenModifiers(token.modifiers, options);

          // Roll the dice
          const rollResult = this.rollDiceFromToken(token, tokenOptions);

          // Create dice token result with dice data
          const diceTokenResult: DiceTokenResult = {
            type: "dice",
            notation: token.notation,
            count: token.count,
            sides: token.sides,
            modifiers: token.modifiers,
            diceData: {
              dice: rollResult.allDice,
              total: rollResult.keptSum,
              isDoubleDigit: rollResult.isDoubleDigit || false,
              isFumble: rollResult.isFumble,
              advantageLevel: tokenOptions.advantageLevel || 0,
              criticalHits: rollResult.criticalHits || 0,
            },
          };

          resultTokens.push(diceTokenResult);

          // Aggregate for formula-level data
          totalCriticalHits += rollResult.criticalHits || 0;
          hasFumble = hasFumble || rollResult.isFumble;
        }
      }

      // Calculate total by evaluating the expression
      const total = this.evaluateTokenExpression(resultTokens);
      const finalTotal = options.allowFumbles && hasFumble ? 0 : total;

      // Generate display string from result tokens
      const displayString = this.generateDisplayString(resultTokens, finalTotal);

      // Generate formula string from original tokens (for traceability)
      const formula = this.generateFormulaString(tokens);

      return {
        tokens: resultTokens,
        displayString,
        total: finalTotal,
        formula,
        numCriticals: totalCriticalHits,
        isFumble: hasFumble,
      };
    } catch (error) {
      throw new Error(`Failed to evaluate tokenized formula: ${error}`);
    }
  }

  evaluateDiceFormula(formula: string, options: DiceFormulaOptions = {}): DiceFormulaResult {
    try {
      // Use the tokenized approach internally
      const tokens = this.tokenize(formula);
      return this.evaluateTokenizedFormula(tokens, options);
    } catch (error) {
      throw new Error(`Failed to evaluate dice formula "${formula}": ${error}`);
    }
  }

  private sanitizeExpression(expression: string): string {
    // Remove extra whitespace
    let cleaned = expression.replace(/\s+/g, " ").trim();

    // Convert to lowercase for dice notation (preserving postfixes)
    const dicePattern = /(\d+)?d(\d+)([!v]+)?/gi;
    const diceMatches: Array<{ match: string; index: number }> = [];
    let match;
    while ((match = dicePattern.exec(cleaned)) !== null) {
      diceMatches.push({ match: match[0].toLowerCase(), index: match.index });
    }

    // Restore dice notation with lowercase 'd'
    for (let i = diceMatches.length - 1; i >= 0; i--) {
      const dice = diceMatches[i];
      cleaned =
        cleaned.substring(0, dice.index) +
        dice.match +
        cleaned.substring(dice.index + dice.match.length);
    }

    return cleaned;
  }

  private rollDiceWithOptions(
    notation: ParsedDiceNotation,
    options: DiceFormulaOptions,
  ): {
    allDice: CategorizedDie[];
    keptSum: number;
    isCritical: boolean;
    isFumble: boolean;
    isDoubleDigit?: boolean;
    criticalHits?: number;
  } {
    // Check if this is a double-digit die
    const isDoubleDigit = this.config.doubleDigitDiceTypes.includes(
      notation.sides as 44 | 66 | 88 | 100,
    );

    if (isDoubleDigit) {
      return this.rollDoubleDigitDice(notation, options);
    }

    // Use advantage level from notation if specified, otherwise from options
    const advantageLevel =
      notation.advantageLevel !== undefined ? notation.advantageLevel : options.advantageLevel || 0;
    const totalDiceToRoll = notation.count + Math.abs(advantageLevel);

    // Roll all dice
    const rolledDice: number[] = [];
    for (let i = 0; i < totalDiceToRoll; i++) {
      rolledDice.push(this.rollSingleDie(notation.sides));
    }

    // Determine which dice to keep based on advantage/disadvantage
    const diceWithIndices = rolledDice.map((value, index) => ({ value, index }));
    const sortedByValue = [...diceWithIndices].sort((a, b) => a.value - b.value);

    const numToDrop = Math.min(Math.abs(advantageLevel), rolledDice.length - 1);
    let keptIndices: Set<number>;
    if (advantageLevel > 0) {
      // Advantage: drop lowest dice
      const droppedIndices = new Set(sortedByValue.slice(0, numToDrop).map((d) => d.index));
      keptIndices = new Set(
        diceWithIndices.filter((d) => !droppedIndices.has(d.index)).map((d) => d.index),
      );
    } else if (advantageLevel < 0) {
      // Disadvantage: drop highest dice
      const droppedIndices = new Set(sortedByValue.slice(-numToDrop).map((d) => d.index));
      keptIndices = new Set(
        diceWithIndices.filter((d) => !droppedIndices.has(d.index)).map((d) => d.index),
      );
    } else {
      keptIndices = new Set(diceWithIndices.map((d) => d.index));
    }

    // Build result maintaining original roll order with categories
    const allDice: CategorizedDie[] = rolledDice.map((value, index) => {
      const isKept = keptIndices.has(index);
      // Check if this is the first kept die and it's a nat 1 (fumble)
      const isFirstKept = isKept && [...keptIndices].sort((a, b) => a - b)[0] === index;
      const isFumble = isFirstKept && value === 1;
      const isCritical = (isFirstKept || options.explodeAll) && value === notation.sides;

      return {
        value,
        size: notation.sides,
        kept: isKept,
        category: (isFumble
          ? "fumble"
          : isCritical
            ? "critical"
            : isKept
              ? "normal"
              : "dropped") as DiceCategory,
        index,
      };
    });

    // Find the first kept die for critical/fumble checking
    const firstKeptDie = allDice.find((d) => d.kept);
    let isCritical = false;
    let isFumble = false;
    let criticalHits = 0;

    if (firstKeptDie) {
      isFumble = firstKeptDie.category === "fumble" && options.allowFumbles === true;
    }

    // Handle exploding criticals
    if (options.allowCriticals) {
      // Determine which dice can explode
      const criticalDice = allDice.filter((d) => d.kept && d.category === "critical");
      const diceThatExplode = options.explodeAll ? criticalDice : criticalDice.slice(0, 1);

      if (diceThatExplode.length > 0) {
        isCritical = true;

        // Process explosions for each critical die
        diceThatExplode.forEach((_) => {
          criticalHits++; // Count the initial critical
          let consecutiveCrits = 0;
          const maxCrits = this.config.maxCriticalExplosions;

          while (consecutiveCrits < maxCrits) {
            const newRoll = this.rollSingleDie(notation.sides);
            allDice.push({
              value: newRoll,
              size: notation.sides,
              kept: true,
              category: "explosion" as DiceCategory,
              index: allDice.length,
            });

            if (newRoll === notation.sides) {
              consecutiveCrits++;
              criticalHits++; // Count each exploded critical
            } else {
              break; // Stop rolling if we didn't get another critical
            }
          }
        });

        // Add vicious dice if enabled (one non-exploding die per critical hit)
        if (options.vicious === true && criticalHits > 0) {
          for (let i = 0; i < criticalHits; i++) {
            const viciousRoll = this.rollSingleDie(notation.sides);
            allDice.push({
              value: viciousRoll,
              size: notation.sides,
              kept: true,
              category: "vicious" as DiceCategory,
              index: allDice.length,
            });
          }
        }
      }
    }

    const keptSum = allDice.filter((d) => d.kept).reduce((sum, d) => sum + d.value, 0);

    return { allDice, keptSum, isCritical, isFumble, criticalHits };
  }

  private rollDoubleDigitDice(
    notation: ParsedDiceNotation,
    options: DiceFormulaOptions,
  ): {
    allDice: CategorizedDie[];
    keptSum: number;
    isCritical: boolean;
    isFumble: boolean;
    isDoubleDigit: boolean;
    criticalHits: number;
  } {
    // Each number uses one pool; retained digits keep their original roll order.
    const advantageLevel =
      notation.advantageLevel !== undefined ? notation.advantageLevel : options.advantageLevel || 0;
    const baseDie = notation.sides === 100 ? 10 : notation.sides / 11;
    const allDice: CategorizedDie[] = [];
    let keptSum = 0;
    for (let number = 0; number < notation.count; number++) {
      const rolls = Array.from({ length: 2 + Math.abs(advantageLevel) }, () => {
        const value = this.rollSingleDie(baseDie);
        return notation.sides === 100 ? value % 10 : value;
      });
      const ranked = rolls
        .map((value, index) => ({ value, index }))
        .sort((a, b) => a.value - b.value || a.index - b.index);
      // On ties, advantage drops the earliest low digit; disadvantage drops
      // the latest high digit, matching the engine's standard dice tie rule.
      const keptIndices = new Set(
        (advantageLevel < 0 ? ranked.slice(0, 2) : ranked.slice(-2)).map((d) => d.index),
      );
      const digits = rolls.filter((_, index) => keptIndices.has(index));
      const total = digits[0] * 10 + digits[1];
      keptSum += notation.sides === 100 && total === 0 ? 100 : total;
      for (const [index, value] of rolls.entries()) {
        const kept = keptIndices.has(index);
        allDice.push({
          value,
          size: baseDie,
          kept,
          category: kept ? "normal" : "dropped",
          index: allDice.length,
        });
      }
    }

    return {
      allDice,
      keptSum,
      isCritical: false,
      isFumble: false,
      isDoubleDigit: true,
      criticalHits: 0,
    };
  }

  private formatDiceDisplay(allDice: CategorizedDie[]): string {
    const formattedDice = allDice.map((die) => {
      const dieStr = `[${die.value}]`;
      return die.kept ? dieStr : `~~${dieStr}~~`;
    });
    return formattedDice.join(" + ");
  }

  private formatDoubleDigitDiceDisplay(allDice: CategorizedDie[], result: number): string {
    let kept = 0;
    const formattedDice = allDice
      .map((die) => {
        const separator = die.kept && kept > 0 && kept % 2 === 0 ? "+ " : "";
        if (die.kept) kept++;
        const dieStr = `[${die.value}]`;
        return separator + (die.kept ? dieStr : `~~${dieStr}~~`);
      })
      .join(" ");
    return `${formattedDice} = ${result}`;
  }

  private evaluateExpression(expression: string): number {
    // Validate that only numbers and operators remain
    const operatorRegex = /^[+\-*/()\d\s]+$/;
    if (!operatorRegex.test(expression)) {
      throw new Error(`Invalid characters in expression: ${expression}`);
    }

    try {
      const func = new Function(`"use strict"; return (${expression});`);
      const result = func();

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error(`Expression did not evaluate to a finite number`);
      }

      return Math.floor(result);
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${error}`);
    }
  }

  private rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Converts token modifiers to dice formula options
   */
  private parseTokenModifiers(
    modifiers: string[],
    baseOptions: DiceFormulaOptions,
  ): DiceFormulaOptions {
    const options = { ...baseOptions };

    for (const modifier of modifiers) {
      if (modifier === "!") {
        options.allowCriticals = true;
      } else if (modifier === "!!") {
        options.allowCriticals = true;
        options.explodeAll = true;
      } else if (modifier === "v") {
        options.vicious = true;
        options.allowCriticals = true; // Vicious requires criticals to be enabled
      } else if (modifier.startsWith("a")) {
        const advantageLevel = parseInt(modifier.substring(1) || "1");
        options.advantageLevel = advantageLevel;
      } else if (modifier.startsWith("d")) {
        const disadvantageLevel = parseInt(modifier.substring(1) || "1");
        options.advantageLevel = -disadvantageLevel;
      }
    }

    return options;
  }

  /**
   * Rolls dice for a dice token using existing dice rolling logic
   */
  private rollDiceFromToken(token: DiceToken, options: DiceFormulaOptions) {
    const notation: ParsedDiceNotation = {
      count: token.count,
      sides: token.sides,
      fullMatch: token.notation,
      hasExplodingCrits: options.allowCriticals,
      allDiceExplode: options.explodeAll,
      isVicious: options.vicious,
      advantageLevel: options.advantageLevel,
    };

    return this.rollDiceWithOptions(notation, options);
  }

  /**
   * Evaluates the mathematical expression from result tokens
   */
  private evaluateTokenExpression(tokens: FormulaTokenResults[]): number {
    // Build expression string by replacing dice tokens with their totals
    const expressionParts: string[] = [];

    for (const token of tokens) {
      if (token.type === "static") {
        expressionParts.push(token.value.toString());
      } else if (token.type === "dice") {
        const total = token.diceData.total;
        expressionParts.push(total.toString());
      } else if (token.type === "operator") {
        expressionParts.push(token.operator);
      }
    }

    const expression = expressionParts.join(" ");
    return this.evaluateExpression(expression);
  }

  /**
   * Generates display string from result tokens
   */
  private generateDisplayString(tokens: FormulaTokenResults[], total: number): string {
    const parts: string[] = [];
    const hasDice = tokens.some((token) => token.type === "dice");

    for (const token of tokens) {
      if (token.type === "static") {
        parts.push(token.value.toString());
      } else if (token.type === "dice") {
        // Generate display string for dice based on type
        const displayString = token.diceData.isDoubleDigit
          ? this.formatDoubleDigitDiceDisplay(token.diceData.dice, token.diceData.total)
          : this.formatDiceDisplay(token.diceData.dice);
        parts.push(displayString);
      } else if (token.type === "operator") {
        parts.push(token.operator);
      }
    }

    // Join parts with smart spacing (no spaces around parentheses)
    let baseString = "";
    for (let i = 0; i < parts.length; i++) {
      const current = parts[i];
      const next = parts[i + 1];

      baseString += current;

      // Add space after current token unless:
      // - Current is opening parenthesis
      // - Next is closing parenthesis
      // - Current is last token
      if (i < parts.length - 1 && current !== "(" && next !== ")") {
        baseString += " ";
      }
    }

    // For formulas with no dice, include the total in the display
    if (!hasDice) {
      return `${baseString} = ${total}`;
    }

    return baseString;
  }

  /**
   * Generates formula string from original tokens
   */
  private generateFormulaString(tokens: FormulaToken[]): string {
    const parts: string[] = [];

    for (const token of tokens) {
      if (token.type === "static") {
        parts.push(token.originalText);
      } else if (token.type === "dice") {
        const modifierStr = token.modifiers.join("");
        parts.push(`${token.notation}${modifierStr}`);
      } else if (token.type === "operator") {
        parts.push(token.operator);
      }
    }

    return parts.join(" ");
  }

  /**
   * Parses a cleaned formula string into an array of tokens
   */
  private parseTokens(formula: string): FormulaToken[] {
    const tokens: FormulaToken[] = [];

    // Define subpatterns for better readability
    const diceNotation = String.raw`(\d+)?d(\d+)([!v]*)?([ad]\d*)?`;
    const numbers = String.raw`\d+(\.\d+)?`;
    const variables = String.raw`[A-Z]+`;
    const operators = String.raw`[+\-*/()]`;
    const whitespace = String.raw`\s+`;

    // Create RegExp objects for token matching
    const diceNotationRegex = new RegExp(`^${diceNotation}$`, "i");
    const numbersRegex = new RegExp(`^${numbers}$`);
    const variablesRegex = new RegExp(`^${variables}$`, "i");
    const operatorsRegex = new RegExp(`^${operators}$`);
    const whitespaceRegex = new RegExp(`^${whitespace}$`);

    // Combine all patterns with alternation (order matters!)
    const tokenPattern = new RegExp(
      `${diceNotation}|${numbers}|${variables}|${operators}|${whitespace}`,
      "gi",
    );

    let match;
    while ((match = tokenPattern.exec(formula)) !== null) {
      const tokenText = match[0];

      // Skip whitespace
      if (whitespaceRegex.test(tokenText)) {
        continue;
      }

      // Check if it's a dice notation
      if (diceNotationRegex.test(tokenText)) {
        const diceMatch = tokenText.match(diceNotationRegex);
        if (diceMatch) {
          const count = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
          const sides = parseInt(diceMatch[2]);
          const modifierPostfixes = diceMatch[3] || "";
          const advantagePostfix = diceMatch[4] || "";

          // Parse modifiers
          const modifiers: string[] = [];

          if (modifierPostfixes.includes("!!")) modifiers.push("!!");
          else if (modifierPostfixes.includes("!")) modifiers.push("!");
          if (modifierPostfixes.includes("v")) modifiers.push("v");
          if (advantagePostfix) modifiers.push(advantagePostfix);

          // Validate dice count
          if (count <= 0) {
            throw new Error(`Invalid dice count: ${count}`);
          }

          // Validate dice type
          const isDoubleDigit = this.config.doubleDigitDiceTypes.includes(
            sides as 44 | 66 | 88 | 100,
          );
          if (
            !this.config.validDiceTypes.includes(sides as 4 | 6 | 8 | 10 | 12 | 20 | 100) &&
            !isDoubleDigit
          ) {
            throw new Error(
              `Invalid dice type: d${sides}. Valid types are: ${[...this.config.validDiceTypes, ...this.config.doubleDigitDiceTypes].join(", ")}`,
            );
          }

          tokens.push({
            type: "dice",
            notation: `${count}d${sides}`,
            count,
            sides,
            modifiers,
          });
        }
      }
      // Check if it's an operator
      else if (operatorsRegex.test(tokenText)) {
        tokens.push({
          type: "operator",
          operator: tokenText as "+" | "-" | "*" | "/" | "(" | ")",
        });
      }
      // Check if it's a number
      else if (numbersRegex.test(tokenText)) {
        tokens.push({
          type: "static",
          value: parseFloat(tokenText),
          originalText: tokenText,
        });
      }
      // Check if it's a variable
      else if (variablesRegex.test(tokenText)) {
        tokens.push({
          type: "static",
          value: 0, // Placeholder value - will be substituted later
          originalText: tokenText,
          isVariable: true,
        });
      } else {
        throw new Error(`Invalid token in formula: ${tokenText}`);
      }
    }

    return tokens;
  }
}

// Create a singleton instance
const diceService = new DiceService();

// Export the main function directly
export const evaluateDiceFormula = (
  formula: string,
  options: DiceFormulaOptions = {},
): DiceFormulaResult => {
  return diceService.evaluateDiceFormula(formula, options);
};

// Export tokenization functions
export const tokenize = (formula: string): FormulaToken[] => {
  return diceService.tokenize(formula);
};

export const evaluateTokenizedFormula = (
  tokens: FormulaToken[],
  options: DiceFormulaOptions = {},
): DiceFormulaResult => {
  return diceService.evaluateTokenizedFormula(tokens, options);
};

// --- Average damage calculation ---

const DIE_AVERAGES: Record<number, number> = {
  4: 2.5,
  6: 3.5,
  8: 4.5,
  10: 5.5,
  12: 6.5,
  20: 10.5,
  // Double-digit dice: roll two dice, one for tens, one for ones
  44: 27.5,
  66: 38.5,
  88: 49.5,
  100: 50.5,
};

const DOUBLE_DIGIT_DICE = [44, 66, 88, 100];

/**
 * Parse advantage level from dice token modifiers.
 * Returns 0 for no advantage, positive for advantage, negative for disadvantage.
 */
function parseAdvantageFromModifiers(modifiers: string[]): number {
  for (const mod of modifiers) {
    // Advantage: "a", "a1", "a2", etc.
    if (mod.match(/^a\d*$/)) {
      return parseInt(mod.substring(1) || "1", 10);
    }
    // Disadvantage: "d", "d1", "d2", etc.
    if (mod.match(/^d\d*$/)) {
      return -parseInt(mod.substring(1) || "1", 10);
    }
  }
  return 0;
}

/**
 * Expected value of the maximum of (k+1) rolls of a dN.
 * Used for advantage calculations.
 * E[max] = sum_{j=1}^{N} j * P(max = j)
 * P(max = j) = (j/N)^(k+1) - ((j-1)/N)^(k+1)
 */
function expectedMax(sides: number, numDice: number): number {
  let total = 0;
  for (let j = 1; j <= sides; j++) {
    const pMaxIsJ = Math.pow(j / sides, numDice) - Math.pow((j - 1) / sides, numDice);
    total += j * pMaxIsJ;
  }
  return total;
}

/**
 * Expected value of the minimum of (k+1) rolls of a dN.
 * E[min] = (N+1) - E[max] by symmetry.
 */
function expectedMin(sides: number, numDice: number): number {
  return sides + 1 - expectedMax(sides, numDice);
}

/**
 * Calculate the average value of a single die with optional advantage/disadvantage.
 */
function singleDieAverage(sides: number, advantageLevel: number): number {
  if (advantageLevel === 0) {
    return DIE_AVERAGES[sides] ?? (sides + 1) / 2;
  }
  const numDice = 1 + Math.abs(advantageLevel);
  return advantageLevel > 0 ? expectedMax(sides, numDice) : expectedMin(sides, numDice);
}

/** Expected value of an ordered digit pair, including deterministic tie drops. */
function doubleDigitAverage(sides: number, advantageLevel: number): number {
  const baseDie = sides === 100 ? 10 : sides / 11;
  const lowest = sides === 100 ? 0 : 1;
  let distribution = new Map<number, number>();
  for (let tens = lowest; tens < lowest + baseDie; tens++)
    for (let ones = lowest; ones < lowest + baseDie; ones++) distribution.set(tens * 10 + ones, 1);
  // Adding one digit and discarding the lowest/highest yields the same retained
  // pair as selecting from the full pool. There are at most 100 pair states.
  for (let extra = 0; extra < Math.abs(advantageLevel); extra++) {
    const next = new Map<number, number>();
    for (const [pair, frequency] of distribution) {
      for (let digit = lowest; digit < lowest + baseDie; digit++) {
        const values = [Math.floor(pair / 10), pair % 10, digit];
        const dropped =
          advantageLevel > 0
            ? values.indexOf(Math.min(...values))
            : values.lastIndexOf(Math.max(...values));
        const retained = values.filter((_, index) => index !== dropped);
        const key = retained[0] * 10 + retained[1];
        next.set(key, (next.get(key) ?? 0) + frequency);
      }
    }
    distribution = next;
  }
  let average = 0;
  for (const [pair, frequency] of distribution)
    average += (sides === 100 && pair === 0 ? 100 : pair) * frequency;
  return average / Math.pow(baseDie, 2 + Math.abs(advantageLevel));
}

/**
 * Calculate the naive average value of a dice token, accounting for advantage/disadvantage.
 * For NdX with advantage, each die is rolled with extra dice and the best is kept.
 */
function diceTokenAverage(count: number, sides: number, modifiers: string[]): number {
  const baseAvg = DIE_AVERAGES[sides];
  if (baseAvg === undefined) return 0;

  const advantageLevel = parseAdvantageFromModifiers(modifiers);
  if (DOUBLE_DIGIT_DICE.includes(sides)) return count * doubleDigitAverage(sides, advantageLevel);
  if (advantageLevel === 0) {
    return count * baseAvg;
  }

  // Each kept die has the expected value of max/min of (1+|adv|) dice
  const perDie = singleDieAverage(sides, advantageLevel);
  return count * perDie;
}

/**
 * Calculate the expected average damage of a dice formula string.
 *
 * When nimbleDice=true, applies Nimble attack rules:
 * - First die rolling 1 = miss (entire attack does 0 damage including modifier)
 * - First die rolling max = crit (roll one extra exploding die)
 * - Vicious (v): crit adds an additional non-exploding die
 * - Double-digit dice (d44, d66, d88, d100) skip miss/crit rules
 *
 * When nimbleDice=false, uses naive averages (N * avg(dX) + M).
 */
export const calculateAverageDamage = (formula: string, nimbleDice = false): number | null => {
  if (!formula || !formula.trim()) return null;

  try {
    const tokens = diceService.tokenize(formula.trim());
    if (tokens.length === 0) return null;

    const values: number[] = [];
    const ops: string[] = [];

    function applyOp() {
      const op = ops.pop()!;
      const b = values.pop()!;
      const a = values.pop()!;
      switch (op) {
        case "+":
          values.push(a + b);
          break;
        case "-":
          values.push(a - b);
          break;
        case "*":
          values.push(a * b);
          break;
        case "/":
          values.push(b !== 0 ? a / b : 0);
          break;
      }
    }

    const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

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

    // Apply Nimble attack rules if enabled and we found a standard dice token
    const isDoubleDie = firstDiceSides !== null && DOUBLE_DIGIT_DICE.includes(firstDiceSides);
    if (nimbleDice && firstDiceSides !== null && !isDoubleDie) {
      const s = firstDiceSides;
      const baseAvg = DIE_AVERAGES[s];
      if (baseAvg !== undefined) {
        // Advantage affects miss/crit probabilities on the first die
        const advLevel = parseAdvantageFromModifiers(firstDiceModifiers);
        const numRolled = 1 + Math.abs(advLevel);

        let pMiss: number;
        let pCrit: number;

        if (advLevel > 0) {
          // Advantage: keep highest. Miss only if ALL dice roll 1. Crit if ANY rolls max.
          pMiss = Math.pow(1 / s, numRolled);
          pCrit = 1 - Math.pow((s - 1) / s, numRolled);
        } else if (advLevel < 0) {
          // Disadvantage: keep lowest. Miss if ANY die rolls 1. Crit only if ALL roll max.
          pMiss = 1 - Math.pow((s - 1) / s, numRolled);
          pCrit = Math.pow(1 / s, numRolled);
        } else {
          pMiss = 1 / s;
          pCrit = 1 / s;
        }

        const pHit = 1 - pMiss;
        const explodingExtra = (baseAvg * s) / (s - 1);

        const hasVicious = firstDiceModifiers.includes("v");
        const viciousExtra = hasVicious ? baseAvg : 0;

        result = pHit * result + pCrit * (explodingExtra + viciousExtra);
      }
    }

    return Math.round(result * 10) / 10;
  } catch {
    return null;
  }
};

// --- Histogram generation via Monte Carlo simulation ---

export interface HistogramBucket {
  value: number;
  count: number;
  percentage: number;
}

export interface HistogramResult {
  buckets: HistogramBucket[];
  min: number;
  max: number;
  mean: number;
  median: number;
  samples: number;
}

/**
 * Generate a histogram of results for a dice formula via Monte Carlo simulation.
 * Rolls the formula `samples` times and buckets the results.
 *
 * @param formula - Dice formula string (e.g., "2d8+10", "1d20!a")
 * @param options - Dice formula options (allowCriticals, allowFumbles, etc.)
 * @param samples - Number of simulations to run (default 10000)
 * @returns Histogram data with buckets, min, max, mean, median
 */
export const generateHistogram = (
  formula: string,
  options: DiceFormulaOptions = {},
  samples = 10000,
): HistogramResult | null => {
  if (!formula || !formula.trim()) return null;

  try {
    if (!Number.isSafeInteger(samples) || samples < 1 || samples > diceConfig.maxHistogramSamples)
      return null;
    const tokens = diceService.tokenize(formula);
    const rollCost = diceService.validateRoll(tokens, options);
    if (samples * rollCost > diceConfig.maxHistogramRolls) return null;
    const counts = new Map<number, number>();
    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    const allResults: number[] = [];

    for (let i = 0; i < samples; i++) {
      const result = diceService.evaluateTokenizedFormula(tokens, options);
      const val = result.total;
      allResults.push(val);
      counts.set(val, (counts.get(val) ?? 0) + 1);
      total += val;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    // Sort results for median
    allResults.sort((a, b) => a - b);
    const median =
      samples % 2 === 0
        ? (allResults[samples / 2 - 1] + allResults[samples / 2]) / 2
        : allResults[Math.floor(samples / 2)];

    // Build sorted buckets
    const sortedKeys = Array.from(counts.keys()).sort((a, b) => a - b);
    const buckets: HistogramBucket[] = sortedKeys.map((value) => ({
      value,
      count: counts.get(value)!,
      percentage: (counts.get(value)! / samples) * 100,
    }));

    return {
      buckets,
      min,
      max,
      mean: Math.round((total / samples) * 10) / 10,
      median,
      samples,
    };
  } catch {
    return null;
  }
};

// Also export the service instance for backward compatibility
export { diceService };
