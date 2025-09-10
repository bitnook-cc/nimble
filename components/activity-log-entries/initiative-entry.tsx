import { InitiativeEntry } from "@/lib/schemas/activity-log";
import { DiceFormulaDisplay } from "@/lib/utils/dice-display-components";

// Component for displaying initiative entries with dice data
export function InitiativeEntryDisplay({
  entry,
}: {
  entry: InitiativeEntry;
}) {
  const getActionsText = () => {
    const total = entry.diceData?.total ?? 0;
    if (total < 10) return "1 action";
    if (total <= 20) return "2 actions";
    return "3 actions";
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side: Description and Formula */}
      <div className="flex items-center gap-3">
        <span className="font-medium">{entry.description}</span>
        {entry.rollExpression && (
          <span className="text-sm text-muted-foreground font-mono">
            ({entry.rollExpression})
          </span>
        )}
      </div>
      
      {/* Right side: Dice display and actions granted */}
      <div className="flex items-center gap-3">
        {entry.diceData && (
          <span className="text-sm">
            <DiceFormulaDisplay 
              dice={entry.diceData.dice}
              beforeDice={entry.diceData.beforeExpression}
              afterDice={entry.diceData.afterExpression}
              total={entry.diceData.total}
              isFumble={false} // No fumbles for initiative
            />
          </span>
        )}
        <span className="text-yellow-600 font-semibold text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
          {getActionsText()}
        </span>
      </div>
    </div>
  );
}