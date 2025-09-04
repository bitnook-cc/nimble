"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { DiceType } from "@/lib/types/dice";
import { diceService } from "@/lib/services/dice-service";
import { useActivityLog } from "@/lib/hooks/use-activity-log";
import { Dices, X } from "lucide-react";
import { DiceIcon } from "./ui/dice-icons";

interface DiceInPool {
  id: string;
  type: DiceType;
}

export function RollPanel() {
  const { addLogEntry } = useActivityLog();
  const [dicePool, setDicePool] = useState<DiceInPool[]>([]);

  const diceTypes: DiceType[] = [4, 6, 8, 10, 12, 20, 100];

  const addDiceToPool = (type: DiceType) => {
    const newDie: DiceInPool = {
      id: crypto.randomUUID(),
      type
    };
    setDicePool(prev => [...prev, newDie]);
  };

  const removeDiceFromPool = (id: string) => {
    setDicePool(prev => prev.filter(die => die.id !== id));
  };

  const clearPool = () => {
    setDicePool([]);
  };

  const rollDice = () => {
    if (dicePool.length === 0) {
      return;
    }

    const allDice = [];
    let totalSum = 0;

    for (const poolDie of dicePool) {
      const { dice } = diceService.rollBasicDice(1, poolDie.type);
      allDice.push(...dice);
      totalSum += dice.reduce((sum, die) => sum + die.result, 0);
    }

    // Create description showing dice types
    const diceTypeCounts = dicePool.reduce((acc, die) => {
      acc[die.type] = (acc[die.type] || 0) + 1;
      return acc;
    }, {} as Record<DiceType, number>);
    
    const diceDescription = Object.entries(diceTypeCounts)
      .map(([type, count]) => `${count}d${type}`)
      .join(' + ');

    addLogEntry({
      id: crypto.randomUUID(),
      type: 'roll',
      timestamp: new Date(),
      description: `Custom roll: ${diceDescription}`,
      dice: allDice,
      droppedDice: [],
      total: totalSum,
      modifier: 0,
      rollExpression: diceDescription,
      criticalHits: 0,
      isMiss: false,
    });

    // Clear pool after rolling
    clearPool();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Dices className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div className="text-sm font-medium">Custom Dice Roll</div>
          
          {/* Dice Type Buttons */}
          <div className="grid grid-cols-3 gap-1">
            {diceTypes.map(type => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                className="h-9 text-xs flex items-center gap-1 px-2"
                onClick={() => addDiceToPool(type)}
              >
                <DiceIcon type={type} className="w-3 h-3" />
                d{type}
              </Button>
            ))}
          </div>

          {/* Dice Pool Display */}
          {dicePool.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pool:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={clearPool}
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {dicePool.map(die => (
                  <div
                    key={die.id}
                    className="flex items-center gap-1 bg-slate-50 border rounded px-1 py-0.5"
                  >
                    <DiceIcon type={die.type} className="w-3 h-3" />
                    <span className="text-xs">d{die.type}</span>
                    <button
                      onClick={() => removeDiceFromPool(die.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roll Button */}
          <Button 
            onClick={rollDice} 
            disabled={dicePool.length === 0}
            className="w-full"
            size="sm"
          >
            Roll ({dicePool.length} dice)
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}