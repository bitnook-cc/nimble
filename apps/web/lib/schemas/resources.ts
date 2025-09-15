import { z } from "zod";

import { ICON_IDS } from "../utils/icon-utils";
import { flexibleValueSchema } from "./flexible-value";

// Resource value schema - consolidating numerical resources
const resourceValueSchema = z.object({
  type: z.literal("numerical"),
  value: z.number(),
});

// Resource reset condition schema
const resourceResetConditionSchema = z.enum([
  "safe_rest",
  "encounter_end",
  "turn_end",
  "never",
  "manual",
]);

// Resource reset type schema
const resourceResetTypeSchema = z.enum(["to_max", "to_zero", "to_default"]);

// Resource definition schema with metadata for content management
export const resourceDefinitionSchema = z.object({
  id: z.string().min(1).meta({ title: "ID", description: "Unique identifier for the resource" }),
  name: z.string().min(1).meta({ title: "Name", description: "Display name of the resource" }),
  description: z
    .string()
    .optional()
    .meta({ title: "Description", description: "Optional description of the resource" }),
  colorScheme: z
    .string()
    .min(1)
    .meta({ title: "Color Scheme", description: "Color scheme ID (e.g., blue-magic, red-fury)" }),
  icon: z
    .enum(ICON_IDS as [string, ...string[]])
    .optional()
    .meta({ title: "Icon", description: "Icon identifier (e.g., sparkles, flame, gem)" }),
  resetCondition: resourceResetConditionSchema.meta({
    title: "Reset Condition",
    description: "When this resource resets",
  }),
  resetType: resourceResetTypeSchema.meta({
    title: "Reset Type",
    description: "How this resource resets",
  }),
  resetValue: flexibleValueSchema
    .optional()
    .meta({ title: "Reset Value", description: "Value to reset to (for to_default reset type)" }),
  minValue: flexibleValueSchema.meta({
    title: "Minimum Value",
    description: "Minimum value for this resource",
  }),
  maxValue: flexibleValueSchema.meta({
    title: "Maximum Value",
    description: "Maximum value for this resource",
  }),
});

// Resource instance schema
export const resourceInstanceSchema = z.object({
  definition: resourceDefinitionSchema,
  current: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
});

// Export inferred types
export type ResourceValue = z.infer<typeof resourceValueSchema>;
export type ResourceResetCondition = z.infer<typeof resourceResetConditionSchema>;
export type ResourceResetType = z.infer<typeof resourceResetTypeSchema>;
export type ResourceDefinition = z.infer<typeof resourceDefinitionSchema>;
export type ResourceInstance = z.infer<typeof resourceInstanceSchema>;
