"use client";

import { ChevronDown, ChevronRight, Lock, Sparkles, Unlock } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import {
  AttributeName,
  PoolFeatureTraitSelection,
  TraitSelection,
  UtilitySpellsTraitSelection,
} from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import {
  getAncestryService,
  getBackgroundService,
  getCharacterService,
} from "@/lib/services/service-factory";

import { FeatureList } from "../feature-list";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

export function FeaturesSection() {
  const {
    character,
    selectSubclass,
    updatePoolSelectionsForTrait,
    selectSpellSchool,
    clearSpellSchoolSelections,
    selectAttributeBoost,
    updateUtilitySelectionsForTrait,
  } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();

  // Early return if no character
  if (!character) return null;

  const contentRepository = ContentRepositoryService.getInstance();
  const characterService = getCharacterService();
  const ancestryService = getAncestryService();
  const backgroundService = getBackgroundService();

  // Get existing features from character
  const existingFeatures = {
    spellSchools: characterService.getSpellSchools(),
  };

  const isOpen = uiState.collapsibleSections.classFeatures;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("classFeatures", isOpen);
  const classDefinition = contentRepository.getClassDefinition(character.classId);
  const subclassId = characterService.getSubclassId();
  const subclassDefinition = subclassId
    ? contentRepository.getSubclassDefinition(subclassId)
    : null;

  if (!classDefinition) {
    return null;
  }

  // Get all features
  const classFeatures = contentRepository.getAllClassFeaturesUpToLevel(
    character.classId,
    character.level,
  );
  const subclassFeatures = subclassId
    ? contentRepository.getAllSubclassFeaturesUpToLevel(subclassId, character.level)
    : [];

  // Get pool feature selections
  const poolSelections = (character.traitSelections || []).filter(
    (sf): sf is PoolFeatureTraitSelection => sf.type === "pool_feature",
  );

  // Add pool selection features to class features
  const allClassFeatures = [
    ...classFeatures,
    ...poolSelections.map((selection) => selection.feature),
  ];

  // Get ancestry and background features
  const ancestryDefinition = contentRepository.getAncestryDefinition(character.ancestryId);
  const backgroundDefinition = contentRepository.getBackgroundDefinition(character.backgroundId);

  const ancestryFeatures = ancestryService.getExpectedFeaturesForCharacter(character);
  const backgroundFeatures = backgroundService.getExpectedFeaturesForCharacter(character);

  // Handler for selection changes from FeatureList
  const handleSelectionsChange = async (selections: TraitSelection[]) => {
    // Find what changed by comparing with current selections
    const currentSelections = character.traitSelections;

    // Group pool features and utility spells by effect ID for batch processing
    const poolFeaturesByEffect = new Map<string, PoolFeatureTraitSelection[]>();
    const utilitySpellsByEffect = new Map<string, UtilitySpellsTraitSelection[]>();
    const otherSelections: TraitSelection[] = [];

    for (const selection of selections) {
      if (selection.type === "pool_feature") {
        const traitId = selection.grantedByTraitId;
        if (!poolFeaturesByEffect.has(traitId)) {
          poolFeaturesByEffect.set(traitId, []);
        }
        poolFeaturesByEffect.get(traitId)!.push(selection);
      } else if (selection.type === "utility_spells") {
        const traitId = selection.grantedByTraitId;
        if (!utilitySpellsByEffect.has(traitId)) {
          utilitySpellsByEffect.set(traitId, []);
        }
        utilitySpellsByEffect.get(traitId)!.push(selection);
      } else {
        otherSelections.push(selection);
      }
    }

    // Handle pool features - replace all for each effect using the new API
    for (const [traitId, poolSelections] of poolFeaturesByEffect) {
      // Use the new batch update API
      await updatePoolSelectionsForTrait(traitId, poolSelections);
    }

    // Handle utility spells - replace all for each effect using the new API
    for (const [traitId, utilitySelections] of utilitySpellsByEffect) {
      await updateUtilitySelectionsForTrait(traitId, utilitySelections);
    }

    // Handle other selections normally
    for (const selection of otherSelections) {
      const existing = currentSelections.find(
        (s) => s.grantedByTraitId === selection.grantedByTraitId,
      );

      if (!existing || JSON.stringify(existing) !== JSON.stringify(selection)) {
        // This is new or changed, apply it
        switch (selection.type) {
          case "subclass":
            await selectSubclass(selection.subclassId, selection.grantedByTraitId);
            break;
          case "spell_school":
            // Clear existing selections first (for edit mode)
            await clearSpellSchoolSelections(selection.grantedByTraitId);
            await selectSpellSchool(selection.schoolId, selection.grantedByTraitId);
            break;
          case "attribute_boost":
            await selectAttributeBoost(
              selection.attribute,
              selection.amount,
              selection.grantedByTraitId,
            );
            break;
        }
      }
    }
  };

  const hasFeatures =
    allClassFeatures.length > 0 ||
    subclassFeatures.length > 0 ||
    ancestryFeatures.length > 0 ||
    backgroundFeatures.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Features
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="w-full">
          <CardContent className="space-y-4 pt-6">
            {!hasFeatures ? (
              <div className="text-center text-muted-foreground py-8">
                No features unlocked yet. Level up to gain new abilities!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Class Features */}
                {allClassFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Class Features</h3>
                    <FeatureList
                      features={allClassFeatures}
                      source="class"
                      sourceLabel={classDefinition.name}
                      existingSelections={character.traitSelections}
                      onSelectionsChange={handleSelectionsChange}
                      character={character}
                      existingFeatures={existingFeatures}
                    />
                  </div>
                )}

                {/* Subclass Features */}
                {subclassFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Subclass Features</h3>
                    <FeatureList
                      features={subclassFeatures}
                      source="subclass"
                      sourceLabel={subclassDefinition?.name || "Subclass"}
                      existingSelections={character.traitSelections}
                      onSelectionsChange={handleSelectionsChange}
                      character={character}
                      existingFeatures={existingFeatures}
                    />
                  </div>
                )}

                {/* Ancestry Features */}
                {ancestryFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Ancestry Features</h3>
                    <FeatureList
                      features={ancestryFeatures}
                      source="ancestry"
                      sourceLabel={ancestryDefinition?.name || "Ancestry"}
                      existingSelections={character.traitSelections}
                      onSelectionsChange={handleSelectionsChange}
                      character={character}
                      existingFeatures={existingFeatures}
                    />
                  </div>
                )}

                {/* Background Features */}
                {backgroundFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Background Features</h3>
                    <FeatureList
                      features={backgroundFeatures}
                      source="background"
                      sourceLabel={backgroundDefinition?.name || "Background"}
                      existingSelections={character.traitSelections}
                      onSelectionsChange={handleSelectionsChange}
                      character={character}
                      existingFeatures={existingFeatures}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
