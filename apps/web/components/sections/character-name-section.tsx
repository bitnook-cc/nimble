"use client";

import { Settings, TrendingUp } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";

import { LevelUpGuide } from "../level-up-guide";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface CharacterNameSectionProps {
  name: string;
  onNameChange: (name: string) => void;
  onOpenConfig: () => void;
}

export function CharacterNameSection({
  name,
  onNameChange,
  onOpenConfig,
}: CharacterNameSectionProps) {
  const { character } = useCharacterService();
  const [showLevelUpGuide, setShowLevelUpGuide] = useState(false);

  if (!character) return null;

  const contentRepository = ContentRepositoryService.getInstance();
  const classDefinition = contentRepository.getClassDefinition(character.classId);
  const className = classDefinition?.name || character.classId;

  const ancestryDefinition = contentRepository.getAncestryDefinition(character.ancestryId);
  const ancestryName = ancestryDefinition?.name || character.ancestryId;

  const backgroundDefinition = contentRepository.getBackgroundDefinition(character.backgroundId);
  const backgroundName = backgroundDefinition?.name || character.backgroundId;

  const handleLevelUp = () => {
    if (!character || character.level >= 20) return;
    setShowLevelUpGuide(true);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Character Name Input with Buttons */}
        <div className="flex items-center gap-2">
          <Input
            id="character-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-xl font-bold flex-1"
            placeholder="Character Name"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLevelUp}
            disabled={character.level >= 20}
            className="h-10 w-10 p-0 shrink-0"
            title={character.level >= 20 ? "Maximum level reached" : "Open Level Up Guide"}
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenConfig}
            className="h-10 w-10 p-0 shrink-0"
            title="Character Configuration"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Ancestry, Background, Class, Level */}
        <div className="text-center text-lg text-muted-foreground">
          {ancestryName} • {backgroundName} • {className} • Level {character.level}
        </div>
      </div>

      {/* Level Up Guide Dialog */}
      {showLevelUpGuide && (
        <LevelUpGuide open={showLevelUpGuide} onOpenChange={setShowLevelUpGuide} />
      )}
    </>
  );
}
