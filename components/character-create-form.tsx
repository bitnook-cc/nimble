"use client";

import { Plus, Wand2 } from "lucide-react";

import { useState } from "react";

import { gameConfig } from "@/lib/config/game-config";
import { useToastService } from "@/lib/hooks/use-toast-service";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { getCharacterCreation, getCharacterService } from "@/lib/services/service-factory";

import { CharacterBuilder } from "./character-builder";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CharacterCreateFormProps {
  onComplete?: () => void; // Called when character is successfully created
  onCancel?: () => void;
  showAsCard?: boolean; // Whether to wrap in a card or just show the form
  autoFocus?: boolean;
}

export function CharacterCreateForm({
  onComplete,
  onCancel,
  showAsCard = true,
  autoFocus = true,
}: CharacterCreateFormProps) {
  const [selectedClass, setSelectedClass] = useState(gameConfig.defaults.classId);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const contentRepository = ContentRepositoryService.getInstance();
  const availableClasses = contentRepository.getAllClasses();
  const { showError, showSuccess } = useToastService();

  const handleCreateCharacter = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const characterCreation = getCharacterCreation();
      const characterService = getCharacterService();

      // Create character with random ancestry/background and generated name
      const newCharacter = await characterCreation.quickCreateCharacter({
        classId: selectedClass,
        level: 1,
        // No name, ancestryId, or backgroundId provided - will be randomly generated
      });

      // Load the new character (this will automatically update settings)
      await characterService.loadCharacter(newCharacter.id);

      showSuccess("Character created", `${newCharacter.name} has been created successfully!`);

      // Reset form
      setSelectedClass(gameConfig.defaults.classId);

      // Notify parent that creation is complete
      onComplete?.();
    } catch (error) {
      console.error("Failed to create character:", error);
      showError("Failed to create character", "Unable to create the character. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setSelectedClass(gameConfig.defaults.classId);
    onCancel?.();
  };

  const handleBuilderCharacterCreated = (characterId: string) => {
    setShowBuilder(false);
    onComplete?.(); // Notify parent that creation is complete
  };

  const formContent = (
    <div className="space-y-4">
      {/* Character Builder Option */}
      <div className="text-center">
        <Button onClick={() => setShowBuilder(true)} className="w-full mb-4" variant="default">
          <Wand2 className="w-4 h-4 mr-2" />
          Character Builder
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or quick create</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="character-class">Class</Label>
        <select
          id="character-class"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleCreateCharacter();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
          className="w-full p-2 border rounded-md"
          autoFocus={autoFocus}
        >
          {availableClasses.map((cls: any) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCreateCharacter} disabled={isCreating} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Creating..." : "Quick Create"}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={handleCancel} size="sm">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  if (showAsCard) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="pt-4">{formContent}</CardContent>
        </Card>

        {/* Character Builder Modal */}
        <CharacterBuilder
          isOpen={showBuilder}
          onClose={() => setShowBuilder(false)}
          onCharacterCreated={handleBuilderCharacterCreated}
        />
      </>
    );
  }

  return (
    <>
      {formContent}

      {/* Character Builder Modal */}
      <CharacterBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onCharacterCreated={handleBuilderCharacterCreated}
      />
    </>
  );
}
