"use client";

import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FeatureList } from "@/components/feature-list";

import { getClassService, getContentRepository, getCharacterService } from "@/lib/services/service-factory";
import { Character, EffectSelection } from "@/lib/schemas/character";
import { ClassFeature } from "@/lib/schemas/features";

interface FeatureSelectionStepProps {
  character: Character;
  levelsToGain: number;
  effectSelections: EffectSelection[];
  onEffectSelectionsChange: (selections: EffectSelection[]) => void;
}

interface GroupedFeatures {
  level: number;
  features: ClassFeature[];
}

export function FeatureSelectionStep({
  character,
  levelsToGain,
  effectSelections,
  onEffectSelectionsChange,
}: FeatureSelectionStepProps) {
  const [groupedFeatures, setGroupedFeatures] = useState<GroupedFeatures[]>([]);
  const contentRepo = getContentRepository();
  const classService = getClassService();
  const characterService = getCharacterService();
  
  // Get existing features from character
  const existingFeatures = {
    spellSchools: characterService.getSpellSchools(),
  };

  useEffect(() => {
    // Get all features for the levels being gained
    const featuresPerLevel: GroupedFeatures[] = [];

    for (let i = 0; i < levelsToGain; i++) {
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

      if (levelFeatures.length > 0) {
        featuresPerLevel.push({
          level: targetLevel,
          features: levelFeatures,
        });
      }
    }

    setGroupedFeatures(featuresPerLevel);
  }, [character, levelsToGain, classService, contentRepo]);

  // Get class and subclass names for display
  const classDefinition = contentRepo.getClassDefinition(character.classId);
  const subclassId = character.effectSelections.find(s => s.type === "subclass")?.subclassId;
  const subclassDefinition = subclassId ? contentRepo.getSubclassDefinition(subclassId) : null;

  // Combine existing character selections with temp selections
  const allSelections = [...character.effectSelections, ...effectSelections];

  // Handler that manages temp selections separately
  const handleSelectionsChange = (newSelections: EffectSelection[]) => {
    // Filter out the character's existing selections to get only temp selections
    const tempSelections = newSelections.filter(
      selection => !character.effectSelections.some(
        existing => existing.grantedByEffectId === selection.grantedByEffectId
      )
    );
    onEffectSelectionsChange(tempSelections);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Select Your Features</h3>
        <p className="text-sm text-muted-foreground">
          Review the features you&apos;ll gain and make selections where required
        </p>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {groupedFeatures.map(({ level, features }) => (
          <div key={level} className="mb-6">
            <h4 className="text-md font-semibold mb-3 sticky top-0 bg-background py-2">
              Level {level} Features
            </h4>
            <FeatureList
              features={features}
              source={features.some(f => f.id.includes('subclass')) ? "subclass" : "class"}
              sourceLabel={
                features.some(f => f.id.includes('subclass')) 
                  ? subclassDefinition?.name || "Subclass"
                  : classDefinition?.name || "Class"
              }
              existingSelections={allSelections}
              onSelectionsChange={handleSelectionsChange}
              character={character}
              existingFeatures={existingFeatures}
            />
          </div>
        ))}
      </ScrollArea>

      {groupedFeatures.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No new features available for the selected levels
        </div>
      )}
    </div>
  );
}