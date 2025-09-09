"use client";

import { Check, Edit2, Plus } from "lucide-react";

import { useEffect, useState } from "react";

import {
  AttributeBoostEffectSelection,
  Character,
  EffectSelection,
  PoolFeatureEffectSelection,
  SpellSchoolEffectSelection,
  SubclassEffectSelection,
  UtilitySpellsEffectSelection,
} from "@/lib/schemas/character";
import {
  AttributeBoostFeatureEffect,
  FeatureEffect,
  PickFeatureFromPoolFeatureEffect,
  SpellSchoolChoiceFeatureEffect,
} from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getIconById } from "@/lib/utils/icon-utils";

import { Button } from "./ui/button";

interface EffectSelectionDisplayProps {
  effect: FeatureEffect;
  effectId: string;
  existingSelections: EffectSelection[]; // Always pass all selections for this effect
  onOpenDialog: (effect: FeatureEffect) => void;
  character?: Character;
  autoOpen?: boolean;
}

/**
 * Component that displays the current selection for an effect
 * and allows editing or making new selections
 */
export function EffectSelectionDisplay({
  effect,
  effectId,
  existingSelections,
  onOpenDialog,
  character,
  autoOpen = false,
}: EffectSelectionDisplayProps) {
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Check if we have any selections for this effect
  const hasSelections = existingSelections.length > 0;

  // Auto-open dialog for unmade selections
  useEffect(() => {
    if (autoOpen && !hasSelections && !hasAutoOpened) {
      setHasAutoOpened(true);
      onOpenDialog(effect);
    }
  }, [autoOpen, hasSelections, hasAutoOpened, effect, onOpenDialog]);

  const contentRepository = ContentRepositoryService.getInstance();

  const renderSelectionContent = () => {
    if (!hasSelections) {
      switch (effect.type) {
        case "subclass_choice":
          return (
            <Button
              size="sm"
              variant="default"
              onClick={() => onOpenDialog(effect)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Choose Subclass
            </Button>
          );

        case "pick_feature_from_pool":
          const poolEffect = effect as PickFeatureFromPoolFeatureEffect;
          const remaining = character
            ? featureSelectionService.getRemainingPoolSelections(character, poolEffect)
            : poolEffect.choicesAllowed;
          if (remaining > 0) {
            return (
              <Button
                size="sm"
                variant="default"
                onClick={() => onOpenDialog(effect)}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Select Feature ({remaining} remaining)
              </Button>
            );
          }
          break;

        case "spell_school_choice":
          const spellEffect = effect as SpellSchoolChoiceFeatureEffect;
          const schoolsRemaining = character
            ? featureSelectionService.getRemainingSpellSchoolSelections(character, spellEffect)
            : spellEffect.numberOfChoices || 1;
          if (schoolsRemaining > 0) {
            return (
              <Button
                size="sm"
                variant="default"
                onClick={() => onOpenDialog(effect)}
                className="gap-1"
              >
                <Plus className="w-3 h-3" />
                Choose School ({schoolsRemaining} remaining)
              </Button>
            );
          }
          break;

        case "attribute_boost":
          return (
            <Button
              size="sm"
              variant="default"
              onClick={() => onOpenDialog(effect)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Choose Attribute
            </Button>
          );

        case "utility_spells":
          return (
            <Button
              size="sm"
              variant="default"
              onClick={() => onOpenDialog(effect)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Choose Spells
            </Button>
          );

        default:
          return null;
      }
    }

    // Display existing selections
    const firstSelection = existingSelections[0];
    switch (firstSelection?.type) {
      case "subclass": {
        const subclassSelection = firstSelection as SubclassEffectSelection;
        const contentRepository = ContentRepositoryService.getInstance();
        const subclass = contentRepository.getSubclassDefinition(subclassSelection.subclassId);
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              {subclass?.name || subclassSelection.subclassId}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenDialog(effect)}
              className="h-6 px-2"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        );
      }

      case "pool_feature": {
        const poolSelections = existingSelections as PoolFeatureEffectSelection[];
        const poolEffect = effect as PickFeatureFromPoolFeatureEffect;
        const remaining = character
          ? featureSelectionService.getRemainingPoolSelections(character, poolEffect)
          : 0;

        return (
          <div className="space-y-1">
            {poolSelections.map((selection, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{selection.feature.name}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              {remaining > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDialog(effect)}
                  className="gap-1 h-7"
                >
                  <Plus className="w-3 h-3" />
                  Add More ({remaining} remaining)
                </Button>
              )}
              {poolSelections.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDialog(effect)}
                  className="h-7 px-2"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Change
                </Button>
              )}
            </div>
          </div>
        );
      }

      case "spell_school": {
        const schoolSelections = existingSelections as SpellSchoolEffectSelection[];
        const spellEffect = effect as SpellSchoolChoiceFeatureEffect;
        const remaining = character
          ? featureSelectionService.getRemainingSpellSchoolSelections(character, spellEffect)
          : 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                {schoolSelections.map((selection, idx) => {
                  const school = contentRepository
                    .getAllSpellSchools()
                    .find((s) => s.id === selection.schoolId);
                  const SchoolIcon = school ? getIconById(school.icon) : null;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      {SchoolIcon && <SchoolIcon className={`w-4 h-4 ${school?.color}`} />}
                      <span className="text-sm">{school?.name || selection.schoolId}</span>
                    </div>
                  );
                })}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenDialog(effect)}
                className="h-6 px-2"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
            {remaining > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenDialog(effect)}
                className="gap-1 h-7"
              >
                <Plus className="w-3 h-3" />
                Add More ({remaining} remaining)
              </Button>
            )}
          </div>
        );
      }

      case "attribute_boost": {
        const boostSelection = firstSelection as AttributeBoostEffectSelection;
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              {boostSelection.attribute.charAt(0).toUpperCase() + boostSelection.attribute.slice(1)}{" "}
              +{boostSelection.amount}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenDialog(effect)}
              className="h-6 px-2"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        );
      }

      case "utility_spells": {
        const spellSelections = existingSelections as UtilitySpellsEffectSelection[];
        const spellCount = spellSelections.length;

        if (spellCount > 0) {
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  {spellSelections.map((selection, idx) => {
                    // Check if this is a full_school selection (no spellId, just schoolId)
                    if (!selection.spellId && selection.schoolId) {
                      const school = contentRepository.getSpellSchool(selection.schoolId);
                      const SchoolIcon = school?.icon ? getIconById(school.icon) : null;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          {SchoolIcon && (
                            <SchoolIcon className={`w-4 h-4`} style={{ color: school?.color }} />
                          )}
                          <span className="text-sm font-medium">
                            All utility spells from {school?.name || selection.schoolId}
                          </span>
                        </div>
                      );
                    }
                    // Regular spell selection
                    const spell = selection.spellId
                      ? contentRepository.getSpellById(selection.spellId)
                      : null;
                    const school = spell ? contentRepository.getSpellSchool(spell.school) : null;
                    const SchoolIcon = school ? getIconById(school.icon) : null;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        {SchoolIcon && (
                          <SchoolIcon className={`w-4 h-4`} style={{ color: school?.color }} />
                        )}
                        <span className="text-sm">
                          {spell?.name || selection.spellId}
                          {school && (
                            <span className="text-muted-foreground ml-1">({school.name})</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenDialog(effect)}
                  className="h-6 px-2"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        }
        return null;
      }

      default:
        return null;
    }
  };

  const content = renderSelectionContent();
  if (!content) return null;

  return <div className="ml-4">{content}</div>;
}
