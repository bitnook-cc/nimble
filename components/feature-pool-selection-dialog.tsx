"use client";

import { useState, useEffect } from "react";

import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import {
  ClassFeature,
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
} from "@/lib/schemas/features";
import { PoolFeatureEffectSelection } from "@/lib/schemas/character";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface FeaturePoolSelectionDialogProps {
  pickPoolFeatureEffect: PickFeatureFromPoolFeatureEffect;
  onClose: () => void;
  onSelectFeatures: (selections: PoolFeatureEffectSelection[]) => void;
  existingSelections?: PoolFeatureEffectSelection[];
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
  pickPoolFeatureEffect,
  onClose,
  onSelectFeatures,
  existingSelections = [],
}: FeaturePoolSelectionDialogProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<ClassFeature[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const contentRepository = ContentRepositoryService.getInstance();
  const pool = contentRepository.getFeaturePool(pickPoolFeatureEffect.poolId)!;

  const currentEffectSelections = existingSelections
      .filter(s => s.poolId === pickPoolFeatureEffect.poolId && s.grantedByEffectId === pickPoolFeatureEffect.id);

  // Find the full feature objects for current selections
  const currentFeatures = currentEffectSelections.map(s => s.feature);

  // Initialize with current selections if in edit mode
  useEffect(() => {
    if (currentEffectSelections.length > 0) {
      setIsEditMode(true);
      setSelectedFeatures(currentFeatures);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount
    
  // Get ALL features selected from this pool (by any effect)
  const allPoolSelections = existingSelections
    .filter(s => s.poolId === pickPoolFeatureEffect.poolId);
  
  // Features selected by OTHER effects (these should be excluded)
  const otherEffectSelectionIDs = allPoolSelections.filter(
    s => s.grantedByEffectId !== pickPoolFeatureEffect.id
  ).map(f => f.feature.id);
  
  // Filter out features selected by other effects
  const availableFeatures = pool.features.filter(
    feature => !otherEffectSelectionIDs.includes(feature.id)
  );
  
  // Calculate remaining selections
  const alreadySelectedCount = currentEffectSelections.length;
  const remaining = pickPoolFeatureEffect.choicesAllowed - alreadySelectedCount;

  if (!pool) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pool Not Found</DialogTitle>
            <DialogDescription>
              The feature pool &ldquo;{pickPoolFeatureEffect.poolId}&rdquo; could not be found.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSelectFeatures = async () => {
    setIsSelecting(true);
    try {
      // Create new selections for the selected features
      const newSelections: PoolFeatureEffectSelection[] = selectedFeatures.map(feature => ({
        type: "pool_feature" as const,
        grantedByEffectId: pickPoolFeatureEffect.id,
        poolId: pickPoolFeatureEffect.poolId,
        feature: feature,
      }));

      // Pass all selections to the callback
      onSelectFeatures(newSelections);
      onClose();
    } catch (error) {
      console.error("Failed to select pool features:", error);
    } finally {
      setIsSelecting(false);
    }
  };
  
  const toggleFeatureSelection = (feature: ClassFeature) => {
    setSelectedFeatures(prev => {
      const isSelected = prev.some(f => f.id === feature.id);
      if (isSelected) {
        return prev.filter(f => f.id !== feature.id);
      } else {
        // Only add if we haven't reached the limit
        if (prev.length < pickPoolFeatureEffect.choicesAllowed) {
          return [...prev, feature];
        }
        return prev;
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select from {pool.name}</DialogTitle>
          <DialogDescription>
            {pool.description}
            <br />
            <span className="font-medium">
              {isEditMode ? (
                <>
                  Change your selection of {pickPoolFeatureEffect.choicesAllowed} feature
                  {pickPoolFeatureEffect.choicesAllowed !== 1 ? "s" : ""}
                  {currentEffectSelections.length > 0 && (
                    <span className="text-muted-foreground ml-1">
                      (Currently have {currentEffectSelections.length})
                    </span>
                  )}
                </>
              ) : (
                remaining > 0 
                  ? `Select up to ${remaining} feature${remaining !== 1 ? 's' : ''}`
                  : 'All selections have been made'
              )}
            </span>
            {!isEditMode && alreadySelectedCount > 0 && (
              <span className="text-muted-foreground ml-2">
                ({alreadySelectedCount} already selected)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {availableFeatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No features available for selection
              </div>
            ) : (
              availableFeatures.map((feature: ClassFeature, index: number) => {
                const isSelected = selectedFeatures.some(f => f.id === feature.id);
                const isCurrentSelection = currentEffectSelections.find(f => f.feature.id === feature.id);
                const canSelect = selectedFeatures.length < pickPoolFeatureEffect.choicesAllowed || isSelected;
                
                return (
                  <Card
                    key={feature.id || index}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "ring-2 ring-primary bg-accent"
                        : canSelect
                          ? "hover:bg-accent/50"
                          : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => canSelect && toggleFeatureSelection(feature)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          {isCurrentSelection && isEditMode && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <Checkbox
                          checked={isSelected}
                          disabled={!canSelect}
                          onClick={(e) => e.stopPropagation()}
                        />
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
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSelectFeatures}
            disabled={isSelecting || (!isEditMode && selectedFeatures.length === 0)}
          >
            {isSelecting 
              ? "Saving..." 
              : isEditMode
                ? `Update Selection (${selectedFeatures.length}/${pickPoolFeatureEffect.choicesAllowed})`
                : selectedFeatures.length > 1
                  ? `Select ${selectedFeatures.length} Features`
                  : "Select Feature"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
