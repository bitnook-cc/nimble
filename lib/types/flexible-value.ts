/**
 * Generic flexible value system for numbers that can be either fixed or formula-based
 * Used for ability max uses, resource min/max values, and other dynamic calculations
 */

import type { Character } from './character';
import { formulaEvaluatorService } from '../services/formula-evaluator-service';

export interface FixedValue {
  type: 'fixed';
  value: number;
}

export interface FormulaValue {
  type: 'formula';
  expression: string; // e.g., "DEX + WIL + 1", "STR * 2", "level + 3"
}

export type FlexibleValue = FixedValue | FormulaValue;

// Helper functions for working with FlexibleValue
export function createFixedValue(value: number): FixedValue {
  return { type: 'fixed', value };
}

export function createFormulaValue(expression: string): FormulaValue {
  return { type: 'formula', expression };
}

/**
 * Get the computed value from a FlexibleValue
 */
export function getValue(flexibleValue: FlexibleValue, character?: Character): number {
  if (flexibleValue.type === 'fixed') {
    return flexibleValue.value;
  } else {
    if (!character) {
      throw new Error('Character is required to evaluate formula values');
    }
    return formulaEvaluatorService.evaluateFormula(flexibleValue.expression, character);
  }
}

/**
 * Get the formula representation of a FlexibleValue
 */
export function getFormula(flexibleValue: FlexibleValue): string {
  if (flexibleValue.type === 'fixed') {
    return flexibleValue.value.toString();
  } else {
    return flexibleValue.expression;
  }
}

export function isFixedValue(value: FlexibleValue): value is FixedValue {
  return value.type === 'fixed';
}

export function isFormulaValue(value: FlexibleValue): value is FormulaValue {
  return value.type === 'formula';
}