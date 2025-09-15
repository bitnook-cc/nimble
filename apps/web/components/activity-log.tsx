"use client";

import {
  AbilityUsageEntry,
  CatchBreathEntry,
  DamageEntry,
  HealingEntry,
  InitiativeEntry,
  ItemConsumptionEntry,
  LogEntry,
  MakeCampEntry,
  ResourceUsageEntry,
  SafeRestEntry,
  SpellCastEntry,
  TempHPEntry,
} from "@/lib/schemas/activity-log";

import { InitiativeEntryDisplay } from "./activity-log-entries/initiative-entry";
import { RollEntryDisplay } from "./activity-log-entries/roll-entry";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ActivityLogProps {
  entries: LogEntry[];
  onClearRolls: () => void;
}

export function ActivityLog({ entries, onClearRolls }: ActivityLogProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Character Log</CardTitle>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearRolls}>
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No activity yet. Roll dice or take damage to see logs!
          </p>
        ) : (
          <div className="space-y-2 h-[calc(100vh-16rem)] overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
              >
                {entry.type === "roll" ? (
                  <RollEntryDisplay roll={entry as any} formatTime={formatTime} />
                ) : entry.type === "initiative" ? (
                  <InitiativeEntryDisplay entry={entry as InitiativeEntry} />
                ) : (
                  <NonRollEntryDisplay entry={entry as any} />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for displaying non-roll entries
function NonRollEntryDisplay({
  entry,
}: {
  entry:
    | DamageEntry
    | HealingEntry
    | TempHPEntry
    | AbilityUsageEntry
    | SafeRestEntry
    | CatchBreathEntry
    | MakeCampEntry
    | ResourceUsageEntry
    | SpellCastEntry
    | ItemConsumptionEntry;
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
