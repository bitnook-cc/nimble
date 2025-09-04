'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useCharacterService } from '@/lib/hooks/use-character-service';
import { getDiceService, getClassService, getContentRepository } from '@/lib/services/service-factory';
import { ClassFeature, StatBoostFeature, SpellSchoolFeature, UtilitySpellsFeature, PickFeatureFromPoolFeature, SpellTierAccessFeature, ResourceFeature, AbilityFeature } from '@/lib/types/class';
import { AttributeName, SelectedFeature } from '@/lib/types/character';
import { resourceService } from '@/lib/services/resource-service';
import { WizardDialog } from '@/components/wizard/wizard-dialog';
import { LevelSelectionStep, HitPointsStep, SkillsStep, FeatureSelectionStep } from './level-up-guide/index';

interface LevelUpGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type for feature selections during level up
type FeatureSelectionType = 
  | { type: 'stat_boost'; attribute: AttributeName }
  | { type: 'spell_school_choice'; schoolId: string }
  | { type: 'utility_spells'; spellIds: string[] }
  | { type: 'feature_pool'; selectedFeatureId: string };

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
  featureSelections: Record<string, FeatureSelectionType>; // Selections for interactive features
}

const STEPS = [
  { id: 'levels', label: 'Choose Levels' },
  { id: 'hp', label: 'Roll Hit Points' },
  { id: 'skills', label: 'Allocate Skills' },
  { id: 'features', label: 'Select Features' },
  // More steps to come: 'abilities', 'review'
];

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
    featureSelections: {}
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
        result
      });
      
      totalGain += result;
    }

    setLevelUpData(prev => ({
      ...prev,
      hpRolls: rolls,
      totalHpGain: totalGain,
      newMaxHp: character.hitPoints.max + totalGain,
      newHitDice: {
        current: character._hitDice.current + levelUpData.levelsToGain,
        max: character._hitDice.max + levelUpData.levelsToGain
      }
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
            modifier: (skill.modifier || 0) + points
          };
        }
      });
      
      // Prepare feature-related updates
      let updatedAttributes = { ...character._attributes };
      let updatedAbilities = [...character.abilities];
      let updatedResources = [...character.resources];
      let grantedFeatures = [...character.grantedFeatures];
      let selectedFeatures: SelectedFeature[] = [...(character.selectedFeatures || [])];
      let spellTierAccess = character.spellTierAccess;
      
      // Process feature selections
      const classService = getClassService();
      
      // Get all features for the levels being gained
      for (let i = 0; i < levelUpData.levelsToGain; i++) {
        const targetLevel = character.level + i + 1;
        
        // Get features for this specific level by comparing with previous level
        const tempCharacter = { ...character, level: targetLevel };
        const allFeaturesAtLevel = classService.getExpectedFeaturesForCharacter(tempCharacter);
        const tempCharacterPrev = { ...character, level: targetLevel - 1 };
        const allFeaturesAtPrevLevel = classService.getExpectedFeaturesForCharacter(tempCharacterPrev);
        
        // Features for this level are the difference
        const levelFeatures = allFeaturesAtLevel.filter(feature => 
          !allFeaturesAtPrevLevel.some(prevFeature => 
            prevFeature.name === feature.name && prevFeature.level === feature.level
          )
        );
        
        // Process each feature
        for (const feature of levelFeatures) {
          const featureId = classService.generateFeatureId(character.classId, targetLevel, feature.name);
          
          // Add to granted features
          if (!grantedFeatures.includes(featureId)) {
            grantedFeatures.push(featureId);
          }
          
          // Apply feature based on type and selections
          const selection = levelUpData.featureSelections[featureId];
          
          switch (feature.type) {
            case 'stat_boost':
              if (selection?.type === 'stat_boost' && selection.attribute) {
                const statBoostFeature = feature as StatBoostFeature;
                const boostAmount = statBoostFeature.statBoosts[0]?.amount || 1;
                updatedAttributes[selection.attribute] = Math.min(
                  10,
                  updatedAttributes[selection.attribute] + boostAmount
                );
                // Track the selection
                selectedFeatures.push({
                  type: 'stat_boost',
                  attribute: selection.attribute,
                  amount: boostAmount,
                  selectedAt: new Date(),
                  grantedByFeatureId: featureId
                });
              }
              break;
              
            case 'spell_school_choice':
              if (selection?.type === 'spell_school_choice' && selection.schoolId) {
                // Create a spell school feature for the selected school
                const selectedSchool = contentRepo.getAllSpellSchools().find(s => s.id === selection.schoolId);
                if (selectedSchool) {
                  // Get spells from the selected school up to current tier access
                  const schoolSpells = contentRepo.getSpellsBySchool(selection.schoolId)
                    .filter(spell => spell.tier <= spellTierAccess);
                  
                  // Add spells that aren't already in abilities
                  const currentSpellIds = new Set(updatedAbilities.filter(a => a.type === 'spell').map(a => a.id));
                  const newSpells = schoolSpells.filter(spell => !currentSpellIds.has(spell.id));
                  updatedAbilities.push(...newSpells);
                  
                  // Track the selection
                  selectedFeatures.push({
                    type: 'spell_school',
                    schoolId: selection.schoolId,
                    selectedAt: new Date(),
                    grantedByFeatureId: featureId
                  });
                }
              }
              break;
              
            case 'utility_spells':
              if (selection?.type === 'utility_spells' && selection.spellIds && selection.spellIds.length > 0) {
                // Add selected utility spells
                const utilityFeature = feature as UtilitySpellsFeature;
                const addedSpellIds: string[] = [];
                
                utilityFeature.schools.forEach(schoolId => {
                  const utilitySpells = contentRepo.getSpellsBySchool(schoolId)
                    .filter(spell => spell.tier === 0 && selection.spellIds.includes(spell.id));
                  
                  // Add spells that aren't already in abilities
                  const currentSpellIds = new Set(updatedAbilities.filter(a => a.type === 'spell').map(a => a.id));
                  const newSpells = utilitySpells.filter(spell => !currentSpellIds.has(spell.id));
                  updatedAbilities.push(...newSpells);
                  addedSpellIds.push(...newSpells.map(s => s.id));
                });
                
                // Track the selection
                if (addedSpellIds.length > 0) {
                  selectedFeatures.push({
                    type: 'utility_spells',
                    spellIds: addedSpellIds,
                    fromSchools: utilityFeature.schools,
                    selectedAt: new Date(),
                    grantedByFeatureId: featureId
                  });
                }
              }
              break;
              
            case 'pick_feature_from_pool':
              if (selection?.type === 'feature_pool' && selection.selectedFeatureId) {
                const poolFeature = feature as PickFeatureFromPoolFeature;
                const pool = classService.getFeaturePool(character.classId, poolFeature.poolId);
                if (pool) {
                  const selectedFeature = pool.features.find(f => f.id === selection.selectedFeatureId);
                  if (selectedFeature) {
                    // Apply the selected feature
                    if (selectedFeature.type === 'ability') {
                      const abilityFeature = selectedFeature as AbilityFeature;
                      if (abilityFeature.ability && !updatedAbilities.some(a => a.id === abilityFeature.ability.id)) {
                        updatedAbilities.push(abilityFeature.ability);
                      }
                    }
                    
                    // Track the selection
                    selectedFeatures.push({
                      type: 'pool_feature',
                      poolId: poolFeature.poolId,
                      featureId: selection.selectedFeatureId,
                      feature: selectedFeature,
                      selectedAt: new Date(),
                      grantedByFeatureId: featureId
                    });
                  }
                }
              }
              break;
              
            case 'spell_school':
              const spellSchoolFeature = feature as SpellSchoolFeature;
              // Get spells from the school up to current tier access
              const schoolSpells = contentRepo.getSpellsBySchool(spellSchoolFeature.spellSchool.schoolId)
                .filter(spell => spell.tier <= spellTierAccess);
              
              // Add spells that aren't already in abilities
              const currentSpellIds = new Set(updatedAbilities.filter(a => a.type === 'spell').map(a => a.id));
              const newSpells = schoolSpells.filter(spell => !currentSpellIds.has(spell.id));
              updatedAbilities.push(...newSpells);
              break;
              
            case 'spell_tier_access':
              const tierFeature = feature as SpellTierAccessFeature;
              spellTierAccess = Math.max(spellTierAccess, tierFeature.maxTier);
              break;
              
            case 'resource':
              const resourceFeature = feature as ResourceFeature;
              if (resourceFeature.resourceDefinition && !updatedResources.some(r => r.definition.id === resourceFeature.resourceDefinition.id)) {
                const resourceInstance = resourceService.createResourceInstanceForCharacter(
                  resourceFeature.resourceDefinition,
                  character, // Pass character for formula evaluation
                  undefined, // No explicit current value - let it initialize based on reset type
                  updatedResources.length
                );
                updatedResources.push(resourceInstance);
              }
              break;
              
            case 'ability':
              const abilityFeature = feature as AbilityFeature;
              if (abilityFeature.ability && !updatedAbilities.some(a => a.id === abilityFeature.ability.id)) {
                updatedAbilities.push(abilityFeature.ability);
              }
              break;
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
          current: levelUpData.newMaxHp // Set current HP to new max HP after level up
        },
        hitDice: {
          ...character._hitDice,
          current: levelUpData.newHitDice.current,
          max: levelUpData.newHitDice.max
        },
        skills: updatedSkills,
        attributes: updatedAttributes,
        abilities: updatedAbilities,
        resources: updatedResources,
        grantedFeatures,
        selectedFeatures,
        spellTierAccess
      };
      
      // Save the updated character
      await updateCharacter(updatedCharacter);
      
      // Sync any remaining features
      await classService.syncCharacterFeatures();
      
      // Close the dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to apply level up:', error);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'levels':
        return <LevelSelectionStep 
          character={character}
          levelsToGain={levelUpData.levelsToGain}
          onLevelsChange={(levels) => setLevelUpData(prev => ({ ...prev, levelsToGain: levels }))}
        />;
      
      case 'hp':
        return <HitPointsStep 
          character={character}
          levelUpData={levelUpData}
          hitDieSize={`d${hitDieSize}`}
          onHpChange={(newHp) => setLevelUpData(prev => ({ ...prev, newMaxHp: newHp }))}
        />;
      
      case 'skills':
        return <SkillsStep 
          character={character}
          levelsToGain={levelUpData.levelsToGain}
          skillAllocations={levelUpData.skillAllocations}
          onSkillAllocationsChange={(allocations) => setLevelUpData(prev => ({ ...prev, skillAllocations: allocations }))}
        />;
      
      case 'features':
        return <FeatureSelectionStep
          character={character}
          levelsToGain={levelUpData.levelsToGain}
          featureSelections={levelUpData.featureSelections}
          onFeatureSelectionsChange={(selections) => setLevelUpData(prev => ({ ...prev, featureSelections: selections }))}
        />;
      
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
      <div className="px-4 sm:px-6 py-4">
        {renderStepContent()}
      </div>
    </WizardDialog>
  );
}