/**
 * Generic Resource System Types
 *
 * Replaces the hardcoded mana system with a flexible resource system
 * that can handle mana, fury, focus, energy, etc.
 *
 * Separates pure resource definitions from runtime instance state.
 * Supports both fixed and formula-based min/max values.
 */
import { createFixedValue } from "./flexible-value";
import type {
  NumericalResourceValue,
  ResourceValue,
  ResourceResetCondition,
  ResourceResetType,
  ResourceDefinition,
  ResourceInstance,
} from "../schemas/resources";

// Re-export types for backward compatibility
export type {
  NumericalResourceValue,
  ResourceValue,
  ResourceResetCondition,
  ResourceResetType,
  ResourceDefinition,
  ResourceInstance,
};

// Helper function to create a ResourceInstance from a ResourceDefinition
// Note: For formula-based max values, you'll need to use ResourceService.calculateMaxValue with a character
export function createResourceInstance(
  definition: ResourceDefinition,
  current?: number,
  sortOrder?: number,
): ResourceInstance {
  return {
    definition,
    current: current ?? (definition.maxValue.type === "fixed" ? definition.maxValue.value : 0),
    sortOrder: sortOrder ?? 1,
  };
}

// Default resource definitions for character creation
export const DEFAULT_RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    id: "mana",
    name: "Mana",
    description: "Magical energy used to cast spells",
    colorScheme: "blue-magic",
    icon: "sparkles",
    resetCondition: "safe_rest",
    resetType: "to_max",
    minValue: createFixedValue(0),
    maxValue: createFixedValue(10),
  },
];
