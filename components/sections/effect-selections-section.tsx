"use client";

import { Plus, Sparkles, Shield, BookOpen, Target, Zap } from "lucide-react";
import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getClassService } from "@/lib/services/service-factory";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { 
  PickFeatureFromPoolFeatureEffect,
  SubclassChoiceFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  AttributeBoostFeatureEffect,
  UtilitySpellsFeatureEffect,
  FeatureEffect
} from "@/lib/schemas/features";
import { AttributeName } from "@/lib/schemas/character";

import { FeaturePoolSelectionDialog } from "../feature-pool-selection-dialog";
import { SubclassSelectionDialog } from "../subclass-selection-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";

interface PendingSelection {
  effect: FeatureEffect;
  effectId: string;
}

export function EffectSelectionsSection() {
  const { character, updateCharacter, getAvailableEffectSelections } = useCharacterService();
  const [selectedPoolFeature, setSelectedPoolFeature] = useState<PickFeatureFromPoolFeatureEffect | null>(null);
  const [selectedSubclassChoice, setSelectedSubclassChoice] = useState<SubclassChoiceFeatureEffect | null>(null);
  const [selectedSpellSchoolChoice, setSelectedSpellSchoolChoice] = useState<PendingSelection | null>(null);
  const [selectedAttributeBoost, setSelectedAttributeBoost] = useState<PendingSelection | null>(null);
  const [selectedUtilitySpells, setSelectedUtilitySpells] = useState<PendingSelection | null>(null);
  const [utilitySpellSelection, setUtilitySpellSelection] = useState<string[]>([]);

  if (!character) return null;

  const classService = getClassService();
  const contentRepository = ContentRepositoryService.getInstance();

  // Get all available selections from character service
  const availableSelections = getAvailableEffectSelections();

  const { 
    poolSelections: availablePoolSelections,
    subclassChoices: availableSubclassChoices,
    spellSchoolSelections: availableSpellSchoolSelections,
    attributeBoosts: availableAttributeBoosts,
    utilitySpellSelections: availableUtilitySpellSelections
  } = availableSelections;

  const totalSelections = 
    availablePoolSelections.length + 
    availableSubclassChoices.length +
    availableSpellSchoolSelections.length +
    availableAttributeBoosts.length +
    availableUtilitySpellSelections.length;

  if (totalSelections === 0) {
    return null;
  }

  // Handler functions for selections
  const handleSelectSpellSchool = async (schoolId: string) => {
    if (!selectedSpellSchoolChoice) return;

    const updatedCharacter = {
      ...character,
      effectSelections: [
        ...character.effectSelections,
        {
          type: "spell_school" as const,
          grantedByEffectId: selectedSpellSchoolChoice.effectId,
          schoolId
        }
      ]
    };

    await updateCharacter(updatedCharacter);
    setSelectedSpellSchoolChoice(null);
  };

  const handleSelectAttributeBoost = async (attribute: AttributeName, amount: number) => {
    if (!selectedAttributeBoost) return;

    const updatedCharacter = {
      ...character,
      effectSelections: [
        ...character.effectSelections,
        {
          type: "attribute_boost" as const,
          grantedByEffectId: selectedAttributeBoost.effectId,
          attribute,
          amount
        }
      ]
    };

    await updateCharacter(updatedCharacter);
    setSelectedAttributeBoost(null);
  };

  const handleSelectUtilitySpells = async () => {
    if (!selectedUtilitySpells) return;
    const effect = selectedUtilitySpells.effect as UtilitySpellsFeatureEffect;
    
    if (!featureSelectionService.validateUtilitySpellSelection(effect, utilitySpellSelection, character)) {
      return; // Invalid selection
    }

    const updatedCharacter = {
      ...character,
      effectSelections: [
        ...character.effectSelections,
        {
          type: "utility_spells" as const,
          grantedByEffectId: selectedUtilitySpells.effectId,
          spellIds: utilitySpellSelection,
          fromSchools: featureSelectionService.getAvailableSchoolsForUtilitySpells(effect, character)
        }
      ]
    };

    await updateCharacter(updatedCharacter);
    setSelectedUtilitySpells(null);
    setUtilitySpellSelection([]);
  };

  const getSelectionIcon = (type: string) => {
    switch (type) {
      case "subclass": return <Shield className="w-4 h-4 text-purple-600" />;
      case "pool_feature": return <Zap className="w-4 h-4 text-orange-600" />;
      case "spell_school": return <BookOpen className="w-4 h-4 text-blue-600" />;
      case "attribute_boost": return <Target className="w-4 h-4 text-green-600" />;
      case "utility_spells": return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default: return <Plus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSelectionColor = (type: string) => {
    switch (type) {
      case "subclass": return "border-purple-200 bg-purple-50";
      case "pool_feature": return "border-orange-200 bg-orange-50";
      case "spell_school": return "border-blue-200 bg-blue-50";
      case "attribute_boost": return "border-green-200 bg-green-50";
      case "utility_spells": return "border-indigo-200 bg-indigo-50";
      default: return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Character Selections Available
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {totalSelections}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Subclass Selections */}
          {availableSubclassChoices.map((subclassChoice: any, index: number) => (
            <div
              key={`subclass-${index}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("subclass")}`}
            >
              <div className="flex items-center gap-3 flex-1">
                {getSelectionIcon("subclass")}
                <div>
                  <div className="font-medium">Subclass Selection</div>
                  <div className="text-sm text-muted-foreground">
                    Choose your class specialization
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => setSelectedSubclassChoice(subclassChoice)}
              >
                Choose Subclass
              </Button>
            </div>
          ))}

          {/* Pool Feature Selections */}
          {availablePoolSelections.map((selection: any, index: number) => {
            const pickEffect = selection.effect;
            const pool = classService.getFeaturePool(character.classId, pickEffect.poolId);
            const remaining = pickEffect.choicesAllowed - character.effectSelections.filter(
              s => s.type === "pool_feature" && s.grantedByEffectId === selection.effectId
            ).length;

            return (
              <div
                key={`pool-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("pool_feature")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("pool_feature")}
                  <div>
                    <div className="font-medium">Feature Pool Selection</div>
                    <div className="text-sm text-muted-foreground">
                      Choose from {pool?.name || pickEffect.poolId}
                    </div>
                    {pool && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {remaining} selection{remaining !== 1 ? "s" : ""} remaining
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setSelectedPoolFeature(pickEffect)}
                  disabled={remaining <= 0}
                >
                  Select Feature
                </Button>
              </div>
            );
          })}

          {/* Spell School Selections */}
          {availableSpellSchoolSelections.map((selection: any, index: number) => {
            const effect = selection.effect as SpellSchoolChoiceFeatureEffect;
            const numberOfChoices = effect.numberOfChoices || 1;
            return (
              <div
                key={`spell-school-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("spell_school")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("spell_school")}
                  <div>
                    <div className="font-medium">Spell School Selection</div>
                    <div className="text-sm text-muted-foreground">
                      Choose {numberOfChoices} spell school{numberOfChoices > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setSelectedSpellSchoolChoice({ effect: selection.effect, effectId: selection.effectId })}
                >
                  Choose School
                </Button>
              </div>
            );
          })}

          {/* Attribute Boost Selections */}
          {availableAttributeBoosts.map((selection: any, index: number) => {
            const effect = selection.effect as AttributeBoostFeatureEffect;
            return (
              <div
                key={`attribute-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("attribute_boost")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("attribute_boost")}
                  <div>
                    <div className="font-medium">Attribute Boost</div>
                    <div className="text-sm text-muted-foreground">
                      Choose an attribute to boost by +{effect.amount}
                      {effect.allowedAttributes.length < 4 && ` from: ${effect.allowedAttributes.join(", ")}`}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setSelectedAttributeBoost({ effect: selection.effect, effectId: selection.effectId })}
                >
                  Choose Boost
                </Button>
              </div>
            );
          })}

          {/* Utility Spell Selections */}
          {availableUtilitySpellSelections.map((selection: any, index: number) => {
            const effect = selection.effect as UtilitySpellsFeatureEffect;
            const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(effect, character);
            const spellCount = featureSelectionService.getUtilitySpellSelectionCount(effect, availableSchools);
            return (
              <div
                key={`utility-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("utility_spells")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("utility_spells")}
                  <div>
                    <div className="font-medium">Utility Spells</div>
                    <div className="text-sm text-muted-foreground">
                      Choose {spellCount} utility spell{spellCount > 1 ? "s" : ""}
                      {effect.selectionMode === "per_school" && ` (${effect.spellsPerSchool || 1} per school)`}
                      {effect.schools && effect.schools.length > 0 && ` from: ${effect.schools.join(", ")}`}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedUtilitySpells({ effect: selection.effect, effectId: selection.effectId });
                    setUtilitySpellSelection([]);
                  }}
                >
                  Choose Spells
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pool Feature Selection Dialog */}
      {selectedPoolFeature && (
        <FeaturePoolSelectionDialog
          pickFeature={selectedPoolFeature}
          onClose={() => setSelectedPoolFeature(null)}
        />
      )}

      {/* Subclass Selection Dialog */}
      {selectedSubclassChoice && (
        <SubclassSelectionDialog
          subclassChoice={selectedSubclassChoice}
          onClose={() => setSelectedSubclassChoice(null)}
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
                  {contentRepository.getAllSpellSchools().map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      <div className="flex items-center gap-2">
                        <span className={school.color}>{school.icon}</span>
                        {school.name}
                      </div>
                    </SelectItem>
                  ))}
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
              {(() => {
                const effect = selectedAttributeBoost.effect as AttributeBoostFeatureEffect;
                const availableAttributes = effect.allowedAttributes;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    {availableAttributes.map((attr) => (
                      <Button
                        key={attr}
                        variant="outline"
                        onClick={() => handleSelectAttributeBoost(attr as AttributeName, effect.amount)}
                        className="justify-start"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {attr.charAt(0).toUpperCase() + attr.slice(1)} +{effect.amount}
                      </Button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Utility Spells Selection Dialog */}
      {selectedUtilitySpells && (
        <Dialog open={true} onOpenChange={() => {
          setSelectedUtilitySpells(null);
          setUtilitySpellSelection([]);
        }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose Utility Spells</DialogTitle>
              <DialogDescription>
                {(() => {
                  const effect = selectedUtilitySpells.effect as UtilitySpellsFeatureEffect;
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(effect, character);
                  const spellCount = featureSelectionService.getUtilitySpellSelectionCount(effect, availableSchools);
                  if (effect.selectionMode === "per_school") {
                    return `Select ${effect.spellsPerSchool || 1} utility spell${(effect.spellsPerSchool || 1) > 1 ? "s" : ""} from each of ${availableSchools.length} school${availableSchools.length > 1 ? "s" : ""} (${spellCount} total).`;
                  } else {
                    return `Select ${spellCount} utility spell${spellCount > 1 ? "s" : ""} to learn.`;
                  }
                })()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {(() => {
                  const effect = selectedUtilitySpells.effect as UtilitySpellsFeatureEffect;
                  const availableSpells = featureSelectionService.getAvailableUtilitySpells(effect, character);
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(effect, character);
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(effect, availableSchools);

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
                  selectedUtilitySpells.effect as UtilitySpellsFeatureEffect,
                  utilitySpellSelection,
                  character
                )}
              >
                {(() => {
                  const effect = selectedUtilitySpells.effect as UtilitySpellsFeatureEffect;
                  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(effect, character);
                  const expectedCount = featureSelectionService.getUtilitySpellSelectionCount(effect, availableSchools);
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