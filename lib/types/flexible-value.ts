/**
 * Generic flexible value system for numbers that can be either fixed or formula-based
 * Used for ability max uses, resource min/max values, and other dynamic calculations
 */
import { formulaEvaluatorService } from "../services/formula-evaluator-service";
import type { Character } from "../schemas/character";
import type { FlexibleValue } from "../schemas/flexible-value";

/**
 * Get the computed value from a FlexibleValue
 */
export function calculateFlexibleValue(
  flexibleValue: FlexibleValue,
  character?: Character,
): number {
  if (flexibleValue.type === "fixed") {
    return flexibleValue.value;
  } else {
    if (!character) {
      throw new Error("Character is required to evaluate formula values");
    }
    return formulaEvaluatorService.evaluateFormula(flexibleValue.expression, character);
  }
}
