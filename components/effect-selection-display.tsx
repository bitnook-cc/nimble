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
  SpellSchoolEffectSelection,
  AttributeBoostEffectSelection,
  UtilitySpellsEffectSelection,
  PoolFeatureEffectSelection,
  SubclassEffectSelection
} from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";
import { featureSelectionService } from "@/lib/services/feature-selection-service";

import { Button } from "./ui/button";

interface EffectSelectionDisplayProps {
  effect: FeatureEffect;
  effectId: string;
  character: Character;
  onOpenDialog: (effect: FeatureEffect, effectId: string) => void;
  autoOpen?: boolean;
}

/**
 * Component that displays the current selection for an effect
 * and allows editing or making new selections
 */
export function EffectSelectionDisplay({ 
  effect, 
  effectId, 
  character, 
  onOpenDialog,
  autoOpen = false 
}: EffectSelectionDisplayProps) {
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  
  // Find existing selection for this effect
  const existingSelection = character.effectSelections.find(
    s => s.grantedByEffectId === effectId
  );

  // Auto-open dialog for unmade selections
  useEffect(() => {
    if (autoOpen && !existingSelection && !hasAutoOpened) {
      setHasAutoOpened(true);
      onOpenDialog(effect, effectId);
    }
  }, [autoOpen, existingSelection, hasAutoOpened, effect, effectId, onOpenDialog]);

  const contentRepository = ContentRepositoryService.getInstance();
  const classService = getClassService();

  const renderSelectionContent = () => {
    if (!existingSelection) {
      switch (effect.type) {
        case "subclass_choice":
          return (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onOpenDialog(effect, effectId)}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              Choose Subclass
            </Button>
          );

        case "pick_feature_from_pool":
          const poolEffect = effect as PickFeatureFromPoolFeatureEffect;
          const remaining = featureSelectionService.getRemainingPoolSelections(
            character, 
            poolEffect, 
          );
          if (remaining > 0) {
            return (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onOpenDialog(effect, effectId)}
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
          const schoolsRemaining = featureSelectionService.getRemainingSpellSchoolSelections(
            character,
            spellEffect,
          );
          if (schoolsRemaining > 0) {
            return (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onOpenDialog(effect, effectId)}
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
              variant="outline"
              onClick={() => onOpenDialog(effect, effectId)}
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
              variant="outline"
              onClick={() => onOpenDialog(effect, effectId)}
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
              variant="ghost"
              onClick={() => onOpenDialog(effect, effectId)}
              className="h-6 px-2"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        );
      }

      case "pool_feature": {
        const poolSelections = character.effectSelections.filter(
          s => s.type === "pool_feature" && s.grantedByEffectId === effectId
        ) as PoolFeatureEffectSelection[];
        
        const poolEffect = effect as PickFeatureFromPoolFeatureEffect;
        const remaining = featureSelectionService.getRemainingPoolSelections(
          character, 
          poolEffect, 
        );

        return (
          <div className="space-y-1">
            {poolSelections.map((selection, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{selection.feature.name}</span>
              </div>
            ))}
            {remaining > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onOpenDialog(effect, effectId)}
                className="gap-1 h-7"
              >
                <Plus className="w-3 h-3" />
                Add More ({remaining} remaining)
              </Button>
            )}
          </div>
        );
      }

      case "spell_school": {
        const schoolSelections = character.effectSelections.filter(
          s => s.type === "spell_school" && s.grantedByEffectId === effectId
        ) as SpellSchoolEffectSelection[];
        
        const spellEffect = effect as SpellSchoolChoiceFeatureEffect;
        const remaining = featureSelectionService.getRemainingSpellSchoolSelections(
          character,
          spellEffect,
        );

        return (
          <div className="space-y-1">
            {schoolSelections.map((selection, idx) => {
              const school = contentRepository.getAllSpellSchools().find(s => s.id === selection.schoolId);
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  {school && <span className={school.color}>{school.icon}</span>}
                  <span className="text-sm">{school?.name || selection.schoolId}</span>
                </div>
              );
            })}
            {remaining > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onOpenDialog(effect, effectId)}
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
              variant="ghost"
              onClick={() => onOpenDialog(effect, effectId)}
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
              variant="ghost"
              onClick={() => onOpenDialog(effect, effectId)}
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