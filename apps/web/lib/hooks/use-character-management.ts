import { useEffect, useState } from "react";

import { Character } from "@/lib/schemas/character";
import {
  getCharacterCreation,
  getCharacterService,
  getCharacterStorage,
  getSettingsService,
} from "@/lib/services/service-factory";
import { AppSettings } from "@/lib/services/settings-service";

import { useCharacterService } from "./use-character-service";
import { useToastService } from "./use-toast-service";

export interface UseCharacterManagementReturn {
  characters: Character[];
  settings: AppSettings;
  isLoaded: boolean;
  loadError: string | null;
  showCharacterSelection: boolean;
  handleSettingsChange: (settings: AppSettings) => Promise<void>;
}

export function useCharacterManagement(): UseCharacterManagementReturn {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ activeCharacterId: undefined });
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);

  // Get services from the factory (services are singletons, safe to call directly)
  const characterStorage = getCharacterStorage();
  const characterCreation = getCharacterCreation();
  const settingsService = getSettingsService();

  // Get toast notifications and character service
  const { showError } = useToastService();
  const { subscribeToEvent } = useCharacterService();

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load settings
        const loadedSettings = await settingsService.getSettings();
        setSettings(loadedSettings);

        // Load character list
        const characterList = await characterStorage.getAllCharacters();
        setCharacters(characterList);

        // Check if we need to show character selection
        if (characterList.length === 0) {
          setShowCharacterSelection(true);
          setLoadError("No characters found. Please create your first character.");
        } else {
          // Load active character through CharacterService
          const characterService = getCharacterService();
          let activeCharacter = null;

          // Only try to load if we have an active character ID
          if (loadedSettings.activeCharacterId) {
            activeCharacter = await characterService.loadCharacter(
              loadedSettings.activeCharacterId,
            );
          }

          if (!activeCharacter) {
            // Use the first available character instead
            try {
              const firstCharacter = characterList[0];
              activeCharacter = await characterService.loadCharacter(firstCharacter.id);

              if (!activeCharacter) {
                throw new Error("Failed to load first available character");
              }
            } catch (initError) {
              console.error("Failed to load first character:", initError);
              setShowCharacterSelection(true);
              setLoadError("Failed to load character. Please select or create a character.");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        showError(
          "Failed to load application",
          "Unable to load character data. Please try again or create a new character.",
        );
        setShowCharacterSelection(true);
        setLoadError(
          "Failed to load application data. Please try selecting or creating a character.",
        );
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Services are singletons, safe to omit from dependencies

  // Subscribe to character events to update app state
  useEffect(() => {
    const unsubscribeCreated = subscribeToEvent("created", async (event) => {
      // Refresh character list and update settings
      const updatedCharacters = await characterStorage.getAllCharacters();
      setCharacters(updatedCharacters);

      const newSettings = await settingsService.getSettings();
      setSettings(newSettings);

      // Hide character selection if it was showing
      setShowCharacterSelection(false);
      setLoadError(null);
    });

    const unsubscribeSwitched = subscribeToEvent("switched", async (event) => {
      // Refresh character list (for last played timestamps) and update settings
      const updatedCharacters = await characterStorage.getAllCharacters();
      setCharacters(updatedCharacters);

      const newSettings = await settingsService.getSettings();
      setSettings(newSettings);

      // Hide character selection if it was showing
      setShowCharacterSelection(false);
      setLoadError(null);
    });

    const unsubscribeDeleted = subscribeToEvent("deleted", async (event) => {
      // Refresh character list and settings
      const updatedCharacters = await characterStorage.getAllCharacters();
      setCharacters(updatedCharacters);

      const newSettings = await settingsService.getSettings();
      setSettings(newSettings);

      // Show character selection if no characters left or if the deleted character was the active one
      if (updatedCharacters.length === 0) {
        setShowCharacterSelection(true);
        setLoadError("No characters remaining. Please create a new character.");
      } else if (event.characterId === settings.activeCharacterId) {
        // The active character was deleted, show selection to choose a new one
        setShowCharacterSelection(true);
        setLoadError("Active character was deleted. Please select a character.");
      }
    });

    // Listen for sync events to refresh character list
    const handleCharactersSynced = async () => {
      // Refresh character list after sync
      const updatedCharacters = await characterStorage.getAllCharacters();
      setCharacters(updatedCharacters);

      // If we had no characters before and got some from sync, hide the selection screen
      if (
        updatedCharacters.length > 0 &&
        showCharacterSelection &&
        loadError?.includes("No characters")
      ) {
        setShowCharacterSelection(false);
        setLoadError(null);

        // Load the first character if no active character is set
        const characterService = getCharacterService();
        const currentSettings = await settingsService.getSettings();
        if (!currentSettings.activeCharacterId && updatedCharacters.length > 0) {
          await characterService.loadCharacter(updatedCharacters[0].id);
        }
      }
    };

    window.addEventListener("characters-synced", handleCharactersSynced);

    return () => {
      unsubscribeCreated();
      unsubscribeSwitched();
      unsubscribeDeleted();
      window.removeEventListener("characters-synced", handleCharactersSynced);
    };
  }, [
    subscribeToEvent,
    characterStorage,
    settingsService,
    settings.activeCharacterId,
    showCharacterSelection,
    loadError,
  ]);

  const handleSettingsChange = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await settingsService.saveSettings(newSettings);
  };

  return {
    characters,
    settings,
    isLoaded,
    loadError,
    showCharacterSelection,
    handleSettingsChange,
  };
}
