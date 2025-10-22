"use client";

import { HelpCircle, Plus } from "lucide-react";

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
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function DicePoolCards() {
  const { character, updateCharacter } = useCharacterService();
  const { addLogEntry } = useActivityLog();

  const [selectedDice, setSelectedDice] = useState<Record<string, Set<number>>>({});
  const [editingDie, setEditingDie] = useState<{ poolId: string; index: number } | null>(null);

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
          characterId: character.id,
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

  const handleUseSelected = async (poolId: string) => {
    const selected = selectedDice[poolId];
    if (!selected || selected.size === 0) return;

    const pool = dicePools.find((p: DicePoolInstance) => p.definition.id === poolId);
    if (!pool) return;

    // Sort indices in descending order to remove from end first (avoids index shifting)
    const indices = Array.from(selected).sort((a, b) => b - a);
    let updatedPools = dicePools;
    const usedValues: number[] = [];

    for (const index of indices) {
      const result = dicePoolService.useDieFromPool(updatedPools, poolId, index);
      if (result.usedValue !== null) {
        updatedPools = result.pools;
        usedValues.push(result.usedValue);
      }
    }

    if (usedValues.length > 0) {
      const total = usedValues.reduce((sum, val) => sum + val, 0);
      addLogEntry({
        id: `dice-pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "dice-pool",
        subtype: "use",
        characterId: character.id,
        poolName: pool.definition.name,
        value: total,
        description: `Used ${usedValues.length} ${pool.definition.name} dice: ${usedValues.reverse().join(", ")} (Total: ${total})`,
        timestamp: new Date(),
      });

      // Clear selection for this pool
      setSelectedDice((prev) => {
        const newState = { ...prev };
        delete newState[poolId];
        return newState;
      });

      await updateCharacter({
        ...character,
        _dicePools: updatedPools,
      });
    }
  };

  const handleCheckboxChange = (poolId: string, index: number, checked: boolean) => {
    setSelectedDice((prev) => {
      const poolSelection = prev[poolId] || new Set<number>();
      const newSelection = new Set(poolSelection);

      if (checked) {
        newSelection.add(index);
      } else {
        newSelection.delete(index);
      }

      return { ...prev, [poolId]: newSelection };
    });
  };

  const handleDieValueChange = async (poolId: string, index: number, newValue: string) => {
    const numValue = parseInt(newValue, 10);
    if (isNaN(numValue)) return;

    const updatedPools = dicePoolService.updateDieValue(dicePools, poolId, index, numValue);

    await updateCharacter({
      ...character,
      _dicePools: updatedPools,
    });

    setEditingDie(null);
  };

  const getPoolIcon = (pool: DicePoolInstance) => {
    if (pool.definition.icon) {
      return getIconById(pool.definition.icon);
    }
    return null;
  };

  const getResetTooltip = (pool: DicePoolInstance) => {
    const condition = pool.definition.resetCondition.replace("_", " ");
    const resetType =
      pool.definition.resetType === "to_max"
        ? "refills with rolled dice"
        : pool.definition.resetType === "to_zero"
          ? "clears all dice"
          : "resets to default";

    return `Resets on ${condition} and ${resetType}`;
  };

  return (
    <TooltipProvider>
      {dicePools.map((pool: DicePoolInstance) => {
        const maxSize = dicePoolService.getPoolMaxSize(pool, character);
        const currentValue = dicePoolService.getPoolCurrentValue(pool);
        const canAddDice = dicePoolService.canAddDiceToPool(pool, character);
        const poolSelection = selectedDice[pool.definition.id];
        const hasSelectedDice = poolSelection && poolSelection.size > 0;
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
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[250px]">
                      <p>{getResetTooltip(pool)}</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {pool.currentDice.length}/{maxSize} d{pool.definition.diceSize} dice
                </span>
              </CardTitle>
              {pool.definition.description && (
                <p className="text-sm text-muted-foreground">{pool.definition.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Dice display - always show all slots */}
              <div className="flex flex-wrap gap-3 justify-center">
                {Array.from({ length: maxSize }, (_, index) => {
                  const dieValue = pool.currentDice[index];
                  const isEmpty = dieValue === undefined;
                  const isEditing =
                    editingDie?.poolId === pool.definition.id && editingDie?.index === index;
                  const isSelected = poolSelection?.has(index) ?? false;

                  return (
                    <div key={index} className="flex flex-col items-center gap-1">
                      {/* Die display */}
                      <div
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-base transition-all",
                          isEmpty
                            ? "border-dashed border-muted-foreground/30 bg-muted/20 cursor-not-allowed opacity-40"
                            : "border-border hover:border-primary/50",
                        )}
                        style={{
                          backgroundColor: isEmpty
                            ? undefined
                            : getResourceColor(pool.definition.colorScheme, 75) + "20",
                          borderColor: isEmpty
                            ? undefined
                            : getResourceColor(pool.definition.colorScheme, 75) + "80",
                        }}
                      >
                        {!isEmpty &&
                          (isEditing ? (
                            <Input
                              type="number"
                              min={1}
                              max={pool.definition.diceSize}
                              defaultValue={dieValue}
                              className="w-10 h-8 text-center p-0 text-base font-bold"
                              autoFocus
                              onBlur={(e) =>
                                handleDieValueChange(pool.definition.id, index, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleDieValueChange(
                                    pool.definition.id,
                                    index,
                                    e.currentTarget.value,
                                  );
                                }
                                if (e.key === "Escape") {
                                  setEditingDie(null);
                                }
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingDie({ poolId: pool.definition.id, index })}
                              className="w-full h-full flex items-center justify-center hover:opacity-70 transition-opacity"
                            >
                              {dieValue}
                            </button>
                          ))}
                      </div>

                      {/* Checkbox below die */}
                      {!isEmpty && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(pool.definition.id, index, checked === true)
                          }
                          className="w-4 h-4"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-between">
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
                  onClick={() => handleUseSelected(pool.definition.id)}
                  disabled={!hasSelectedDice}
                >
                  Use Selected ({poolSelection?.size || 0})
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </TooltipProvider>
  );
}
