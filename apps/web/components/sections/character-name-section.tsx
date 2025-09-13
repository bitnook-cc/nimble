"use client";

import { Settings, TrendingUp } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { characterImageService } from "@/lib/services/character-image-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { LevelUpGuide } from "../level-up-guide";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CharacterAvatar } from "../character-avatar";
import { CharacterImageUploadDialog } from "../character-image-upload-dialog";
import { CharacterImageHistoryDialog } from "../character-image-history-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Upload, History } from "lucide-react";

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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showImageHistory, setShowImageHistory] = useState(false);

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

  const handleImageSaved = async (imageId: string) => {
    // Update the character with the new image ID
    const characterService = getCharacterService();
    await characterService.updateCharacterFields({
      imageId: imageId
    });
  };

  return (
    <>
      <div className="space-y-3">
        {/* Header with Avatar and Character Info */}
        <div className="flex items-start gap-4">
          {/* Character Avatar with Dropdown Menu */}
          {characterImageService.isImageUploadSupported() ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div>
                  <CharacterAvatar
                    characterId={character.id}
                    characterName={character.name}
                    imageId={character.imageId}
                    size="profile"
                    clickable={true}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setShowImageUpload(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowImageHistory(true)}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <CharacterAvatar
              characterId={character.id}
              characterName={character.name}
              imageId={character.imageId}
              size="profile"
              clickable={false}
            />
          )}
          
          {/* Character Info */}
          <div className="flex-1 space-y-2">
            {/* Name Input with Buttons */}
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
            <div className="text-sm text-muted-foreground">
              {ancestryName} • {backgroundName}
            </div>
            <div className="text-sm text-muted-foreground">
              {className} • Level {character.level}
            </div>
          </div>
        </div>
      </div>

      {/* Level Up Guide Dialog */}
      {showLevelUpGuide && (
        <LevelUpGuide open={showLevelUpGuide} onOpenChange={setShowLevelUpGuide} />
      )}

      {/* Image Upload Dialog */}
      {showImageUpload && (
        <CharacterImageUploadDialog
          open={showImageUpload}
          onOpenChange={setShowImageUpload}
          characterId={character.id}
          characterName={character.name}
          onImageSaved={handleImageSaved}
        />
      )}

      {/* Image History Dialog */}
      {showImageHistory && (
        <CharacterImageHistoryDialog
          open={showImageHistory}
          onOpenChange={setShowImageHistory}
          characterId={character.id}
          characterName={character.name}
          currentImageId={character.imageId}
        />
      )}
    </>
  );
}
