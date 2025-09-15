"use client";

import { BookOpen, Plus, Shield, Sparkles, Target, Zap } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import {
  AttributeName,
  PoolFeatureTraitSelection,
  UtilitySpellsTraitSelection,
} from "@/lib/schemas/character";
import {
  AttributeBoostFeatureTrait,
  FeatureTrait,
  PickFeatureFromPoolFeatureTrait,
  SpellSchoolChoiceFeatureTrait,
  SubclassChoiceFeatureTrait,
  UtilitySpellsFeatureTrait,
} from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getCharacterService, getClassService } from "@/lib/services/service-factory";
import { getIconById } from "@/lib/utils/icon-utils";

import { AttributeBoostSelectionDialog } from "../dialogs/attribute-boost-selection-dialog";
import { FeaturePoolSelectionDialog } from "../dialogs/feature-pool-selection-dialog";
import { SpellSchoolSelectionDialog } from "../dialogs/spell-school-selection-dialog";
import { SubclassSelectionDialog } from "../dialogs/subclass-selection-dialog";
import { UtilitySpellSelectionDialog } from "../dialogs/utility-spell-selection-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function TraitSelectionsSection() {
  const {
    character,
    getAvailableTraitSelections,
    selectSpellSchool,
    clearSpellSchoolSelections,
    selectAttributeBoost,
    updateUtilitySelectionsForTrait,
  } = useCharacterService();
  const [selectedPoolFeature, setSelectedPoolFeature] =
    useState<PickFeatureFromPoolFeatureTrait | null>(null);
  const [selectedSubclassChoice, setSelectedSubclassChoice] =
    useState<SubclassChoiceFeatureTrait | null>(null);
  const [selectedSpellSchoolChoice, setSelectedSpellSchoolChoice] =
    useState<SpellSchoolChoiceFeatureTrait | null>(null);
  const [existingSpellSchoolSelections, setExistingSpellSchoolSelections] = useState<string[]>([]);
  const [selectedAttributeBoost, setSelectedAttributeBoost] =
    useState<AttributeBoostFeatureTrait | null>(null);
  const [existingAttributeSelection, setExistingAttributeSelection] = useState<
    AttributeName | undefined
  >();
  const [selectedUtilitySpells, setSelectedUtilitySpells] =
    useState<UtilitySpellsFeatureTrait | null>(null);
  const [existingUtilitySpellSelections, setExistingUtilitySpellSelections] = useState<
    UtilitySpellsTraitSelection[]
  >([]);

  if (!character) return null;

  const classService = getClassService();
  const contentRepository = ContentRepositoryService.getInstance();

  // Get all available selections from character service
  const availableSelections = getAvailableTraitSelections();

  const {
    poolSelections: availablePoolSelections,
    subclassChoices: availableSubclassChoices,
    spellSchoolSelections: availableSpellSchoolSelections,
    attributeBoosts: availableAttributeBoosts,
    utilitySpellSelections: availableUtilitySpellSelections,
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

    // Clear existing selections first (the dialog handles single selection)
    const existingSelection = character.traitSelections.find(
      (s) => s.type === "spell_school" && s.grantedByTraitId === selectedSpellSchoolChoice.id,
    );

    if (existingSelection && existingSelection.type === "spell_school") {
      await clearSpellSchoolSelections(selectedSpellSchoolChoice.id!);
    }

    await selectSpellSchool(schoolId, selectedSpellSchoolChoice.id!);
    setSelectedSpellSchoolChoice(null);
    setExistingSpellSchoolSelections([]);
  };

  const handleSelectAttributeBoost = async (attribute: AttributeName, amount: number) => {
    if (!selectedAttributeBoost) return;

    await selectAttributeBoost(attribute, amount, selectedAttributeBoost.id!);
    setSelectedAttributeBoost(null);
    setExistingAttributeSelection(undefined);
  };

  const handleSelectUtilitySpells = async (selections: UtilitySpellsTraitSelection[]) => {
    if (!selectedUtilitySpells) return;

    // Use the new method to update all selections for this effect
    await updateUtilitySelectionsForTrait(selectedUtilitySpells.id!, selections);

    setSelectedUtilitySpells(null);
    setExistingUtilitySpellSelections([]);
  };

  const getSelectionIcon = (type: string) => {
    switch (type) {
      case "subclass":
        return <Shield className="w-4 h-4 text-purple-600" />;
      case "pool_feature":
        return <Zap className="w-4 h-4 text-orange-600" />;
      case "spell_school":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case "attribute_boost":
        return <Target className="w-4 h-4 text-green-600" />;
      case "utility_spells":
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <Plus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSelectionColor = (type: string) => {
    switch (type) {
      case "subclass":
        return "border-purple-200 dark:border-purple-800 bg-purple-500/5";
      case "pool_feature":
        return "border-orange-200 dark:border-orange-800 bg-orange-500/5";
      case "spell_school":
        return "border-blue-200 dark:border-blue-800 bg-blue-500/5";
      case "attribute_boost":
        return "border-green-200 dark:border-green-800 bg-green-500/5";
      case "utility_spells":
        return "border-indigo-200 dark:border-indigo-800 bg-indigo-500/5";
      default:
        return "border-gray-200 dark:border-gray-800 bg-gray-500/5";
    }
  };

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Character Selections Available
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-800 dark:text-amber-200">
              {totalSelections}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Subclass Selections */}
          {availableSubclassChoices.map((effect: SubclassChoiceFeatureTrait, index: number) => (
            <div
              key={effect.id || `subclass-${index}`}
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
              <Button size="sm" onClick={() => setSelectedSubclassChoice(effect)}>
                Choose Subclass
              </Button>
            </div>
          ))}

          {/* Pool Feature Selections */}
          {availablePoolSelections.map((effect: PickFeatureFromPoolFeatureTrait, index: number) => {
            const contentRepository = ContentRepositoryService.getInstance();
            const pool = contentRepository.getFeaturePool(effect.poolId);
            const remaining =
              effect.choicesAllowed -
              character.traitSelections.filter(
                (s) => s.type === "pool_feature" && s.grantedByTraitId === effect.id,
              ).length;

            return (
              <div
                key={effect.id || `pool-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("pool_feature")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("pool_feature")}
                  <div>
                    <div className="font-medium">Feature Pool Selection</div>
                    <div className="text-sm text-muted-foreground">
                      Choose from {pool?.name || effect.poolId}
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
                  onClick={() => setSelectedPoolFeature(effect)}
                  disabled={remaining <= 0}
                >
                  Select Feature
                </Button>
              </div>
            );
          })}

          {/* Spell School Selections */}
          {availableSpellSchoolSelections.map(
            (effect: SpellSchoolChoiceFeatureTrait, index: number) => {
              const numberOfChoices = effect.numberOfChoices || 1;
              return (
                <div
                  key={effect.id || `spell-school-${index}`}
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
                    onClick={() => {
                      setSelectedSpellSchoolChoice(effect);
                      // Get all existing spell school selections to filter them out
                      const characterService = getCharacterService();
                      const existingSchools = characterService.getSpellSchools();
                      setExistingSpellSchoolSelections(existingSchools);
                    }}
                  >
                    {character.traitSelections.some(
                      (s) => s.type === "spell_school" && s.grantedByTraitId === effect.id,
                    )
                      ? "Edit School"
                      : "Choose School"}
                  </Button>
                </div>
              );
            },
          )}

          {/* Attribute Boost Selections */}
          {availableAttributeBoosts.map((effect: AttributeBoostFeatureTrait, index: number) => {
            return (
              <div
                key={effect.id || `attribute-${index}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("attribute_boost")}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getSelectionIcon("attribute_boost")}
                  <div>
                    <div className="font-medium">Attribute Boost</div>
                    <div className="text-sm text-muted-foreground">
                      Choose an attribute to boost by +{effect.amount}
                      {effect.allowedAttributes.length < 4 &&
                        ` from: ${effect.allowedAttributes.join(", ")}`}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAttributeBoost(effect);
                    // Check if there's an existing selection for this effect
                    const existingSelection = character.traitSelections.find(
                      (s) => s.type === "attribute_boost" && s.grantedByTraitId === effect.id,
                    );
                    if (existingSelection && existingSelection.type === "attribute_boost") {
                      setExistingAttributeSelection(existingSelection.attribute);
                    } else {
                      setExistingAttributeSelection(undefined);
                    }
                  }}
                >
                  {character.traitSelections.some(
                    (s) => s.type === "attribute_boost" && s.grantedByTraitId === effect.id,
                  )
                    ? "Edit Boost"
                    : "Choose Boost"}
                </Button>
              </div>
            );
          })}

          {/* Utility Spell Selections */}
          {availableUtilitySpellSelections.map(
            (effect: UtilitySpellsFeatureTrait, index: number) => {
              const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
                effect,
                character,
              );
              const totalRequired = featureSelectionService.getUtilitySpellSelectionCount(
                effect,
                availableSchools,
              );
              const remaining = featureSelectionService.getRemainingUtilitySpellSelections(
                character,
                effect,
              );
              const selected = totalRequired - remaining;

              return (
                <div
                  key={effect.id || `utility-${index}`}
                  className={`flex items-center justify-between p-3 rounded-lg border ${getSelectionColor("utility_spells")}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getSelectionIcon("utility_spells")}
                    <div>
                      <div className="font-medium">Utility Spells</div>
                      <div className="text-sm text-muted-foreground">
                        {selected > 0 ? (
                          <>
                            Selected {selected}/{totalRequired} spells - {remaining} remaining
                          </>
                        ) : (
                          <>
                            Choose {totalRequired} utility spell{totalRequired > 1 ? "s" : ""}
                          </>
                        )}
                        {effect.selectionMode === "per_school" &&
                          ` (${effect.numberOfSpells || 1} per school)`}
                        {effect.schools &&
                          effect.schools.length > 0 &&
                          ` from: ${effect.schools.join(", ")}`}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUtilitySpells(effect);
                      // Check if there are existing selections for this effect
                      const existingSelections = character.traitSelections.filter(
                        (s) => s.type === "utility_spells" && s.grantedByTraitId === effect.id,
                      ) as UtilitySpellsTraitSelection[];
                      setExistingUtilitySpellSelections(existingSelections);
                    }}
                  >
                    {selected > 0 ? "Edit Spells" : "Choose Spells"}
                  </Button>
                </div>
              );
            },
          )}
        </CardContent>
      </Card>

      {/* Pool Feature Selection Dialog */}
      {selectedPoolFeature && (
        <FeaturePoolSelectionDialog
          pickPoolFeatureTrait={selectedPoolFeature}
          onClose={() => setSelectedPoolFeature(null)}
          onSelectFeatures={async (newSelections: PoolFeatureTraitSelection[]) => {
            const characterService = getCharacterService();
            // Use the new API to update all selections for this effect
            await characterService.updatePoolSelectionsForTrait(
              selectedPoolFeature.id,
              newSelections,
            );
          }}
          existingSelections={
            character.traitSelections.filter(
              (s) => s.type === "pool_feature",
            ) as PoolFeatureTraitSelection[]
          }
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
        <SpellSchoolSelectionDialog
          effect={selectedSpellSchoolChoice}
          character={character}
          open={!!selectedSpellSchoolChoice}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSpellSchoolChoice(null);
              setExistingSpellSchoolSelections([]);
            }
          }}
          onConfirm={handleSelectSpellSchool}
          existingSelection={(() => {
            const selection = character.traitSelections.find(
              (s) =>
                s.type === "spell_school" && s.grantedByTraitId === selectedSpellSchoolChoice.id,
            );
            return selection?.type === "spell_school" ? selection.schoolId : undefined;
          })()}
          existingSchools={existingSpellSchoolSelections}
        />
      )}

      {/* Attribute Boost Selection Dialog */}
      {selectedAttributeBoost && (
        <AttributeBoostSelectionDialog
          effect={selectedAttributeBoost}
          open={!!selectedAttributeBoost}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAttributeBoost(null);
              setExistingAttributeSelection(undefined);
            }
          }}
          onConfirm={handleSelectAttributeBoost}
          existingSelection={existingAttributeSelection}
        />
      )}

      {/* Utility Spells Selection Dialog */}
      {selectedUtilitySpells && (
        <UtilitySpellSelectionDialog
          effect={selectedUtilitySpells}
          character={character}
          open={!!selectedUtilitySpells}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUtilitySpells(null);
              setExistingUtilitySpellSelections([]);
            }
          }}
          onConfirm={handleSelectUtilitySpells}
          existingSelections={existingUtilitySpellSelections}
        />
      )}
    </>
  );
}
