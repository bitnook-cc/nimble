import React from "react";

import { DiceRollData } from "../schemas/dice";
import { DiceFormulaDisplay, DoubleDigitDiceDisplay } from "./dice-display-components";

interface DiceRollDisplayProps {
  diceData: DiceRollData;
  description?: string;
  formula?: string;
}

/**
 * Utility component for displaying dice roll results with rich formatting
 * Can be used in activity log, toasts, or anywhere dice results need to be shown
 */
export function DiceRollDisplay({ diceData, description, formula }: DiceRollDisplayProps) {
  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side: Description and Formula */}
      <div className="flex items-center gap-3">
        {description && <span className="font-medium">{description}</span>}
        {formula && <span className="text-sm text-muted-foreground font-mono">({formula})</span>}
      </div>

      {/* Right side: Dice display and total */}
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {diceData.isDoubleDigit ? (
            <DoubleDigitDiceDisplay dice={diceData.dice} result={diceData.total} />
          ) : (
            <DiceFormulaDisplay
              dice={diceData.dice}
              beforeDice={diceData.beforeExpression}
              afterDice={diceData.afterExpression}
              total={diceData.total}
              isFumble={diceData.isFumble}
            />
          )}
        </span>
      </div>
    </div>
  );
}
