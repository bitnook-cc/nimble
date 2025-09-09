"use client";

import {
  Award,
  BookOpen,
  CircleDot,
  Crown,
  Plus,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import React from "react";

import { Badge } from "@/components/ui/badge";

import { Character, EffectSelection } from "@/lib/schemas/character";
import { FeatureEffect, SpellSchoolFeatureEffect } from "@/lib/schemas/features";
import { FlexibleValue } from "@/lib/schemas/flexible-value";

import { EffectSelectionDisplay } from "./effect-selection-display";

interface FeatureEffectsDisplayProps {
  effects: FeatureEffect[];
  existingSelections?: EffectSelection[];
  onOpenSelectionDialog?: (effect: FeatureEffect) => void;
  character?: Character;
  className?: string;
  abilityOverrideInfo?: Map<
    string,
    { currentLevel: number; overriddenLevels: number[]; isManual: boolean }
  >;
}

const getEffectIcon = (effectType: string) => {
  switch (effectType) {
    case "ability":
      return <Zap className="h-3 w-3" />;
    case "attribute_boost":
      return <TrendingUp className="h-3 w-3" />;
    case "stat_bonus":
      return <Plus className="h-3 w-3" />;
    case "proficiency":
      return <Award className="h-3 w-3" />;
    case "spell_school":
      return <BookOpen className="h-3 w-3" />;
    case "spell_school_choice":
      return <BookOpen className="h-3 w-3" />;
    case "utility_spells":
      return <Sparkles className="h-3 w-3" />;
    case "spell_tier_access":
      return <Crown className="h-3 w-3" />;
    case "resource":
      return <CircleDot className="h-3 w-3" />;
    case "subclass_choice":
      return <Users className="h-3 w-3" />;
    case "pick_feature_from_pool":
      return <Users className="h-3 w-3" />;
    case "resistance":
      return <Shield className="h-3 w-3" />;
    default:
      return null;
  }
};

const getEffectLabel = (effectType: string) => {
  switch (effectType) {
    case "ability":
      return "Ability";
    case "attribute_boost":
      return "Attribute Boost";
    case "stat_bonus":
      return "Stat Bonus";
    case "proficiency":
      return "Proficiency";
    case "spell_school":
      return "Spell School";
    case "spell_school_choice":
      return "Choose Spell School";
    case "utility_spells":
      return "Utility Spells";
    case "spell_tier_access":
      return "Spell Tier Access";
    case "resource":
      return "Resource";
    case "subclass_choice":
      return "Choose Subclass";
    case "pick_feature_from_pool":
      return "Choose Feature";
    case "resistance":
      return "Resistance";
    default:
      return effectType;
  }
};

const formatEffectDescription = (effect: FeatureEffect): string => {
  switch (effect.type) {
    case "ability":
      return `Grants: ${effect.ability.name}`;

    case "attribute_boost":
      const attrs = effect.allowedAttributes.map((a) => a.toUpperCase()).join(" or ");
      return `+${effect.amount} to ${attrs}`;

    case "stat_bonus":
      const bonuses: string[] = [];

      // Helper to format flexible values
      const formatValue = (val: number | FlexibleValue | undefined): string | null => {
        if (!val) return null;
        if (typeof val === "number") {
          if (val === 0) return null;
          return `${val > 0 ? "+" : ""}${val}`;
        }
        if (val.type === "fixed") {
          if (val.value === 0) return null;
          return `${val.value > 0 ? "+" : ""}${val.value}`;
        }
        if (val.type === "formula") {
          return val.expression;
        }
        return null;
      };

      // Attributes
      if (effect.statBonus.attributes) {
        Object.entries(effect.statBonus.attributes).forEach(([attr, val]) => {
          const formatted = formatValue(val);
          if (formatted) {
            bonuses.push(`${formatted} ${attr.toUpperCase()}`);
          }
        });
      }

      // Skills
      if (effect.statBonus.skillBonuses) {
        Object.entries(effect.statBonus.skillBonuses).forEach(([skill, val]) => {
          const formatted = formatValue(val);
          if (formatted) {
            bonuses.push(`${formatted} ${skill}`);
          }
        });
      }

      // Combat stats
      if (effect.statBonus.initiativeBonus) {
        const formatted = formatValue(effect.statBonus.initiativeBonus);
        if (formatted) bonuses.push(`${formatted} Initiative`);
      }
      if (effect.statBonus.speedBonus) {
        const formatted = formatValue(effect.statBonus.speedBonus);
        if (formatted) bonuses.push(`${formatted} Speed`);
      }
      if (effect.statBonus.armorBonus) {
        const formatted = formatValue(effect.statBonus.armorBonus);
        if (formatted) bonuses.push(`${formatted} Armor`);
      }
      if (effect.statBonus.maxWoundsBonus) {
        const formatted = formatValue(effect.statBonus.maxWoundsBonus);
        if (formatted) bonuses.push(`${formatted} Wounds`);
      }
      if (effect.statBonus.hitDiceBonus) {
        const formatted = formatValue(effect.statBonus.hitDiceBonus);
        if (formatted) bonuses.push(`${formatted} Hit Dice`);
      }

      // Resources
      if (effect.statBonus.resourceMaxBonuses) {
        Object.entries(effect.statBonus.resourceMaxBonuses).forEach(([resourceId, val]) => {
          const formatted = formatValue(val);
          if (formatted) {
            // Try to get resource name
            const resourceName = resourceId.charAt(0).toUpperCase() + resourceId.slice(1);
            bonuses.push(`${formatted} ${resourceName}`);
          }
        });
      }

      return bonuses.length > 0 ? bonuses.join(", ") : "Stat bonus";

    case "proficiency":
      return effect.proficiencies.map((p) => p.name).join(", ");

    case "spell_school":
      const spellSchoolEffect = effect as SpellSchoolFeatureEffect;
      return `Unlocks spell school: ${spellSchoolEffect.schoolId}`;

    case "spell_school_choice":
      const numChoices = effect.numberOfChoices || 1;
      return `Choose ${numChoices} spell school${numChoices > 1 ? "s" : ""}`;

    case "utility_spells":
      if (effect.selectionMode === "full_school") {
        return effect.schools && effect.schools.length > 0
          ? `All utility spells from one chosen school (${effect.schools.join(", ")})`
          : `All utility spells from one chosen school`;
      }
      return effect.schools && effect.schools.length > 0
        ? `Utility spells from ${effect.schools.join(", ")}`
        : `Utility spells from your known schools`;

    case "spell_tier_access":
      return `Access to Tier ${effect.maxTier} spells`;

    case "resource":
      return `${effect.resourceDefinition.name}: ${effect.resourceDefinition.description || "Resource"}`;

    case "subclass_choice":
      return "Select your specialization";

    case "pick_feature_from_pool":
      return `Choose ${effect.choicesAllowed} feature${effect.choicesAllowed > 1 ? "s" : ""} from ${effect.poolId}`;

    case "resistance":
      return effect.resistances.map((r) => r.name).join(", ");

    default:
      return "Effect";
  }
};

const isSelectableEffect = (effect: FeatureEffect): boolean => {
  return [
    "attribute_boost",
    "spell_school_choice",
    "utility_spells",
    "subclass_choice",
    "pick_feature_from_pool",
  ].includes(effect.type);
};

export function FeatureEffectsDisplay({
  effects,
  existingSelections = [],
  onOpenSelectionDialog,
  character,
  className = "",
  abilityOverrideInfo,
}: FeatureEffectsDisplayProps) {
  if (!effects || effects.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        Passive feature - no mechanical effects
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Effects
      </div>
      <div className="space-y-2">
        {effects.map((effect, index) => {
          const effectId = effect.id || `effect-${index}`;
          const isSelectable = isSelectableEffect(effect);

          // Check if we should show selection UI for this effect
          const needsSelection = onOpenSelectionDialog && isSelectable;
          // Get all selections for this effect
          const effectSelections = existingSelections.filter(
            (s) => s.grantedByEffectId === effectId,
          );

          // If this is a selectable effect with selection handler, use EffectSelectionDisplay
          if (needsSelection) {
            return (
              <div key={effectId} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                <div className="flex items-center gap-1">
                  {getEffectIcon(effect.type)}
                  <Badge variant="secondary" className="text-xs">
                    {getEffectLabel(effect.type)}
                  </Badge>
                </div>
                <div className="flex-1">
                  {effectSelections.length > 0 ? (
                    // Show the selection instead of the description
                    <EffectSelectionDisplay
                      effect={effect}
                      effectId={effectId}
                      existingSelections={effectSelections}
                      onOpenDialog={onOpenSelectionDialog}
                      character={character}
                      autoOpen={false}
                    />
                  ) : (
                    // Show the description with a selection button
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{formatEffectDescription(effect)}</span>
                      <EffectSelectionDisplay
                        effect={effect}
                        effectId={effectId}
                        existingSelections={effectSelections}
                        onOpenDialog={onOpenSelectionDialog}
                        character={character}
                        autoOpen={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Check if this is an ability effect that is overriding lower level versions
          let override = null;
          if (effect.type === "ability" && abilityOverrideInfo) {
            const ability = (effect as any).ability;
            if (ability && ability.id) {
              override = abilityOverrideInfo.get(ability.id);
            }
          }

          // Original display for non-selectable effects
          return (
            <div key={effectId} className="flex items-center gap-2 p-2 rounded-md border bg-card">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1">
                  {getEffectIcon(effect.type)}
                  <Badge variant="secondary" className="text-xs">
                    {getEffectLabel(effect.type)}
                  </Badge>
                  {override && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-amber-50 border-amber-200 text-amber-700"
                    >
                      {override.isManual
                        ? `Manual Override (Replaces Lvl ${override.overriddenLevels.join(", ")})`
                        : `Overrides Lvl ${override.overriddenLevels.join(", ")}`}
                    </Badge>
                  )}
                </div>
                <span className="text-sm">{formatEffectDescription(effect)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
