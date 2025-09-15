"use client";

import { Character } from "@/lib/schemas/character";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface BasicSettingsSectionProps {
  character: Character;
  updateMaxWounds: (value: string) => Promise<void>;
  updateMaxHP: (value: string) => Promise<void>;
  updateInitiativeModifier: (value: string) => Promise<void>;
  updateMaxInventorySize: (value: string) => Promise<void>;
}

export function BasicSettingsSection({
  character,
  updateMaxWounds,
  updateMaxHP,
  updateInitiativeModifier,
  updateMaxInventorySize,
}: BasicSettingsSectionProps) {
  return (
    <>
      {/* Wounds Configuration */}
      <div className="space-y-2">
        <Label htmlFor="max-wounds" className="text-sm font-medium">
          Maximum Wounds
        </Label>
        <div className="space-y-1">
          <Input
            id="max-wounds"
            type="number"
            min="1"
            max="20"
            value={character.wounds.max}
            onChange={(e) => updateMaxWounds(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Number of wounds the character can sustain before death.
          </p>
        </div>
      </div>

      {/* Max HP Configuration */}
      <div className="space-y-2">
        <Label htmlFor="max-hp" className="text-sm font-medium">
          Maximum Hit Points
        </Label>
        <div className="space-y-1">
          <Input
            id="max-hp"
            type="number"
            min="1"
            max="1000"
            value={character.hitPoints.max}
            onChange={(e) => updateMaxHP(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Base maximum hit points for the character.
          </p>
        </div>
      </div>

      {/* Initiative Modifier Configuration */}
      <div className="space-y-2">
        <Label htmlFor="initiative-modifier" className="text-sm font-medium">
          Initiative Modifier
        </Label>
        <div className="space-y-1">
          <Input
            id="initiative-modifier"
            type="number"
            min="-10"
            max="10"
            value={character._initiative.modifier}
            onChange={(e) => updateInitiativeModifier(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Additional modifier for initiative rolls (added to Dexterity). Current total:{" "}
            {character._attributes.dexterity + character._initiative.modifier >= 0 ? "+" : ""}
            {character._attributes.dexterity + character._initiative.modifier}.
          </p>
        </div>
      </div>

      {/* Max Inventory Size Configuration */}
      <div className="space-y-2">
        <Label htmlFor="max-inventory" className="text-sm font-medium">
          Base Inventory Size
        </Label>
        <div className="space-y-1">
          <Input
            id="max-inventory"
            type="number"
            min="1"
            max="100"
            value={character.config.maxInventorySize}
            onChange={(e) => updateMaxInventorySize(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Base inventory slots (before strength bonus). Final size ={" "}
            {character.config.maxInventorySize} + {character._attributes.strength} (strength) ={" "}
            {character.config.maxInventorySize + character._attributes.strength} slots.
          </p>
        </div>
      </div>
    </>
  );
}