"use client";

import { Plus } from "lucide-react";

import { useState } from "react";

import { useActivityLog } from "@/lib/hooks/use-activity-log";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { DicePoolInstance } from "@/lib/schemas/dice-pools";
import { dicePoolService } from "@/lib/services/dice-pool-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { cn } from "@/lib/utils";
import { getIconById } from "@/lib/utils/icon-utils";
import { getResourceColor } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function DicePoolCards() {
  const { character, updateCharacter } = useCharacterService();
  const { addLogEntry } = useActivityLog();

  const [selectedDice, setSelectedDice] = useState<Record<string, number | null>>({});

  // Get dice pools from character service (includes trait-granted pools)
  const characterService = getCharacterService();
  const dicePools = character ? characterService.getDicePools() : [];

  // Early return if no character or no dice pools
  if (!character || dicePools.length === 0) return null;

  const handleAddDice = async (poolId: string) => {
    const result = dicePoolService.addDiceToPools(dicePools, poolId, character);

    if (result.rolledValue !== null) {
      const pool = dicePools.find((p: DicePoolInstance) => p.definition.id === poolId);
      if (pool) {
        addLogEntry({
          id: `dice-pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "dice-pool",
          subtype: "add",
          poolName: pool.definition.name,
          diceSize: pool.definition.diceSize,
          value: result.rolledValue,
          description: `Added d${pool.definition.diceSize} to ${pool.definition.name}: rolled ${result.rolledValue}`,
          timestamp: new Date(),
        });
      }

      await updateCharacter({
        ...character,
        _dicePools: result.pools,
      });
    }
  };

  const handleUseDie = async (poolId: string) => {
    const dieIndex = selectedDice[poolId];
    if (dieIndex === null || dieIndex === undefined) return;

    const result = dicePoolService.useDieFromPool(dicePools, poolId, dieIndex);

    if (result.usedValue !== null) {
      const pool = dicePools.find((p: DicePoolInstance) => p.definition.id === poolId);
      if (pool) {
        addLogEntry({
          id: `dice-pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: "dice-pool",
          subtype: "use",
          poolName: pool.definition.name,
          value: result.usedValue,
          description: `Used ${pool.definition.name} die: ${result.usedValue}`,
          timestamp: new Date(),
        });
      }

      // Clear selection for this pool
      setSelectedDice((prev) => ({ ...prev, [poolId]: null }));

      await updateCharacter({
        ...character,
        _dicePools: result.pools,
      });
    }
  };

  const handleDieClick = (poolId: string, index: number) => {
    setSelectedDice((prev) => ({
      ...prev,
      [poolId]: prev[poolId] === index ? null : index,
    }));
  };

  const getPoolIcon = (pool: DicePoolInstance) => {
    if (pool.definition.icon) {
      return getIconById(pool.definition.icon);
    }
    return null;
  };

  return (
    <>
      {dicePools.map((pool: DicePoolInstance) => {
        const maxSize = dicePoolService.getPoolMaxSize(pool, character);
        const currentValue = dicePoolService.getPoolCurrentValue(pool);
        const canAddDice = dicePoolService.canAddDiceToPool(pool, character);
        const hasSelectedDie =
          selectedDice[pool.definition.id] !== null &&
          selectedDice[pool.definition.id] !== undefined;
        const Icon = getPoolIcon(pool);

        return (
          <Card key={pool.definition.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {Icon && (
                    <Icon
                      className="w-4 h-4"
                      style={{ color: getResourceColor(pool.definition.colorScheme, 75) }}
                    />
                  )}
                  {pool.definition.name}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {pool.currentDice.length}/{maxSize} dice (Total: {currentValue})
                </span>
              </CardTitle>
              {pool.definition.description && (
                <p className="text-sm text-muted-foreground">{pool.definition.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dice display - always show all slots */}
              <div className="flex flex-wrap gap-2 justify-center">
                {Array.from({ length: maxSize }, (_, index) => {
                  const dieValue = pool.currentDice[index];
                  const isSelected = selectedDice[pool.definition.id] === index;
                  const isEmpty = dieValue === undefined;

                  return (
                    <button
                      key={index}
                      onClick={() => !isEmpty && handleDieClick(pool.definition.id, index)}
                      disabled={isEmpty}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all",
                        isEmpty
                          ? "cursor-not-allowed opacity-40"
                          : "hover:scale-105 hover:shadow-md",
                        isSelected && !isEmpty
                          ? "ring-2 ring-primary border-primary bg-primary/10"
                          : isEmpty
                            ? "border-dashed border-muted-foreground/30 bg-muted/20"
                            : "border-border hover:border-primary/50",
                      )}
                      style={{
                        backgroundColor: isEmpty
                          ? undefined
                          : isSelected
                            ? undefined
                            : getResourceColor(pool.definition.colorScheme, 75) + "20",
                        borderColor: isEmpty
                          ? undefined
                          : isSelected
                            ? undefined
                            : getResourceColor(pool.definition.colorScheme, 75) + "80",
                      }}
                    >
                      {!isEmpty && dieValue}
                    </button>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddDice(pool.definition.id)}
                  disabled={!canAddDice}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add d{pool.definition.diceSize}
                </Button>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleUseDie(pool.definition.id)}
                  disabled={!hasSelectedDie}
                >
                  Use Selected Die
                </Button>
              </div>

              {/* Pool info */}
              <div className="text-xs text-muted-foreground">
                <span>Dice Size: d{pool.definition.diceSize}</span>
                <span className="mx-2">•</span>
                <span>Reset: {pool.definition.resetCondition.replace("_", " ")}</span>
                {pool.definition.resetType && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      Reset Type:{" "}
                      {pool.definition.resetType === "to_max" ? "Fill Pool" : "Clear Pool"}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
