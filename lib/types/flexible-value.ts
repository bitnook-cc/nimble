/**
 * Generic flexible value system for numbers that can be either fixed or formula-based
 * Used for ability max uses, resource min/max values, and other dynamic calculations
 */
import { formulaEvaluatorService } from "../services/formula-evaluator-service";
import type { FlexibleValue } from "../schemas/flexible-value";

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
