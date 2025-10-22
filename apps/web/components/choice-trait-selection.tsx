"use client";

import { Check } from "lucide-react";

import { Character, ChoiceTraitSelection, TraitSelection } from "@/lib/schemas/character";
import { ChoiceFeatureTrait, FeatureTrait } from "@/lib/schemas/features";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";

interface ChoiceTraitSelectionProps {
  choiceTrait: ChoiceFeatureTrait;
  character: Character;
  existingSelection?: ChoiceTraitSelection;
  onOpenNestedDialog?: (
    trait: FeatureTrait,
    parentChoiceTraitId: string,
    optionTraitId: string,
  ) => void;
}

/**
 * Component that displays inline choice selection with checkboxes
 * For nested selections (e.g., feature pools), it opens the appropriate dialog
 */
export function ChoiceTraitSelectionComponent({
  choiceTrait,
  character,
  existingSelection,
  onOpenNestedDialog,
}: ChoiceTraitSelectionProps) {
  const characterService = getCharacterService();

  // Get currently selected option IDs
  const selectedTraitIds = existingSelection?.selectedOptions.map((opt: any) => opt.traitId) || [];

  const remaining = featureSelectionService.getRemainingChoiceSelections(character, choiceTrait);
  const canSelectMore = selectedTraitIds.length < choiceTrait.numSelections;

  const handleToggleOption = async (optionTrait: FeatureTrait) => {
    const isSelected = selectedTraitIds.includes(optionTrait.id);

    if (isSelected) {
      // Deselect - remove this option
      await characterService.removeChoiceOption(choiceTrait.id, optionTrait.id);
    } else {
      // Select - check if we can add more
      if (selectedTraitIds.length >= choiceTrait.numSelections) {
        return; // Can't select more
      }

      // Check if this option requires a nested selection
      if (requiresNestedSelection(optionTrait)) {
        // Open the appropriate dialog for this trait type
        if (onOpenNestedDialog) {
          onOpenNestedDialog(optionTrait, choiceTrait.id, optionTrait.id);
        }
        return;
      }

      // Simple selection - add to character
      await characterService.addChoiceOption(choiceTrait.id, optionTrait.id);
    }
  };

  const requiresNestedSelection = (trait: FeatureTrait): boolean => {
    return (
      trait.type === "pick_feature_from_pool" ||
      trait.type === "attribute_boost" ||
      trait.type === "spell_school_choice" ||
      trait.type === "utility_spells"
    );
  };

  const renderOptionTrait = (optionTrait: FeatureTrait, isSelected: boolean) => {
    // Find if this option has a nested selection
    const optionData = existingSelection?.selectedOptions.find(
      (opt: any) => opt.traitId === optionTrait.id,
    );
    const hasNestedSelection = optionData?.selection !== undefined;

    return (
      <div
        key={optionTrait.id}
        className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
          isSelected
            ? "border-primary bg-accent"
            : canSelectMore
              ? "border-border hover:border-primary/50 cursor-pointer"
              : "border-border opacity-50 cursor-not-allowed"
        }`}
        onClick={() => canSelectMore && handleToggleOption(optionTrait)}
      >
        <Checkbox
          checked={isSelected}
          disabled={!canSelectMore && !isSelected}
          className="mt-0.5"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{getOptionLabel(optionTrait)}</span>
            {requiresNestedSelection(optionTrait) && (
              <Badge variant="secondary" className="text-xs">
                Requires Selection
              </Badge>
            )}
            {isSelected && <Check className="w-4 h-4 text-green-600 ml-auto" />}
          </div>
          {getOptionDescription(optionTrait) && (
            <p className="text-xs text-muted-foreground">{getOptionDescription(optionTrait)}</p>
          )}
          {hasNestedSelection && optionData?.selection && (
            <div className="mt-2 p-2 bg-background rounded text-xs">
              <strong>Selection:</strong> {renderNestedSelection(optionData.selection)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getOptionLabel = (trait: FeatureTrait): string => {
    switch (trait.type) {
      case "pick_feature_from_pool":
        return `Select from ${trait.poolId}`;
      case "attribute_boost":
        return `+${trait.amount} to Attribute`;
      case "spell_school_choice":
        return "Choose Spell School";
      case "utility_spells":
        return "Choose Utility Spells";
      case "stat_bonus":
        return "Stat Bonus";
      case "ability":
        return trait.ability.name || "Ability";
      case "resource":
        return trait.resourceDefinition.name;
      case "proficiency":
        return trait.proficiencies.map((p: any) => p.name).join(", ");
      default:
        return trait.type;
    }
  };

  const getOptionDescription = (trait: FeatureTrait): string | undefined => {
    switch (trait.type) {
      case "ability":
        return trait.ability.description;
      case "resource":
        return trait.resourceDefinition.description;
      case "pick_feature_from_pool":
        return `Choose ${trait.choicesAllowed} feature(s)`;
      case "attribute_boost":
        return `Choose from: ${trait.allowedAttributes.join(", ")}`;
      default:
        return undefined;
    }
  };

  const renderNestedSelection = (selection: TraitSelection): string => {
    switch (selection.type) {
      case "pool_feature":
        return selection.feature.name;
      case "attribute_boost":
        return `${selection.attribute.charAt(0).toUpperCase() + selection.attribute.slice(1)} +${selection.amount}`;
      case "spell_school":
        return selection.schoolId;
      case "utility_spells":
        return selection.spellId || `All ${selection.schoolId} utility spells`;
      default:
        return "Selected";
    }
  };

  return (
    <div className="ml-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span>
          Select up to {choiceTrait.numSelections} option
          {choiceTrait.numSelections !== 1 ? "s" : ""}
        </span>
        {selectedTraitIds.length > 0 && (
          <Badge variant="outline">
            {selectedTraitIds.length} / {choiceTrait.numSelections} selected
          </Badge>
        )}
      </div>
      <div className="space-y-2">
        {choiceTrait.options.map((optionTrait: any) => {
          const isSelected = selectedTraitIds.includes(optionTrait.id);
          return renderOptionTrait(optionTrait, isSelected);
        })}
      </div>
    </div>
  );
}
