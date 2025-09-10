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
    <div className="flex items-center justify-between w-full">
      {/* Left side: Description and Formula */}
      <div className="flex items-center gap-3">
        <span className="font-medium">{roll.description}</span>
        <span className="text-sm text-muted-foreground font-mono">
          ({roll.rollExpression})
        </span>
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
        {roll.diceData ? (
          <span className="text-sm">
            {roll.diceData.isDoubleDigit ? (
              <DoubleDigitDiceDisplay 
                dice={roll.diceData.dice}
                result={roll.total}
              />
            ) : (
              <DiceFormulaDisplay 
                dice={roll.diceData.dice}
                beforeDice={roll.diceData.beforeExpression}
                afterDice={roll.diceData.afterExpression}
                total={roll.total}
                isFumble={roll.diceData.isFumble}
              />
            )}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs font-mono">
            [{renderDiceWithStrikethrough()}]
            {roll.modifier !== 0 ? ` ${roll.modifier >= 0 ? "+" : ""}${roll.modifier}` : ""} ={" "}
            {roll.total}
          </span>
        )}
        
        
        {roll.criticalHits && roll.criticalHits > 0 && (
          <span className="text-yellow-600 font-semibold text-xs bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
            CRIT
          </span>
        )}
        {roll.isMiss && (
          <span className="text-destructive font-semibold text-xs bg-destructive/10 px-2 py-0.5 rounded">
            MISS
          </span>
        )}
      </div>
    </div>
  );
}