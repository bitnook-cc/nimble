import { useEffect, useState } from "react";

import { UIState, uiStateService } from "../services/ui-state-service";

/**
 * Custom hook that provides direct access to UI state service with automatic re-rendering.
 * Eliminates the need for React Context by subscribing to service changes directly.
 */
export function useUIStateService() {
  const [uiState, setUIState] = useState<UIState | null>(null);

  useEffect(() => {
    // Subscribe to UI state changes
    const unsubscribe = uiStateService.subscribeToUIState((updatedUIState) => {
      setUIState(updatedUIState);
    });

    // Initialize with current UI state
    const initializeUIState = async () => {
      const currentState = await uiStateService.getUIState();
      setUIState(currentState);
    };
    initializeUIState();

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    // State - use default if null
    uiState: uiState || {
      collapsibleSections: {
        classInfo: true,
        classFeatures: true,
        hitPoints: true,
        hitDice: true,
        wounds: true,
        resources: true,
        initiative: true,
        actionTracker: true,
        attributes: true,
        armor: true,
        abilities: true,
        inventory: true,
      },
      advantageLevel: 0,
      activeTab: "combat",
    },

    // Service methods - direct access to all UI state operations
    updateCollapsibleState: uiStateService.updateCollapsibleState.bind(uiStateService),
    updateAdvantageLevel: uiStateService.updateAdvantageLevel.bind(uiStateService),
    updateActiveTab: uiStateService.updateActiveTab.bind(uiStateService),
  };
}
