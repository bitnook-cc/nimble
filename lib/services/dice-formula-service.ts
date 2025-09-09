import { AttributeName } from "../schemas/character";
import { DiceType } from "../schemas/dice";
import { diceService } from "./dice-service";
import { getCharacterService } from "./service-factory";

export interface DiceFormulaOptions {
  advantageLevel?: number; // Positive for advantage, negative for disadvantage
  allowCriticals?: boolean; // Allow exploding criticals on max rolls
  allowFumbles?: boolean; // Allow fumbles on natural 1s
  vicious?: boolean; // Add one extra non-exploding die on critical hits
}

export interface DiceFormulaResult {
  displayString: string; // e.g., "[2] + ~~[1]~~ + [4] + 2"
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

export class DiceFormulaService {
  private readonly operatorRegex = /^[+\-*/\(\)0-9\s]+$/;
  private readonly validDiceTypes = [4, 6, 8, 10, 12, 20, 100];

  /**
   * Evaluate a dice formula expression
   * @param formula The formula to evaluate (e.g., "3d6 + 2" or "STRd6 + WIL")
   * @param options Options for dice rolling behavior
   */
  evaluateDiceFormula(formula: string, options: DiceFormulaOptions = {}): DiceFormulaResult {
    try {
      // Step 1: Clean and prepare the formula
      const cleanedFormula = this.sanitizeFormula(formula);

      // Step 2: Substitute variables (STR, DEX, etc.)
      const { substituted, hasVariables } = this.substituteVariables(cleanedFormula);

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

      return {
        displayString: expressionWithDice.display,
        total: options.allowFumbles && rollResult.isFumble ? 0 : total,
        formula,
        substitutedFormula: hasVariables ? substituted : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to evaluate dice formula "${formula}": ${error}`);
    }
  }

  /**
   * Clean and validate the formula
   */
  private sanitizeFormula(formula: string): string {
    // Remove extra whitespace
    const cleaned = formula.replace(/\s+/g, " ").trim();

    // Check for obviously malicious patterns
    const dangerousPatterns = [
      /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([^)]*\)/, // function calls (except d notation)
      /\[|\]/, // array access
      /\{|\}/, // object access
      /;|:/, // statement separators
      /=/, // assignment
      /\.|`/, // property access or template literals
    ];

    for (const pattern of dangerousPatterns) {
      // Skip the function pattern check for dice notation
      if (pattern.source.includes("a-zA-Z_$") && /\bd\d+/i.test(cleaned)) {
        continue;
      }
      if (pattern.test(cleaned)) {
        throw new Error(`Potentially unsafe pattern detected in formula`);
      }
    }

    return cleaned;
  }

  /**
   * Substitute attribute variables in the formula
   */
  private substituteVariables(formula: string): { substituted: string; hasVariables: boolean } {
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();

    if (!character) {
      return { substituted: formula, hasVariables: false };
    }

    let result = formula;
    let hasVariables = false;

    // Get attributes with stat boosts
    const attributes = characterService.getAttributes();

    // Replace attribute names (case-insensitive)
    // Special handling for variables before 'd' in dice notation
    const attributeMap: Record<string, AttributeName> = {
      STR: "strength",
      STRENGTH: "strength",
      DEX: "dexterity",
      DEXTERITY: "dexterity",
      INT: "intelligence",
      INTELLIGENCE: "intelligence",
      WIL: "will",
      WILL: "will",
    };

    // Use case-insensitive replacement with special handling for dice notation
    for (const [key, attributeName] of Object.entries(attributeMap)) {
      const value = attributes[attributeName];
      // Match the attribute name when it's either:
      // 1. Followed by 'd' (for dice notation like STRd6)
      // 2. At a word boundary (for regular math like STR + 2)
      const regex = new RegExp(`\\b${key}(?=d\\d+)|\\b${key}\\b`, "gi");
      if (regex.test(result)) {
        hasVariables = true;
        result = result.replace(regex, value.toString());
      }
    }

    // Replace level keyword with same special handling
    const levelRegex = /\b(LEVEL|LVL)(?=d\d+)|\b(LEVEL|LVL)\b/gi;
    if (levelRegex.test(result)) {
      hasVariables = true;
      result = result.replace(levelRegex, character.level.toString());
    }

    return { substituted: result, hasVariables };
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

    // Validate dice type
    if (!this.validDiceTypes.includes(sides)) {
      throw new Error(
        `Invalid dice type: d${sides}. Valid types are: ${this.validDiceTypes.join(", ")}`,
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
    allDice: { value: number; kept: boolean }[];
    keptSum: number;
    isCritical: boolean;
    isFumble: boolean;
  } {
    const advantageLevel = options.advantageLevel || 0;
    const totalDiceToRoll = notation.count + Math.abs(advantageLevel);

    // Roll all dice in order
    const rolledDice: number[] = [];
    for (let i = 0; i < totalDiceToRoll; i++) {
      rolledDice.push(diceService.rollSingleDie(notation.sides));
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

    // Build result maintaining original roll order
    const allDice = rolledDice.map((value, index) => ({
      value,
      kept: keptIndices.has(index),
    }));

    // Find the first kept die for critical/fumble checking
    const firstKeptDie = allDice.find((d) => d.kept);
    let isCritical = false;
    let isFumble = false;

    if (firstKeptDie) {
      isFumble = options.allowFumbles === true && firstKeptDie.value === 1;
      isCritical = options.allowCriticals === true && firstKeptDie.value === notation.sides;

      // Handle exploding criticals
      if (isCritical && options.allowCriticals) {
        let consecutiveCrits = 0;
        const maxCrits = 10; // Reasonable limit to prevent infinite loops

        while (consecutiveCrits < maxCrits) {
          const newRoll = diceService.rollSingleDie(notation.sides);
          allDice.push({ value: newRoll, kept: true });

          if (newRoll === notation.sides) {
            consecutiveCrits++;
          } else {
            break; // Stop rolling if we didn't get another critical
          }
        }

        // Add vicious die if enabled (non-exploding extra die on crit)
        if (options.vicious === true) {
          const viciousRoll = diceService.rollSingleDie(notation.sides);
          allDice.push({ value: viciousRoll, kept: true });
          // Note: vicious die cannot explode, so we don't check for another crit
        }
      }
    }

    const keptSum = allDice.filter((d) => d.kept).reduce((sum, d) => sum + d.value, 0);

    return { allDice, keptSum, isCritical, isFumble };
  }

  /**
   * Build the expression with rolled dice values
   */
  private buildExpressionWithDice(
    expression: string,
    notation: ParsedDiceNotation,
    rollResult: {
      allDice: { value: number; kept: boolean }[];
      keptSum: number;
      isCritical: boolean;
      isFumble: boolean;
    },
  ): { expression: string; display: string } {
    // Build the dice display string
    const diceDisplay = this.formatDiceDisplay(rollResult.allDice);

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
  private formatDiceDisplay(allDice: { value: number; kept: boolean }[]): string {
    // Format each die in its original roll order
    const formattedDice = allDice.map((die) => {
      const dieStr = `[${die.value}]`;
      return die.kept ? dieStr : `~~${dieStr}~~`;
    });

    // Join with " + " for addition
    return formattedDice.join(" + ");
  }

  /**
   * Safely evaluate the mathematical expression
   */
  private evaluateExpression(expression: string): number {
    // Validate that only numbers and operators remain
    if (!this.operatorRegex.test(expression)) {
      throw new Error(`Invalid characters in expression: ${expression}`);
    }

    try {
      // Use Function constructor for safer evaluation than eval
      const func = new Function(`"use strict"; return (${expression});`);
      const result = func();

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error(`Expression did not evaluate to a finite number: ${result}`);
      }

      return Math.floor(result); // Always return integer results
    } catch (error) {
      throw new Error(`Failed to evaluate expression "${expression}": ${error}`);
    }
  }
}

export const diceFormulaService = new DiceFormulaService();
