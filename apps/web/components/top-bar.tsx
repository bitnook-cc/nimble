"use client";

import { ChevronDown, ChevronUp, Equal, Menu, Share2, Users } from "lucide-react";

import { useActivitySharing } from "@/lib/hooks/use-activity-sharing";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { Character } from "@/lib/schemas/character";
import { AppSettings } from "@/lib/services/settings-service";

import { ActivitySharingDialog } from "./activity-sharing-dialog";
import { AppMenu } from "./app-menu";
import { AuthButton } from "./auth-button";
import { RollPanel } from "./roll-panel";
import { SyncButton } from "./sync-button";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface TopBarProps {
  settings: AppSettings;
  characters: Character[];
  onSettingsChange: (settings: AppSettings) => void;
  hasCharacter?: boolean;
}

function SessionStatus() {
  const { session, isInSession } = useActivitySharing();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !isInSession || !session) {
    return (
      <ActivitySharingDialog>
        <Button variant="outline" size="sm" disabled={!isAuthenticated}>
          <Share2 className="w-4 h-4 mr-2" />
          Join Game
        </Button>
      </ActivitySharingDialog>
    );
  }

  const isOwner = session.ownerId === user?.id;
  const participantCount = session.participants.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-700">Connected</span>
      </div>
      <ActivitySharingDialog>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50">
          <Users className="w-4 h-4" />
          <span className="font-medium">{session.name}</span>
          <Badge variant="secondary" className="text-xs">
            {session.code}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {participantCount}/{session.maxPlayers}
          </span>
          {isOwner && (
            <Badge variant="outline" className="text-xs">
              Owner
            </Badge>
          )}
        </Button>
      </ActivitySharingDialog>
    </div>
  );
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
        {/* Left side - Menu and Auth */}
        <div className="flex items-center gap-4">
          <AppMenu
            settings={settings}
            characters={characters}
            onSettingsChange={onSettingsChange}
          />
          <AuthButton />
          <SyncButton />
        </div>

        {/* Center - Session Status */}
        <div>{hasCharacter && <SessionStatus />}</div>

        {/* Right side - Advantage and Roll Panel */}
        <div className="flex items-center gap-3">
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
