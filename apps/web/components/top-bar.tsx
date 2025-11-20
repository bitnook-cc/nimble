"use client";

import { ChevronDown, ChevronUp, Equal } from "lucide-react";

import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { Character } from "@/lib/schemas/character";
import { AppSettings } from "@/lib/services/settings-service";

import { AppMenu } from "./app-menu";
import { AuthButton } from "./auth-button";
import { RollPanel } from "./roll-panel";
import { SyncButton } from "./sync-button";
import { Button } from "./ui/button";

interface TopBarProps {
  settings: AppSettings;
  characters: Character[];
  onSettingsChange: (settings: AppSettings) => void;
  hasCharacter?: boolean;
}

function CompactAdvantageToggle() {
  const { uiState, updateAdvantageLevel } = useUIStateService();
  const advantageLevel = uiState.advantageLevel;

  const getDisplayText = () => {
    if (advantageLevel > 0) {
      return `Adv ${advantageLevel}`;
    } else if (advantageLevel < 0) {
      return `Dis ${Math.abs(advantageLevel)}`;
    } else {
      return "Normal";
    }
  };

  const getDisplayColor = () => {
    if (advantageLevel > 0) {
      return "text-green-600";
    } else if (advantageLevel < 0) {
      return "text-red-600";
    } else {
      return "text-muted-foreground";
    }
  };

  const incrementAdvantage = () => {
    updateAdvantageLevel(advantageLevel + 1);
  };

  const decrementAdvantage = () => {
    updateAdvantageLevel(advantageLevel - 1);
  };

  const resetAdvantage = () => {
    updateAdvantageLevel(0);
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-medium ${getDisplayColor()}`}>{getDisplayText()}</span>
      <div className="flex items-center">
        <Button variant="ghost" size="sm" onClick={decrementAdvantage} className="h-7 w-7 p-0">
          <ChevronDown className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={resetAdvantage}
          className="h-7 w-7 p-0"
          disabled={advantageLevel === 0}
        >
          <Equal className="h-3 w-3" />
        </Button>

        <Button variant="ghost" size="sm" onClick={incrementAdvantage} className="h-7 w-7 p-0">
          <ChevronUp className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function TopBar({
  settings,
  characters,
  onSettingsChange,
  hasCharacter = false,
}: TopBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Menu, Auth, and Sync */}
        <div className="flex items-center gap-4 flex-1">
          <AppMenu
            settings={settings}
            characters={characters}
            onSettingsChange={onSettingsChange}
          />
          <AuthButton />
          <SyncButton />
        </div>

        {/* Center - Logo (responsive) */}
        <div className="hidden min-[500px]:flex items-center absolute left-1/2 -translate-x-1/2">
          <img src="/logo.png" alt="Sidekick" className="h-8 w-8" />
          <span className="hidden sm:inline font-alegreya-sans text-xl font-black -ml-1.5 relative z-10">
            idekick
          </span>
        </div>

        {/* Right side - Advantage and Roll Panel */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {hasCharacter && (
            <>
              <CompactAdvantageToggle />
              <RollPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
