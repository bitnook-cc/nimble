import { FormulaTokenResults } from "@nimble/dice";

import { DiceRollEntry } from "@/lib/schemas/activity-log";
import { DiceFormulaDisplay, DoubleDigitDiceDisplay } from "@/lib/utils/dice-display-components";

// Component for displaying roll entries
export function RollEntryDisplay({
  roll,
  formatTime,
}: {
  roll: DiceRollEntry;
  formatTime: (date: Date) => string;
}) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side: Description and Formula */}
      <div className="flex items-center gap-3">
        <span className="font-medium">{roll.description}</span>
        <span className="text-sm text-muted-foreground font-mono">({roll.rollExpression})</span>
        {/* Badges for special conditions */}
        {roll.advantageLevel && roll.advantageLevel > 0 && (
          <span className="text-green-600 font-semibold text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
            ADV {roll.advantageLevel}
          </span>
        )}
        {roll.advantageLevel && roll.advantageLevel < 0 && (
          <span className="text-red-600 font-semibold text-xs bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded">
            DIS {Math.abs(roll.advantageLevel)}
          </span>
        )}
      </div>

      {/* Right side: Dice display and total */}
      <div className="flex items-center gap-2">
        {roll.diceResult && (
          <span className="text-sm">
            <DiceFormulaDisplay
              tokens={roll.diceResult.tokens}
              total={roll.diceResult.total}
              isFumble={roll.diceResult.isFumble}
            />
          </span>
        )}

        {roll.diceResult?.numCriticals !== undefined && roll.diceResult.numCriticals > 0 && (
          <span className="text-yellow-600 font-semibold text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
            CRIT
          </span>
        )}
        {roll.diceResult?.isFumble && (
          <span className="text-destructive font-semibold text-xs bg-destructive/10 px-2 py-0.5 rounded">
            MISS
          </span>
        )}
      </div>
    </div>
  );
}
