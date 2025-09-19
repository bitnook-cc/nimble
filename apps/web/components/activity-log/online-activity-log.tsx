"use client";

import { realtime } from "@nimble/shared";
import { Share2, Users, Wifi, WifiOff } from "lucide-react";
import Pusher from "pusher-js";
import { useCallback, useEffect, useState } from "react";

import { activitySharingService } from "@/lib/services/activity-sharing-service";
import { InitiativeEntry, LogEntry } from "@/lib/schemas/activity-log";

import { InitiativeEntryDisplay } from "./activity-log-entries/initiative-entry";
import { RollEntryDisplay } from "./activity-log-entries/roll-entry";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface OnlineActivityLogProps {
  sessionId: string;
  sessionName: string;
  participantCount: number;
  maxPlayers: number;
  onDisconnect: () => void;
}

interface SessionActivityEntry {
  id: string;
  sessionId: string;
  characterId: string;
  characterName: string;
  userName: string;
  activityData: LogEntry;
  timestamp: string;
}

export function OnlineActivityLog({
  sessionId,
  sessionName,
  participantCount,
  maxPlayers,
  onDisconnect,
}: OnlineActivityLogProps) {
  const [entries, setEntries] = useState<SessionActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [pusher, setPusher] = useState<Pusher | null>(null);

  // Initialize Pusher and fetch initial data
  useEffect(() => {
    const initializePusher = () => {
      try {
        const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        // Subscribe to session channel
        const channel = pusherInstance.subscribe(`session-${sessionId}`);

        // Listen for connection state changes
        pusherInstance.connection.bind("connected", () => {
          setConnected(true);
        });

        pusherInstance.connection.bind("disconnected", () => {
          setConnected(false);
        });

        pusherInstance.connection.bind("error", () => {
          setConnected(false);
        });

        // Listen for new activity entries
        channel.bind("activity-shared", (data: realtime.ActivitySharedPayload) => {
          const newEntry: SessionActivityEntry = {
            id: `${data.activity.characterId}-${Date.now()}`,
            sessionId: sessionId,
            characterId: data.activity.characterId,
            characterName: data.activity.characterName,
            userName: data.activity.user.name,
            activityData: data.activity.logEntry,
            timestamp: data.activity.timestamp,
          };

          setEntries((prev) => [newEntry, ...prev]);
        });

        setPusher(pusherInstance);

        return pusherInstance;
      } catch (error) {
        console.error("Failed to initialize Pusher:", error);
        setConnected(false);
        return null;
      }
    };

    const pusherInstance = initializePusher();

    // Fetch initial activity history
    const fetchInitialActivity = async () => {
      try {
        setLoading(true);
        const response = await activitySharingService.getActivityHistory(sessionId);
        
        // Convert API response to SessionActivityEntry format
        const sessionEntries: SessionActivityEntry[] = response.data.map((activity: any) => ({
          id: activity.id,
          sessionId: sessionId,
          characterId: activity.characterId,
          characterName: activity.characterName,
          userName: activity.user.name,
          activityData: activity.logEntry,
          timestamp: activity.timestamp,
        }));

        setEntries(sessionEntries);
      } catch (error) {
        console.error("Failed to fetch activity history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialActivity();

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe(`session-${sessionId}`);
        pusherInstance.disconnect();
      }
    };
  }, [sessionId]);

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, []);

  const formatActivityTime = useCallback((entry: SessionActivityEntry) => {
    // Use the activity's timestamp if it has one, otherwise use our session timestamp
    const activityTimestamp = entry.activityData.timestamp ? new Date(entry.activityData.timestamp) : new Date(entry.timestamp);
    return formatTime(activityTimestamp.toISOString());
  }, [formatTime]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Session Activity</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {sessionName}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {connected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600">Offline</span>
                </>
              )}
            </div>
            
            {/* Participant Count */}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {participantCount}/{maxPlayers}
              </span>
            </div>

            {/* Disconnect Button */}
            <Button variant="outline" size="sm" onClick={onDisconnect}>
              <Share2 className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-2">Loading session activity...</p>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No activity yet. Actions from all players will appear here!
          </p>
        ) : (
          <div className="space-y-2 h-[calc(100vh-16rem)] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm group"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-primary">
                        {entry.characterName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({entry.userName})
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatActivityTime(entry)}
                    </span>
                  </div>
                  
                  {/* Render the activity based on its type */}
                  {entry.activityData.type === "roll" ? (
                    <RollEntryDisplay 
                      roll={entry.activityData as any} 
                      formatTime={(date: Date) => formatTime(date.toISOString())} 
                    />
                  ) : entry.activityData.type === "initiative" ? (
                    <InitiativeEntryDisplay entry={entry.activityData as InitiativeEntry} />
                  ) : (
                    <NonRollEntryDisplay entry={entry.activityData as any} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for displaying non-roll entries (reused from ActivityLog)
function NonRollEntryDisplay({
  entry,
}: {
  entry: Exclude<LogEntry, { type: "roll" | "initiative" | "dice-pool" }>;
}) {
  const getEntryIcon = () => {
    switch (entry.type) {
      case "damage":
        return "⚔️";
      case "healing":
        return "❤️";
      case "temp_hp":
        return "🛡️";
      case "ability_usage":
        return "✨";
      case "safe_rest":
        return "🏠";
      case "catch_breath":
        return "💨";
      case "make_camp":
        return "🏕️";
      case "resource":
        return "💎";
      case "spell_cast":
        return "🔮";
      case "item_consumption":
        return "🧪";
      default:
        return "📝";
    }
  };

  const getEntryColor = () => {
    switch (entry.type) {
      case "damage":
        return "text-red-600";
      case "healing":
        return "text-green-600";
      case "temp_hp":
        return "text-blue-600";
      case "ability_usage":
        return "text-purple-600";
      case "safe_rest":
        return "text-green-700";
      case "catch_breath":
        return "text-blue-600";
      case "make_camp":
        return "text-orange-600";
      case "resource":
        return "text-purple-600";
      case "spell_cast":
        return "text-indigo-600";
      case "item_consumption":
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getEntryValue = () => {
    switch (entry.type) {
      case "damage":
        return `-${entry.amount}`;
      case "healing":
        return `+${entry.amount}`;
      case "temp_hp":
        return `+${entry.amount}`;
      case "ability_usage":
        return entry.maxUses > 0 ? `${entry.usesRemaining}/${entry.maxUses}` : "";
      case "resource":
        return entry.action === "spent" ? `-${entry.amount}` : `+${entry.amount}`;
      case "spell_cast":
        return entry.resourceCost ? `-${entry.resourceCost.amount}` : "";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <span className="text-lg">{getEntryIcon()}</span>
        <span className="font-medium">{entry.description}</span>
      </div>
      {getEntryValue() && <span className={`font-bold ${getEntryColor()}`}>{getEntryValue()}</span>}
    </div>
  );
}