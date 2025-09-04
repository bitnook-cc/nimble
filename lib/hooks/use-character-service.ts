import { useState, useEffect, useCallback } from 'react';
import { Character } from '../types/character';
import { CharacterEventType, CharacterEvent } from '../services/character-service';
import { getCharacterService } from '../services/service-factory';
import { useToastService } from './use-toast-service';

/**
 * Custom hook that provides direct access to character service with automatic re-rendering.
 * Eliminates the need for React Context by subscribing to service changes directly.
 * 
 * This hook provides character state and all character operations including combat actions.
 * Use useDiceActions for dice rolling functionality.
 */
export function useCharacterService() {
  const [character, setCharacter] = useState<Character | null>(null);
  const { showError, showSuccess } = useToastService();
  
  useEffect(() => {
    const characterService = getCharacterService();
    
    // Subscribe to character update events
    const unsubscribeUpdate = characterService.subscribeToEvent('updated', (event) => {
      setCharacter(event.character || null);
    });
    
    const unsubscribeSwitch = characterService.subscribeToEvent('switched', (event) => {
      setCharacter(event.character || null);
    });
    
    const unsubscribeCreate = characterService.subscribeToEvent('created', (event) => {
      setCharacter(event.character || null);
    });
    
    // Initialize with current character
    setCharacter(characterService.getCurrentCharacter());
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeUpdate();
      unsubscribeSwitch();
      unsubscribeCreate();
    };
  }, []);

  // Character lifecycle operations
  const characterService = getCharacterService();

  const switchCharacter = useCallback(async (characterId: string) => {
    try {
      // Load character (this will automatically update settings)
      const newCharacter = await characterService.loadCharacter(characterId);
      return newCharacter;
    } catch (error) {
      console.error("Failed to switch character:", error);
      showError("Failed to switch character", "Unable to load the selected character. Please try again.");
      throw error;
    }
  }, [characterService, showError]);

  const deleteCharacter = useCallback(async (characterId: string) => {
    try {
      await characterService.deleteCharacterById(characterId);
      showSuccess("Character deleted", "Character has been deleted successfully.");
    } catch (error) {
      console.error("Failed to delete character:", error);
      showError("Failed to delete character", "Unable to delete the character. Please try again.");
      throw error;
    }
  }, [characterService, showError, showSuccess]);

  const subscribeToEvent = useCallback((eventType: CharacterEventType, listener: (event: CharacterEvent) => void) => {
    return characterService.subscribeToEvent(eventType, listener);
  }, [characterService]);
  
  return {
    // State
    character,
    
    // Character lifecycle operations
    switchCharacter,
    deleteCharacter,
    subscribeToEvent,
    
    // Service methods - direct access to character operations
    updateCharacter: characterService.updateCharacter.bind(characterService),
    applyDamage: characterService.applyDamage.bind(characterService),
    applyHealing: characterService.applyHealing.bind(characterService),
    applyTemporaryHP: characterService.applyTemporaryHP.bind(characterService),
    updateActionTracker: characterService.updateActionTracker.bind(characterService),
    updateAbilities: characterService.updateAbilities.bind(characterService),
    startEncounter: characterService.startEncounter.bind(characterService),
    endEncounter: characterService.endEncounter.bind(characterService),
    endTurn: characterService.endTurn.bind(characterService),
    performSafeRest: characterService.performSafeRest.bind(characterService),
    performCatchBreath: characterService.performCatchBreath.bind(characterService),
    performMakeCamp: characterService.performMakeCamp.bind(characterService),
    performAttack: characterService.performAttack.bind(characterService),
    performUseAbility: characterService.performUseAbility.bind(characterService),
    updateCharacterConfiguration: characterService.updateCharacterConfiguration.bind(characterService),
    
    // Dynamic stat calculation methods
    getAttributes: characterService.getAttributes.bind(characterService),
    getSkills: characterService.getSkills.bind(characterService),
    getSkillValue: characterService.getSkillValue.bind(characterService),
    getInitiative: characterService.getInitiative.bind(characterService),
    getHitDice: characterService.getHitDice.bind(characterService),
    getMaxWounds: characterService.getMaxWounds.bind(characterService),
    getArmorValue: characterService.getArmorValue.bind(characterService),
    getResourceMaxValue: characterService.getResourceMaxValue.bind(characterService),
    getResourceMinValue: characterService.getResourceMinValue.bind(characterService),
  };
}