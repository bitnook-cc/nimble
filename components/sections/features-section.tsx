"use client";

import { ChevronDown, ChevronRight, Lock, Sparkles, Unlock } from "lucide-react";
import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService, getAncestryService, getBackgroundService } from "@/lib/services/service-factory";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";
import { PoolFeatureEffectSelection, AttributeName, EffectSelection } from "@/lib/schemas/character";
import { ClassFeature } from "@/lib/schemas/features";

import { FeatureList } from "../feature-list";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

export function FeaturesSection() {
  const { 
    character, 
    selectSubclass,
    selectPoolFeature,
    updatePoolSelectionsForEffect,
    clearPoolFeatureSelections,
    selectSpellSchool,
    clearSpellSchoolSelections,
    selectAttributeBoost,
    selectUtilitySpells
  } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const [expandedSpellSchools, setExpandedSpellSchools] = useState<Record<string, boolean>>({});

  const contentRepository = ContentRepositoryService.getInstance();
  const classService = getClassService();
  const characterService = getCharacterService();
  const ancestryService = getAncestryService();
  const backgroundService = getBackgroundService();
  
  // Get existing features from character
  const existingFeatures = {
    spellSchools: characterService.getSpellSchools(),
  };

  // Early return if no character
  if (!character) return null;

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
  const poolSelections = (character.effectSelections || []).filter(
    (sf): sf is PoolFeatureEffectSelection => sf.type === "pool_feature",
  );

  // Add pool selection features to class features
  const allClassFeatures = [
    ...classFeatures,
    ...poolSelections.map(selection => selection.feature),
  ];

  // Get ancestry and background features
  const ancestryDefinition = contentRepository.getAncestryDefinition(character.ancestryId);
  const backgroundDefinition = contentRepository.getBackgroundDefinition(character.backgroundId);

  const ancestryFeatures = ancestryService.getExpectedFeaturesForCharacter(character);
  const backgroundFeatures = backgroundService.getExpectedFeaturesForCharacter(character);

  // Handler for selection changes from FeatureList
  const handleSelectionsChange = async (selections: EffectSelection[]) => {
    // Find what changed by comparing with current selections
    const currentSelections = character.effectSelections;
    
    // Group pool features by effect ID for batch processing
    const poolFeaturesByEffect = new Map<string, PoolFeatureEffectSelection[]>();
    const otherSelections: EffectSelection[] = [];
    
    for (const selection of selections) {
      if (selection.type === "pool_feature") {
        const effectId = selection.grantedByEffectId;
        if (!poolFeaturesByEffect.has(effectId)) {
          poolFeaturesByEffect.set(effectId, []);
        }
        poolFeaturesByEffect.get(effectId)!.push(selection);
      } else {
        otherSelections.push(selection);
      }
    }
    
    // Handle pool features - replace all for each effect using the new API
    for (const [effectId, poolSelections] of poolFeaturesByEffect) {
      // Use the new batch update API
      await updatePoolSelectionsForEffect(effectId, poolSelections);
    }
    
    // Handle other selections normally
    for (const selection of otherSelections) {
      const existing = currentSelections.find(s => s.grantedByEffectId === selection.grantedByEffectId);
      
      if (!existing || JSON.stringify(existing) !== JSON.stringify(selection)) {
        // This is new or changed, apply it
        switch (selection.type) {
          case "subclass":
            await selectSubclass(selection.subclassId, selection.grantedByEffectId);
            break;
          case "spell_school":
            // Clear existing selections first (for edit mode)
            await clearSpellSchoolSelections(selection.grantedByEffectId);
            await selectSpellSchool(selection.schoolId, selection.grantedByEffectId);
            break;
          case "attribute_boost":
            await selectAttributeBoost(
              selection.attribute,
              selection.amount,
              selection.grantedByEffectId
            );
            break;
          case "utility_spells":
            await selectUtilitySpells(
              selection.spellIds,
              selection.fromSchools,
              selection.grantedByEffectId
            );
            break;
        }
      }
    }
  };

  const hasFeatures = allClassFeatures.length > 0 || 
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
                      existingSelections={character.effectSelections}
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
                      existingSelections={character.effectSelections}
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
                      existingSelections={character.effectSelections}
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
                      existingSelections={character.effectSelections}
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