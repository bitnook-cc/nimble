import { AttributeName } from "../schemas/character";
import { getCharacterService } from "../services/service-factory";
import { getClassService } from "../services/service-factory";

/**
 * Common utilities for formula evaluation and dice formula processing
 */

// Regex patterns for validation
export const OPERATOR_REGEX = /^[+\-*/\(\)0-9\s]+$/;
export const DICE_NOTATION_REGEX = /\b(\d+)?d(\d+)([!v]+)?\b/gi;

// Dangerous patterns that should be rejected for security
const DANGEROUS_PATTERNS = [
  /[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/, // function calls
  /\[|\]/, // array access
  /\{|\}/, // object access
  /;|:/, // statement separators
  /=/, // assignment
  /\.|`/, // property access or template literals
];

/**
 * Clean and validate a formula expression for safety
 * @param expression The expression to sanitize
 * @returns The cleaned expression
 * @throws Error if dangerous patterns are detected
 */
export function sanitizeExpression(expression: string): string {
  // Remove extra whitespace
  let cleaned = expression.replace(/\s+/g, " ").trim();

  // Convert variables to uppercase while preserving 'd' in dice notation and postfixes
  // First, protect dice notation by temporarily replacing it
  const dicePattern = /(\d+)?d(\d+)([!v]+)?/gi;
  const diceMatches: Array<{ match: string; index: number }> = [];
  let match;
  while ((match = dicePattern.exec(cleaned)) !== null) {
    // Keep dice notation with lowercase 'd' and lowercase postfixes
    const diceNotation = match[0].toLowerCase();
    diceMatches.push({ match: diceNotation, index: match.index });
  }

  // Convert everything to uppercase
  cleaned = cleaned.toUpperCase();

  // Restore dice notation with lowercase 'd'
  for (let i = diceMatches.length - 1; i >= 0; i--) {
    const dice = diceMatches[i];
    cleaned =
      cleaned.substring(0, dice.index) +
      dice.match +
      cleaned.substring(dice.index + dice.match.length);
  }

  // Check for obviously malicious patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(cleaned)) {
      throw new Error(`Potentially unsafe pattern detected: ${pattern}`);
    }
  }

  return cleaned;
}

/**
 * Replace attribute names and keywords with their numeric values
 * @param expression The expression with variables to substitute
 * @returns The expression with variables replaced
 * @throws Error if no character is available for substitution
 */
export function substituteVariables(expression: string): string {
  const characterService = getCharacterService();
  const character = characterService.getCurrentCharacter();

  if (!character) {
    throw new Error("No character available for variable substitution");
  }

  let result = expression;

  // Get attributes with stat boosts from character service
  const attributes = characterService.getAttributes();

  // Map of variable names to attribute names
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

  // Replace attribute names (case-insensitive)
  for (const [key, attributeName] of Object.entries(attributeMap)) {
    const value = attributes[attributeName];
    // Use word boundaries to avoid partial matches
    result = result.replace(new RegExp(`\\b${key}\\b`, "g"), value.toString());
  }

  // Replace KEY with the highest key attribute value
  const classService = getClassService();
  const characterClass = classService.getCharacterClass(character);
  if (characterClass && characterClass.keyAttributes && characterClass.keyAttributes.length > 0) {
    const keyAttributeValues = characterClass.keyAttributes.map((attr) => attributes[attr]);
    const highestKeyValue = Math.max(...keyAttributeValues);
    result = result.replace(/\bKEY\b/g, highestKeyValue.toString());
  }

  // Replace level keywords
  result = result.replace(/\bLEVEL\b/g, character.level.toString());
  result = result.replace(/\bLVL\b/g, character.level.toString());

  return result;
}

/**
 * Replace attribute names with support for dice notation (e.g., STRd6) and math expressions (e.g., 2d6 + STR)
 * Handles variables that appear:
 * - Before 'd' in dice notation (STRd6)
 * - As standalone terms in expressions (2d6 + STR)
 * @param expression The expression with variables to substitute
 * @returns Object with substituted expression and whether variables were found
 */
export function substituteVariablesForDice(expression: string): {
  substituted: string;
  hasVariables: boolean;
} {
  const characterService = getCharacterService();
  const character = characterService.getCurrentCharacter();

  if (!character) {
    return { substituted: expression, hasVariables: false };
  }

  let result = expression;
  let hasVariables = false;

  // Get attributes with stat boosts
  const attributes = characterService.getAttributes();

  // Map of variable names to attribute names
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
    // 2. At a word boundary (for regular math like STR + 2 or 2d6 + STR)
    const regex = new RegExp(`\\b${key}(?=d\\d+)|\\b${key}\\b`, "gi");
    if (regex.test(result)) {
      hasVariables = true;
      result = result.replace(regex, value.toString());
    }
  }

  // Replace KEY with the highest key attribute value
  const classService = getClassService();
  const characterClass = classService.getCharacterClass(character);
  if (characterClass && characterClass.keyAttributes && characterClass.keyAttributes.length > 0) {
    const keyAttributeValues = characterClass.keyAttributes.map((attr) => attributes[attr]);
    const highestKeyValue = Math.max(...keyAttributeValues);
    // Handle KEY in dice notation (KEYd6) or as standalone
    const keyRegex = /\bKEY(?=d\d+)|\bKEY\b/gi;
    if (keyRegex.test(result)) {
      hasVariables = true;
      result = result.replace(keyRegex, highestKeyValue.toString());
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
 * Safely evaluate a mathematical expression using Function constructor
 * This is safer than eval() as it doesn't have access to the global scope
 * @param expression The mathematical expression to evaluate
 * @returns The numeric result
 * @throws Error if evaluation fails or result is not a finite number
 */
export function safeEvaluate(expression: string): number {
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
 * Validate a dice formula for syntax and safety
 * @param formula The dice formula to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateDiceFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: "Formula cannot be empty" };
  }

  try {
    // Step 1: Clean the formula
    const cleaned = sanitizeExpression(formula);

    // Step 2: Check for dice notation (create new regex to avoid lastIndex issues)
    const hasDice = /\b(\d+)?d(\d+)([!v]+)?\b/gi.test(cleaned);
    if (!hasDice) {
      return {
        valid: false,
        error: "Formula must contain at least one dice notation (e.g., 1d20, 2d6, 1d6!, 1d4v)",
      };
    }

    // Step 3: Validate dice types and postfixes
    const diceMatches = [...cleaned.matchAll(/\b(\d+)?d(\d+)([!v]+)?\b/gi)];
    const validDiceTypes = [4, 6, 8, 10, 12, 20, 44, 66, 88, 100];

    for (const match of diceMatches) {
      const sides = parseInt(match[2]);
      if (!validDiceTypes.includes(sides)) {
        return {
          valid: false,
          error: `Invalid dice type d${sides}. Valid types: d4, d6, d8, d10, d12, d20, d44, d66, d88, d100`,
        };
      }

      const count = match[1] ? parseInt(match[1]) : 1;
      if (count <= 0 || count > 20) {
        return {
          valid: false,
          error: `Invalid dice count ${count}. Must be between 1 and 20`,
        };
      }
    }

    // Step 4: Replace dice and variables with numbers for syntax check
    let testExpression = cleaned;

    // Replace dice notation (including postfixes) with a number
    testExpression = testExpression.replace(/\b(\d+)?d(\d+)([!v]+)?\b/gi, "1");

    // Replace known variables with numbers
    const variables = [
      "STR",
      "STRENGTH",
      "DEX",
      "DEXTERITY",
      "INT",
      "INTELLIGENCE",
      "WIL",
      "WILL",
      "KEY",
      "LEVEL",
      "LVL",
    ];
    for (const variable of variables) {
      testExpression = testExpression.replace(new RegExp(`\\b${variable}\\b`, "gi"), "1");
    }

    // Step 5: Check if only valid characters remain
    if (!OPERATOR_REGEX.test(testExpression)) {
      return { valid: false, error: "Formula contains invalid characters or unknown variables" };
    }

    // Step 6: Try to evaluate the test expression to check syntax
    try {
      safeEvaluate(testExpression);
    } catch (error) {
      return { valid: false, error: "Invalid mathematical expression syntax" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
}

/**
 * Get list of supported variables for dice formulas
 */
export function getSupportedVariables(): string[] {
  return [
    "STR",
    "STRENGTH",
    "DEX",
    "DEXTERITY",
    "INT",
    "INTELLIGENCE",
    "WIL",
    "WILL",
    "KEY",
    "LEVEL",
    "LVL",
  ];
}

/**
 * Get example dice formulas for UI hints
 */
export function getExampleFormulas(): string[] {
  return [
    "1d20+5",
    "2d6+STR",
    "STRd6",
    "1d8+LEVEL+2",
    "(2d4+1)*2",
    "3d6+DEX",
    "1d12+STR*2",
    "1d20+KEY",
    "1d6!",
    "1d4v",
    "1d8!v",
  ];
}
