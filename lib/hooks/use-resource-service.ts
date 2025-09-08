import { useCallback } from "react";

import { getCharacterService } from "../services/service-factory";
import { ResourceDefinition, ResourceInstance } from "../schemas/resources";
import { useActivityLog } from "./use-activity-log";
import { useCharacterService } from "./use-character-service";

/**
 * Custom hook that provides direct access to resource management functionality.
 * Eliminates the need for React Context by using services directly.
 */
export function useResourceService() {
  const { character } = useCharacterService();
  const { addLogEntry } = useActivityLog();
  const characterService = getCharacterService();

  const spendResource = useCallback(
    async (resourceId: string, amount: number) => {
      if (!character) return;

      const currentValue = characterService.getResourceValue(resourceId);
      const newValue = Math.max(0, currentValue - amount);
      await characterService.setResourceValue(resourceId, newValue);

      // Log the resource usage
      const resource = characterService.getResourceDefinitions().find(r => r.id === resourceId);
      if (resource) {
        const maxValue = characterService.getResourceMaxValue(resourceId);
        const logEntry = {
          id: `log-${Date.now()}`,
          type: "resource" as const,
          timestamp: new Date(),
          description: `Spent ${amount} ${resource.name}`,
          resourceId: resourceId,
          resourceName: resource.name,
          amount: amount,
          action: "spent" as const,
          currentAmount: newValue,
          maxAmount: maxValue,
        };
        await addLogEntry(logEntry);
      }
    },
    [character, characterService, addLogEntry],
  );

  const restoreResource = useCallback(
    async (resourceId: string, amount: number) => {
      if (!character) return;

      const currentValue = characterService.getResourceValue(resourceId);
      const maxValue = characterService.getResourceMaxValue(resourceId);
      const newValue = Math.min(maxValue, currentValue + amount);
      await characterService.setResourceValue(resourceId, newValue);

      // Log the resource usage
      const resource = characterService.getResourceDefinitions().find(r => r.id === resourceId);
      if (resource) {
        const logEntry = {
          id: `log-${Date.now()}`,
          type: "resource" as const,
          timestamp: new Date(),
          description: `Restored ${amount} ${resource.name}`,
          resourceId: resourceId,
          resourceName: resource.name,
          amount: amount,
          action: "restored" as const,
          currentAmount: newValue,
          maxAmount: maxValue,
        };
        await addLogEntry(logEntry);
      }
    },
    [character, characterService, addLogEntry],
  );

  const setResource = useCallback(
    async (resourceId: string, value: number) => {
      if (!character) return;
      await characterService.setResourceValue(resourceId, value);
    },
    [character, characterService],
  );

  // These methods are no longer needed with the new dynamic system
  // Resources are managed through the character service
  const addResourceToCharacter = useCallback(
    async (resource: ResourceInstance) => {
      // Resources are now added through effects, not directly
      console.warn("addResourceToCharacter is deprecated - resources are managed through effects");
    },
    [],
  );

  const removeResourceFromCharacter = useCallback(
    async (resourceId: string) => {
      // Resources are now removed through effects, not directly
      console.warn("removeResourceFromCharacter is deprecated - resources are managed through effects");
    },
    [],
  );

  // Reset methods are handled by the character service
  const resetResourcesOnSafeRest = useCallback(async () => {
    // This is now handled in performSafeRest
    if (character) {
      await characterService.performSafeRest();
    }
  }, [character, characterService]);

  const resetResourcesOnEncounterEnd = useCallback(async () => {
    // This is now handled in endEncounter
    if (character) {
      await characterService.endEncounter();
    }
  }, [character, characterService]);

  const resetResourcesOnTurnEnd = useCallback(async () => {
    // This is now handled in endTurn
    if (character) {
      await characterService.endTurn();
    }
  }, [character, characterService]);

  // Get resources from character service
  const resources = character ? characterService.getResources() : [];
  const activeResources = resources.filter(r => r.current !== 0 || r.definition.resetCondition !== "never");

  return {
    // State
    character,
    resources,
    activeResources,

    // Resource management
    spendResource,
    restoreResource,
    setResource,
    addResourceToCharacter,
    removeResourceFromCharacter,

    // Reset functions
    resetResourcesOnSafeRest,
    resetResourcesOnEncounterEnd,
    resetResourcesOnTurnEnd,

    // Utility functions
    getResourceInstance: (resourceId: string): ResourceInstance | undefined =>
      resources.find(r => r.definition.id === resourceId),
  };
}