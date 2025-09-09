"use client";

import React, { useState } from "react";

import {
  AttributeName,
  Character,
  EffectSelection,
  PoolFeatureEffectSelection,
  UtilitySpellsEffectSelection,
} from "@/lib/schemas/character";
import {
  AttributeBoostFeatureEffect,
  CharacterFeature,
  ClassFeature,
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  SubclassChoiceFeatureEffect,
  UtilitySpellsFeatureEffect,
} from "@/lib/schemas/features";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { AttributeBoostSelectionDialog } from "./dialogs/attribute-boost-selection-dialog";
import { FeaturePoolSelectionDialog } from "./dialogs/feature-pool-selection-dialog";
import { SpellSchoolSelectionDialog } from "./dialogs/spell-school-selection-dialog";
import { SubclassSelectionDialog } from "./dialogs/subclass-selection-dialog";
import { UtilitySpellSelectionDialog } from "./dialogs/utility-spell-selection-dialog";
import { FeatureCard } from "./feature-card";
import { FeatureEffectsDisplay } from "./feature-effects-display";

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
  const [selectedPoolFeatureEffect, setSelectedPoolFeatureEffect] =
    useState<PickFeatureFromPoolFeatureEffect | null>(null);
  const [selectedSubclassChoiceEffect, setSelectedSubclassChoiceEffect] =
    useState<SubclassChoiceFeatureEffect | null>(null);
  const [selectedSpellSchoolChoiceEffect, setSelectedSpellSchoolChoiceEffect] =
    useState<SpellSchoolChoiceFeatureEffect | null>(null);
  const [selectedAttributeBoostEffect, setSelectedAttributeBoostEffect] =
    useState<AttributeBoostFeatureEffect | null>(null);
  const [selectedUtilitySpellsEffect, setSelectedUtilitySpellsEffect] =
    useState<UtilitySpellsFeatureEffect | null>(null);
  const [existingUtilitySpellSelections, setExistingUtilitySpellSelections] = useState<
    UtilitySpellsEffectSelection[]
  >([]);
  const [existingAttributeSelection, setExistingAttributeSelection] = useState<
    AttributeName | undefined
  >();
  const [existingSpellSchoolSelection, setExistingSpellSchoolSelection] = useState<
    string | undefined
  >();

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
        // Check for existing selection
        const existingSchoolSelection = existingSelections.find(
          (s) => s.type === "spell_school" && s.grantedByEffectId === effect.id,
        );
        if (existingSchoolSelection && existingSchoolSelection.type === "spell_school") {
          setExistingSpellSchoolSelection(existingSchoolSelection.schoolId);
        } else {
          setExistingSpellSchoolSelection(undefined);
        }
        break;
      case "attribute_boost":
        setSelectedAttributeBoostEffect(effect);
        // Check for existing selection
        const existingAttrSelection = existingSelections.find(
          (s) => s.type === "attribute_boost" && s.grantedByEffectId === effect.id,
        );
        if (existingAttrSelection && existingAttrSelection.type === "attribute_boost") {
          setExistingAttributeSelection(existingAttrSelection.attribute);
        } else {
          setExistingAttributeSelection(undefined);
        }
        break;
      case "utility_spells":
        setSelectedUtilitySpellsEffect(effect);
        console.log(existingSelections, effect);
        // Check if there are existing selections for this effect
        const existingUtilitySelections = existingSelections.filter(
          (s) => s.type === "utility_spells" && s.grantedByEffectId === effect.id,
        ) as UtilitySpellsEffectSelection[];
        console.log(existingUtilitySelections);
        setExistingUtilitySpellSelections(existingUtilitySelections);
        break;
    }
  };

  // Handler for selection changes
  const handleSelectionChange = (effectId: string, selection: EffectSelection | null) => {
    if (selection) {
      // Add or update selection
      const updated = existingSelections.filter((s) => s.grantedByEffectId !== effectId);
      updated.push(selection);
      onSelectionsChange(updated);
    } else {
      // Remove selection
      const updated = existingSelections.filter((s) => s.grantedByEffectId !== effectId);
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

  const handleSelectUtilitySpells = (selections: UtilitySpellsEffectSelection[]) => {
    if (!selectedUtilitySpellsEffect || !character) return;

    // Remove existing selections for this effect
    const otherSelections = existingSelections.filter(
      (s) =>
        !(s.type === "utility_spells" && s.grantedByEffectId === selectedUtilitySpellsEffect.id),
    );

    // Add new selections
    const updated = [...otherSelections, ...selections];
    onSelectionsChange(updated);

    setSelectedUtilitySpellsEffect(null);
    setExistingUtilitySpellSelections([]);
  };

  const handleSelectPoolFeatures = (newSelections: PoolFeatureEffectSelection[]) => {
    if (!selectedPoolFeatureEffect) return;

    // Remove existing selections for this effect
    const otherSelections = existingSelections.filter(
      (s) => !(s.type === "pool_feature" && s.grantedByEffectId === selectedPoolFeatureEffect.id),
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

  // Get ability override info from character service
  const characterService = getCharacterService();
  const abilityOverrideInfo = characterService.getAbilityOverrideInfo();

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
                  onOpenSelectionDialog={handleOpenSelectionDialog}
                  character={character}
                  abilityOverrideInfo={abilityOverrideInfo}
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
          existingSelections={
            existingSelections.filter(
              (s) => s.type === "pool_feature",
            ) as PoolFeatureEffectSelection[]
          }
        />
      )}

      {selectedSubclassChoiceEffect && (
        <SubclassSelectionDialog
          subclassChoice={selectedSubclassChoiceEffect}
          onSelectSubclass={handleSelectSubclass}
          onClose={() => setSelectedSubclassChoiceEffect(null)}
          classId={
            character?.classId ||
            (source === "class" && features[0]?.id?.split("-")[0]) ||
            undefined
          }
        />
      )}

      {/* Spell School Selection Dialog */}
      {selectedSpellSchoolChoiceEffect && character && (
        <SpellSchoolSelectionDialog
          effect={selectedSpellSchoolChoiceEffect}
          character={character}
          open={!!selectedSpellSchoolChoiceEffect}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSpellSchoolChoiceEffect(null);
              setExistingSpellSchoolSelection(undefined);
            }
          }}
          onConfirm={handleSelectSpellSchool}
          existingSelection={existingSpellSchoolSelection}
          existingSchools={existingFeatures.spellSchools}
        />
      )}

      {/* Attribute Boost Selection Dialog */}
      {selectedAttributeBoostEffect && (
        <AttributeBoostSelectionDialog
          effect={selectedAttributeBoostEffect}
          open={!!selectedAttributeBoostEffect}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAttributeBoostEffect(null);
              setExistingAttributeSelection(undefined);
            }
          }}
          onConfirm={handleSelectAttributeBoost}
          existingSelection={existingAttributeSelection}
        />
      )}

      {/* Utility Spells Selection Dialog */}
      {selectedUtilitySpellsEffect && character && (
        <UtilitySpellSelectionDialog
          effect={selectedUtilitySpellsEffect}
          character={character}
          open={!!selectedUtilitySpellsEffect}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUtilitySpellsEffect(null);
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
