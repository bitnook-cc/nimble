"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { Character, UtilitySpellsEffectSelection } from "@/lib/schemas/character";
import { UtilitySpellsFeatureEffect } from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { featureSelectionService } from "@/lib/services/feature-selection-service";
import { getIconById } from "@/lib/utils/icon-utils";

interface UtilitySpellSelectionDialogProps {
  effect: UtilitySpellsFeatureEffect;
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: UtilitySpellsEffectSelection[]) => void;
  existingSelections?: UtilitySpellsEffectSelection[];
}

export function UtilitySpellSelectionDialog({
  effect,
  character,
  open,
  onOpenChange,
  onConfirm,
  existingSelections = [],
}: UtilitySpellSelectionDialogProps) {
  const [utilitySpellSelection, setUtilitySpellSelection] = useState<SpellAbilityDefinition[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const contentRepository = ContentRepositoryService.getInstance();
  const isEditMode = existingSelections.length > 0;
  const isFullSchoolMode = effect.selectionMode === "full_school";

  // Initialize selection when dialog opens
  useEffect(() => {
    if (open) {
      if (isFullSchoolMode) {
        // For full_school mode, check if there's an existing school selection
        const existingSchool =
          existingSelections.length > 0 ? existingSelections[0].schoolId : null;
        setSelectedSchoolId(existingSchool);
      } else {
        // For other modes, get existing spell selections
        const existingSpells = existingSelections
          .map((s) => (s.spellId ? contentRepository.getSpellById(s.spellId) : null))
          .filter((s) => s !== null);
        setUtilitySpellSelection(existingSpells);
      }
    } else {
      // Clear selection when dialog closes
      setUtilitySpellSelection([]);
      setSelectedSchoolId(null);
    }
  }, [open, existingSelections, contentRepository, isFullSchoolMode]);

  const handleConfirm = () => {
    if (isFullSchoolMode) {
      // For full_school mode, create a single selection with just the school ID
      const selections: UtilitySpellsEffectSelection[] = selectedSchoolId
        ? [
            {
              type: "utility_spells" as const,
              grantedByEffectId: effect.id,
              schoolId: selectedSchoolId,
              // No spellId for full_school mode
            },
          ]
        : [];
      onConfirm(selections);
    } else {
      // For other modes, create one selection object for each selected spell
      const selections: UtilitySpellsEffectSelection[] = utilitySpellSelection.map((spell) => {
        return {
          type: "utility_spells" as const,
          grantedByEffectId: effect.id,
          spellId: spell.id,
          schoolId: spell.school,
        };
      });
      onConfirm(selections);
    }
    onOpenChange(false);
  };

  const availableSchools = featureSelectionService.getAvailableSchoolsForUtilitySpells(
    effect,
    character,
  );
  const totalSpellCount = featureSelectionService.getUtilitySpellSelectionCount(
    effect,
    availableSchools,
  );
  const allAvailableSpells: SpellAbilityDefinition[] =
    featureSelectionService.getAvailableUtilitySpells(effect, character);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Choose"} Utility Spells</DialogTitle>
          <DialogDescription>
            {effect.selectionMode === "per_school"
              ? `Select ${effect.numberOfSpells || 1} utility spell${(effect.numberOfSpells || 1) > 1 ? "s" : ""} from each of ${availableSchools.length} school${availableSchools.length > 1 ? "s" : ""} (${totalSpellCount} total).`
              : effect.selectionMode === "full_school"
                ? `Select one spell school to gain access to all utility spells from that school.`
                : `Select ${totalSpellCount} utility spell${totalSpellCount > 1 ? "s" : ""} to learn.`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-4">
            {isFullSchoolMode
              ? // Full school mode - show school selection
                availableSchools.map((schoolId) => {
                  const school = contentRepository.getSpellSchool(schoolId);
                  const SchoolIcon = school?.icon ? getIconById(school.icon) : null;
                  const schoolSpells = allAvailableSpells.filter(
                    (spell) => spell.school === schoolId,
                  );
                  const isSelected = selectedSchoolId === schoolId;

                  return (
                    <div
                      key={schoolId}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSchoolId(isSelected ? null : schoolId)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedSchoolId(checked ? schoolId : null);
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {SchoolIcon && (
                                <SchoolIcon className="w-5 h-5" style={{ color: school?.color }} />
                              )}
                              <h3
                                className="font-semibold text-lg"
                                style={{ color: school?.color }}
                              >
                                {school?.name || schoolId}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {school?.description || "A school of magic"}
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {schoolSpells.length} utility spell
                                {schoolSpells.length !== 1 ? "s" : ""} available:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {schoolSpells.map((spell) => (
                                  <Badge key={spell.id} variant="outline" className="text-xs">
                                    {spell.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              : // Regular spell selection mode
                (() => {
                  const numberOfSpells = effect.numberOfSpells || 1;
                  const isPerSchoolMode = effect.selectionMode === "per_school";

                  // Get all already-selected utility spells from OTHER effects
                  const otherUtilitySpellSelections = character.effectSelections
                    .filter((s) => s.type === "utility_spells" && s.grantedByEffectId !== effect.id)
                    .map((s) => (s.type === "utility_spells" && s.spellId ? s.spellId : ""))
                    .filter((id) => id !== "");

                  // Group spells by school
                  return availableSchools.map((schoolId) => {
                    const schoolSpells = allAvailableSpells.filter(
                      (spell) => spell.school === schoolId,
                    );
                    const school = contentRepository.getSpellSchool(schoolId);
                    const SchoolIcon = school?.icon ? getIconById(school.icon) : null;

                    // Count selected spells in this school
                    const selectedInSchool = utilitySpellSelection.filter((spell) => {
                      return spell.school === schoolId;
                    }).length;

                    // Check if school is at limit
                    const schoolAtLimit =
                      (isPerSchoolMode && selectedInSchool >= numberOfSpells) ||
                      (!isPerSchoolMode && utilitySpellSelection.length >= numberOfSpells);

                    return (
                      <div key={schoolId} className="space-y-2">
                        <div className="flex items-center justify-between sticky top-0 bg-background z-10 pb-1">
                          <div className="flex items-center gap-2">
                            {SchoolIcon && (
                              <SchoolIcon className="w-4 h-4" style={{ color: school?.color }} />
                            )}
                            <h3 className="font-semibold" style={{ color: school?.color }}>
                              {school?.name || schoolId}
                            </h3>
                          </div>
                          {isPerSchoolMode && (
                            <Badge
                              variant={schoolAtLimit ? "secondary" : "outline"}
                              className={`text-xs ${schoolAtLimit ? "bg-green-100 text-green-800" : ""}`}
                            >
                              {selectedInSchool}/{numberOfSpells} selected
                              {schoolAtLimit && " ✓"}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2 pl-6">
                          {schoolSpells.map((spell) => {
                            const isAlreadySelected = otherUtilitySpellSelections.includes(
                              spell.id,
                            );
                            const isSelected = !!utilitySpellSelection.find(
                              (s) => s.id === spell.id,
                            );
                            // Can't select if already selected by another effect
                            // Can't select new spells if school is at limit (but can deselect)
                            const canSelect = !isAlreadySelected && (isSelected || !schoolAtLimit);

                            return (
                              <div
                                key={spell.id}
                                className={`flex items-start space-x-3 p-3 border rounded-lg ${
                                  isAlreadySelected
                                    ? "bg-muted/50 opacity-60"
                                    : schoolAtLimit && !isSelected
                                      ? "opacity-50"
                                      : ""
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Check if we can add more spells
                                      setUtilitySpellSelection([...utilitySpellSelection, spell]);
                                    } else {
                                      // Always allow deselection
                                      setUtilitySpellSelection(
                                        utilitySpellSelection.filter((s) => s.id !== spell.id),
                                      );
                                    }
                                  }}
                                  disabled={!canSelect}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {spell.name}
                                    {isAlreadySelected && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Already Selected
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {spell.description}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {spell.tier === 0 ? "Cantrip" : `Tier ${spell.tier}`}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={
              isFullSchoolMode
                ? !selectedSchoolId
                : !featureSelectionService.validateUtilitySpellSelection(
                    effect,
                    utilitySpellSelection,
                    character,
                  )
            }
          >
            {isFullSchoolMode
              ? selectedSchoolId
                ? `Confirm School Selection`
                : `Select a School`
              : `Confirm Selection (${utilitySpellSelection.length}/${totalSpellCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
