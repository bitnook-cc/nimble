"use client";

import { Analytics } from "@vercel/analytics/next";

import { useCallback, useEffect, useState } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import { CharacterConfigDialog } from "@/components/character-config-dialog";
import { CharacterHeader } from "@/components/character-header";
import { CharacterSelector } from "@/components/character-selector";
import { LicenseDisclaimer } from "@/components/license-disclaimer";
import { LoadingScreen } from "@/components/loading-screen";
import { TabbedCharacterSheet } from "@/components/tabbed-character-sheet";
import { ToastContainer } from "@/components/toast-container";
import { TopBar } from "@/components/top-bar";

import { APP_CONFIG } from "@/lib/config/app-config";
import { useCharacterManagement } from "@/lib/hooks/use-character-management";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useThemeInit } from "@/lib/hooks/use-theme-init";

function HomeContent() {
  // Initialize theme after hydration
  useThemeInit();

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
  const onNameChange = useCallback(
    async (name: string) => {
      if (character) {
        const updatedCharacter = { ...character, name };
        await updateCharacter(updatedCharacter);
      }
    },
    [character, updateCharacter],
  );

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
      document.title = `${APP_CONFIG.APP_NAME} - ${character.name}`;
    } else {
      document.title = APP_CONFIG.APP_NAME;
    }
  }, [character]);

  if (!isLoaded) {
    return <LoadingScreen message="Loading character data..." />;
  }

  return (
    <main className="h-screen bg-background flex flex-col overflow-hidden">
      <TopBar
        settings={settings}
        characters={characters}
        onSettingsChange={handleSettingsChange}
        hasCharacter={!!character}
      />

      {showCharacterSelection || !character ? (
        <>
          <CharacterSelector
            fullScreen={true}
            characters={characters}
            activeCharacterId={character?.id}
            errorMessage={loadError || undefined}
          />

          {/* Disclaimer Footer */}
          <LicenseDisclaimer />
        </>
      ) : (
        <>
          <TabbedCharacterSheet onNameChange={onNameChange} onOpenConfig={onOpenConfig} />

          {/* Character Config Dialog */}
          {showConfigDialog && <CharacterConfigDialog onClose={onCloseConfig} />}
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomeContent />
      <ToastContainer />
      <Analytics />
    </ErrorBoundary>
  );
}
