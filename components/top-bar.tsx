"use client";

import { ChevronDown, ChevronUp, Equal, Menu } from "lucide-react";

import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { AppSettings } from "@/lib/services/settings-service";
import { Character } from "@/lib/schemas/character";

import { AppMenu } from "./app-menu";
import { RollPanel } from "./roll-panel";
import { Button } from "./ui/button";

interface TopBarProps {
  settings: AppSettings;
  characters: Character[];
  onSettingsChange: (settings: AppSettings) => void;
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

export function TopBar({ settings, characters, onSettingsChange }: TopBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left side - Menu */}
        <div className="flex items-center">
          <AppMenu
            settings={settings}
            characters={characters}
            onSettingsChange={onSettingsChange}
          />
        </div>

        {/* Center - Empty space for balance */}
        <div></div>

        {/* Right side - Advantage and Roll Panel */}
        <div className="flex items-center gap-3">
          <CompactAdvantageToggle />
          <RollPanel />
        </div>
      </div>
    </div>
  );
}
