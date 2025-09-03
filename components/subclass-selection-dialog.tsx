"use client";

import { useState } from "react";
import { SubclassChoiceFeature, SubclassDefinition } from "@/lib/types/class";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getClassService } from "@/lib/services/service-factory";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface SubclassSelectionDialogProps {
  subclassChoice: SubclassChoiceFeature;
  onClose: () => void;
}

export function SubclassSelectionDialog({ subclassChoice, onClose }: SubclassSelectionDialogProps) {
  const { character } = useCharacterService();
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassDefinition | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!character) {
    return null;
  }

  const classService = getClassService();
  const availableSubclasses = classService.getAvailableSubclassesForCharacter(character);

  const handleSelectSubclass = async () => {
    if (!selectedSubclass) return;

    setIsSelecting(true);
    try {
      const grantedByFeatureId = classService.generateFeatureId(character.classId, subclassChoice.level, subclassChoice.name);
      await classService.selectSubclass(character, selectedSubclass.id, grantedByFeatureId);
      onClose();
    } catch (error) {
      console.error('Failed to select subclass:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose Your {character.classId} Subclass</DialogTitle>
          <DialogDescription>
            {subclassChoice.description}
            <br />
            <span className="font-medium">
              This choice will define your character&apos;s specialization and grant unique features.
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
                      ? 'ring-2 ring-primary bg-accent' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedSubclass(subclass)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{subclass.name}</CardTitle>
                      <Badge className="bg-purple-100 text-purple-800">
                        Subclass
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {subclass.description}
                    </p>
                    
                    {subclass.features && subclass.features.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div>Grants {subclass.features.length} unique feature{subclass.features.length !== 1 ? 's' : ''}</div>
                        <div className="mt-1">
                          Features at levels: {subclass.features.map(f => f.level).sort().join(', ')}
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
          <Button 
            onClick={handleSelectSubclass}
            disabled={!selectedSubclass || isSelecting}
          >
            {isSelecting ? 'Selecting...' : 'Select Subclass'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}