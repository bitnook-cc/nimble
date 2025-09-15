"use client";

import { useCharacterService } from "@/lib/hooks/use-character-service";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { BasicSettingsSection } from "./character-config/basic-settings-section";
import { ResourceConfigurationSection } from "./character-config/resource-configuration-section";
import { DicePoolConfigurationSection } from "./character-config/dice-pool-configuration-section";

interface CharacterConfigDialogProps {
  onClose: () => void;
}

export function CharacterConfigDialog({ onClose }: CharacterConfigDialogProps) {
  const { character, updateCharacter } = useCharacterService();

  // Don't render if character is null
  if (!character) {
    return null;
  }

  const handleClose = () => {
    onClose();
  };

  const updateMaxWounds = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxWounds = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      wounds: {
        ...character.wounds,
        max: maxWounds,
        current: Math.min(character.wounds.current, maxWounds),
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateMaxHP = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxHP = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      hitPoints: {
        ...character.hitPoints,
        max: maxHP,
        current: Math.min(character.hitPoints.current, maxHP),
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateMaxInventorySize = async (value: string) => {
    const numValue = parseInt(value) || 1;
    const maxInventorySize = Math.max(1, numValue);

    const updatedCharacter = {
      ...character,
      config: {
        ...character.config,
        maxInventorySize,
      },
    };
    await updateCharacter(updatedCharacter);
  };

  const updateInitiativeModifier = async (value: string) => {
    const numValue = parseInt(value) || 0;
    const modifier = Math.max(-10, Math.min(10, numValue));

    const updatedCharacter = {
      ...character,
      _initiative: {
        ...character._initiative,
        modifier,
      },
    };
    await updateCharacter(updatedCharacter);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Character Configuration</DialogTitle>
          <DialogDescription>Configure advanced settings for {character.name}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Basic Settings */}
          <BasicSettingsSection
            character={character}
            updateMaxWounds={updateMaxWounds}
            updateMaxHP={updateMaxHP}
            updateInitiativeModifier={updateInitiativeModifier}
            updateMaxInventorySize={updateMaxInventorySize}
          />

          {/* Resource Management */}
          <ResourceConfigurationSection
            character={character}
            updateCharacter={updateCharacter}
          />

          {/* Dice Pool Management */}
          <DicePoolConfigurationSection
            character={character}
            updateCharacter={updateCharacter}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
