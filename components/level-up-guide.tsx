"use client";

import { Sparkles } from "lucide-react";

import React, { useState } from "react";

import { WizardDialog } from "@/components/wizard/wizard-dialog";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { resourceService } from "@/lib/services/resource-service";
import {
  getCharacterService,
  getClassService,
  getContentRepository,
  getDiceService,
} from "@/lib/services/service-factory";
import { AttributeName, EffectSelection } from "@/lib/schemas/character";
import {
  ClassFeature,
  AbilityFeatureEffect,
  AttributeBoostFeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  ResourceFeatureEffect,
  SpellSchoolFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  SpellTierAccessFeatureEffect,
  SubclassChoiceFeatureEffect,
  UtilitySpellsFeatureEffect,
} from "@/lib/schemas/features";

import {
  FeatureSelectionStep,
  HitPointsStep,
  LevelSelectionStep,
  SkillsStep,
} from "./level-up-guide/index";

interface LevelUpGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LevelUpData {
  levelsToGain: number;
  hpRolls: Array<{
    level: number;
    roll1: number;
    roll2: number;
    result: number;
  }>;
  totalHpGain: number;
  newMaxHp: number;
  newHitDice: { current: number; max: number };
  skillAllocations: Record<string, number>;
  effectSelections: EffectSelection[]; // Selections for interactive features
}

const STEPS = [
  { id: "levels", label: "Choose Levels" },
  { id: "hp", label: "Roll Hit Points" },
  { id: "skills", label: "Allocate Skills" },
  { id: "features", label: "Select Features" },
  // More steps to come: 'abilities', 'review'
];

// Helper function to determine primary feature type from effects
function getPrimaryFeatureType(feature: ClassFeature): string {
  if (feature.effects.length === 0) {
    return "passive_feature";
  }

  // Return the first effect type as the primary type
  return feature.effects[0].type;
}

export function LevelUpGuide({ open, onOpenChange }: LevelUpGuideProps) {
  const { character, updateCharacter } = useCharacterService();
  const [currentStep, setCurrentStep] = useState(0);
  const [levelUpData, setLevelUpData] = useState<LevelUpData>({
    levelsToGain: 1,
    hpRolls: [],
    totalHpGain: 0,
    newMaxHp: character?.hitPoints.max || 0,
    newHitDice: character ? { ...character._hitDice } : { current: 0, max: 0 },
    skillAllocations: {},
    effectSelections: [],
  });

  // Service instances
  const diceService = getDiceService();
  const contentRepo = getContentRepository();

  // Early return if no character loaded (after all hooks)
  if (!character) return null;

  // Get class definition for hit die size
  const classDefinition = contentRepo.getClassDefinition(character.classId);
  const hitDieSize = classDefinition?.hitDieSize || 8;

  const handleNext = () => {
    if (currentStep === 0) {
      // Moving from level selection to HP rolling - roll the dice
      rollHitPoints();
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Moving from HP to Skills
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Moving from Skills to Features
      setCurrentStep(3);
    } else if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - apply changes
      applyLevelUp();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const rollHitPoints = () => {
    const rolls: Array<{
      level: number;
      roll1: number;
      roll2: number;
      result: number;
    }> = [];
    let totalGain = 0;

    for (let i = 0; i < levelUpData.levelsToGain; i++) {
      const currentLevel = character.level + i + 1;

      // Roll with advantage (roll twice, take the higher)
      const roll1 = diceService.rollSingleDie(hitDieSize as any);
      const roll2 = diceService.rollSingleDie(hitDieSize as any);
      const result = Math.max(roll1, roll2);

      rolls.push({
        level: currentLevel,
        roll1,
        roll2,
        result,
      });

      totalGain += result;
    }

    setLevelUpData((prev) => ({
      ...prev,
      hpRolls: rolls,
      totalHpGain: totalGain,
      newMaxHp: character.hitPoints.max + totalGain,
      newHitDice: {
        current: character._hitDice.current + levelUpData.levelsToGain,
        max: character._hitDice.max + levelUpData.levelsToGain,
      },
    }));
  };

  const applyLevelUp = async () => {
    try {
      // Apply skill allocations
      const updatedSkills = { ...character._skills };
      Object.entries(levelUpData.skillAllocations).forEach(([skillName, points]) => {
        const skill = updatedSkills[skillName as keyof typeof updatedSkills];
        if (points > 0 && skill) {
          updatedSkills[skillName as keyof typeof updatedSkills] = {
            ...skill,
            modifier: (skill.modifier || 0) + points,
          };
        }
      });

      // Prepare feature-related updates
      let updatedAttributes = { ...character._attributes };
      let updatedAbilities = [...character._abilities];
      let updatedResourceDefinitions = [...(character._resourceDefinitions || [])];
      let updatedResourceValues = new Map(character._resourceValues || new Map());
      let effectSelections: EffectSelection[] = [...(character.effectSelections || [])];
      let spellTierAccess = character._spellTierAccess;
      const characterService = getCharacterService();

      // Process feature selections
      const classService = getClassService();

      // Get all features for the levels being gained
      for (let i = 0; i < levelUpData.levelsToGain; i++) {
        const targetLevel = character.level + i + 1;

        // Get features for this specific level by comparing with previous level
        const tempCharacter = { ...character, level: targetLevel };
        const allFeaturesAtLevel = classService.getExpectedFeaturesForCharacter(tempCharacter);
        const tempCharacterPrev = { ...character, level: targetLevel - 1 };
        const allFeaturesAtPrevLevel =
          classService.getExpectedFeaturesForCharacter(tempCharacterPrev);

        // Features for this level are the difference
        const levelFeatures = allFeaturesAtLevel.filter(
          (feature) =>
            !allFeaturesAtPrevLevel.some(
              (prevFeature) =>
                prevFeature.name === feature.name && prevFeature.level === feature.level,
            ),
        );

        // Process each feature's effects directly
        for (const feature of levelFeatures) {
          // Features are now dynamically calculated, no need to track granted features

          // Process all effects of the feature
          for (let effectIndex = 0; effectIndex < feature.effects.length; effectIndex++) {
            const effect = feature.effects[effectIndex];
            const effectId = effect.id || `${feature.id}-${effectIndex}`;
            
            // Find the selection for this effect
            const selection = levelUpData.effectSelections.find(
              s => s.grantedByEffectId === effectId
            );

            const primaryType = effect.type;
          switch (primaryType) {
            case "attribute_boost":
              if (selection?.type === "attribute_boost" && selection.attribute) {
                const attributeBoostEffect = effect as AttributeBoostFeatureEffect;
                const boostAmount = attributeBoostEffect?.amount || 1;
                updatedAttributes[selection.attribute] = Math.min(
                  10,
                  updatedAttributes[selection.attribute] + boostAmount,
                );
                // Selection is already tracked in levelUpData.effectSelections
                effectSelections.push(selection);
              }
              break;

            case "spell_school_choice":
              if (selection?.type === "spell_school" && selection.schoolId) {
                // Create a spell school feature for the selected school
                const selectedSchool = contentRepo
                  .getAllSpellSchools()
                  .find((s) => s.id === selection.schoolId);
                if (selectedSchool) {
                  // Get spells from the selected school up to current tier access
                  const schoolSpells = contentRepo
                    .getSpellsBySchool(selection.schoolId)
                    .filter((spell) => spell.tier <= spellTierAccess);

                  // Add spells that aren't already in abilities
                  const currentSpellIds = new Set(
                    updatedAbilities.filter((a) => a.type === "spell").map((a) => a.id),
                  );
                  const newSpells = schoolSpells.filter((spell) => !currentSpellIds.has(spell.id));
                  updatedAbilities.push(...newSpells);

                  // Selection is already tracked in levelUpData.effectSelections
                  effectSelections.push(selection);
                }
              }
              break;

            case "utility_spells":
              // Get all utility spell selections for this effect
              const utilitySelections = levelUpData.effectSelections.filter(
                s => s.type === "utility_spells" && s.grantedByEffectId === effectId
              );
              
              if (utilitySelections.length > 0) {
                // Add selected utility spells
                const utilitySpellsEffect = effect as UtilitySpellsFeatureEffect;
                const addedSpellIds: string[] = [];

                utilitySelections.forEach((sel) => {
                  if (sel.type === "utility_spells") {
                    const spell = contentRepo.getSpellById(sel.spellId);
                    if (spell && spell.tier === 0) {
                      // Add spell if not already in abilities
                      const currentSpellIds = new Set(
                        updatedAbilities.filter((a) => a.type === "spell").map((a) => a.id),
                      );
                      if (!currentSpellIds.has(spell.id)) {
                        updatedAbilities.push(spell);
                        addedSpellIds.push(spell.id);
                      }
                    }
                  }
                });

                // Selections are already tracked in levelUpData.effectSelections
                // No need to add them again
              }
              break;

            case "subclass_choice":
              if (selection?.type === "subclass" && selection.subclassId) {
                // Selection is already tracked in levelUpData.effectSelections
                effectSelections.push(selection);
              }
              break;

            case "pick_feature_from_pool":
              if (selection?.type === "pool_feature" && selection.feature) {
                const pickFeatureEffect = effect as PickFeatureFromPoolFeatureEffect;
                const selectedFeature = selection.feature;
                if (selectedFeature) {
                  // Apply the selected feature's effects
                  for (const selectedEffect of selectedFeature.effects) {
                    if (selectedEffect.type === "ability") {
                      const abilityEffect = selectedEffect as AbilityFeatureEffect;
                      if (
                        abilityEffect?.ability &&
                        !updatedAbilities.some((a) => a.id === abilityEffect.ability.id)
                      ) {
                        updatedAbilities.push(abilityEffect.ability);
                      }
                    }
                  }
                  // Selection is already tracked in levelUpData.effectSelections
                  effectSelections.push(selection);
                }
              }
              break;

            case "spell_school":
              const spellSchoolEffect = effect as SpellSchoolFeatureEffect;
              // Get spells from the school up to current tier access
              const schoolSpells = contentRepo
                .getSpellsBySchool(spellSchoolEffect?.schoolId || "")
                .filter((spell) => spell.tier <= spellTierAccess);

              // Add spells that aren't already in abilities
              const currentSpellIds = new Set(
                updatedAbilities.filter((a) => a.type === "spell").map((a) => a.id),
              );
              const newSpells = schoolSpells.filter((spell) => !currentSpellIds.has(spell.id));
              updatedAbilities.push(...newSpells);
              break;

            case "spell_tier_access":
              const tierAccessEffect = effect as SpellTierAccessFeatureEffect;
              spellTierAccess = Math.max(spellTierAccess, tierAccessEffect?.maxTier || 0);
              break;

            case "resource":
              const resourceEffect = effect as ResourceFeatureEffect;
              if (
                resourceEffect?.resourceDefinition &&
                !updatedResourceDefinitions.some(
                  (r) => r.id === resourceEffect.resourceDefinition.id,
                )
              ) {
                updatedResourceDefinitions.push(resourceEffect.resourceDefinition);
                // Initialize the resource value if it doesn't exist
                if (!updatedResourceValues.has(resourceEffect.resourceDefinition.id)) {
                  const initialValue = resourceService.calculateInitialValue(
                    resourceEffect.resourceDefinition
                  );
                  updatedResourceValues.set(
                    resourceEffect.resourceDefinition.id,
                    resourceService.createNumericalValue(initialValue),
                  );
                }
              }
              break;

            case "ability":
              const abilityEffect = effect as AbilityFeatureEffect;
              if (
                abilityEffect?.ability &&
                !updatedAbilities.some((a) => a.id === abilityEffect.ability.id)
              ) {
                updatedAbilities.push(abilityEffect.ability);
              }
              break;
          }
          }
        }
      }

      // Update character with new level, HP, skills, and features
      const updatedCharacter = {
        ...character,
        level: character.level + levelUpData.levelsToGain,
        hitPoints: {
          ...character.hitPoints,
          max: levelUpData.newMaxHp,
          current: levelUpData.newMaxHp, // Set current HP to new max HP after level up
        },
        _hitDice: {
          ...character._hitDice,
          current: levelUpData.newHitDice.current,
          max: levelUpData.newHitDice.max,
        },
        _skills: updatedSkills,
        _attributes: updatedAttributes,
        _abilities: updatedAbilities,
        _resourceDefinitions: updatedResourceDefinitions,
        _resourceValues: updatedResourceValues,
        effectSelections,
        _spellTierAccess: spellTierAccess,
      };

      // Save the updated character
      await updateCharacter(updatedCharacter);

      // Features are now dynamically calculated, no sync needed

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply level up:", error);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "levels":
        return (
          <LevelSelectionStep
            character={character}
            levelsToGain={levelUpData.levelsToGain}
            onLevelsChange={(levels) =>
              setLevelUpData((prev) => ({ ...prev, levelsToGain: levels }))
            }
          />
        );

      case "hp":
        return (
          <HitPointsStep
            character={character}
            levelUpData={levelUpData}
            hitDieSize={`d${hitDieSize}`}
            onHpChange={(newHp) => setLevelUpData((prev) => ({ ...prev, newMaxHp: newHp }))}
            onReroll={rollHitPoints}
          />
        );

      case "skills":
        return (
          <SkillsStep
            character={character}
            levelsToGain={levelUpData.levelsToGain}
            skillAllocations={levelUpData.skillAllocations}
            onSkillAllocationsChange={(allocations) =>
              setLevelUpData((prev) => ({ ...prev, skillAllocations: allocations }))
            }
          />
        );

      case "features":
        return (
          <FeatureSelectionStep
            character={character}
            levelsToGain={levelUpData.levelsToGain}
            effectSelections={levelUpData.effectSelections}
            onEffectSelectionsChange={(selections) =>
              setLevelUpData((prev) => ({ ...prev, effectSelections: selections }))
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <WizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Level Up Guide"
      titleIcon={<Sparkles className="h-5 w-5 text-yellow-500" />}
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onNext={handleNext}
      onPrevious={handlePrevious}
      canProceed={true}
      className="max-w-2xl"
    >
      <div className="px-4 sm:px-6 py-4">{renderStepContent()}</div>
    </WizardDialog>
  );
}
