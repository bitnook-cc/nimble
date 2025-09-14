"use client";

import { AlertTriangle, Clock, Plus, Trash2, User } from "lucide-react";

import { useState } from "react";

import { APP_CONFIG } from "@/lib/config/app-config";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { Character } from "@/lib/schemas/character";
import { syncService } from "@/lib/services/sync/sync-service";

import { CharacterCreateForm } from "./character-create-form";
import { CharacterDeleteDialog } from "./character-delete-dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { NimbleCard, NimbleCardBanner } from "./ui/nimble-card";

interface CharacterSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  characters: Character[];
  activeCharacterId?: string;
  errorMessage?: string;
  fullScreen?: boolean; // New prop to render as full screen instead of dialog
}

export function CharacterSelector({
  isOpen = true,
  onClose,
  characters,
  activeCharacterId,
  errorMessage,
  fullScreen = false,
}: CharacterSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteDialogCharacter, setDeleteDialogCharacter] = useState<Character | null>(null);
  const { switchCharacter, deleteCharacter } = useCharacterService();

  const handleCreateCharacter = () => {
    setShowCreateForm(false);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleDeleteCharacter = async (characterId: string, deleteFromServer: boolean) => {
    // Delete locally
    deleteCharacter(characterId);

    // Delete from server if requested
    if (deleteFromServer) {
      try {
        await syncService.deleteCharacterBackup(characterId);
        console.log(`Deleted character ${characterId} from server backup`);
      } catch (error) {
        console.error(`Failed to delete character ${characterId} from server:`, error);
        // Don't throw - local deletion already succeeded
      }
    }
  };

  const openDeleteDialog = (character: Character) => {
    setDeleteDialogCharacter(character);
  };

  const formatLastPlayed = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const sortedCharacters = [...characters].sort(
    (a, b) => (b.timestamps?.updatedAt || 0) - (a.timestamps?.updatedAt || 0),
  );

  const content = (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {/* Create New Character Section */}
      {!showCreateForm ? (
        <Button variant="outline" onClick={() => setShowCreateForm(true)} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create New Character
        </Button>
      ) : (
        <CharacterCreateForm
          onComplete={handleCreateCharacter}
          onCancel={handleCancelCreate}
          showAsCard={true}
          autoFocus={true}
        />
      )}

      {/* Character List */}
      <div className="space-y-2">
        {sortedCharacters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No characters found. Create your first character above!
          </div>
        ) : (
          sortedCharacters.map((character) => (
            <NimbleCard
              key={character.id}
              variant={character.id === activeCharacterId ? "accent" : "default"}
              className={`cursor-pointer transition-all ${
                character.id === activeCharacterId
                  ? "scale-[1.02]"
                  : "hover:scale-[1.01]"
              }`}
            >
              <div
                onClick={() => {
                  if (character.id !== activeCharacterId) {
                    switchCharacter(character.id);
                    onClose?.();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">
                        {character.name}
                        {character.id === activeCharacterId && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatLastPlayed(new Date(character.timestamps?.updatedAt || Date.now()))}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(character);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </NimbleCard>
          ))
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <>
        <div className="flex-1 flex flex-col">
          <div className="container mx-auto py-8 flex-1">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">{APP_CONFIG.APP_NAME}</h1>
                <p className="text-muted-foreground">Select a character or create a new one</p>
              </div>
              {content}
            </div>
          </div>
        </div>

        {deleteDialogCharacter && (
          <CharacterDeleteDialog
            isOpen={!!deleteDialogCharacter}
            onClose={() => setDeleteDialogCharacter(null)}
            character={deleteDialogCharacter}
            isLastCharacter={characters.length === 1}
            isActiveCharacter={deleteDialogCharacter.id === activeCharacterId}
            onDelete={handleDeleteCharacter}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Characters</DialogTitle>
            <DialogDescription>
              Select a character to continue playing or create a new one.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>

      {deleteDialogCharacter && (
        <CharacterDeleteDialog
          isOpen={!!deleteDialogCharacter}
          onClose={() => setDeleteDialogCharacter(null)}
          character={deleteDialogCharacter}
          isLastCharacter={characters.length === 1}
          isActiveCharacter={deleteDialogCharacter.id === activeCharacterId}
          onDelete={handleDeleteCharacter}
        />
      )}
    </>
  );
}
