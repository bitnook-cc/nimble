"use client";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getClassService } from "@/lib/services/service-factory";
import {
  ClassFeature,
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
} from "@/lib/schemas/features";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface FeaturePoolSelectionDialogProps {
  pickFeature: PickFeatureFromPoolFeatureEffect;
  onClose: () => void;
}

// Helper function to render individual effects
function renderEffect(effect: FeatureEffect, index: number): React.ReactNode {
  switch (effect.type) {
    case "ability":
      if ("ability" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">Ability: {effect.ability.name || "Unnamed"}</div>
            <div>Type: {effect.ability.type}</div>
            {effect.ability.type === "action" && effect.ability.frequency && (
              <div>Frequency: {effect.ability.frequency.replace("_", " ")}</div>
            )}
          </div>
        );
      }
      break;
    case "stat_bonus":
      if ("statBonus" in effect) {
        const bonuses: string[] = [];
        if (effect.statBonus.attributes) {
          Object.entries(effect.statBonus.attributes).forEach(([attr, value]) => {
            if (value) {
              bonuses.push(`${attr} +${value.type === "fixed" ? value.value : value.expression}`);
            }
          });
        }
        if (bonuses.length > 0) {
          return (
            <div key={index} className="text-xs text-muted-foreground">
              <div className="font-medium">Stat Bonuses: {bonuses.join(", ")}</div>
            </div>
          );
        }
      }
      break;
    case "attribute_boost":
      if ("allowedAttributes" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">Attribute Boost: +{effect.amount}</div>
            <div>Choose from: {effect.allowedAttributes.join(", ")}</div>
          </div>
        );
      }
      break;
    case "proficiency":
      if ("proficiencies" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">
              Proficiencies: {effect.proficiencies.map((prof) => prof.name).join(", ")}
            </div>
          </div>
        );
      }
      break;
    case "resource":
      if ("resourceDefinition" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">Grants Resource: {effect.resourceDefinition.name}</div>
          </div>
        );
      }
      break;
    case "spell_school":
      if ("schoolId" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">Spell School: {effect.schoolId}</div>
          </div>
        );
      }
      break;
    case "spell_school_choice":
      if ("availableSchools" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">
              Spell School Choice: {effect.availableSchools?.join(", ") || "Any"}
            </div>
          </div>
        );
      }
      break;
    case "pick_feature_from_pool":
      if ("poolId" in effect) {
        return (
          <div key={index} className="text-xs text-muted-foreground">
            <div className="font-medium">Feature Choice: {effect.poolId}</div>
            <div>
              Choose {effect.choicesAllowed} feature{effect.choicesAllowed !== 1 ? "s" : ""}
            </div>
          </div>
        );
      }
      break;
    case "subclass_choice":
      return (
        <div key={index} className="text-xs text-muted-foreground">
          <div className="font-medium">Subclass Choice Available</div>
        </div>
      );
    default:
      return (
        <div key={index} className="text-xs text-muted-foreground">
          <div className="font-medium">Effect: {effect.type}</div>
        </div>
      );
  }
  return null;
}

export function FeaturePoolSelectionDialog({
  pickFeature,
  onClose,
}: FeaturePoolSelectionDialogProps) {
  const { character, selectPoolFeature } = useCharacterService();
  const [selectedFeature, setSelectedFeature] = useState<ClassFeature | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!character) {
    return null;
  }

  const classService = getClassService();
  const pool = classService.getFeaturePool(character.classId, pickFeature.poolId);
  const availableFeatures = classService.getAvailablePoolFeatures(
    character.classId,
    pickFeature.poolId,
    character.effectSelections,
  );
  const remaining = classService.getRemainingPoolSelections(character, pickFeature);

  if (!pool) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pool Not Found</DialogTitle>
            <DialogDescription>
              The feature pool &ldquo;{pickFeature.poolId}&rdquo; could not be found.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSelectFeature = async () => {
    if (!selectedFeature) return;

    setIsSelecting(true);
    try {
      // Use the effect ID instead of generating a feature ID
      await selectPoolFeature(
        pickFeature.poolId,
        selectedFeature,
        pickFeature.id,
      );
      onClose();
    } catch (error) {
      console.error("Failed to select pool feature:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select from {pool.name}</DialogTitle>
          <DialogDescription>
            {pool.description}
            <br />
            <span className="font-medium">Remaining selections: {remaining}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {availableFeatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No features available for selection
              </div>
            ) : (
              availableFeatures.map((feature: ClassFeature, index: number) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedFeature === feature
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedFeature(feature)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>

                    {feature.effects.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {feature.effects.map((effect, index) => renderEffect(effect, index))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelectFeature}
            disabled={!selectedFeature || isSelecting || remaining <= 0}
          >
            {isSelecting ? "Selecting..." : "Select Feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
