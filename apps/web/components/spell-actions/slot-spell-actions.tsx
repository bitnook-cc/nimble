"use client";

import { Zap } from "lucide-react";

import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { SpellCastingService } from "@/lib/services/spell-casting-service";
import { SlotCastingOptions } from "@/lib/services/spell-casting-types";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface SlotSpellActionsProps {
  spell: SpellAbilityDefinition;
  spellTierAccess: number;
  onCast: (spell: SpellAbilityDefinition) => void;
}

export function SlotSpellActions({ spell, spellTierAccess, onCast }: SlotSpellActionsProps) {
  const spellCastingService = SpellCastingService.getInstance();

  // Calculate if we can afford to cast this spell
  const options: SlotCastingOptions = {
    methodType: "slot",
  };
  const cost = spellCastingService.calculateCastingCost(spell.id, options);
  const canCast = cost?.canAfford ?? false;
  const insufficientMessage = cost?.warningMessage;

  return (
    <div className="flex gap-2 pt-1 justify-end items-center">
      <Badge variant="secondary" className="text-xs">
        Tier {spellTierAccess}
      </Badge>
      <Button
        size="sm"
        variant={canCast ? "outline" : "ghost"}
        onClick={() => onCast(spell)}
        disabled={!canCast}
        title={insufficientMessage || `Cast at maximum tier (${spellTierAccess})`}
      >
        <Zap className="w-4 h-4 mr-1" />
        Cast
      </Button>
    </div>
  );
}
