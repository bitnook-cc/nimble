"use client";

import {
  AbilityUsageEntry,
  CatchBreathEntry,
  DamageEntry,
  DiceRollEntry,
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

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface ActivityLogProps {
  entries: LogEntry[];
  onClearRolls: () => void;
}

export function ActivityLog({ entries, onClearRolls }: ActivityLogProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <TooltipProvider>
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                >
                  {entry.type === "roll" ? (
                    <RollEntryDisplay roll={entry} formatTime={formatTime} />
                  ) : (
                    <NonRollEntryDisplay entry={entry} formatTime={formatTime} />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Component for displaying roll entries
function RollEntryDisplay({
  roll,
  formatTime,
}: {
  roll: DiceRollEntry;
  formatTime: (date: Date) => string;
}) {
  const formatDiceWithAdvantage = (
    roll: DiceRollEntry,
  ): { result: string; isDropped: boolean }[] => {
    // If no advantage/disadvantage, show normally
    if (!roll.advantageLevel || roll.advantageLevel === 0) {
      return roll.dice.map((d) => ({
        result: `${d.result}${d.isCritical ? "*" : ""}`,
        isDropped: false,
      }));
    }

    // For advantage/disadvantage, combine all dice and identify dropped ones
    const allDice = [...roll.dice, ...(roll.droppedDice || [])];
    const droppedSet = new Set((roll.droppedDice || []).map((d) => `${d.result}-${d.type}`));

    return allDice.map((d) => {
      const result = `${d.result}${d.isCritical ? "*" : ""}`;
      const diceKey = `${d.result}-${d.type}`;
      const isDropped = droppedSet.has(diceKey);
      return { result, isDropped };
    });
  };

  const renderDiceWithStrikethrough = () => {
    const diceData = formatDiceWithAdvantage(roll);

    // For normal rolls (no advantage), show with commas
    if (!roll.advantageLevel || roll.advantageLevel === 0) {
      return diceData.map((data, index) => (
        <span key={index}>
          {data.result}
          {index < diceData.length - 1 ? ", " : ""}
        </span>
      ));
    }

    // For advantage/disadvantage rolls, show with spaces and strikethrough
    return diceData.map((data, index) => (
      <span key={index} className={data.isDropped ? "line-through text-muted-foreground" : ""}>
        {data.result}
        {index < diceData.length - 1 ? " " : ""}
      </span>
    ));
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="font-medium">{roll.description}</span>
        <span className="text-muted-foreground text-xs font-mono">
          {roll.rollExpression}: [{renderDiceWithStrikethrough()}]
          {roll.modifier !== 0 ? ` ${roll.modifier >= 0 ? "+" : ""}${roll.modifier}` : ""} ={" "}
          {roll.total}
        </span>
        {roll.criticalHits && roll.criticalHits > 0 && (
          <span className="text-yellow-600 font-semibold text-xs bg-yellow-100 px-2 py-1 rounded">
            CRIT x{roll.criticalHits}
          </span>
        )}
        {roll.advantageLevel && roll.advantageLevel > 0 && (
          <span className="text-green-600 font-semibold text-xs bg-green-100 px-2 py-1 rounded">
            ADV {roll.advantageLevel}
          </span>
        )}
        {roll.advantageLevel && roll.advantageLevel < 0 && (
          <span className="text-red-600 font-semibold text-xs bg-red-100 px-2 py-1 rounded">
            DIS {Math.abs(roll.advantageLevel)}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground">{formatTime(roll.timestamp)}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`font-bold text-lg min-w-8 text-right cursor-help ${
                roll.isMiss ? "text-destructive" : ""
              }`}
            >
              {roll.isMiss ? "MISS" : roll.total}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <div className="font-semibold">Roll Breakdown</div>
              <div className="text-sm font-mono bg-muted/50 px-2 py-1 rounded mt-1">
                {roll.rollExpression}
              </div>
              {roll.isMiss && <div className="text-destructive font-semibold">MISS!</div>}
              {roll.criticalHits && roll.criticalHits > 0 && (
                <div className="text-yellow-600 font-semibold">
                  CRITICAL HIT! ({roll.criticalHits} crits)
                </div>
              )}
              {roll.advantageLevel && roll.advantageLevel !== 0 && (
                <div
                  className={
                    roll.advantageLevel > 0
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {roll.advantageLevel > 0
                    ? `Advantage ${roll.advantageLevel}`
                    : `Disadvantage ${Math.abs(roll.advantageLevel)}`}
                </div>
              )}
              <div className="text-sm mt-1">
                <div className="font-semibold">All dice rolled:</div>
                <div className="font-mono text-base">{renderDiceWithStrikethrough()}</div>
                {roll.advantageLevel && roll.advantageLevel !== 0 && (
                  <div className="text-xs mt-1">
                    <div className="font-semibold">Individual dice:</div>
                    {[...roll.dice, ...(roll.droppedDice || [])].map((die, index) => {
                      const isDropped =
                        roll.droppedDice?.some(
                          (dropped) => dropped.result === die.result && dropped.type === die.type,
                        ) || false;
                      return (
                        <div
                          key={index}
                          className={`${die.isCritical ? "text-yellow-600 font-semibold" : ""} ${isDropped ? "line-through text-muted-foreground" : ""}`}
                        >
                          d{die.type}: {die.result} {die.isCritical ? "(CRIT!)" : ""}{" "}
                          {isDropped ? "(dropped)" : "(kept)"}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(!roll.advantageLevel || roll.advantageLevel === 0) && (
                  <div className="text-xs mt-1">
                    {roll.dice.map((die, index) => (
                      <div
                        key={index}
                        className={die.isCritical ? "text-yellow-600 font-semibold" : ""}
                      >
                        d{die.type}: {die.result} {die.isCritical ? "(CRIT!)" : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {roll.modifier !== 0 && (
                <div className="text-sm">
                  Modifier: {roll.modifier >= 0 ? "+" : ""}
                  {roll.modifier}
                </div>
              )}
              <div className="text-sm border-t pt-1 mt-1 font-semibold">Total: {roll.total}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}

// Component for displaying non-roll entries
function NonRollEntryDisplay({
  entry,
  formatTime,
}: {
  entry:
    | DamageEntry
    | HealingEntry
    | TempHPEntry
    | InitiativeEntry
    | AbilityUsageEntry
    | SafeRestEntry
    | CatchBreathEntry
    | MakeCampEntry
    | ResourceUsageEntry
    | SpellCastEntry
    | ItemConsumptionEntry;
  formatTime: (date: Date) => string;
}) {
  const getEntryIcon = () => {
    switch (entry.type) {
      case "damage":
        return "⚔️";
      case "healing":
        return "❤️";
      case "temp_hp":
        return "🛡️";
      case "initiative":
        return "⚡";
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
      case "initiative":
        return "text-yellow-600";
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
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{getEntryIcon()}</span>
        <span className="font-medium">{entry.description}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground">{formatTime(entry.timestamp)}</span>
        <span className={`font-bold text-lg min-w-8 text-right ${getEntryColor()}`}>
          {entry.type === "damage"
            ? `-${entry.amount}`
            : entry.type === "healing"
              ? `+${entry.amount}`
              : entry.type === "temp_hp"
                ? `+${entry.amount}`
                : entry.type === "initiative"
                  ? `${(entry as InitiativeEntry).actionsGranted} acts`
                  : entry.type === "ability_usage"
                    ? `${(entry as AbilityUsageEntry).usesRemaining}/${(entry as AbilityUsageEntry).maxUses}`
                    : entry.type === "safe_rest"
                      ? "REST"
                      : entry.type === "catch_breath"
                        ? `+${(entry as CatchBreathEntry).healingAmount}`
                        : entry.type === "make_camp"
                          ? `+${(entry as MakeCampEntry).healingAmount}`
                          : entry.type === "resource"
                            ? (entry as ResourceUsageEntry).action === "spent"
                              ? `-${entry.amount}`
                              : `+${entry.amount}`
                            : ""}
        </span>
      </div>
    </>
  );
}
