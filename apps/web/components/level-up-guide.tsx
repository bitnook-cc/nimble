"use client";

import { Sparkles } from "lucide-react";

import React, { useState } from "react";

import { WizardDialog } from "@/components/wizard/wizard-dialog";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { AttributeName, TraitSelection } from "@/lib/schemas/character";
import {
  AbilityFeatureTrait,
  AttributeBoostFeatureTrait,
  ClassFeature,
  PickFeatureFromPoolFeatureTrait,
  ResourceFeatureTrait,
  SpellSchoolChoiceFeatureTrait,
  SpellSchoolFeatureTrait,
  SpellTierAccessFeatureTrait,
  SubclassChoiceFeatureTrait,
  UtilitySpellsFeatureTrait,
} from "@/lib/schemas/features";
import { resourceService } from "@/lib/services/resource-service";
import {
  getCharacterService,
  getClassService,
  getContentRepository,
  getDiceService,
} from "@/lib/services/service-factory";

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
  traitSelections: TraitSelection[]; // Selections for interactive features
}

const STEPS = [
  { id: "levels", label: "Choose Levels" },
  { id: "hp", label: "Roll Hit Points" },
  { id: "skills", label: "Allocate Skills" },
  { id: "features", label: "Select Features" },
  // More steps to come: 'abilities', 'review'
];

// Helper function to determine primary feature type from traits
function getPrimaryFeatureType(feature: ClassFeature): string {
  if (feature.traits.length === 0) {
    return "passive_feature";
  }

  // Return the first effect type as the primary type
  return feature.traits[0].type;
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
    traitSelections: [],
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
      const roll1Result = diceService.evaluateDiceFormula(`1d${hitDieSize}`, {});
      const roll2Result = diceService.evaluateDiceFormula(`1d${hitDieSize}`, {});
      const roll1 = roll1Result.total;
      const roll2 = roll2Result.total;
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
      let traitSelections: TraitSelection[] = [...(character.traitSelections || [])];

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

        // Process each feature's traits directly
        for (const feature of levelFeatures) {
          // Features are now dynamically calculated, no need to track granted features

          // Process all traits of the feature
          for (let effectIndex = 0; effectIndex < feature.traits.length; effectIndex++) {
            const trait = feature.traits[effectIndex];

            // Find the selection for this effect
            const selections = levelUpData.traitSelections.filter(
              (s) => s.grantedByTraitId === trait.id,
            );

            for (const selection of selections) {
              switch (selection.type) {
                case "attribute_boost":
                  if (selection?.type === "attribute_boost" && selection.attribute) {
                    // Attributes are tracked dynamically
                    // Selection is already tracked in levelUpData.traitSelections
                    traitSelections.push(selection);
                  }
                  break;

                case "spell_school":
                  // Create a spell school feature for the selected school
                  const selectedSchool = contentRepo
                    .getAllSpellSchools()
                    .find((s) => s.id === selection.schoolId);
                  if (selectedSchool) {
                    traitSelections.push(selection);
                  }

                  break;

                case "utility_spells":
                  traitSelections.push(selection);
                  break;

                case "subclass":
                  // Selection is already tracked in levelUpData.traitSelections
                  traitSelections.push(selection);
                  break;

                case "pool_feature":
                  // Selection is already tracked in levelUpData.traitSelections
                  // Abilities from picked features are now calculated dynamically
                  traitSelections.push(selection);
                  break;
              }
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
        traitSelections,
      };

      // Save the updated character
      await updateCharacter(updatedCharacter);

      // Features are now dynamically calculated, no sync needed

      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply level up:", error);
      console.error("Level up data:", levelUpData);
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
            traitSelections={levelUpData.traitSelections}
            onTraitSelectionsChange={(selections) =>
              setLevelUpData((prev) => ({ ...prev, traitSelections: selections }))
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
