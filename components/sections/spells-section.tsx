"use client";

import { ChevronDown, ChevronRight, Lock, Sparkles, Zap } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { Character } from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { calculateFlexibleValue as getFlexibleValue } from "@/lib/types/flexible-value";
import { getIconById } from "@/lib/utils/icon-utils";
import {
  formatActionCost,
  formatResourceCost,
  getInsufficientResourceMessage,
  hasEnoughResourcesForSpell,
} from "@/lib/utils/spell-utils";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

export function SpellsSection() {
  const { character, performUseAbility } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const [openSchools, setOpenSchools] = useState<Record<string, boolean>>({});
  const [openLockedSchools, setOpenLockedSchools] = useState<Record<string, boolean>>({});

  const contentRepository = ContentRepositoryService.getInstance();
  const [isLockedSectionOpen, setIsLockedSectionOpen] = useState<boolean>(false);

  if (!character) return null;

  // Get all spell abilities from character
  const characterService = getCharacterService();
  const allAbilities = characterService.getAbilities();
  const spellAbilities = allAbilities.filter(
    (ability) => ability.type === "spell",
  ) as SpellAbilityDefinition[];

  // Get spell scaling multiplier
  const spellScalingMultiplier = characterService.getSpellScalingLevel();

  // Helper function to get effective damage formula with scaling
  const getEffectiveDamageFormula = (spell: SpellAbilityDefinition): string | null => {
    if (!spell.diceFormula) return null;
    
    // If no scaling bonus or multiplier is 0, return base formula
    if (!spell.scalingBonus || spellScalingMultiplier === 0) {
      return spell.diceFormula;
    }

    // Build the effective formula
    const scalingPart = spell.scalingBonus.startsWith('+') || spell.scalingBonus.startsWith('-')
      ? spell.scalingBonus
      : `+${spell.scalingBonus}`;
    
    // If multiplier is 1, just add the bonus once
    if (spellScalingMultiplier === 1) {
      return `${spell.diceFormula}${scalingPart}`;
    } else {
      // Extract the numeric/dice part from the scaling bonus and multiply
      const cleanBonus = scalingPart.replace(/^[+-]/, '');
      return `${spell.diceFormula}+${spellScalingMultiplier}×(${cleanBonus})`;
    }
  };

  // Find mana resource (if any)
  const resources = characterService.getResources();
  const manaResource = resources.find(
    (resource) =>
      resource.definition.id.toLowerCase() === "mana" ||
      resource.definition.name.toLowerCase().includes("mana"),
  );

  // Get all spell schools the character has access to
  const characterSpellSchools = characterService.getSpellSchools();

  // Get all locked spells by school
  const getLockedSpellsBySchool = () => {
    const lockedSpellsBySchool: Record<string, SpellAbilityDefinition[]> = {};

    characterSpellSchools.forEach((schoolId) => {
      const allSpells = contentRepository.getSpellsBySchool(schoolId);
      // Include tier 0 spells when checking what's available vs locked
      const lockedSpells = allSpells.filter((spell) => spell.tier > character._spellTierAccess);

      if (lockedSpells.length > 0) {
        lockedSpellsBySchool[schoolId] = lockedSpells;
      }
    });

    return lockedSpellsBySchool;
  };

  const lockedSpellsBySchool = getLockedSpellsBySchool();

  if (spellAbilities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Spells
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No spells available. Gain spell school access to learn spells!
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group spells by school
  const spellsBySchool = spellAbilities.reduce(
    (acc, spell) => {
      if (!acc[spell.school]) {
        acc[spell.school] = [];
      }
      acc[spell.school].push(spell);
      return acc;
    },
    {} as Record<string, SpellAbilityDefinition[]>,
  );

  // Sort spells within each school by tier, then by name
  Object.values(spellsBySchool).forEach((spells) => {
    spells.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
  });

  const getTierColor = (tier: number) => {
    if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
    if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const handleSpellCast = async (spell: SpellAbilityDefinition) => {
    await performUseAbility(spell.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Spells
          <Badge variant="secondary" className="ml-2">
            {character._spellTierAccess === 0 ? "Cantrip" : `Tier ${character._spellTierAccess}`}{" "}
            Access
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mana Tracker */}
        {manaResource && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{manaResource.definition.name}</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{manaResource.current}</div>
                <div className="text-xs text-muted-foreground">
                  / {getFlexibleValue(manaResource.definition.maxValue)}
                </div>
              </div>
            </div>
            {/* Mana bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{
                  width: `${Math.max(0, Math.min(100, (manaResource.current / getFlexibleValue(manaResource.definition.maxValue)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {Object.entries(spellsBySchool).map(([school, spells]) => {
          const isOpen = openSchools[school] ?? true;
          const onToggle = (open: boolean) => {
            setOpenSchools((prev) => ({ ...prev, [school]: open }));
          };
          const schoolData = contentRepository.getSpellSchool(school);
          const schoolName = schoolData?.name || school;
          const schoolColor = schoolData?.color || "text-gray-600";
          const SchoolIcon = schoolData?.icon ? getIconById(schoolData.icon) : Sparkles;

          return (
            <Collapsible key={school} open={isOpen} onOpenChange={onToggle}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <h3 className={`text-lg font-semibold flex items-center gap-2 ${schoolColor}`}>
                    <SchoolIcon className="w-5 h-5" />
                    {schoolName} ({spells.length})
                  </h3>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-3 pt-2">
                  {spells.map((spell) => {
                    const canCast = hasEnoughResourcesForSpell(resources, spell);
                    const insufficientMessage = getInsufficientResourceMessage(resources, spell);

                    return (
                      <div key={spell.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{spell.name}</h4>
                              <Badge variant="outline" className={getTierColor(spell.tier)}>
                                {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {spell.category === "utility" ? "Utility" : "Combat"}
                              </Badge>
                            </div>

                            {/* Action and Resource costs in a row */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {spell.actionCost !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                  {formatActionCost(spell.actionCost)}
                                </Badge>
                              )}
                              {spell.resourceCost && (
                                <Badge
                                  variant={canCast ? "secondary" : "destructive"}
                                  className="text-xs"
                                >
                                  {formatResourceCost(spell.resourceCost)}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">{spell.description}</p>
                            {spell.diceFormula && (
                              <div className="text-xs text-muted-foreground">
                                <span>Damage: {getEffectiveDamageFormula(spell)}</span>
                                {spell.scalingBonus && spellScalingMultiplier > 0 && (
                                  <span className="ml-2 text-green-600">
                                    (Scaled ×{spellScalingMultiplier})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant={canCast ? "outline" : "ghost"}
                            onClick={() => handleSpellCast(spell)}
                            className="ml-4"
                            disabled={!canCast}
                            title={insufficientMessage || "Cast spell"}
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Locked Spells Section */}
        {Object.keys(lockedSpellsBySchool).length > 0 && (
          <div className="pt-6 border-t">
            <Collapsible open={isLockedSectionOpen} onOpenChange={setIsLockedSectionOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <h3
                    className={`text-lg font-semibold flex items-center gap-2 text-muted-foreground`}
                  >
                    <Lock className="w-5 h-5" />
                    Locked Spells
                  </h3>
                  {isLockedSectionOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 pt-2">
                  {Object.entries(lockedSpellsBySchool).map(([schoolId, spells]) => {
                    const school = contentRepository.getSpellSchool(schoolId);
                    const schoolName = school?.name || schoolId;
                    const schoolColor = school?.color || "text-gray-600";
                    const SchoolIcon = school?.icon ? getIconById(school.icon) : Sparkles;
                    const isOpen = openLockedSchools[schoolId] ?? false;

                    return (
                      <Collapsible
                        key={schoolId}
                        open={isOpen}
                        onOpenChange={(open) => {
                          setOpenLockedSchools((prev) => ({ ...prev, [schoolId]: open }));
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                            <h4 className={`font-semibold flex items-center gap-2 ${schoolColor}`}>
                              <SchoolIcon className="w-4 h-4" />
                              {schoolName} ({spells.length} locked)
                            </h4>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-3 pt-2 pl-4">
                            {spells.map((spell) => (
                              <div
                                key={spell.id}
                                className="border rounded-lg p-4 space-y-3 bg-muted/30"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h5 className="font-semibold text-muted-foreground">
                                        {spell.name}
                                      </h5>
                                      <Badge variant="outline" className={getTierColor(spell.tier)}>
                                        {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {spell.category === "utility" ? "Utility" : "Combat"}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className="text-red-600 border-red-600"
                                      >
                                        Requires Tier {spell.tier} Access
                                      </Badge>
                                      {spell.actionCost !== undefined && (
                                        <Badge variant="secondary" className="text-xs">
                                          {spell.actionCost === 0
                                            ? "Bonus Action"
                                            : spell.actionCost === 1
                                              ? "Action"
                                              : `${spell.actionCost} Actions`}
                                        </Badge>
                                      )}
                                      {spell.resourceCost && (
                                        <Badge variant="secondary" className="text-xs">
                                          {spell.resourceCost.type === "fixed"
                                            ? `${spell.resourceCost.amount} ${spell.resourceCost.resourceId}`
                                            : `${spell.resourceCost.minAmount}-${spell.resourceCost.maxAmount} ${spell.resourceCost.resourceId}`}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground/70">
                                      {spell.description}
                                    </p>
                                    {spell.diceFormula && (
                                      <div className="text-xs text-muted-foreground/70">
                                        <span>Damage: {getEffectiveDamageFormula(spell)}</span>
                                        {spell.scalingBonus && spellScalingMultiplier > 0 && (
                                          <span className="ml-2 text-green-600/70">
                                            (Will scale ×{spellScalingMultiplier})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <Lock className="w-4 h-4 text-muted-foreground ml-4" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
