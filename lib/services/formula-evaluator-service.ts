import { FlexibleValue } from "../schemas/flexible-value";
import { 
  OPERATOR_REGEX, 
  sanitizeExpression, 
  substituteVariables, 
  safeEvaluate 
} from "../utils/formula-utils";

export class FormulaEvaluatorService {
  /**
   * Safely evaluate a formula expression using the current character
   * @param expression The formula expression to evaluate
   * @throws Error if the expression is invalid or cannot be evaluated
   */
  evaluateFormula(expression: string): number {
    // Step 1: Clean and validate the expression
    const cleanedExpression = sanitizeExpression(expression);

    // Step 2: Replace variables with their values
    const substitutedExpression = substituteVariables(cleanedExpression);

    // Step 3: Validate that only numbers and operators remain
    if (!OPERATOR_REGEX.test(substitutedExpression)) {
      throw new Error(
        `Invalid characters in expression after substitution: ${substitutedExpression}`,
      );
    }

    // Step 4: Safely evaluate the mathematical expression
    const result = safeEvaluate(substitutedExpression);

    // Step 5: Ensure result is a valid non-negative integer
    return Math.max(0, Math.floor(result));
  }

  /**
   * Evaluate a FlexibleValue (either fixed or formula-based) using the current character
   */
  evaluateFlexibleValue(value: FlexibleValue): number {
    if (value.type === "fixed") {
      return value.value;
    } else {
      return this.evaluateFormula(value.expression);
    }
  }

  /**
   * Get a preview of what a formula would evaluate to with the current character
   */
  previewFormula(expression: string): { result: number; substituted: string } {
    const cleanedExpression = sanitizeExpression(expression);
    const substitutedExpression = substituteVariables(cleanedExpression);
    const result = this.evaluateFormula(expression);

    return { result, substituted: substitutedExpression };
  }
}

export const formulaEvaluatorService = new FormulaEvaluatorService();
