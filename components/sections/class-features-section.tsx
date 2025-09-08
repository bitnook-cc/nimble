"use client";

import { ChevronDown, ChevronRight, Lock, Sparkles, Unlock } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService, getAncestryService, getBackgroundService } from "@/lib/services/service-factory";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";
import { Character } from "@/lib/types/character";
import { PoolFeatureEffectSelection } from "@/lib/types/character";
import { CharacterFeature } from "@/lib/types/character";
import { ClassFeature } from "@/lib/schemas/class";

import { FeatureEffectsDisplay } from "../feature-effects-display";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

type ClassFeatureWithSource = {
  source: "class" | "subclass";
  feature: ClassFeature;
};

type AncestryFeatureWithSource = {
  source: "ancestry";
  feature: CharacterFeature;
};

type BackgroundFeatureWithSource = {
  source: "background";
  feature: CharacterFeature;
};

type FeatureWithSource =
  | ClassFeatureWithSource
  | AncestryFeatureWithSource
  | BackgroundFeatureWithSource;

export function ClassFeaturesSection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const [expandedSpellSchools, setExpandedSpellSchools] = useState<Record<string, boolean>>({});

  const contentRepository = ContentRepositoryService.getInstance();
  const classService = getClassService();
  const characterService = getCharacterService();
  const ancestryService = getAncestryService();
  const backgroundService = getBackgroundService();

  // Early return if no character (shouldn't happen in normal usage)
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

  // Get all class and subclass features
  const classFeatures = contentRepository.getAllClassFeaturesUpToLevel(
    character.classId,
    character.level,
  );
  const subclassFeatures = subclassId
    ? contentRepository.getAllSubclassFeaturesUpToLevel(subclassId, character.level)
    : [];

  // Get pool feature selections (these come from class features)
  const poolSelections = (character.effectSelections || []).filter(
    (sf): sf is PoolFeatureEffectSelection => sf.type === "pool_feature",
  );

  // Get ancestry and background features
  const ancestryDefinition = contentRepository.getAncestryDefinition(character.ancestryId);
  const backgroundDefinition = contentRepository.getBackgroundDefinition(character.backgroundId);

  const ancestryFeatures = ancestryService.getExpectedFeaturesForCharacter(character);
  const backgroundFeatures = backgroundService.getExpectedFeaturesForCharacter(character);

  // Combine all features with their sources
  const allFeatures: FeatureWithSource[] = [
    ...classFeatures.map(
      (feature): ClassFeatureWithSource => ({
        source: "class",
        feature,
      }),
    ),
    ...subclassFeatures.map(
      (feature): ClassFeatureWithSource => ({
        source: "subclass",
        feature,
      }),
    ),
    ...poolSelections.map(
      (selection): ClassFeatureWithSource => ({
        source: "class",
        feature: selection.feature,
      }),
    ),
    ...ancestryFeatures.map(
      (feature): AncestryFeatureWithSource => ({
        source: "ancestry",
        feature,
      }),
    ),
    ...backgroundFeatures.map(
      (feature): BackgroundFeatureWithSource => ({
        source: "background",
        feature,
      }),
    ),
  ];

  // Sort class/subclass features by level
  const classSubclassFeatures = allFeatures
    .filter((f) => f.source === "class" || f.source === "subclass")
    .sort((a, b) => {
      const levelA = "level" in a.feature ? a.feature.level : 0;
      const levelB = "level" in b.feature ? b.feature.level : 0;
      return levelA - levelB;
    });

  const getSourceDisplayName = (
    source: "class" | "subclass" | "ancestry" | "background",
  ): string => {
    switch (source) {
      case "class":
        return classDefinition.name;
      case "subclass":
        return subclassDefinition?.name || "Subclass";
      case "ancestry":
        return ancestryDefinition?.name || "Ancestry";
      case "background":
        return backgroundDefinition?.name || "Background";
      default:
        return "Unknown";
    }
  };

  const getSourceBadgeColor = (source: "class" | "subclass" | "ancestry" | "background") => {
    switch (source) {
      case "class":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "subclass":
        return "bg-violet-100 text-violet-800 border-violet-200";
      case "ancestry":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "background":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTierColor = (tier: number) => {
    if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
    if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const isSpellUnlocked = (tier: number): boolean => {
    return tier <= character._spellTierAccess;
  };

  const renderFeature = (featureWithSource: FeatureWithSource, index: number) => {
    const { source, feature } = featureWithSource;
    const hasLevel = "level" in feature;

    return (
      <div key={`${source}-${feature.id}-${index}`} className="border rounded-lg p-4 space-y-3">
        {/* Feature Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">{feature.name}</h4>
            {hasLevel && (
              <Badge variant="outline" className="text-xs">
                Level {feature.level}
              </Badge>
            )}
            <Badge variant="outline" className={getSourceBadgeColor(source)}>
              {getSourceDisplayName(source)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>

        {/* Feature Effects */}
        {feature.effects && feature.effects.length > 0 && (
          <div className="pt-2 border-t">
            <FeatureEffectsDisplay effects={feature.effects} />
          </div>
        )}

        {/* Special handling for spell school effects with expandable spell lists */}
        {feature.effects?.some((e) => e.type === "spell_school") && (
          <div className="pt-2 border-t">
            {feature.effects
              .filter((e) => e.type === "spell_school")
              .map((effect, effectIndex: number) => {
                const schoolId = effect.schoolId;
                const isExpanded = expandedSpellSchools[schoolId] || false;
                const school = contentRepository.getSpellSchool(schoolId);

                if (!school) {
                  console.error("No school found for effect", effect);
                  return null;
                }

                if (school?.spells.length === 0) {
                  console.error("No spells found for school", schoolId);
                  return null;
                }

                // Group spells by tier
                const spellsByTier = school.spells.reduce(
                  (acc, spell) => {
                    if (!acc[spell.tier]) acc[spell.tier] = [];
                    acc[spell.tier].push(spell);
                    return acc;
                  },
                  {} as Record<number, typeof school.spells>,
                );

                return (
                  <div key={effectIndex} className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between p-2"
                      onClick={() =>
                        setExpandedSpellSchools({
                          ...expandedSpellSchools,
                          [schoolId]: !isExpanded,
                        })
                      }
                    >
                      <span className="text-sm font-medium">
                        View {school.name} Spells
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {isExpanded && (
                      <div className="pl-4 space-y-3">
                        {Object.entries(spellsByTier)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([tier, tierSpells]) => {
                            const tierNum = Number(tier);
                            const unlocked = isSpellUnlocked(tierNum);

                            return (
                              <div key={tier} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-medium">Tier {tier} Spells</h5>
                                  {unlocked ? (
                                    <Unlock className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Lock className="h-3 w-3 text-gray-400" />
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={getTierColor(tierNum) + " text-xs"}
                                  >
                                    {unlocked ? "Unlocked" : `Requires Level ${tierNum * 2}`}
                                  </Badge>
                                </div>
                                <div className="grid gap-2">
                                  {tierSpells.map((spell) => (
                                    <div
                                      key={spell.id}
                                      className={`p-2 rounded-md border text-xs ${
                                        unlocked
                                          ? "bg-card border-border"
                                          : "bg-gray-50 border-gray-200 opacity-60"
                                      }`}
                                    >
                                      <div className="font-medium">{spell.name}</div>
                                      <div className="text-muted-foreground">
                                        {spell.description}
                                      </div>
                                      {spell.resourceCost && (
                                        <div className="mt-1 text-blue-600">
                                          Cost:{" "}
                                          {spell.resourceCost.type === "fixed"
                                            ? `${spell.resourceCost.amount} ${spell.resourceCost.resourceId}`
                                            : `${spell.resourceCost.minAmount}-${spell.resourceCost.maxAmount} ${spell.resourceCost.resourceId}`}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Class Features
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="w-full">
          <CardContent className="space-y-4 pt-6">
            {allFeatures.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No features unlocked yet. Level up to gain new abilities!
              </div>
            ) : (
              <div className="space-y-6">
                {/* Class & Subclass Features */}
                {classSubclassFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Class & Subclass Features</h3>
                    <div className="space-y-3">
                      {classSubclassFeatures.map((feature, index) => renderFeature(feature, index))}
                    </div>
                  </div>
                )}

                {/* Ancestry Features */}
                {ancestryFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Ancestry Features</h3>
                    <div className="space-y-3">
                      {allFeatures
                        .filter((f) => f.source === "ancestry")
                        .map((feature, index) => renderFeature(feature, index))}
                    </div>
                  </div>
                )}

                {/* Background Features */}
                {backgroundFeatures.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Background Features</h3>
                    <div className="space-y-3">
                      {allFeatures
                        .filter((f) => f.source === "background")
                        .map((feature, index) => renderFeature(feature, index))}
                    </div>
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
