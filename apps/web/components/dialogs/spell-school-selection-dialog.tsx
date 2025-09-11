"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Character } from "@/lib/schemas/character";
import { SpellSchoolChoiceFeatureEffect } from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getIconById } from "@/lib/utils/icon-utils";

interface SpellSchoolSelectionDialogProps {
  effect: SpellSchoolChoiceFeatureEffect;
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (schoolId: string) => void;
  existingSelection?: string;
  existingSchools?: string[];
}

export function SpellSchoolSelectionDialog({
  effect,
  character,
  open,
  onOpenChange,
  onConfirm,
  existingSelection,
  existingSchools = [],
}: SpellSchoolSelectionDialogProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const contentRepository = ContentRepositoryService.getInstance();
  const isEditMode = !!existingSelection;

  // Initialize selection when dialog opens
  useEffect(() => {
    if (open && existingSelection) {
      setSelectedSchool(existingSelection);
    } else if (open) {
      setSelectedSchool("");
    }
  }, [open, existingSelection]);

  const handleConfirm = () => {
    if (!selectedSchool) return;
    onConfirm(selectedSchool);
    onOpenChange(false);
  };

  // Get available schools
  const getAvailableSchools = () => {
    const allSchools = contentRepository.getAllSpellSchools();

    // Filter out already selected schools (but keep the current one if editing)
    return allSchools.filter(
      (school) => !existingSchools.includes(school.id) || school.id === existingSelection,
    );
  };

  const availableSchools = getAvailableSchools();

  if (availableSchools.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Schools Available</DialogTitle>
            <DialogDescription>All spell schools have already been selected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit" : "Choose"} Spell School</DialogTitle>
          <DialogDescription>
            Select a school of magic to gain access to its spells.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <RadioGroup value={selectedSchool} onValueChange={setSelectedSchool}>
            <div className="space-y-3">
              {availableSchools.map((school) => {
                const SchoolIcon = school.icon ? getIconById(school.icon) : null;
                const isSelected = selectedSchool === school.id;

                return (
                  <div
                    key={school.id}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedSchool(school.id)}
                  >
                    <RadioGroupItem value={school.id} id={school.id} />
                    <Label htmlFor={school.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        {SchoolIcon && (
                          <SchoolIcon className="w-5 h-5" style={{ color: school.color }} />
                        )}
                        <span className="font-semibold text-lg" style={{ color: school.color }}>
                          {school.name}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          {school.spells.length} spells
                        </Badge>
                      </div>
                      {school.description && (
                        <p className="text-sm text-muted-foreground mb-2">{school.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {school.spells.slice(0, 5).map((spell) => (
                          <Badge key={spell.id} variant="secondary" className="text-xs">
                            {spell.name}
                          </Badge>
                        ))}
                        {school.spells.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{school.spells.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!selectedSchool}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
