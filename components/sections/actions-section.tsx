"use client";

import { Actions } from "../actions";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";

export function ActionsSection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const { attack } = useDiceActions();
  const { uiState } = useUIStateService();
  
  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;
  
  const advantageLevel = uiState.advantageLevel;
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Actions</h2>
      <Actions 
        character={character} 
        onAttack={attack} 
        advantageLevel={advantageLevel} 
      />
    </div>
  );
}