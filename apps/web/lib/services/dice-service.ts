import { CategorizedDie, DiceCategory, DiceRollData, DiceType } from "../schemas/dice";
import {
  OPERATOR_REGEX,
  safeEvaluate,
  sanitizeExpression,
  substituteVariablesForDice,
} from "../utils/formula-utils";

export interface DiceFormulaOptions {
  advantageLevel?: number; // Positive for advantage, negative for disadvantage
  allowCriticals?: boolean; // Allow exploding criticals on max rolls
  allowFumbles?: boolean; // Allow fumbles on natural 1s
  vicious?: boolean; // Add one extra non-exploding die on critical hits
}

export interface DiceFormulaResult {
  displayString: string; // e.g., "[2] + ~~[1]~~ + [4] + 2"
  diceData?: DiceRollData; // Data for rich display rendering
  total: number; // e.g., 9
  formula: string; // Original formula for reference
  substitutedFormula?: string; // Formula after variable substitution
}

interface ParsedDiceNotation {
  count: number;
  sides: DiceType;
  position: number; // Position in the expression
  length: number; // Length of the matched string
  fullMatch: string; // The full matched string
}

/**
 * Unified dice service for all dice rolling operations.
 * Handles dice formulas, advantage/disadvantage, criticals, and fumbles.
 */
export class DiceService {
  private readonly validDiceTypes = [4, 6, 8, 10, 12, 20, 100];
  private readonly doubleDigitDiceTypes = [44, 66, 88];

  /**
   * Evaluate a dice formula expression
   * @param formula The formula to evaluate (e.g., "3d6 + 2" or "STRd6 + WIL")
   * @param options Options for dice rolling behavior
   */
  evaluateDiceFormula(formula: string, options: DiceFormulaOptions = {}): DiceFormulaResult {
    try {
      // Step 1: Clean and prepare the formula
      const cleanedFormula = sanitizeExpression(formula);

      // Step 2: Substitute variables (STR, DEX, etc.)
      const { substituted, hasVariables } = substituteVariablesForDice(cleanedFormula);

      // Step 3: Find and parse dice notation
      const diceNotation = this.findDiceNotation(substituted);
      if (!diceNotation) {
        throw new Error(`No valid dice notation found in formula: ${formula}`);
      }

      // Step 4: Validate dice count
      if (diceNotation.count <= 0) {
        throw new Error(`Invalid dice count: ${diceNotation.count}. Must be positive.`);
      }

      // Step 5: Roll the dice with options
      const rollResult = this.rollDiceWithOptions(diceNotation, options);

      // Step 6: Build the expression with dice results
      const expressionWithDice = this.buildExpressionWithDice(
        substituted,
        diceNotation,
        rollResult,
      );

      // Step 7: Evaluate the mathematical expression
      const total = this.evaluateExpression(expressionWithDice.expression);
      const finalTotal = options.allowFumbles && rollResult.isFumble ? 0 : total;

      // Create dice data for rich display
      const beforeDice = substituted.substring(0, diceNotation.position).trim();
      const afterDice = substituted.substring(diceNotation.position + diceNotation.length).trim();

      const diceData: DiceRollData = {
        dice: rollResult.allDice,
        beforeExpression: beforeDice || undefined,
        afterExpression: afterDice || undefined,
        total: finalTotal,
        isDoubleDigit: rollResult.isDoubleDigit,
        isFumble: rollResult.isFumble,
        advantageLevel: options.advantageLevel || 0,
        criticalHits: rollResult.criticalHits || 0,
      };

      return {
        displayString: expressionWithDice.display,
        diceData,
        total: finalTotal,
        formula,
        substitutedFormula: hasVariables ? substituted : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to evaluate dice formula "${formula}": ${error}`);
    }
  }

  /**
   * Find and parse dice notation in the expression
   */
  private findDiceNotation(expression: string): ParsedDiceNotation | null {
    // Updated regex to handle negative numbers before 'd'
    const diceRegex = /(-?\d+)?d(\d+)/gi;

    const match = diceRegex.exec(expression);
    if (!match) return null;

    const count = match[1] ? parseInt(match[1]) : 1;
    const sides = parseInt(match[2]);

    // Validate dice type (including double-digit dice)
    const isDoubleDigit = this.doubleDigitDiceTypes.includes(sides);
    if (!this.validDiceTypes.includes(sides) && !isDoubleDigit) {
      throw new Error(
        `Invalid dice type: d${sides}. Valid types are: ${[...this.validDiceTypes, ...this.doubleDigitDiceTypes].join(", ")}`,
      );
    }

    return {
      count,
      sides: sides as DiceType,
      position: match.index,
      length: match[0].length,
      fullMatch: match[0],
    };
  }

  /**
   * Roll dice with the specified options
   */
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
    const isDoubleDigit = this.doubleDigitDiceTypes.includes(notation.sides as any);

    if (isDoubleDigit) {
      // Double-digit dice cannot crit or be vicious
      return this.rollDoubleDigitDice(notation, options);
    }

    const advantageLevel = options.advantageLevel || 0;
    const totalDiceToRoll = notation.count + Math.abs(advantageLevel);

    // Roll all dice in order
    const rolledDice: number[] = [];
    for (let i = 0; i < totalDiceToRoll; i++) {
      rolledDice.push(this.rollSingleDie(notation.sides));
    }

    // Determine which dice to keep based on advantage/disadvantage
    // We need to track indices to maintain order
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
      // No advantage/disadvantage
      keptIndices = new Set(diceWithIndices.map((d) => d.index));
    }

    // Build result maintaining original roll order with categories
    const allDice: CategorizedDie[] = rolledDice.map((value, index) => {
      const isKept = keptIndices.has(index);
      // Check if this is the first kept die and it's a nat 1 (fumble)
      const isFirstKept = isKept && [...keptIndices].sort((a, b) => a - b)[0] === index;
      const isFumble =
        isFirstKept && value === 1 && notation.sides === 20 && options.allowFumbles === true;

      return {
        value,
        size: notation.sides,
        kept: isKept,
        category: isFumble ? "fumble" : isKept ? "normal" : "dropped",
        index,
      };
    });

    // Find the first kept die for critical/fumble checking
    const firstKeptDie = allDice.find((d) => d.kept);
    let isCritical = false;
    let isFumble = false;
    let criticalHits = 0;

    if (firstKeptDie) {
      isFumble = firstKeptDie.category === "fumble";
      isCritical = options.allowCriticals === true && firstKeptDie.value === notation.sides;

      // Handle exploding criticals
      if (isCritical && options.allowCriticals) {
        criticalHits = 1; // Count the initial critical
        let consecutiveCrits = 0;
        const maxCrits = 10; // Reasonable limit to prevent infinite loops

        while (consecutiveCrits < maxCrits) {
          const newRoll = this.rollSingleDie(notation.sides);
          allDice.push({
            value: newRoll,
            size: notation.sides,
            kept: true,
            category: "critical",
            index: allDice.length,
          });

          if (newRoll === notation.sides) {
            consecutiveCrits++;
            criticalHits++; // Count each exploded critical
          } else {
            break; // Stop rolling if we didn't get another critical
          }
        }

        // Add vicious die if enabled (non-exploding extra die on crit)
        if (options.vicious === true) {
          const viciousRoll = this.rollSingleDie(notation.sides);
          allDice.push({
            value: viciousRoll,
            size: notation.sides,
            kept: true,
            category: "vicious",
            index: allDice.length,
          });
          // Note: vicious die cannot explode, so we don't check for another crit
        }
      }
    }

    const keptSum = allDice.filter((d) => d.kept).reduce((sum, d) => sum + d.value, 0);

    return { allDice, keptSum, isCritical, isFumble, criticalHits };
  }

  /**
   * Roll double-digit dice (d44, d66, d88)
   * These dice roll two dice and combine them as tens and ones
   */
  private rollDoubleDigitDice(
    notation: ParsedDiceNotation,
    options: DiceFormulaOptions,
  ): {
    allDice: CategorizedDie[];
    keptSum: number;
    isCritical: boolean;
    isFumble: boolean;
    isDoubleDigit: boolean;
  } {
    if (notation.count !== 1) {
      throw new Error(
        `Double-digit dice (d${notation.sides}) can only be rolled one at a time. Use 1d${notation.sides}.`,
      );
    }

    const advantageLevel = options.advantageLevel || 0;
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

    // Track indices for determining which dice are kept
    const tensIndices = tensRolls.map((value, index) => ({ value, index }));
    const onesIndices = onesRolls.map((value, index) => ({ value, index }));

    // Sort by value to determine which to keep/drop
    const tensSorted = [...tensIndices].sort((a, b) => a.value - b.value);
    const onesSorted = [...onesIndices].sort((a, b) => a.value - b.value);

    let keptTensIndex: number;
    let keptOnesIndex: number;

    if (advantageLevel > 0) {
      // Advantage: drop lowest, keep highest
      keptTensIndex = tensSorted[tensSorted.length - 1].index;
      keptOnesIndex = onesSorted[onesSorted.length - 1].index;
    } else if (advantageLevel < 0) {
      // Disadvantage: drop highest, keep lowest
      keptTensIndex = tensSorted[0].index;
      keptOnesIndex = onesSorted[0].index;
    } else {
      // No advantage/disadvantage
      keptTensIndex = 0;
      keptOnesIndex = 0;
    }

    // Build the allDice array in the order rolled
    // First all tens dice, then all ones dice
    const allDice: CategorizedDie[] = [];

    // Add tens dice
    tensRolls.forEach((value, index) => {
      allDice.push({
        value,
        size: baseDie as DiceType,
        kept: index === keptTensIndex,
        category: index === keptTensIndex ? "normal" : "dropped",
        index: allDice.length,
      });
    });

    // Add ones dice
    onesRolls.forEach((value, index) => {
      allDice.push({
        value,
        size: baseDie as DiceType,
        kept: index === keptOnesIndex,
        category: index === keptOnesIndex ? "normal" : "dropped",
        index: allDice.length,
      });
    });

    // Calculate the final result
    const keptTens = tensRolls[keptTensIndex];
    const keptOnes = onesRolls[keptOnesIndex];
    const keptSum = keptTens * 10 + keptOnes;

    return {
      allDice,
      keptSum,
      isCritical: false, // Double-digit dice cannot crit
      isFumble: false, // Double-digit dice cannot fumble
      isDoubleDigit: true,
    };
  }

  /**
   * Build the expression with rolled dice values
   */
  private buildExpressionWithDice(
    expression: string,
    notation: ParsedDiceNotation,
    rollResult: {
      allDice: CategorizedDie[];
      keptSum: number;
      isCritical: boolean;
      isFumble: boolean;
      isDoubleDigit?: boolean;
      criticalHits?: number;
    },
  ): { expression: string; display: string } {
    // Build the dice display string
    const diceDisplay = rollResult.isDoubleDigit
      ? this.formatDoubleDigitDiceDisplay(rollResult.allDice, rollResult.keptSum)
      : this.formatDiceDisplay(rollResult.allDice);

    // Replace the dice notation with the sum for evaluation
    const beforeDice = expression.substring(0, notation.position);
    const afterDice = expression.substring(notation.position + notation.length);

    const evaluationExpression = beforeDice + rollResult.keptSum + afterDice;
    const displayExpression = beforeDice + diceDisplay + afterDice;

    return {
      expression: evaluationExpression,
      display: displayExpression,
    };
  }

  /**
   * Format dice for display with advantage/disadvantage strikethrough
   */
  private formatDiceDisplay(allDice: CategorizedDie[]): string {
    // Format each die in its original roll order
    const formattedDice = allDice.map((die) => {
      const dieStr = `[${die.value}]`;
      return die.kept ? dieStr : `~~${dieStr}~~`;
    });

    // Join with " + " for addition
    return formattedDice.join(" + ");
  }

  /**
   * Format double-digit dice display
   * Shows the individual dice with the final result
   */
  private formatDoubleDigitDiceDisplay(allDice: CategorizedDie[], result: number): string {
    // Format all dice (tens first, then ones)
    const formattedDice = allDice
      .map((die) => {
        const dieStr = `[${die.value}]`;
        return die.kept ? dieStr : `~~${dieStr}~~`;
      })
      .join(" ");

    // Return format: [dice] = result
    // e.g., "[3] [2] = 32" or "[3] ~~[1]~~ [2] = 32"
    return `${formattedDice} = ${result}`;
  }

  /**
   * Safely evaluate the mathematical expression
   */
  private evaluateExpression(expression: string): number {
    // Validate that only numbers and operators remain
    if (!OPERATOR_REGEX.test(expression)) {
      throw new Error(`Invalid characters in expression: ${expression}`);
    }

    const result = safeEvaluate(expression);
    return Math.floor(result); // Always return integer results
  }

  /**
   * Roll a single die with the specified number of sides.
   * @param sides The number of sides on the die
   * @returns A random number between 1 and sides (inclusive)
   */
  private rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }
}

export const diceService = new DiceService();

// Export alias for backward compatibility during migration
export const diceFormulaService = diceService;
