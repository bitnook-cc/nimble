import { CategorizedDie, DiceRollData, DiceType } from "@nimble/dice";
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
  hasExplodingCrits?: boolean; // From '!' postfix
  isVicious?: boolean; // From 'v' postfix
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

      // Step 3: Find all dice notations
      const diceNotations = this.findAllDiceNotations(substituted);

      // If no dice notation found, treat as pure math expression
      if (diceNotations.length === 0) {
        const total = this.evaluateExpression(substituted);
        return {
          displayString: `${substituted} = ${total}`,
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
          substitutedFormula: hasVariables ? substituted : undefined,
        };
      }

      // Step 4: Process all dice notations
      let expressionWithDice = substituted;
      let displayExpression = substituted;
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

        // Apply postfix modifiers for this specific dice notation
        const modifiedOptions = {
          ...options,
          // Postfix modifiers override the options
          allowCriticals:
            notation.hasExplodingCrits || notation.isVicious || options.allowCriticals,
          vicious: notation.isVicious || options.vicious,
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

      // Step 5: Evaluate the mathematical expression
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
        substitutedFormula: hasVariables ? substituted : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to evaluate dice formula "${formula}": ${error}`);
    }
  }

  /**
   * Find all dice notations in the expression
   */
  private findAllDiceNotations(expression: string): ParsedDiceNotation[] {
    const diceRegex = /(-?\d+)?d(\d+)([!v]+)?/gi;
    const notations: ParsedDiceNotation[] = [];
    let match;

    while ((match = diceRegex.exec(expression)) !== null) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const sides = parseInt(match[2]);
      const postfixes = match[3] || "";

      // Parse postfixes
      const hasExplodingCrits = postfixes.includes("!");
      const isVicious = postfixes.includes("v");

      // Validate dice type (including double-digit dice)
      const isDoubleDigit = this.doubleDigitDiceTypes.includes(sides);
      if (!this.validDiceTypes.includes(sides) && !isDoubleDigit) {
        throw new Error(
          `Invalid dice type: d${sides}. Valid types are: ${[...this.validDiceTypes, ...this.doubleDigitDiceTypes].join(", ")}`,
        );
      }

      notations.push({
        count,
        sides: sides as DiceType,
        position: match.index,
        length: match[0].length,
        fullMatch: match[0],
        hasExplodingCrits,
        isVicious,
      });
    }

    return notations;
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
      // Double-digit dice cannot crit or be vicious (ignore postfixes)
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

        // Add vicious dice if enabled (one non-exploding die per critical hit)
        if (options.vicious === true && criticalHits > 0) {
          for (let i = 0; i < criticalHits; i++) {
            const viciousRoll = this.rollSingleDie(notation.sides);
            allDice.push({
              value: viciousRoll,
              size: notation.sides,
              kept: true,
              category: "vicious",
              index: allDice.length,
            });
            // Note: vicious dice cannot explode, so we don't check for crits
          }
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
