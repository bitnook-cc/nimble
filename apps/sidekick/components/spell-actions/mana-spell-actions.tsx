"use client";

import { TrendingUp, Zap } from "lucide-react";

import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { SpellCastingService } from "@/lib/services/spell-casting-service";
import { ManaCastingOptions } from "@/lib/services/spell-casting-types";

import { Button } from "../ui/button";

interface ManaSpellActionsProps {
  spell: SpellAbilityDefinition;
  spellTierAccess: number;
  onCast: (spell: SpellAbilityDefinition, targetTier?: number) => void;
  onUpcast: (spell: SpellAbilityDefinition) => void;
}

export function ManaSpellActions({
  spell,
  spellTierAccess,
  onCast,
  onUpcast,
}: ManaSpellActionsProps) {
  const spellCastingService = SpellCastingService.getInstance();

  // Calculate if we can afford to cast this spell at base tier
  const options: ManaCastingOptions = {
    methodType: "mana",
    targetTier: spell.tier,
  };
  const cost = spellCastingService.calculateCastingCost(spell.id, options);
  const canCast = cost?.canAfford ?? false;
  const insufficientMessage = cost?.warningMessage;

  // Check if spell can be upcast (has resource cost, upcast bonus, and is not at max tier)
  const canUpcast = spell.resourceCost && spell.upcastBonus && spell.tier < spellTierAccess;

  return (
    <div className="flex gap-2 pt-1 justify-end">
      <Button
        size="sm"
        variant={canCast ? "outline" : "ghost"}
        onClick={() => onCast(spell)}
        disabled={!canCast}
        title={insufficientMessage || "Cast spell"}
      >
        <Zap className="w-4 h-4 mr-1" />
        Cast
      </Button>
      {canUpcast && (
        <Button
          size="sm"
          variant={canCast ? "outline" : "ghost"}
          onClick={() => onUpcast(spell)}
          disabled={!canCast}
          title="Upcast spell for increased effect"
        >
          <TrendingUp className="w-4 h-4 mr-1" />
          Upcast
        </Button>
      )}
    </div>
  );
}
