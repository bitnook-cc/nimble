import { useCallback } from "react";

import { ResourceDefinition, ResourceInstance } from "../schemas/resources";
import { getCharacterService } from "../services/service-factory";
import { useCharacterService } from "./use-character-service";

/**
 * Custom hook that provides direct access to resource management functionality.
 * Eliminates the need for React Context by using services directly.
 */
export function useResourceService() {
  const { character } = useCharacterService();
  const characterService = getCharacterService();

  const spendResource = useCallback(
    async (resourceId: string, amount: number) => {
      if (!character) return;
      // Delegate to character service which handles logging
      await characterService.spendResource(resourceId, amount);
    },
    [character, characterService],
  );

  const restoreResource = useCallback(
    async (resourceId: string, amount: number) => {
      if (!character) return;
      // Delegate to character service which handles logging
      await characterService.restoreResource(resourceId, amount);
    },
    [character, characterService],
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
  const addResourceToCharacter = useCallback(async (resource: ResourceInstance) => {
    // Resources are now added through traits, not directly
    console.warn("addResourceToCharacter is deprecated - resources are managed through traits");
  }, []);

  const removeResourceFromCharacter = useCallback(async (resourceId: string) => {
    // Resources are now removed through traits, not directly
    console.warn(
      "removeResourceFromCharacter is deprecated - resources are managed through traits",
    );
  }, []);

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
  const activeResources = resources.filter(
    (r) => r.current !== 0 || r.definition.resetCondition !== "never",
  );

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
      resources.find((r) => r.definition.id === resourceId),
  };
}
