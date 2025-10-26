"use client";

import { Minus, Plus, Zap } from "lucide-react";

import { useState } from "react";

import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { SpellCastingService } from "@/lib/services/spell-casting-service";
import { ManaCastingOptions } from "@/lib/services/spell-casting-types";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface UpcastSpellDialogProps {
  spell: SpellAbilityDefinition;
  baseTier: number;
  maxTier: number;
  onCast: (targetTier: number) => void;
  onClose: () => void;
}

export function UpcastSpellDialog({
  spell,
  baseTier,
  maxTier,
  onCast,
  onClose,
}: UpcastSpellDialogProps) {
  const [targetTier, setTargetTier] = useState(baseTier);
  const spellCastingService = SpellCastingService.getInstance();

  // Calculate cost for current target tier
  const options: ManaCastingOptions = {
    methodType: "mana",
    targetTier,
  };
  const cost = spellCastingService.calculateCastingCost(spell.id, options);

  // Calculate damage preview with upcast bonus
  const getDamagePreview = () => {
    if (!spell.diceFormula) return null;

    const extraTiers = targetTier - baseTier;
    if (extraTiers === 0 || !spell.upcastBonus) {
      return spell.diceFormula;
    }

    // Add upcastBonus once per extra tier
    const cleanBonus = spell.upcastBonus.replace(/^[+-]/, "");
    const sign = spell.upcastBonus.startsWith("-") ? "-" : "+";

    if (extraTiers === 1) {
      return `${spell.diceFormula}${sign}${cleanBonus}`;
    } else {
      return `${spell.diceFormula}${sign}(${extraTiers}×${cleanBonus})`;
    }
  };

  const handleCast = () => {
    onCast(targetTier);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upcast {spell.name}</DialogTitle>
          <DialogDescription>Cast at a higher tier for increased effect</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tier display */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Tier:</span>
              <span>{baseTier}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Casting Tier:</span>
              <span className="text-lg">Tier {targetTier}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Extra Tiers:</span>
              <span className="text-purple-600">+{targetTier - baseTier}</span>
            </div>
          </div>

          {/* Tier selector */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTargetTier(Math.max(baseTier, targetTier - 1))}
              disabled={targetTier <= baseTier}
            >
              <Minus className="h-4 w-4" />
            </Button>

            <div className="text-2xl font-bold w-16 text-center">T{targetTier}</div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTargetTier(Math.min(maxTier, targetTier + 1))}
              disabled={targetTier >= maxTier}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Cost display */}
          {cost && (
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm font-semibold mb-1">Cost:</div>
              <div className="text-lg">{cost.description}</div>
              {cost.warningMessage && (
                <div className="text-sm text-destructive mt-2">{cost.warningMessage}</div>
              )}
            </div>
          )}

          {/* Damage preview */}
          {spell.diceFormula && (
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground mb-1">Damage Formula:</div>
              <div className="text-lg font-mono font-semibold">{getDamagePreview()}</div>
              {spell.upcastBonus && targetTier > baseTier && (
                <div className="text-xs text-muted-foreground mt-2">
                  Upcast bonus: {spell.upcastBonus} per tier
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCast} disabled={!cost?.canAfford}>
            <Zap className="mr-2 h-4 w-4" />
            Cast (Tier {targetTier})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
