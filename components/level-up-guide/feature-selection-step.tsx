"use client";

import React, { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FeatureSelectionType } from "@/components/character-builder/features-overview";
import { FeatureEffectsDisplay } from "@/components/feature-effects-display";

import { getClassService, getContentRepository } from "@/lib/services/service-factory";
import { SpellAbility } from "@/lib/types/abilities";
import { AttributeName, Character } from "@/lib/types/character";
import { ClassFeature } from "@/lib/types/class";
import {
  AttributeBoostFeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  SubclassChoiceFeatureEffect,
  UtilitySpellsFeatureEffect,
} from "@/lib/types/feature-effects";

interface FeatureSelectionStepProps {
  character: Character;
  levelsToGain: number;
  featureSelections: Record<string, FeatureSelectionType>;
  onFeatureSelectionsChange: (selections: Record<string, FeatureSelectionType>) => void;
}

interface GroupedFeatures {
  level: number;
  features: ClassFeature[];
}

// Helper function to determine primary feature type from effects
function getPrimaryFeatureType(feature: ClassFeature): string {
  if (feature.effects.length === 0) {
    return "passive_feature";
  }

  // Return the first effect type as the primary type
  return feature.effects[0].type;
}

export function FeatureSelectionStep({
  character,
  levelsToGain,
  featureSelections,
  onFeatureSelectionsChange,
}: FeatureSelectionStepProps) {
  const [groupedFeatures, setGroupedFeatures] = useState<GroupedFeatures[]>([]);
  const contentRepo = getContentRepository();
  const classService = getClassService();

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

  const handleStatBoostSelection = (featureId: string, attribute: AttributeName) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: "attribute_boost", attribute },
    });
  };

  const handleSpellSchoolSelection = (featureId: string, schoolId: string) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: "spell_school_choice", schoolId },
    });
  };

  const handleUtilitySpellSelection = (featureId: string, spellId: string, checked: boolean) => {
    const current = featureSelections[featureId];
    const currentSpellIds = current?.type === "utility_spells" ? current.spellIds : [];

    const spellIds = checked
      ? [...currentSpellIds, spellId]
      : currentSpellIds.filter((id: string) => id !== spellId);

    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: "utility_spells", spellIds },
    });
  };

  const handleFeaturePoolSelection = (featureId: string, selectedFeatureId: string) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: "feature_pool", selectedFeatureId },
    });
  };

  const handleSubclassSelection = (featureId: string, subclassId: string) => {
    onFeatureSelectionsChange({
      ...featureSelections,
      [featureId]: { type: "subclass_choice", subclassId },
    });
  };

  const renderFeature = (feature: ClassFeature, level: number) => {
    const featureId = classService.generateFeatureId(character.classId, level, feature.name);
    const primaryType = getPrimaryFeatureType(feature);

    // Render based on feature type
    switch (primaryType) {
      case "attribute_boost": {
        const attributeBoostEffects = feature.effects.filter(
          (e) => e.type === "attribute_boost",
        ) as AttributeBoostFeatureEffect[];
        const attributeBoostEffect = attributeBoostEffects[0];
        const selection = featureSelections[featureId];
        const selectedAttribute =
          selection?.type === "attribute_boost" ? selection.attribute : undefined;

        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose an attribute to boost:</Label>
              <RadioGroup
                value={selectedAttribute || ""}
                onValueChange={(value) =>
                  handleStatBoostSelection(featureId, value as AttributeName)
                }
              >
                {(
                  attributeBoostEffect?.allowedAttributes ||
                  (["strength", "dexterity", "intelligence", "will"] as AttributeName[])
                ).map((attr) => (
                  <div key={attr} className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value={attr} id={`${featureId}-${attr}`} />
                    <Label htmlFor={`${featureId}-${attr}`} className="capitalize cursor-pointer">
                      {attr} (+{attributeBoostEffect?.amount || 1})
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      case "spell_school_choice": {
        const spellSchoolChoiceEffects = feature.effects.filter(
          (e) => e.type === "spell_school_choice",
        ) as SpellSchoolChoiceFeatureEffect[];
        const spellSchoolChoiceEffect = spellSchoolChoiceEffects[0];
        const selection = featureSelections[featureId];
        const selectedSchool =
          selection?.type === "spell_school_choice" ? selection.schoolId : undefined;

        // Get available schools
        const availableSchools = spellSchoolChoiceEffect?.availableSchools
          ? contentRepo
              .getAllSpellSchools()
              .filter((s) => spellSchoolChoiceEffect.availableSchools!.includes(s.id))
          : contentRepo.getAllSpellSchools();

        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose a spell school:</Label>
              <Select
                value={selectedSchool || ""}
                onValueChange={(value) => handleSpellSchoolSelection(featureId, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a spell school" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchools.map((school: any) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );
      }

      case "utility_spells": {
        const utilitySpellsEffects = feature.effects.filter(
          (e) => e.type === "utility_spells",
        ) as UtilitySpellsFeatureEffect[];
        const utilitySpellsEffect = utilitySpellsEffects[0];
        const selection = featureSelections[featureId];
        const selectedSpells = selection?.type === "utility_spells" ? selection.spellIds : [];

        // Get utility spells from the specified schools
        const utilitySpells: SpellAbility[] = [];
        utilitySpellsEffect?.schools?.forEach((schoolId: any) => {
          const spells = contentRepo
            .getSpellsBySchool(schoolId)
            .filter((spell) => spell.tier === 0); // Utility spells are tier 0
          utilitySpells.push(...spells);
        });

        if (utilitySpells.length === 0) {
          return null; // No utility spells available
        }

        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Select utility spells:</Label>
              <ScrollArea className="h-48 border rounded-md p-3">
                {utilitySpells.map((spell) => (
                  <div key={spell.id} className="flex items-start space-x-2 mb-3">
                    <Checkbox
                      id={`${featureId}-${spell.id}`}
                      checked={selectedSpells.includes(spell.id)}
                      onCheckedChange={(checked) =>
                        handleUtilitySpellSelection(featureId, spell.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor={`${featureId}-${spell.id}`} className="cursor-pointer">
                        <div className="font-medium text-sm">{spell.name}</div>
                        <div className="text-xs text-muted-foreground">{spell.description}</div>
                      </Label>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        );
      }

      case "pick_feature_from_pool": {
        const pickFeatureEffects = feature.effects.filter(
          (e) => e.type === "pick_feature_from_pool",
        ) as PickFeatureFromPoolFeatureEffect[];
        const pickFeatureEffect = pickFeatureEffects[0];
        const selection = featureSelections[featureId];
        const selectedFeature =
          selection?.type === "feature_pool" ? selection.selectedFeatureId : undefined;

        // Get the feature pool
        const pool = classService.getFeaturePool(
          character.classId,
          pickFeatureEffect?.poolId || "",
        );
        if (!pool) {
          return null; // Pool not found
        }

        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose from {pool.name}:</Label>
              <RadioGroup
                value={selectedFeature || ""}
                onValueChange={(value) => handleFeaturePoolSelection(featureId, value)}
              >
                <ScrollArea className="h-48 border rounded-md p-3">
                  {pool.features.map((poolFeature) => (
                    <div key={poolFeature.id} className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem
                        value={poolFeature.id}
                        id={`${featureId}-${poolFeature.id}`}
                      />
                      <Label htmlFor={`${featureId}-${poolFeature.id}`} className="cursor-pointer">
                        <div className="font-medium text-sm">{poolFeature.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {poolFeature.description}
                        </div>
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      case "subclass_choice": {
        const subclassChoiceEffects = feature.effects.filter(
          (e) => e.type === "subclass_choice",
        ) as SubclassChoiceFeatureEffect[];
        if (subclassChoiceEffects.length === 0) {
          break; // Fall through to default rendering
        }

        const selection = featureSelections[featureId];
        const selectedSubclass =
          selection?.type === "subclass_choice" ? selection.subclassId : undefined;

        // Get available subclasses for this class
        const availableSubclasses = contentRepo.getSubclassesForClass(character.classId);

        if (availableSubclasses.length === 0) {
          break; // No subclasses available
        }

        return (
          <Card key={featureId} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="text-sm mb-2 block">Choose your subclass:</Label>
              <RadioGroup
                value={selectedSubclass || ""}
                onValueChange={(value) => handleSubclassSelection(featureId, value)}
              >
                <ScrollArea className="h-48 border rounded-md p-3">
                  {availableSubclasses.map((subclass) => (
                    <div key={subclass.id} className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value={subclass.id} id={`${featureId}-${subclass.id}`} />
                      <Label htmlFor={`${featureId}-${subclass.id}`} className="cursor-pointer">
                        <div className="font-medium text-sm">{subclass.name}</div>
                        <div className="text-xs text-muted-foreground">{subclass.description}</div>
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </RadioGroup>
            </CardContent>
          </Card>
        );
      }

      // Non-interactive features - display them with their effects
      default:
        return (
          <Card key={featureId} className="mb-4 bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{feature.name}</CardTitle>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardHeader>
            {feature.effects.length > 0 && (
              <CardContent className="pt-0">
                <FeatureEffectsDisplay effects={feature.effects} />
              </CardContent>
            )}
          </Card>
        );
    }
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
            {features.map((feature) => renderFeature(feature, level))}
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
