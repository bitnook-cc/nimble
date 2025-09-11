"use client";

import { useState } from "react";
import { Minus, Plus, Zap } from "lucide-react";
import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { ResourceInstance } from "@/lib/schemas/resources";
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
  resource: ResourceInstance | undefined;
  maxSpellTier: number;
  onCast: (extraResourceAmount: number) => void;
  onClose: () => void;
}

export function UpcastSpellDialog({
  spell,
  resource,
  maxSpellTier,
  onCast,
  onClose,
}: UpcastSpellDialogProps) {
  const baseResourceCost = spell.resourceCost?.type === "fixed" 
    ? spell.resourceCost.amount 
    : spell.resourceCost?.minAmount || 0;
  
  const maxExtraResource = Math.min(
    maxSpellTier - spell.tier,
    resource ? resource.current - baseResourceCost : 0
  );
  
  const [extraResource, setExtraResource] = useState(0);
  
  const handleCast = () => {
    onCast(extraResource);
    onClose();
  };
  
  const resourceName = resource?.definition.name || "Resource";
  const totalCost = baseResourceCost + extraResource;
  
  // Calculate the damage preview
  const getDamagePreview = () => {
    if (!spell.diceFormula) return null;
    if (!spell.upcastBonus || extraResource === 0) return spell.diceFormula;
    
    // Clean the upcast bonus
    const cleanBonus = spell.upcastBonus.replace(/^[+-]/, '');
    const sign = spell.upcastBonus.startsWith('-') ? '-' : '+';
    
    // For now, show it symbolically (actual calculation happens when cast)
    if (extraResource === 1) {
      return `${spell.diceFormula}${sign}${cleanBonus}`;
    } else {
      return `${spell.diceFormula}${sign}(${extraResource}×${cleanBonus})`;
    }
  };
  
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upcast {spell.name}</DialogTitle>
          <DialogDescription>
            Choose how much extra {resourceName.toLowerCase()} to spend for increased effect.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Resource cost display */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Cost:</span>
              <span>{baseResourceCost} {resourceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Extra {resourceName}:</span>
              <span className="font-semibold">{extraResource}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total Cost:</span>
              <span className="text-lg">{totalCost} {resourceName}</span>
            </div>
            {resource && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Available:</span>
                <span>{resource.current} {resourceName}</span>
              </div>
            )}
          </div>
          
          {/* Extra resource selector */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExtraResource(Math.max(0, extraResource - 1))}
              disabled={extraResource <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="text-2xl font-bold w-12 text-center">
              {extraResource}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setExtraResource(Math.min(maxExtraResource, extraResource + 1))}
              disabled={extraResource >= maxExtraResource}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Damage preview */}
          {spell.diceFormula && (
            <div className="rounded-lg bg-muted p-4">
              <div className="text-sm text-muted-foreground mb-1">Damage Formula:</div>
              <div className="text-lg font-mono font-semibold">
                {getDamagePreview()}
              </div>
              {spell.upcastBonus && extraResource > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Upcast bonus: {spell.upcastBonus} per extra {resourceName.toLowerCase()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCast}
            disabled={!resource || resource.current < totalCost}
          >
            <Zap className="mr-2 h-4 w-4" />
            Cast ({totalCost} {resourceName})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}