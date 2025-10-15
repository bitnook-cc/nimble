"use client";

import { ChevronLeft, ChevronRight, Users, X } from "lucide-react";

import { useState } from "react";

import { useActivitySharing } from "@/lib/hooks/use-activity-sharing";
import { useAuth } from "@/lib/hooks/use-auth";

import { ActivitySharingDialog } from "./activity-sharing-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function GameSessionToast() {
  const { session, isInSession, leaveSession } = useActivitySharing();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isInSession || !session) {
    return null;
  }

  const isOwner = session.ownerId === user?.id;
  const participantCount = session.participants.length;

  const handleLeave = async () => {
    await leaveSession();
  };

  return (
    <div
      className={`fixed top-16 left-0 z-40 transition-transform duration-300 ${
        isExpanded ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Collapsed Tab */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute left-full top-0 bg-card border border-border rounded-r-lg px-2 py-3 hover:bg-muted/50 transition-colors shadow-lg cursor-pointer flex items-center gap-2"
        >
          <div
            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            style={{
              animation: "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          ></div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <style jsx>{`
            @keyframes pulse-glow {
              0%,
              100% {
                filter: drop-shadow(0 0 0px rgb(34 197 94));
              }
              50% {
                filter: drop-shadow(0 0 4px rgb(34 197 94));
              }
            }
          `}</style>
        </button>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex flex-col p-4 gap-3 min-w-[280px] bg-card border border-border rounded-r-lg shadow-lg">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-green-700">In Game</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLeave}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Session Info */}
          <ActivitySharingDialog>
            <button className="flex flex-col gap-2 p-3 rounded-md border border-border hover:bg-muted/30 transition-colors text-left cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{session.name}</span>
                {isOwner && (
                  <Badge variant="outline" className="text-xs">
                    Owner
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {participantCount}/{session.maxPlayers}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {session.code}
                </Badge>
              </div>
            </button>
          </ActivitySharingDialog>

          {/* Participants List */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Players</span>
            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
              {session.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-2 text-sm px-2 py-1 rounded bg-muted/30"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="truncate flex-1">{participant.userName}</span>
                  {participant.userId === session.ownerId && (
                    <Badge variant="outline" className="text-xs">
                      GM
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
