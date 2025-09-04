import { z } from 'zod';

// Shared schema for FlexibleValue type
export const fixedValueSchema = z.object({
  type: z.literal('fixed'),
  value: z.number().int().min(0),
});

export const formulaValueSchema = z.object({
  type: z.literal('formula'),
  expression: z.string().min(1).max(100), // Reasonable limit for formula expressions
});

export const flexibleValueSchema = z.discriminatedUnion('type', [
  fixedValueSchema,
  formulaValueSchema,
]);

// Schema with metadata for use in class definitions
export const fixedValueWithMetaSchema = z.object({
  type: z.literal('fixed').meta({ title: 'Fixed Value', description: 'Fixed numeric value' }),
  value: z.number().int().min(0).meta({ title: 'Value', description: 'Numeric value (integer)' }),
});

export const formulaValueWithMetaSchema = z.object({
  type: z.literal('formula').meta({ title: 'Formula Value', description: 'Formula-based value' }),
  expression: z.string().min(1).max(100).meta({ title: 'Expression', description: 'Formula expression (e.g., "DEX + WIL + 1")' }),
});

export const flexibleValueWithMetaSchema = z.discriminatedUnion('type', [
  fixedValueWithMetaSchema,
  formulaValueWithMetaSchema,
]).meta({ title: 'Flexible Value', description: 'Value that can be fixed or formula-based' });