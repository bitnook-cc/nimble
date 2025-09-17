import {
  evaluateDiceFormula as baseEvaluateDiceFormula,
  type DiceFormulaOptions,
  type DiceFormulaResult,
} from "@nimble/dice";

import { substituteVariablesForDice } from "../utils/formula-utils";

/**
 * Web-specific dice service that extends the base dice functionality
 * with variable substitution for character attributes.
 */
export class DiceService {
  /**
   * Evaluate a dice formula expression with variable substitution
   * @param formula The formula to evaluate (e.g., "3d6 + 2" or "STRd6 + WIL")
   * @param options Options for dice rolling behavior
   */
  evaluateDiceFormula(formula: string, options: DiceFormulaOptions = {}): DiceFormulaResult {
    try {
      // Substitute variables (STR, DEX, etc.) - this is web-specific
      const { substituted, hasVariables } = substituteVariablesForDice(formula);

      // Use the base dice function for the actual dice rolling
      const result = baseEvaluateDiceFormula(substituted, options);

      // Add the substituted formula if we had variables
      if (hasVariables) {
        return {
          ...result,
          substitutedFormula: substituted,
        };
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate dice formula "${formula}": ${error}`);
    }
  }
}

export const diceService = new DiceService();

// Export alias for backward compatibility during migration
export const diceFormulaService = diceService;

// Re-export types from the base module for convenience
export type { DiceFormulaOptions, DiceFormulaResult } from "@nimble/dice";