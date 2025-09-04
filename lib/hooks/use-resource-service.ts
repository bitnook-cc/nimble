import { useCallback } from 'react';
import { resourceService } from '../services/resource-service';
import { useCharacterService } from './use-character-service';
import { useActivityLog } from './use-activity-log';

/**
 * Custom hook that provides direct access to resource management functionality.
 * Eliminates the need for React Context by using services directly.
 */
export function useResourceService() {
  const { character, updateCharacter } = useCharacterService();
  const { addLogEntry } = useActivityLog();

  const spendResource = useCallback(async (resourceId: string, amount: number) => {
    if (!character) return;

    const usage = resourceService.spendResource(character, resourceId, amount);
    if (usage) {
      await updateCharacter({ ...character });
      
      // Log the resource usage
      const logEntry = resourceService.createResourceLogEntry(usage, character);
      await addLogEntry(logEntry);
    }
  }, [character, updateCharacter, addLogEntry]);

  const restoreResource = useCallback(async (resourceId: string, amount: number) => {
    if (!character) return;

    const usage = resourceService.restoreResource(character, resourceId, amount);
    if (usage) {
      await updateCharacter({ ...character });
      
      // Log the resource usage
      const logEntry = resourceService.createResourceLogEntry(usage, character);
      await addLogEntry(logEntry);
    }
  }, [character, updateCharacter, addLogEntry]);

  const setResource = useCallback(async (resourceId: string, value: number) => {
    if (!character) return;

    const success = resourceService.setResource(character, resourceId, value);
    if (success) {
      await updateCharacter({ ...character });
    }
  }, [character, updateCharacter]);

  const addResourceToCharacter = useCallback(async (resource: import('../types/resources').ResourceInstance) => {
    if (!character) return;

    resourceService.addResourceToCharacter(character, resource);
    await updateCharacter({ ...character });
  }, [character, updateCharacter]);

  const removeResourceFromCharacter = useCallback(async (resourceId: string) => {
    if (!character) return;

    const success = resourceService.removeResourceFromCharacter(character, resourceId);
    if (success) {
      await updateCharacter({ ...character });
    }
  }, [character, updateCharacter]);

  const resetResourcesOnSafeRest = useCallback(async () => {
    if (!character) return;

    const entries = resourceService.resetResourcesOnSafeRest(character);
    if (entries.length > 0) {
      await updateCharacter({ ...character });
      
      // Log all resource resets
      for (const entry of entries) {
        const logEntry = resourceService.createResourceLogEntry(entry, character);
        await addLogEntry(logEntry);
      }
    }
  }, [character, updateCharacter, addLogEntry]);

  const resetResourcesOnEncounterEnd = useCallback(async () => {
    if (!character) return;

    const entries = resourceService.resetResourcesOnEncounterEnd(character);
    if (entries.length > 0) {
      await updateCharacter({ ...character });
      
      // Log all resource resets
      for (const entry of entries) {
        const logEntry = resourceService.createResourceLogEntry(entry, character);
        await addLogEntry(logEntry);
      }
    }
  }, [character, updateCharacter, addLogEntry]);

  const resetResourcesOnTurnEnd = useCallback(async () => {
    if (!character) return;

    const entries = resourceService.resetResourcesOnTurnEnd(character);
    if (entries.length > 0) {
      await updateCharacter({ ...character });
      
      // Log all resource resets
      for (const entry of entries) {
        const logEntry = resourceService.createResourceLogEntry(entry, character);
        await addLogEntry(logEntry);
      }
    }
  }, [character, updateCharacter, addLogEntry]);

  return {
    // State
    character,
    resources: character?.resources || [],
    activeResources: character ? resourceService.getActiveResources(character) : [],
    
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
    getResourceInstance: (resourceId: string) => 
      character ? resourceService.getResourceInstance(character, resourceId) : null,
  };
}