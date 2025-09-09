/**
 * Generic flexible value system for numbers that can be either fixed or formula-based
 * Used for ability max uses, resource min/max values, and other dynamic calculations
 */
import type { FlexibleValue } from "../schemas/flexible-value";
import { formulaEvaluatorService } from "../services/formula-evaluator-service";

/**
 * Get the computed value from a FlexibleValue
 */
export function calculateFlexibleValue(flexibleValue: FlexibleValue): number {
  if (flexibleValue.type === "fixed") {
    return flexibleValue.value;
  } else {
    return formulaEvaluatorService.evaluateFormula(flexibleValue.expression);
  }
}
