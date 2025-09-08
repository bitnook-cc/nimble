import { AttributeName, Character } from "../schemas/character";
import { FlexibleValue } from "../schemas/flexible-value";

export class FormulaEvaluatorService {
  private readonly allowedAttributes: string[] = [
    "STR",
    "DEX",
    "INT",
    "WIL",
    "strength",
    "dexterity",
    "intelligence",
    "will",
  ];

  private readonly allowedKeywords: string[] = ["level"];

  private readonly operatorRegex = /^[+\-*/()0-9\s]+$/;

  /**
   * Safely evaluate a formula expression with character context
   */
  evaluateFormula(expression: string, character: Character): number {
    try {
      // Step 1: Clean and validate the expression
      const cleanedExpression = this.sanitizeExpression(expression);

      // Step 2: Replace variables with their values
      const substitutedExpression = this.substituteVariables(cleanedExpression, character);

      // Step 3: Validate that only numbers and operators remain
      if (!this.operatorRegex.test(substitutedExpression)) {
        throw new Error(
          `Invalid characters in expression after substitution: ${substitutedExpression}`,
        );
      }

      // Step 4: Safely evaluate the mathematical expression
      const result = this.safeEvaluate(substitutedExpression);

      // Step 5: Ensure result is a valid non-negative integer
      return Math.max(0, Math.floor(result));
    } catch (error) {
      console.warn(`Formula evaluation failed for "${expression}":`, error);
      return 0; // Default to 0 uses on error
    }
  }

  /**
   * Clean the expression and perform basic validation
   */
  private sanitizeExpression(expression: string): string {
    // Remove extra whitespace and convert to uppercase for consistency
    const cleaned = expression.replace(/\s+/g, " ").trim().toUpperCase();

    // Check for obviously malicious patterns
    const dangerousPatterns = [
      /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, // function calls
      /\[|\]/, // array access
      /\{|\}/, // object access
      /;|:/, // statement separators
      /=/, // assignment
      /\.|`/, // property access or template literals
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleaned)) {
        throw new Error(`Potentially unsafe pattern detected: ${pattern}`);
      }
    }

    return cleaned;
  }

  /**
   * Replace attribute names and keywords with their numeric values
   */
  private substituteVariables(expression: string, character: Character): string {
    let result = expression;

    // Replace attribute names (both full and abbreviated)
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

    for (const [key, attributeName] of Object.entries(attributeMap)) {
      const value = character._attributes[attributeName];
      // Use word boundaries to avoid partial matches
      result = result.replace(new RegExp(`\\b${key}\\b`, "g"), value.toString());
    }

    // Replace level keyword
    result = result.replace(/\bLEVEL\b/g, character.level.toString());

    return result;
  }

  /**
   * Safely evaluate a mathematical expression using Function constructor
   * This is safer than eval() as it doesn't have access to the global scope
   */
  private safeEvaluate(expression: string): number {
    try {
      // Create a restricted evaluation context
      const func = new Function(`"use strict"; return (${expression});`);
      const result = func();

      if (typeof result !== "number" || !isFinite(result)) {
        throw new Error(`Expression did not evaluate to a finite number: ${result}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate expression "${expression}": ${error}`);
    }
  }

  /**
   * Evaluate a FlexibleValue (either fixed or formula-based) with character context
   */
  evaluateFlexibleValue(value: FlexibleValue, character: Character): number {
    if (value.type === "fixed") {
      return value.value;
    } else {
      return this.evaluateFormula(value.expression, character);
    }
  }

  /**
   * Get a preview of what a formula would evaluate to with given character
   */
  previewFormula(
    expression: string,
    character: Character,
  ): { result: number; substituted: string } {
    const cleanedExpression = this.sanitizeExpression(expression);
    const substitutedExpression = this.substituteVariables(cleanedExpression, character);
    const result = this.evaluateFormula(expression, character);

    return { result, substituted: substitutedExpression };
  }
}

export const formulaEvaluatorService = new FormulaEvaluatorService();
