"use client";

import React, { useState } from "react";
import { FeatureCard } from "./feature-card";
import { FeatureEffectsDisplay } from "./feature-effects-display";
import { FeaturePoolSelectionDialog } from "./feature-pool-selection-dialog";
import { SubclassSelectionDialog } from "./subclass-selection-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Target } from "lucide-react";

import { 
  CharacterFeature, 
  ClassFeature, 
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SubclassChoiceFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  AttributeBoostFeatureEffect,
  UtilitySpellsFeatureEffect,
} from "@/lib/schemas/features";
import { 
  Character, 
  EffectSelection,
  AttributeName,
  PoolFeatureEffectSelection
} from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getIconById } from "@/lib/utils/icon-utils";

interface ExistingFeatures {
  spellSchools: string[];
  // Additional attributes can be added here later
}

interface FeatureListProps {
  features: (CharacterFeature | ClassFeature)[];
  source: "class" | "subclass" | "ancestry" | "background";
  sourceLabel: string;
  existingSelections: EffectSelection[];
  onSelectionsChange: (selections: EffectSelection[]) => void;
  character?: Character;
  existingFeatures?: ExistingFeatures;
}

export function FeatureList({
  features,
  source,
  sourceLabel,
  existingSelections,
  onSelectionsChange,
  character,
  existingFeatures = { spellSchools: [] },
}: FeatureListProps) {
  // Dialog states
  const [selectedPoolFeatureEffect, setSelectedPoolFeatureEffect] = useState<
    PickFeatureFromPoolFeatureEffect
   | null>(null);
  const [selectedSubclassChoiceEffect, setSelectedSubclassChoiceEffect] = useState<
    SubclassChoiceFeatureEffect
   | null>(null);
  const [selectedSpellSchoolChoiceEffect, setSelectedSpellSchoolChoiceEffect] = useState<
    SpellSchoolChoiceFeatureEffect
   | null>(null);
  const [selectedAttributeBoostEffect, setSelectedAttributeBoostEffect] = useState<
    AttributeBoostFeatureEffect | null>(null);
  const [selectedUtilitySpellsEffect, setSelectedUtilitySpellsEffect] = useState<
    UtilitySpellsFeatureEffect
   | null>(null);
  const [utilitySpellSelection, setUtilitySpellSelectionEffect] = useState<string[]>([]);

  const contentRepository = ContentRepositoryService.getInstance();

  // Handler for opening selection dialogs
  const handleOpenSelectionDialog = (effect: FeatureEffect) => {
    switch (effect.type) {
      case "subclass_choice":
        setSelectedSubclassChoiceEffect(effect);
        break;
      case "pick_feature_from_pool":
        setSelectedPoolFeatureEffect(effect);
        break;
      case "spell_school_choice":
        setSelectedSpellSchoolChoiceEffect(effect);
        break;
      case "attribute_boost":
        setSelectedAttributeBoostEffect(effect);
        break;
      case "utility_spells":
        setSelectedUtilitySpellsEffect(effect);
        setUtilitySpellSelectionEffect([]);
        break;
    }
  };

  // Handler for selection changes
  const handleSelectionChange = (effectId: string, selection: EffectSelection | null) => {
    if (selection) {
      // Add or update selection
      const updated = existingSelections.filter(s => s.grantedByEffectId !== effectId);
      updated.push(selection);
      onSelectionsChange(updated);
    } else {
      // Remove selection
      const updated = existingSelections.filter(s => s.grantedByEffectId !== effectId);
      onSelectionsChange(updated);
    }
  };

  // Specific handlers for each selection type
  const handleSelectSpellSchool = (schoolId: string) => {
    if (!selectedSpellSchoolChoiceEffect) return;
    
    handleSelectionChange(selectedSpellSchoolChoiceEffect.id, {
      type: "spell_school",
      schoolId,
      grantedByEffectId: selectedSpellSchoolChoiceEffect.id,
    });
    
    setSelectedSpellSchoolChoiceEffect(null);
  };

  const handleSelectAttributeBoost = (attribute: AttributeName, amount: number) => {
    if (!selectedAttributeBoostEffect) return;
    
    handleSelectionChange(selectedAttributeBoostEffect.id, {
      type: "attribute_boost",
      attribute,
      amount,
      grantedByEffectId: selectedAttributeBoostEffect.id,
    });
    
    setSelectedAttributeBoostEffect(null);
  };

  const handleSelectUtilitySpells = () => {
    if (!selectedUtilitySpellsEffect || !character) return;
    
    if (!featureSelectionService.validateUtilitySpellSelection(
      selectedUtilitySpellsEffect, 
      utilitySpellSelection, 
      character
    )) {
      return;
    }

    const fromSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
      selectedUtilitySpellsEffect, 
      character
    );
    
    handleSelectionChange(selectedUtilitySpellsEffect.id, {
      type: "utility_spells",
      spellIds: utilitySpellSelection,
      fromSchools,
      grantedByEffectId: selectedUtilitySpellsEffect.id,
    });
    
    setSelectedUtilitySpellsEffect(null);
    setUtilitySpellSelectionEffect([]);
  };

  const handleSelectPoolFeatures = (newSelections: PoolFeatureEffectSelection[]) => {
    if (!selectedPoolFeatureEffect) return;
    
    // Remove existing selections for this effect
    const otherSelections = existingSelections.filter(
      s => !(s.type === "pool_feature" && s.grantedByEffectId === selectedPoolFeatureEffect.id)
    );
    
    // Add new selections
    const updated = [...otherSelections, ...newSelections];
    
    onSelectionsChange(updated);
    setSelectedPoolFeatureEffect(null);
  };

  const handleSelectSubclass = (subclassId: string) => {
    if (!selectedSubclassChoiceEffect) return;
    
    handleSelectionChange(selectedSubclassChoiceEffect.id, {
      type: "subclass",
      subclassId,
      grantedByEffectId: selectedSubclassChoiceEffect.id,
    });
    
    setSelectedSubclassChoiceEffect(null);
  };

  return (
    <>
      <div className="space-y-3">
        {features.map((feature, index) => {
          const level = "level" in feature ? feature.level : undefined;
          
          return (
            <FeatureCard
              key={`${source}-${feature.id}-${index}`}
              feature={feature}
              source={source}
              sourceLabel={sourceLabel}
              level={level}
            >
              {feature.effects && feature.effects.length > 0 && (
                <FeatureEffectsDisplay
                  effects={feature.effects}
                  existingSelections={existingSelections}
                  onSelectionChange={handleSelectionChange}
                  onOpenSelectionDialog={handleOpenSelectionDialog}
                  character={character}
                />
              )}
            </FeatureCard>
          );
        })}
      </div>

      {/* Selection Dialogs */}
      {selectedPoolFeatureEffect && (
        <FeaturePoolSelectionDialog
          pickPoolFeatureEffect={selectedPoolFeatureEffect}
          onSelectFeatures={handleSelectPoolFeatures}
          onClose={() => setSelectedPoolFeatureEffect(null)}
          existingSelections={existingSelections.filter(
            s => s.type === "pool_feature"
          ) as PoolFeatureEffectSelection[]}
        />
      )}

      {selectedSubclassChoiceEffect && (
        <SubclassSelectionDialog
          subclassChoice={selectedSubclassChoiceEffect}
          onSelectSubclass={handleSelectSubclass}
          onClose={() => setSelectedSubclassChoiceEffect(null)}
          classId={character?.classId || (source === "class" && features[0]?.id?.split('-')[0]) || undefined}
        />
      )}

      {/* Spell School Selection Dialog */}
      {selectedSpellSchoolChoiceEffect && (
        <Dialog open={true} onOpenChange={() => setSelectedSpellSchoolChoiceEffect(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Spell School</DialogTitle>
              <DialogDescription>
                Select a spell school to gain access to its spells.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select onValueChange={handleSelectSpellSchool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a spell school" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    // Get already selected spell schools from temporary selections
                    const selectedSchoolIds = new Set(
                      existingSelections
                        .filter(s => s.type === "spell_school")
                        .map(s => s.schoolId)
                    );
                    
                    // Add existing spell schools from character (passed via existingFeatures)
                    existingFeatures.spellSchools.forEach(schoolId => 
                      selectedSchoolIds.add(schoolId)
                    );
                    
                    // Filter out already available schools
                    const availableSchools = contentRepository.getAllSpellSchools()
                      .filter(school => !selectedSchoolIds.has(school.id));
                    
                    if (availableSchools.length === 0) {
                      return (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          All spell schools are already available
                        </div>
                      );
                    }
                    
                    return availableSchools.map((school) => {
                      const SchoolIcon = getIconById(school.icon);
                      return (
                        <SelectItem key={school.id} value={school.id}>
                          <div className="flex items-center gap-2">
                            <SchoolIcon className={`w-4 h-4 ${school.color}`} />
                            {school.name}
                          </div>
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Attribute Boost Selection Dialog */}
      {selectedAttributeBoostEffect && (
        <Dialog open={true} onOpenChange={() => setSelectedAttributeBoostEffect(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Attribute Boost</DialogTitle>
              <DialogDescription>
                Select an attribute to receive a permanent boost.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedAttributeBoostEffect.allowedAttributes.map((attr) => (
                  <Button
                    key={attr}
                    variant="outline"
                    onClick={() => handleSelectAttributeBoost(
                      attr as AttributeName, 
                      selectedAttributeBoostEffect.amount
                    )}
                    className="justify-start"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {attr.charAt(0).toUpperCase() + attr.slice(1)} +{selectedAttributeBoostEffect.amount}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Utility Spells Selection Dialog */}
      {selectedUtilitySpellsEffect && character && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedUtilitySpellsEffect(null);
          setUtilitySpellSelectionEffect([]);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Utility Spells</DialogTitle>
              <DialogDescription>
                {(() => {
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpellsEffect, 
                    character
                  );
                  const spellCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpellsEffect, 
                    availableSchools
                  );
                  if (selectedUtilitySpellsEffect.selectionMode === "per_school") {
                    return `Select ${selectedUtilitySpellsEffect.spellsPerSchool || 1} utility spell${(selectedUtilitySpellsEffect.spellsPerSchool || 1) > 1 ? "s" : ""} from each of ${availableSchools.length} school${availableSchools.length > 1 ? "s" : ""} (${spellCount} total).`;
                  } else {
                    return `Select ${spellCount} utility spell${spellCount > 1 ? "s" : ""} to learn.`;
                  }
                })()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {(() => {
                  const availableSpells = featureSelectionService.getAvailableUtilitySpells(
                    selectedUtilitySpellsEffect, 
                    character
                  );
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpellsEffect, 
                    character
                  );
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpellsEffect, 
                    availableSchools
                  );

                  return availableSpells.map((spell) => (
                    <div key={spell.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={utilitySpellSelection.includes(spell.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (utilitySpellSelection.length < expectedCount) {
                              setUtilitySpellSelectionEffect([...utilitySpellSelection, spell.id]);
                            }
                          } else {
                            setUtilitySpellSelectionEffect(utilitySpellSelection.filter(id => id !== spell.id));
                          }
                        }}
                        disabled={!utilitySpellSelection.includes(spell.id) && utilitySpellSelection.length >= expectedCount}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{spell.name}</div>
                        <div className="text-sm text-muted-foreground">{spell.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {spell.school}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                onClick={handleSelectUtilitySpells}
                disabled={!featureSelectionService.validateUtilitySpellSelection(
                  selectedUtilitySpellsEffect,
                  utilitySpellSelection,
                  character
                )}
              >
                {(() => {
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpellsEffect, 
                    character
                  );
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpellsEffect, 
                    availableSchools
                  );
                  return `Confirm Selection (${utilitySpellSelection.length}/${expectedCount})`;
                })()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}