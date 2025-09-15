"use client";

import { ChevronDown, ChevronRight, Dices } from "lucide-react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { DicePoolCards } from "./dice-pool-cards";

export function DicePoolSection() {
  const { character } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  // Get dice pools from character service (includes trait-granted pools)
  const characterService = getCharacterService();
  const dicePools = character ? characterService.getDicePools() : [];

  // Early return if no character or no dice pools
  if (!character || dicePools.length === 0) return null;

  const isOpen = uiState.collapsibleSections?.dicePools ?? true;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("dicePools", isOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-500" />
            Dice Pools
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 p-4">
          <DicePoolCards />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
