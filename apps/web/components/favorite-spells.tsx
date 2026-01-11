"use client";

import { ChevronDown, ChevronRight, Sparkles, Star, TrendingUp, Zap } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { Character } from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { SpellCastingService } from "@/lib/services/spell-casting-service";
import {
  ManaCastingOptions,
  SlotCastingOptions,
  SpellCastingOptions,
} from "@/lib/services/spell-casting-types";
import { getIconById } from "@/lib/utils/icon-utils";
import { formatActionCost } from "@/lib/utils/spell-utils";

import { UpcastSpellDialog } from "./dialogs/upcast-spell-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { MarkdownRenderer } from "./ui/markdown-renderer";

interface FavoriteSpellsProps {
  character: Character;
  advantageLevel: number;
}

export function FavoriteSpells({ character, advantageLevel }: FavoriteSpellsProps) {
  const { toggleFavoriteSpell, getSpellTierAccess, getResources } = useCharacterService();
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const [upcastingSpell, setUpcastingSpell] = useState<SpellAbilityDefinition | null>(null);

  const contentRepository = ContentRepositoryService.getInstance();
  const characterService = getCharacterService();
  const spellCastingService = SpellCastingService.getInstance();

  // Get favorited spell IDs
  const favoritedSpellIds = character._favorites.spells;

  // Get all abilities and filter for favorited combat spells
  const allAbilities = characterService.getAbilities();
  const favoritedSpells = allAbilities.filter(
    (ability): ability is SpellAbilityDefinition =>
      ability.type === "spell" &&
      ability.category === "combat" &&
      favoritedSpellIds.includes(ability.id),
  ) as SpellAbilityDefinition[];

  // Sort by tier first, then by spell school
  const sortedFavoritedSpells = [...favoritedSpells].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.school.localeCompare(b.school);
  });

  const spellTierAccess = getSpellTierAccess();
  const _resources = getResources();
  const spellScalingMultiplier = characterService.getSpellScalingLevel();
  const spellcastingConfig = characterService.getSpellcastingConfig();

  // Create casting options once based on spellcasting method
  const createCastingOptions = (
    spell: SpellAbilityDefinition,
    targetTier?: number,
  ): SpellCastingOptions => {
    if (spellcastingConfig?.method === "slot") {
      return {
        methodType: "slot",
        advantageLevel,
      } as SlotCastingOptions;
    } else {
      return {
        methodType: "mana",
        targetTier: targetTier || spell.tier,
        advantageLevel,
      } as ManaCastingOptions;
    }
  };

  const getTierColor = (tier: number) => {
    if (tier === 1) return "bg-green-100 text-green-800 border-green-200";
    if (tier <= 3) return "bg-blue-100 text-blue-800 border-blue-200";
    if (tier <= 6) return "bg-purple-100 text-purple-800 border-purple-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getEffectiveDamageFormula = (spell: SpellAbilityDefinition): string | null => {
    if (!spell.diceFormula) return null;

    if (!spell.scalingBonus || spellScalingMultiplier === 0) {
      return spell.diceFormula;
    }

    const scalingPart =
      spell.scalingBonus.startsWith("+") || spell.scalingBonus.startsWith("-")
        ? spell.scalingBonus
        : `+${spell.scalingBonus}`;

    if (spellScalingMultiplier === 1) {
      return `${spell.diceFormula}${scalingPart}`;
    } else {
      const cleanBonus = scalingPart.replace(/^[+-]/, "");
      return `${spell.diceFormula}+${spellScalingMultiplier}×(${cleanBonus})`;
    }
  };

  const handleSpellCast = async (spell: SpellAbilityDefinition, targetTier?: number) => {
    const options = createCastingOptions(spell, targetTier);
    const result = await spellCastingService.castSpell(spell.id, options);

    if (!result.success) {
      console.error("Failed to cast spell:", result.error);
    }

    setUpcastingSpell(null);
  };

  const handleUpcastClick = (spell: SpellAbilityDefinition) => {
    setUpcastingSpell(spell);
  };

  const handleToggleFavorite = async (spell: SpellAbilityDefinition) => {
    try {
      await toggleFavoriteSpell(spell.id);
    } catch (error) {
      console.error("Failed to toggle favorite spell:", error);
    }
  };

  const toggleSpellExpanded = (spellId: string) => {
    setExpandedSpells((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(spellId)) {
        newSet.delete(spellId);
      } else {
        newSet.add(spellId);
      }
      return newSet;
    });
  };

  if (sortedFavoritedSpells.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Spells
        </h3>
        <Card>
          <CardContent className="p-0">
            {sortedFavoritedSpells.map((spell, index) => {
              const options = createCastingOptions(spell);
              const cost = spellCastingService.calculateCastingCost(spell.id, options);
              const canCast = cost?.canAfford ?? false;
              const insufficientMessage = cost?.warningMessage || null;
              const canUpcast = spellCastingService.canUpcastSpell(spell.id, options);
              const actionCost = spell.actionCost || 0;
              const insufficientActions =
                character.inEncounter &&
                actionCost > 0 &&
                character.actionTracker.current < actionCost;
              const isDisabled = !canCast || insufficientActions;
              const isExpanded = expandedSpells.has(spell.id);

              // Get school data for icon
              const schoolData = contentRepository.getSpellSchool(spell.school);
              const schoolColor = schoolData?.color || "text-gray-600";
              const SchoolIcon = schoolData?.icon ? getIconById(schoolData.icon) : Sparkles;

              return (
                <div
                  key={spell.id}
                  className={`p-2 hover:bg-muted/50 transition-colors ${
                    index > 0 ? "border-t" : ""
                  } ${isDisabled ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <div className="shrink-0 mt-0.5">
                        <SchoolIcon className={`w-3 h-3 ${schoolColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleSpellExpanded(spell.id)}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <span className="font-medium text-sm">{spell.name}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="mt-1 mb-2">
                            <MarkdownRenderer content={spell.description} className="text-xs" />
                            {spell.diceFormula && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <span>Damage: {getEffectiveDamageFormula(spell)}</span>
                                {spell.scalingBonus && spellScalingMultiplier > 0 && (
                                  <span className="ml-2 text-green-600">
                                    (Scaled ×{spellScalingMultiplier})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          <div className="flex gap-1 flex-wrap items-center">
                            <Badge variant="outline" className={getTierColor(spell.tier)}>
                              {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                            </Badge>
                            {actionCost > 0 && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${insufficientActions ? "text-red-600" : ""}`}
                              >
                                {formatActionCost(actionCost)}
                              </Badge>
                            )}
                            {cost?.resourceCost && (
                              <Badge
                                variant={canCast ? "secondary" : "destructive"}
                                className="text-xs"
                              >
                                {cost.resourceCost.amount} {cost.resourceCost.resourceName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFavorite(spell)}
                        title="Remove from favorites"
                        className="h-7 px-2"
                      >
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      </Button>
                      <Button
                        variant={isDisabled ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleSpellCast(spell)}
                        disabled={isDisabled}
                        className="h-7 text-xs"
                        title={
                          insufficientActions ? "No Actions" : insufficientMessage || "Cast spell"
                        }
                      >
                        <Zap className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">
                          {insufficientActions ? "No Actions" : !canCast ? "Need Resource" : "Cast"}
                        </span>
                      </Button>
                      {canUpcast && (
                        <Button
                          size="sm"
                          variant={isDisabled ? "outline" : "default"}
                          onClick={() => handleUpcastClick(spell)}
                          disabled={isDisabled}
                          title="Upcast spell for increased effect"
                          className="h-7 px-2"
                        >
                          <TrendingUp className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Upcast Dialog */}
      {upcastingSpell && (
        <UpcastSpellDialog
          spell={upcastingSpell}
          baseTier={upcastingSpell.tier}
          maxTier={spellTierAccess}
          onCast={(targetTier) => handleSpellCast(upcastingSpell, targetTier)}
          onClose={() => setUpcastingSpell(null)}
        />
      )}
    </>
  );
}
