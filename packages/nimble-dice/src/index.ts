/**
 * Nimble Dice - Standalone dice rolling engine
 * Supports standard dice notation with extensions:
 * - Basic dice: 2d6, 1d20, etc.
 * - Modifiers: 2d6+5, 1d20-3
 * - Exploding criticals: 1d20! (explodes on max roll)
 * - Vicious: 1d8v (adds extra die on critical)
 * - Double-digit dice: 1d44, 1d66, 1d88
 * - Advantage/disadvantage system
 */

import {
  CategorizedDie,
  DiceCategory,
  DiceFormulaOptions,
  DiceFormulaResult,
  DiceRollData,
} from "./schemas.js";
import { diceConfig } from "./config.js";

// Re-export all types from schemas
export * from "./schemas.js";

interface ParsedDiceNotation {
  count: number;
  sides: number;
  position: number;
  length: number;
  fullMatch: string;
  hasExplodingCrits?: boolean;
  allDiceExplode?: boolean;
  isVicious?: boolean;
  advantageLevel?: number; // Positive for advantage, negative for disadvantage
}

export class DiceService {
  private readonly config = diceConfig;

  evaluateDiceFormula(formula: string, options: DiceFormulaOptions = {}): DiceFormulaResult {
    try {
      // Clean the formula
      const cleanedFormula = this.sanitizeExpression(formula);

      // Find all dice notations
      const diceNotations = this.findAllDiceNotations(cleanedFormula);

      // If no dice notation found, treat as pure math expression
      if (diceNotations.length === 0) {
        const total = this.evaluateExpression(cleanedFormula);
        return {
          displayString: `${cleanedFormula} = ${total}`,
          diceData: {
            dice: [],
            total,
            isDoubleDigit: false,
            isFumble: false,
            advantageLevel: 0,
            criticalHits: 0,
          },
          total,
          formula,
        };
      }

      // Process all dice notations
      let expressionWithDice = cleanedFormula;
      let displayExpression = cleanedFormula;
      const allDice: CategorizedDie[] = [];
      let totalCriticalHits = 0;
      let hasFumble = false;
      let hasDoubleDigit = false;

      // Process dice notations in reverse order to maintain correct positions
      for (let i = diceNotations.length - 1; i >= 0; i--) {
        const notation = diceNotations[i];

        // Validate dice count
        if (notation.count <= 0) {
          throw new Error(`Invalid dice count: ${notation.count}. Must be positive.`);
        }
        if (notation.count > this.config.maxDiceCount) {
          throw new Error(
            `Too many dice: ${notation.count}. Maximum allowed is ${this.config.maxDiceCount}.`,
          );
        }

        // Apply postfix modifiers
        const modifiedOptions = {
          ...options,
          allowCriticals:
            notation.hasExplodingCrits || notation.isVicious || options.allowCriticals,
          vicious: notation.isVicious || options.vicious,
          explodeAll: notation.allDiceExplode || options.explodeAll,
        };

        const rollResult = this.rollDiceWithOptions(notation, modifiedOptions);

        // Update aggregated data
        allDice.unshift(...rollResult.allDice);
        totalCriticalHits += rollResult.criticalHits || 0;
        hasFumble = hasFumble || rollResult.isFumble;
        hasDoubleDigit = hasDoubleDigit || rollResult.isDoubleDigit || false;

        // Build the dice display string
        const diceDisplay = rollResult.isDoubleDigit
          ? this.formatDoubleDigitDiceDisplay(rollResult.allDice, rollResult.keptSum)
          : this.formatDiceDisplay(rollResult.allDice);

        // Replace the dice notation with the sum for evaluation
        const beforeDice = expressionWithDice.substring(0, notation.position);
        const afterDice = expressionWithDice.substring(notation.position + notation.length);
        expressionWithDice = beforeDice + rollResult.keptSum + afterDice;
        displayExpression =
          displayExpression.substring(0, notation.position) +
          diceDisplay +
          displayExpression.substring(notation.position + notation.length);
      }

      // Evaluate the mathematical expression
      const total = this.evaluateExpression(expressionWithDice);
      const finalTotal = options.allowFumbles && hasFumble ? 0 : total;

      // Create dice data for rich display
      const diceData: DiceRollData = {
        dice: allDice,
        total: finalTotal,
        isDoubleDigit: hasDoubleDigit,
        isFumble: hasFumble,
        advantageLevel: options.advantageLevel || 0,
        criticalHits: totalCriticalHits,
      };

      return {
        displayString: displayExpression,
        diceData,
        total: finalTotal,
        formula,
      };
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

  private findAllDiceNotations(expression: string): ParsedDiceNotation[] {
    // Updated regex to capture advantage (a) and disadvantage (d) postfixes with optional numbers
    // Pattern: [count]d[sides][!v]*[a|d][number]?
    const diceRegex = /(-?\d+)?d(\d+)([!v]*)?([ad]\d?)?/gi;
    const notations: ParsedDiceNotation[] = [];
    let match;

    while ((match = diceRegex.exec(expression)) !== null) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const sides = parseInt(match[2]);
      const modifierPostfixes = match[3] || "";
      const advantagePostfix = match[4] || "";
      const advantageNumber = parseInt(advantagePostfix.substring(1) || "1");

      // Parse modifiers
      const hasExplodingCrits = modifierPostfixes.includes("!");
      const allDiceExplode = modifierPostfixes.includes("!!");
      const isVicious = modifierPostfixes.includes("v");

      // Parse advantage/disadvantage
      let advantageLevel = undefined;
      if (advantagePostfix.includes("a")) {
        advantageLevel = advantageNumber;
      } else if (advantagePostfix.includes("d")) {
        advantageLevel = -advantageNumber;
      }

      // Validate dice type
      const isDoubleDigit = this.config.doubleDigitDiceTypes.includes(sides as any);
      if (!this.config.validDiceTypes.includes(sides as any) && !isDoubleDigit) {
        throw new Error(
          `Invalid dice type: d${sides}. Valid types are: ${[...this.config.validDiceTypes, ...this.config.doubleDigitDiceTypes].join(", ")}`,
        );
      }

      notations.push({
        count,
        sides,
        position: match.index,
        length: match[0].length,
        fullMatch: match[0],
        hasExplodingCrits,
        allDiceExplode,
        isVicious,
        advantageLevel,
      });
    }

    return notations;
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
    const isDoubleDigit = this.config.doubleDigitDiceTypes.includes(notation.sides as any);

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
    if (notation.count !== 1) {
      throw new Error(`Double-digit dice (d${notation.sides}) can only be rolled one at a time.`);
    }

    // Use advantage level from notation if specified, otherwise from options
    const advantageLevel =
      notation.advantageLevel !== undefined ? notation.advantageLevel : options.advantageLevel || 0;
    const baseDie = notation.sides === 44 ? 4 : notation.sides === 66 ? 6 : 8;
    const totalDicePerPosition = 1 + Math.abs(advantageLevel);

    // Roll all dice for tens position
    const tensRolls: number[] = [];
    for (let i = 0; i < totalDicePerPosition; i++) {
      tensRolls.push(this.rollSingleDie(baseDie));
    }

    // Roll all dice for ones position
    const onesRolls: number[] = [];
    for (let i = 0; i < totalDicePerPosition; i++) {
      onesRolls.push(this.rollSingleDie(baseDie));
    }

    // Determine which to keep
    const tensIndices = tensRolls.map((value, index) => ({ value, index }));
    const onesIndices = onesRolls.map((value, index) => ({ value, index }));
    const tensSorted = [...tensIndices].sort((a, b) => a.value - b.value);
    const onesSorted = [...onesIndices].sort((a, b) => a.value - b.value);

    let keptTensIndex: number;
    let keptOnesIndex: number;

    if (advantageLevel > 0) {
      keptTensIndex = tensSorted[tensSorted.length - 1].index;
      keptOnesIndex = onesSorted[onesSorted.length - 1].index;
    } else if (advantageLevel < 0) {
      keptTensIndex = tensSorted[0].index;
      keptOnesIndex = onesSorted[0].index;
    } else {
      keptTensIndex = 0;
      keptOnesIndex = 0;
    }

    // Build dice array
    const allDice: CategorizedDie[] = [];
    tensRolls.forEach((value, index) => {
      allDice.push({
        value,
        size: baseDie,
        kept: index === keptTensIndex,
        category: (index === keptTensIndex ? "normal" : "dropped") as DiceCategory,
        index: allDice.length,
      });
    });
    onesRolls.forEach((value, index) => {
      allDice.push({
        value,
        size: baseDie,
        kept: index === keptOnesIndex,
        category: (index === keptOnesIndex ? "normal" : "dropped") as DiceCategory,
        index: allDice.length,
      });
    });

    const keptSum = tensRolls[keptTensIndex] * 10 + onesRolls[keptOnesIndex];

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
    const formattedDice = allDice
      .map((die) => {
        const dieStr = `[${die.value}]`;
        return die.kept ? dieStr : `~~${dieStr}~~`;
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

// Also export the service instance for backward compatibility
export { diceService };
