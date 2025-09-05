"use client";

import { TabbedCharacterSheet } from "@/components/tabbed-character-sheet";
import { CharacterHeader } from "@/components/character-header";
import { CharacterSelector } from "@/components/character-selector";
import { CharacterConfigDialog } from "@/components/character-config-dialog";
import { TopBar } from "@/components/top-bar";
import { useCharacterManagement } from "@/lib/hooks/use-character-management";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/loading-screen";
import { ToastContainer } from "@/components/toast-container";
import { useCallback, useEffect, useState } from "react";

function HomeContent() {
  // App state management
  const {
    characters,
    settings,
    isLoaded,
    loadError,
    showCharacterSelection,
    handleSettingsChange,
  } = useCharacterManagement();

  // Character operations
  const { character, updateCharacter } = useCharacterService();

  // Character config dialog state
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  // Simple name change handler for character header
  const onNameChange = useCallback(async (name: string) => {
    if (character) {
      const updatedCharacter = { ...character, name };
      await updateCharacter(updatedCharacter);
    }
  }, [character, updateCharacter]);

  // Character config handlers
  const onOpenConfig = useCallback(() => {
    setShowConfigDialog(true);
  }, []);

  const onCloseConfig = useCallback(() => {
    setShowConfigDialog(false);
  }, []);


  // Update page title based on character name
  useEffect(() => {
    if (character) {
      document.title = `Nimble Navigator - ${character.name}`;
    } else {
      document.title = "Nimble Navigator";
    }
  }, [character]);

  if (!isLoaded) {
    return <LoadingScreen message="Loading character data..." />;
  }

  if (showCharacterSelection || !character) {
    return (
      <CharacterSelector
        fullScreen={true}
        characters={characters}
        activeCharacterId={character?.id}
        errorMessage={loadError || undefined}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <TopBar 
        settings={settings}
        characters={characters}
        onSettingsChange={handleSettingsChange}
      />
      <div className="container mx-auto py-6 px-4 space-y-6 flex-1">
        <CharacterHeader 
          onNameChange={onNameChange}
          onOpenConfig={onOpenConfig}
        />
        <TabbedCharacterSheet />
      </div>
      
      {/* Disclaimer Footer */}
      <footer className="border-t bg-muted/30 py-3 px-4">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            Nimble Navigator is an independent product published under the Nimble 3rd Party Creator License and is not affiliated with Nimble Co. Nimble © 2025 Nimble Co.
          </p>
        </div>
      </footer>
      
      {/* Character Config Dialog */}
      {showConfigDialog && (
        <CharacterConfigDialog
          onClose={onCloseConfig}
        />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
      <ToastContainer />
    </ErrorBoundary>
  );
}