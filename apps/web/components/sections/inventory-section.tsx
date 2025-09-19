"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";

import { Inventory } from "../inventory";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

export function InventorySection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  const isOpen = uiState.collapsibleSections.inventory;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("inventory", isOpen);
  const inventory = character.inventory;
  const characterDexterity = character._attributes.dexterity;
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold">Inventory</h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4">
          <Inventory
            inventory={inventory}
            characterDexterity={characterDexterity}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
