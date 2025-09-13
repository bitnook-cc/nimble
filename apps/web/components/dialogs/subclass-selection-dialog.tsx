"use client";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { SubclassDefinition } from "@/lib/schemas/class";
import { SubclassChoiceFeatureTrait } from "@/lib/schemas/features";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getClassService } from "@/lib/services/service-factory";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface SubclassSelectionDialogProps {
  subclassChoice: SubclassChoiceFeatureTrait;
  onClose: () => void;
  onSelectSubclass?: (subclassId: string) => void;
  classId?: string; // Optional class ID for when character is not available
}

export function SubclassSelectionDialog({
  subclassChoice,
  onClose,
  onSelectSubclass,
  classId,
}: SubclassSelectionDialogProps) {
  const { character, selectSubclass } = useCharacterService();
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassDefinition | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // If callback provided, don't require character
  if (!character && !onSelectSubclass) {
    return null;
  }

  const classService = getClassService();
  const contentRepository = ContentRepositoryService.getInstance();

  // Get class ID from either character or prop
  const effectiveClassId = character?.classId || classId || "fighter";

  const availableSubclasses = character
    ? classService.getAvailableSubclassesForCharacter(character)
    : contentRepository.getSubclassesForClass(effectiveClassId);

  const handleSelectSubclass = async () => {
    if (!selectedSubclass) return;

    setIsSelecting(true);
    try {
      if (onSelectSubclass) {
        // Use callback for temp state management
        onSelectSubclass(selectedSubclass.id);
      } else if (character) {
        // Use service for live updates
        const grantedByTraitId = subclassChoice.id;
        await selectSubclass(selectedSubclass.id, grantedByTraitId);
      }
      onClose();
    } catch (error) {
      console.error("Failed to select subclass:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your {character?.classId || "Class"} Subclass</DialogTitle>
          <DialogDescription>
            Choose your class specialization
            <br />
            <span className="font-medium">
              This choice will define your character&apos;s specialization and grant unique
              features.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 pr-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {availableSubclasses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subclasses available for this class
              </div>
            ) : (
              availableSubclasses.map((subclass: SubclassDefinition, index: number) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    selectedSubclass === subclass
                      ? "ring-2 ring-primary bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedSubclass(subclass)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{subclass.name}</CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">Subclass</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{subclass.description}</p>

                    {subclass.features && subclass.features.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div>
                          Grants {subclass.features.length} unique feature
                          {subclass.features.length !== 1 ? "s" : ""}
                        </div>
                        <div className="mt-1">
                          Features at levels:{" "}
                          {subclass.features
                            .map((f) => f.level)
                            .sort()
                            .join(", ")}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelectSubclass} disabled={!selectedSubclass || isSelecting}>
            {isSelecting ? "Selecting..." : "Select Subclass"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
