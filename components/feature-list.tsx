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
  SpellSchoolFeatureEffect
} from "@/lib/schemas/features";
import { 
  Character, 
  EffectSelection,
  AttributeName,
  PoolFeatureEffectSelection
} from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";

interface FeatureListProps {
  features: (CharacterFeature | ClassFeature)[];
  source: "class" | "subclass" | "ancestry" | "background";
  sourceLabel: string;
  existingSelections: EffectSelection[];
  onSelectionsChange: (selections: EffectSelection[]) => void;
  character?: Character;
}

export function FeatureList({
  features,
  source,
  sourceLabel,
  existingSelections,
  onSelectionsChange,
  character,
}: FeatureListProps) {
  // Dialog states
  const [selectedPoolFeature, setSelectedPoolFeature] = useState<
    PickFeatureFromPoolFeatureEffect
   | null>(null);
  const [selectedSubclassChoice, setSelectedSubclassChoice] = useState<
    SubclassChoiceFeatureEffect
   | null>(null);
  const [selectedSpellSchoolChoice, setSelectedSpellSchoolChoice] = useState<
    SpellSchoolChoiceFeatureEffect
   | null>(null);
  const [selectedAttributeBoost, setSelectedAttributeBoost] = useState<
    AttributeBoostFeatureEffect | null>(null);
  const [selectedUtilitySpells, setSelectedUtilitySpells] = useState<
    UtilitySpellsFeatureEffect
   | null>(null);
  const [utilitySpellSelection, setUtilitySpellSelection] = useState<string[]>([]);

  const contentRepository = ContentRepositoryService.getInstance();

  // Handler for opening selection dialogs
  const handleOpenSelectionDialog = (effect: FeatureEffect) => {
    switch (effect.type) {
      case "subclass_choice":
        setSelectedSubclassChoice(effect);
        break;
      case "pick_feature_from_pool":
        setSelectedPoolFeature(effect);
        break;
      case "spell_school_choice":
        setSelectedSpellSchoolChoice(effect);
        break;
      case "attribute_boost":
        setSelectedAttributeBoost(effect);
        break;
      case "utility_spells":
        setSelectedUtilitySpells(effect);
        setUtilitySpellSelection([]);
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
    if (!selectedSpellSchoolChoice) return;
    
    handleSelectionChange(selectedSpellSchoolChoice.id, {
      type: "spell_school",
      schoolId,
      grantedByEffectId: selectedSpellSchoolChoice.id,
    });
    
    setSelectedSpellSchoolChoice(null);
  };

  const handleSelectAttributeBoost = (attribute: AttributeName, amount: number) => {
    if (!selectedAttributeBoost) return;
    
    handleSelectionChange(selectedAttributeBoost.id, {
      type: "attribute_boost",
      attribute,
      amount,
      grantedByEffectId: selectedAttributeBoost.id,
    });
    
    setSelectedAttributeBoost(null);
  };

  const handleSelectUtilitySpells = () => {
    if (!selectedUtilitySpells || !character) return;
    
    if (!featureSelectionService.validateUtilitySpellSelection(
      selectedUtilitySpells, 
      utilitySpellSelection, 
      character
    )) {
      return;
    }

    const fromSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
      selectedUtilitySpells, 
      character
    );
    
    handleSelectionChange(selectedUtilitySpells.id, {
      type: "utility_spells",
      spellIds: utilitySpellSelection,
      fromSchools,
      grantedByEffectId: selectedUtilitySpells.id,
    });
    
    setSelectedUtilitySpells(null);
    setUtilitySpellSelection([]);
  };

  const handleSelectPoolFeature = (poolId: string, feature: ClassFeature) => {
    if (!selectedPoolFeature) return;
    
    // For pool features, we might have multiple selections
    const existingPoolSelections = existingSelections.filter(
      s => s.type === "pool_feature" && s.grantedByEffectId === selectedPoolFeature.id
    ) as PoolFeatureEffectSelection[];
    
    const updated = [...existingSelections.filter(
      s => !(s.type === "pool_feature" && s.grantedByEffectId === selectedPoolFeature.id)
    )];
    
    // Add all existing pool selections
    updated.push(...existingPoolSelections);
    
    // Add the new selection
    updated.push({
      type: "pool_feature",
      poolId,
      featureId: feature.id,
      feature,
      grantedByEffectId: selectedPoolFeature.id,
    });
    
    onSelectionsChange(updated);
    setSelectedPoolFeature(null);
  };

  const handleSelectSubclass = (subclassId: string) => {
    if (!selectedSubclassChoice) return;
    
    handleSelectionChange(selectedSubclassChoice.id, {
      type: "subclass",
      subclassId,
      grantedByEffectId: selectedSubclassChoice.id,
    });
    
    setSelectedSubclassChoice(null);
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
      {selectedPoolFeature && (
        <FeaturePoolSelectionDialog
          pickFeature={selectedPoolFeature}
          onSelectFeature={(poolId, feature) => handleSelectPoolFeature(poolId, feature)}
          onClose={() => setSelectedPoolFeature(null)}
        />
      )}

      {selectedSubclassChoice && (
        <SubclassSelectionDialog
          subclassChoice={selectedSubclassChoice}
          onSelectSubclass={handleSelectSubclass}
          onClose={() => setSelectedSubclassChoice(null)}
          classId={character?.classId || (source === "class" && features[0]?.id?.split('-')[0]) || undefined}
        />
      )}

      {/* Spell School Selection Dialog */}
      {selectedSpellSchoolChoice && (
        <Dialog open={true} onOpenChange={() => setSelectedSpellSchoolChoice(null)}>
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
                    // Get already selected spell schools from selections
                    const selectedSchoolIds = new Set(
                      existingSelections
                        .filter(s => s.type === "spell_school")
                        .map(s => s.schoolId)
                    );
                    
                    // If we have a character, also get their existing spell schools
                    if (character) {
                      // Add schools from character's effect selections
                      character.effectSelections
                        .filter(s => s.type === "spell_school")
                        .forEach(s => selectedSchoolIds.add(s.schoolId));
                    }
                    
                    // Also check for direct spell_school effects in current features (non-selectable)
                    const directSchoolIds = new Set<string>(
                      features.flatMap(f => 
                        f.effects
                          .filter((e): e is SpellSchoolFeatureEffect => e.type === "spell_school")
                          .map(e => e.schoolId)
                      )
                    );
                    
                    // Filter out already available schools
                    const availableSchools = contentRepository.getAllSpellSchools()
                      .filter(school => 
                        !selectedSchoolIds.has(school.id) && 
                        !directSchoolIds.has(school.id)
                      );
                    
                    if (availableSchools.length === 0) {
                      return (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          All spell schools are already available
                        </div>
                      );
                    }
                    
                    return availableSchools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        <div className="flex items-center gap-2">
                          <span className={school.color}>{school.icon}</span>
                          {school.name}
                        </div>
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Attribute Boost Selection Dialog */}
      {selectedAttributeBoost && (
        <Dialog open={true} onOpenChange={() => setSelectedAttributeBoost(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Choose Attribute Boost</DialogTitle>
              <DialogDescription>
                Select an attribute to receive a permanent boost.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {selectedAttributeBoost.allowedAttributes.map((attr) => (
                  <Button
                    key={attr}
                    variant="outline"
                    onClick={() => handleSelectAttributeBoost(
                      attr as AttributeName, 
                      selectedAttributeBoost.amount
                    )}
                    className="justify-start"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    {attr.charAt(0).toUpperCase() + attr.slice(1)} +{selectedAttributeBoost.amount}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Utility Spells Selection Dialog */}
      {selectedUtilitySpells && character && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedUtilitySpells(null);
          setUtilitySpellSelection([]);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Utility Spells</DialogTitle>
              <DialogDescription>
                {(() => {
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpells, 
                    character
                  );
                  const spellCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpells, 
                    availableSchools
                  );
                  if (selectedUtilitySpells.selectionMode === "per_school") {
                    return `Select ${selectedUtilitySpells.spellsPerSchool || 1} utility spell${(selectedUtilitySpells.spellsPerSchool || 1) > 1 ? "s" : ""} from each of ${availableSchools.length} school${availableSchools.length > 1 ? "s" : ""} (${spellCount} total).`;
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
                    selectedUtilitySpells, 
                    character
                  );
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpells, 
                    character
                  );
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpells, 
                    availableSchools
                  );

                  return availableSpells.map((spell) => (
                    <div key={spell.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={utilitySpellSelection.includes(spell.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (utilitySpellSelection.length < expectedCount) {
                              setUtilitySpellSelection([...utilitySpellSelection, spell.id]);
                            }
                          } else {
                            setUtilitySpellSelection(utilitySpellSelection.filter(id => id !== spell.id));
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
                  selectedUtilitySpells,
                  utilitySpellSelection,
                  character
                )}
              >
                {(() => {
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                    selectedUtilitySpells, 
                    character
                  );
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(
                    selectedUtilitySpells, 
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