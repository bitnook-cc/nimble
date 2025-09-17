import { DiceCategory } from "@nimble/dice";

import React from "react";

export interface DiceDisplayProps {
  value: number;
  size?: number;
  category: DiceCategory;
  isFirst?: boolean;
}

/**
 * Component to display a single die with appropriate styling
 */
export function DiceDisplay({ value, size, category, isFirst = false }: DiceDisplayProps) {
  const diceType = size ? `d${size}` : "";

  const getStyles = () => {
    switch (category) {
      case "critical":
        return {
          className: "font-bold text-orange-600 dark:text-orange-500",
          tooltip: `Critical ${diceType} (exploded): ${value}`,
        };
      case "vicious":
        return {
          className: "font-bold text-purple-600 dark:text-purple-500",
          tooltip: `Vicious ${diceType} (bonus damage): ${value}`,
        };
      case "dropped":
        return {
          className: "text-gray-400 dark:text-gray-500 line-through opacity-60",
          tooltip: `Dropped ${diceType} (advantage/disadvantage): ${value}`,
        };
      case "fumble":
        return {
          className: "font-bold text-red-600 dark:text-red-500",
          tooltip: `Fumble ${diceType} (natural 1): ${value}`,
        };
      case "normal":
      default:
        return {
          className: isFirst ? "font-semibold" : "",
          tooltip: `Rolled ${diceType}: ${value}`,
        };
    }
  };

  const { className, tooltip } = getStyles();

  return (
    <span className={`inline-block mx-0.5 ${className}`} title={tooltip}>
      [{value}]
    </span>
  );
}

/**
 * Component to display the full dice roll formula with rich formatting
 */
export function DiceFormulaDisplay({
  dice,
  beforeDice,
  afterDice,
  total,
  isFumble,
}: {
  dice: Array<{ value: number; size?: number; category: DiceCategory; kept: boolean }>;
  beforeDice?: string;
  afterDice?: string;
  total: number;
  isFumble?: boolean;
}) {
  // Display dice in their original order, formatting each based on its category
  const keptDice = dice.filter((d) => d.kept);
  const hasDroppedDice = dice.some((d) => !d.kept);

  return (
    <span className="inline-flex items-center gap-1">
      {beforeDice && <span className="text-black dark:text-white font-medium">{beforeDice}</span>}

      {/* Display all dice in their original order */}
      {dice.map((die, index) => {
        const isFirstKeptDie = keptDice.length > 0 && die === keptDice[0];

        return (
          <React.Fragment key={index}>
            {/* Add operators between kept dice */}
            {index > 0 && die.kept && dice[index - 1].kept && (
              <span className="text-gray-400 dark:text-gray-500">+</span>
            )}

            {/* Add separator before dropped dice section */}
            {!die.kept && index > 0 && dice[index - 1].kept && (
              <span className="text-gray-500 mx-1">|</span>
            )}

            {/* Add comma between dropped dice */}
            {!die.kept && index > 0 && !dice[index - 1].kept && (
              <span className="text-gray-400 dark:text-gray-500">,</span>
            )}

            <DiceDisplay
              value={die.value}
              size={die.size}
              category={die.category}
              isFirst={isFirstKeptDie}
            />
          </React.Fragment>
        );
      })}

      {afterDice && <span className="text-black text-gray-500 font-medium">{afterDice}</span>}

      <span className="text-gray-500 mx-1">=</span>
      <span
        className={`font-bold ${isFumble ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500"}`}
      >
        {total}
      </span>
    </span>
  );
}

/**
 * Component for double-digit dice display (d44, d66, d88)
 */
export function DoubleDigitDiceDisplay({
  dice,
  result,
}: {
  dice: Array<{ value: number; size?: number; kept: boolean }>;
  result: number;
}) {
  // Double-digit dice have tens first, then ones
  const halfLength = dice.length / 2;
  const tensDice = dice.slice(0, halfLength);
  const onesDice = dice.slice(halfLength);

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-gray-600 dark:text-gray-400 text-sm">Tens:</span>
      {tensDice.map((die, index) => (
        <DiceDisplay
          key={`tens-${index}`}
          value={die.value}
          size={die.size}
          category={die.kept ? "normal" : "dropped"}
        />
      ))}

      <span className="text-gray-500 mx-2">|</span>

      <span className="text-gray-600 dark:text-gray-400 text-sm">Ones:</span>
      {onesDice.map((die, index) => (
        <DiceDisplay
          key={`ones-${index}`}
          value={die.value}
          size={die.size}
          category={die.kept ? "normal" : "dropped"}
        />
      ))}

      <span className="text-gray-500 dark:text-gray-400 mx-1">=</span>
      <span className="font-bold text-green-600 dark:text-green-500">{result}</span>
    </span>
  );
}
