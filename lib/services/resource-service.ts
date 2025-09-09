import { calculateFlexibleValue } from "../types/flexible-value";
import { 
  ResourceDefinition, 
  ResourceResetCondition,
  ResourceValue,
  NumericalResourceValue 
} from "../schemas/resources";

/**
 * Resource Service - Handles resource calculations and manipulations
 * Works with the new dynamic resource model where definitions and values are separate
 * Returns new maps instead of mutating existing ones
 */
export class ResourceService {
  /**
   * Calculate the actual minimum value for a resource definition
   */
  calculateMinValue(definition: ResourceDefinition): number {
    return calculateFlexibleValue(definition.minValue);
  }

  /**
   * Calculate the actual maximum value for a resource definition
   */
  calculateMaxValue(definition: ResourceDefinition): number {
    return calculateFlexibleValue(definition.maxValue);
  }

  /**
   * Calculate the actual reset value for a resource definition (if applicable)
   */
  private calculateResetValue(definition: ResourceDefinition): number | undefined {
    if (!definition.resetValue) return undefined;
    return calculateFlexibleValue(definition.resetValue);
  }

  /**
   * Calculate the initial value for a resource based on its reset type
   */
  calculateInitialValue(definition: ResourceDefinition): number {
    switch (definition.resetType) {
      case "to_max":
        return this.calculateMaxValue(definition);
      case "to_zero":
        return this.calculateMinValue(definition);
      case "to_default":
        return this.calculateResetValue(definition) ?? 
               this.calculateMaxValue(definition);
      default:
        return this.calculateMaxValue(definition);
    }
  }

  /**
   * Calculate the reset value for a resource based on its reset type
   */
  calculateResetTargetValue(definition: ResourceDefinition): number {
    switch (definition.resetType) {
      case "to_max":
        return this.calculateMaxValue(definition);
      case "to_zero":
        return this.calculateMinValue(definition);
      case "to_default":
        return this.calculateResetValue(definition) ?? 
               this.calculateMaxValue(definition);
      default:
        return this.calculateMaxValue(definition);
    }
  }

  /**
   * Create a numerical resource value
   */
  createNumericalValue(value: number): NumericalResourceValue {
    return {
      type: "numerical",
      value
    };
  }

  /**
   * Get the numerical value from a ResourceValue
   * Returns 0 if the value is not numerical or undefined
   */
  getNumericalValue(resourceValue: ResourceValue | undefined): number {
    if (!resourceValue) return 0;
    if (resourceValue.type === "numerical") {
      return resourceValue.value;
    }
    return 0;
  }

  /**
   * Set a resource value with min/max clamping
   * Returns a new ResourceValue object
   */
  setResourceValue(
    definition: ResourceDefinition,
    newValue: number
  ): ResourceValue {
    const minValue = this.calculateMinValue(definition);
    const maxValue = this.calculateMaxValue(definition);
    const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));
    
    return this.createNumericalValue(clampedValue);
  }

  /**
   * Reset resources based on a condition
   * Also resets resources with "smaller" conditions (safe_rest > encounter_end > turn_end)
   * Returns a new Map with updated values
   */
  resetResourcesByCondition(
    resourceDefinitions: ResourceDefinition[],
    currentValues: Map<string, ResourceValue>,
    condition: ResourceResetCondition
  ): Map<string, ResourceValue> {
    const newValues = new Map(currentValues);
    
    // Define the hierarchy of reset conditions
    const conditionHierarchy: ResourceResetCondition[] = ["turn_end", "encounter_end", "safe_rest"];
    const conditionIndex = conditionHierarchy.indexOf(condition);
    
    for (const definition of resourceDefinitions) {
      // Reset if the resource's condition matches or is "smaller" (earlier in hierarchy)
      const resourceConditionIndex = conditionHierarchy.indexOf(definition.resetCondition);
      
      // Reset if:
      // 1. Exact match
      // 2. Resource condition is earlier in hierarchy (smaller scope)
      // 3. Skip if condition is "never" or "manual"
      if (definition.resetCondition === condition || 
          (conditionIndex >= 0 && resourceConditionIndex >= 0 && resourceConditionIndex <= conditionIndex)) {
        const targetValue = this.calculateResetTargetValue(definition);
        newValues.set(definition.id, this.createNumericalValue(targetValue));
      }
    }
    
    return newValues;
  }

  /**
   * Reset all resources to their initial values
   * Returns a new Map with all resources at initial values
   */
  resetAllResources(
    resourceDefinitions: ResourceDefinition[]
  ): Map<string, ResourceValue> {
    const newValues = new Map<string, ResourceValue>();
    
    for (const definition of resourceDefinitions) {
      const initialValue = this.calculateInitialValue(definition);
      newValues.set(definition.id, this.createNumericalValue(initialValue));
    }
    
    return newValues;
  }

  /**
   * Spend resource (subtract amount)
   * Returns a new Map with the updated value
   */
  spendResource(
    resourceId: string,
    amount: number,
    definition: ResourceDefinition,
    currentValues: Map<string, ResourceValue>
  ): Map<string, ResourceValue> {
    const newValues = new Map(currentValues);
    const currentValue = this.getNumericalValue(currentValues.get(resourceId));
    const newValue = currentValue - amount;
    
    newValues.set(
      resourceId, 
      this.setResourceValue(definition, newValue)
    );
    
    return newValues;
  }

  /**
   * Restore resource (add amount)
   * Returns a new Map with the updated value
   */
  restoreResource(
    resourceId: string,
    amount: number,
    definition: ResourceDefinition,
    currentValues: Map<string, ResourceValue>
  ): Map<string, ResourceValue> {
    const newValues = new Map(currentValues);
    const currentValue = this.getNumericalValue(currentValues.get(resourceId));
    const newValue = currentValue + amount;
    
    newValues.set(
      resourceId,
      this.setResourceValue(definition, newValue)
    );
    
    return newValues;
  }

  /**
   * Update a single resource value
   * Returns a new Map with the updated value
   */
  updateResourceValue(
    resourceId: string,
    value: number,
    definition: ResourceDefinition,
    currentValues: Map<string, ResourceValue>
  ): Map<string, ResourceValue> {
    const newValues = new Map(currentValues);
    newValues.set(
      resourceId,
      this.setResourceValue(definition, value)
    );
    return newValues;
  }
}

export const resourceService = new ResourceService();