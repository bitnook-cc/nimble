import { z } from "zod";

// Schema with metadata for use in class definitions
const fixedValueSchema = z.object({
  type: z.literal("fixed").meta({ title: "Fixed Value", description: "Fixed numeric value" }),
  value: z.number().int().min(0).meta({ title: "Value", description: "Numeric value (integer)" }),
});

const formulaValueSchema = z.object({
  type: z.literal("formula").meta({ title: "Formula Value", description: "Formula-based value" }),
  expression: z
    .string()
    .min(1)
    .max(100)
    .meta({ title: "Expression", description: 'Formula expression (e.g., "DEX + WIL + 1")' }),
});

export const flexibleValueSchema = z
  .discriminatedUnion("type", [fixedValueSchema, formulaValueSchema])
  .meta({ title: "Flexible Value", description: "Value that can be fixed or formula-based" });

// Export inferred types
export type FixedValue = z.infer<typeof fixedValueSchema>;
export type FormulaValue = z.infer<typeof formulaValueSchema>;
export type FlexibleValue = z.infer<typeof flexibleValueSchema>;
