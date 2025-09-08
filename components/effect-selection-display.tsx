"use client";

import { Plus, Check, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";

import { 
  FeatureEffect,
  SpellSchoolChoiceFeatureEffect,
  AttributeBoostFeatureEffect,
  PickFeatureFromPoolFeatureEffect,
} from "@/lib/schemas/features";
import { 
  Character,
  EffectSelection,
  SpellSchoolEffectSelection,
  AttributeBoostEffectSelection,
  UtilitySpellsEffectSelection,
  PoolFeatureEffectSelection,
  SubclassEffectSelection
} from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getIconById } from "@/lib/utils/icon-utils";

import { Button } from "./ui/button";

interface EffectSelectionDisplayProps {
  effect: FeatureEffect;
  effectId: string;
  existingSelection?: EffectSelection;
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
  existingSelection,
  onOpenDialog,
  character,
  autoOpen = false 
}: EffectSelectionDisplayProps) {
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Auto-open dialog for unmade selections
  useEffect(() => {
    if (autoOpen && !existingSelection && !hasAutoOpened) {
      setHasAutoOpened(true);
      onOpenDialog(effect);
    }
  }, [autoOpen, existingSelection, hasAutoOpened, effect, onOpenDialog]);

  const contentRepository = ContentRepositoryService.getInstance();
  const classService = getClassService();

  const renderSelectionContent = () => {
    if (!existingSelection) {
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
          const remaining = character ? featureSelectionService.getRemainingPoolSelections(
            character, 
            poolEffect, 
          ) : poolEffect.choicesAllowed;
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
          const schoolsRemaining = character ? featureSelectionService.getRemainingSpellSchoolSelections(
            character,
            spellEffect,
          ) : (spellEffect.numberOfChoices || 1);
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

    // Display existing selection
    switch (existingSelection?.type) {
      case "subclass": {
        const subclassSelection = existingSelection as SubclassEffectSelection;
        const contentRepository = ContentRepositoryService.getInstance();
        const subclass = contentRepository.getSubclassDefinition(subclassSelection.subclassId);
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">{subclass?.name || subclassSelection.subclassId}</span>
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
        const poolSelections = character ? character.effectSelections.filter(
          s => s.type === "pool_feature" && s.grantedByEffectId === effectId
        ) as PoolFeatureEffectSelection[] : [existingSelection as PoolFeatureEffectSelection];
        
        const poolEffect = effect as PickFeatureFromPoolFeatureEffect;
        const remaining = character ? featureSelectionService.getRemainingPoolSelections(
          character, 
          poolEffect, 
        ) : 0;

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
        const schoolSelections = character ? character.effectSelections.filter(
          s => s.type === "spell_school" && s.grantedByEffectId === effectId
        ) as SpellSchoolEffectSelection[] : [existingSelection as SpellSchoolEffectSelection];
        
        const spellEffect = effect as SpellSchoolChoiceFeatureEffect;
        const remaining = character ? featureSelectionService.getRemainingSpellSchoolSelections(
          character,
          spellEffect,
        ) : 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                {schoolSelections.map((selection, idx) => {
                  const school = contentRepository.getAllSpellSchools().find(s => s.id === selection.schoolId);
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
        const boostSelection = existingSelection as AttributeBoostEffectSelection;
        const boostEffect = effect as AttributeBoostFeatureEffect;
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              {boostSelection.attribute.charAt(0).toUpperCase() + boostSelection.attribute.slice(1)} +{boostSelection.amount}
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
        const spellsSelection = existingSelection as UtilitySpellsEffectSelection;
        return (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm">
              {spellsSelection.spellIds.length} spell{spellsSelection.spellIds.length !== 1 ? 's' : ''} selected
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

      default:
        return null;
    }
  };

  const content = renderSelectionContent();
  if (!content) return null;

  return <div className="ml-4">{content}</div>;
}