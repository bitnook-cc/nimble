import { Character } from "../types/character";
import { getValue as getFlexibleValue } from "../types/flexible-value";
import { ResourceUsageEntry } from "../types/log-entries";
import { ResourceDefinition, ResourceInstance, ResourceResetCondition } from "../types/resources";

/**
 * Resource Service
 * Manages character resources (mana, fury, focus, etc.)
 * Resources are now stored directly on the character with their complete definition.
 */
export class ResourceService {
  /**
   * Get a character's resource by ID
   */
  getResourceInstance(character: Character, resourceId: string): ResourceInstance | null {
    return character.resources.find((r) => r.definition.id === resourceId) || null;
  }

  /**
   * Get all resources for a character
   */
  getActiveResources(character: Character): ResourceInstance[] {
    return character.resources;
  }

  /**
   * Calculate the actual minimum value for a resource definition
   */
  calculateMinValue(definition: ResourceDefinition, character: Character): number {
    return getFlexibleValue(definition.minValue, character);
  }

  /**
   * Calculate the actual maximum value for a resource definition
   */
  calculateMaxValue(definition: ResourceDefinition, character: Character): number {
    return getFlexibleValue(definition.maxValue, character);
  }

  /**
   * Calculate the actual reset value for a resource definition (if applicable)
   */
  calculateResetValue(definition: ResourceDefinition, character: Character): number | undefined {
    if (!definition.resetValue) return undefined;
    return getFlexibleValue(definition.resetValue, character);
  }

  /**
   * Create a resource instance with calculated values based on character
   * Initializes current value based on the resource's reset type
   */
  createResourceInstanceForCharacter(
    definition: ResourceDefinition,
    character: Character,
    current?: number,
    sortOrder?: number,
  ): ResourceInstance {
    if (current !== undefined) {
      return {
        definition,
        current,
        sortOrder: sortOrder ?? 1,
      };
    }

    // Initialize based on reset type
    let initialValue: number;
    switch (definition.resetType) {
      case "to_max":
        initialValue = this.calculateMaxValue(definition, character);
        break;
      case "to_zero":
        initialValue = this.calculateMinValue(definition, character);
        break;
      case "to_default":
        initialValue =
          this.calculateResetValue(definition, character) ||
          this.calculateMaxValue(definition, character); // Default to max if no resetValue specified
        break;
      default:
        initialValue = this.calculateMaxValue(definition, character);
        break;
    }

    return {
      definition,
      current: initialValue,
      sortOrder: sortOrder ?? 1,
    };
  }

  /**
   * Add a resource to a character
   */
  addResourceToCharacter(character: Character, resource: ResourceInstance): ResourceInstance {
    // Check if character already has this resource
    const existing = this.getResourceInstance(character, resource.definition.id);
    if (existing) {
      return existing;
    }

    character.resources.push(resource);
    return resource;
  }

  /**
   * Remove a resource from a character
   */
  removeResourceFromCharacter(character: Character, resourceId: string): boolean {
    const index = character.resources.findIndex((r) => r.definition.id === resourceId);
    if (index === -1) {
      return false;
    }

    character.resources.splice(index, 1);
    return true;
  }

  /**
   * Spend resource points
   */
  spendResource(
    character: Character,
    resourceId: string,
    amount: number,
  ): {
    resourceId: string;
    amount: number;
    type: "spend" | "restore";
    resource: ResourceInstance;
  } | null {
    const resourceInstance = character.resources.find((r) => r.definition.id === resourceId);
    if (!resourceInstance) {
      return null;
    }

    const minValue = this.calculateMinValue(resourceInstance.definition, character);
    const actualAmount = Math.min(amount, resourceInstance.current);
    resourceInstance.current = Math.max(minValue, resourceInstance.current - actualAmount);

    return {
      resourceId,
      amount: actualAmount,
      type: "spend",
      resource: resourceInstance,
    };
  }

  /**
   * Restore resource points
   */
  restoreResource(
    character: Character,
    resourceId: string,
    amount: number,
  ): {
    resourceId: string;
    amount: number;
    type: "spend" | "restore";
    resource: ResourceInstance;
  } | null {
    const resourceInstance = character.resources.find((r) => r.definition.id === resourceId);
    if (!resourceInstance) {
      return null;
    }

    const maxValue = this.calculateMaxValue(resourceInstance.definition, character);
    const actualAmount = Math.min(amount, maxValue - resourceInstance.current);
    resourceInstance.current = Math.min(maxValue, resourceInstance.current + actualAmount);

    return {
      resourceId,
      amount: actualAmount,
      type: "restore",
      resource: resourceInstance,
    };
  }

  /**
   * Set resource to a specific value
   */
  setResource(character: Character, resourceId: string, value: number): boolean {
    const resourceInstance = character.resources.find((r) => r.definition.id === resourceId);
    if (!resourceInstance) {
      return false;
    }

    const minValue = this.calculateMinValue(resourceInstance.definition, character);
    const maxValue = this.calculateMaxValue(resourceInstance.definition, character);
    resourceInstance.current = Math.max(minValue, Math.min(value, maxValue));
    return true;
  }

  /**
   * Reset resources based on condition
   */
  resetResourcesByCondition(
    character: Character,
    condition: ResourceResetCondition,
  ): {
    resourceId: string;
    amount: number;
    type: "spend" | "restore";
    resource: ResourceInstance;
  }[] {
    const entries: {
      resourceId: string;
      amount: number;
      type: "spend" | "restore";
      resource: ResourceInstance;
    }[] = [];

    for (const resourceInstance of character.resources) {
      if (resourceInstance.definition.resetCondition !== condition) continue;

      let newValue: number;

      switch (resourceInstance.definition.resetType) {
        case "to_max":
          newValue = this.calculateMaxValue(resourceInstance.definition, character);
          break;
        case "to_zero":
          newValue = this.calculateMinValue(resourceInstance.definition, character);
          break;
        case "to_default":
          newValue =
            this.calculateResetValue(resourceInstance.definition, character) ||
            this.calculateMaxValue(resourceInstance.definition, character); // Default to max if no resetValue specified
          break;
        default:
          continue;
      }

      if (resourceInstance.current !== newValue) {
        const amount = Math.abs(newValue - resourceInstance.current);
        const type = newValue > resourceInstance.current ? "restore" : "spend";

        resourceInstance.current = newValue;

        entries.push({
          resourceId: resourceInstance.definition.id,
          amount,
          type,
          resource: resourceInstance,
        });
      }
    }

    return entries;
  }

  /**
   * Reset resources on safe rest
   */
  resetResourcesOnSafeRest(character: Character) {
    return this.resetResourcesByCondition(character, "safe_rest");
  }

  /**
   * Reset resources on encounter end
   */
  resetResourcesOnEncounterEnd(character: Character) {
    return this.resetResourcesByCondition(character, "encounter_end");
  }

  /**
   * Reset resources on turn end
   */
  resetResourcesOnTurnEnd(character: Character) {
    return this.resetResourcesByCondition(character, "turn_end");
  }

  /**
   * Create a log entry for resource usage
   */
  createResourceLogEntry(
    entry: {
      resourceId: string;
      amount: number;
      type: "spend" | "restore";
      resource: ResourceInstance;
    },
    character: Character,
  ): ResourceUsageEntry {
    const maxValue = this.calculateMaxValue(entry.resource.definition, character);
    return {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type: "resource",
      resourceId: entry.resourceId,
      resourceName: entry.resource.definition.name,
      amount: entry.amount,
      action: entry.type === "spend" ? "spent" : "restored",
      currentAmount: entry.resource.current,
      maxAmount: maxValue,
      description: `${entry.type === "spend" ? "Spent" : "Restored"} ${entry.amount} ${entry.resource.definition.name}`,
    };
  }
}

export const resourceService = new ResourceService();
