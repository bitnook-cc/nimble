"use client";

import { ChevronDown, ChevronRight, Dices, Plus } from "lucide-react";
import { useState } from "react";

import { useActivityLog } from "@/lib/hooks/use-activity-log";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { DicePoolInstance } from "@/lib/schemas/dice-pools";
import { dicePoolService } from "@/lib/services/dice-pool-service";
import { getIconById } from "@/lib/utils/icon-utils";
import { getResourceColor } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";

export function DicePoolSection() {
  const { character, updateCharacter } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const { addLogEntry } = useActivityLog();

  const [selectedDice, setSelectedDice] = useState<Record<string, number | null>>({});

  // Get dice pools from character service (includes trait-granted pools)
  const characterService = getCharacterService();
  const dicePools = character ? characterService.getDicePools() : [];
  
  // Early return if no character or no dice pools
  if (!character || dicePools.length === 0) return null;

  const isOpen = uiState.collapsibleSections?.dicePools ?? true;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("dicePools", isOpen);

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
      setSelectedDice(prev => ({ ...prev, [poolId]: null }));
      
      await updateCharacter({
        ...character,
        _dicePools: result.pools,
      });
    }
  };

  const handleDieClick = (poolId: string, index: number) => {
    setSelectedDice(prev => ({
      ...prev,
      [poolId]: prev[poolId] === index ? null : index,
    }));
  };

  const getDiceColor = (pool: DicePoolInstance, isSelected: boolean) => {
    if (isSelected) {
      return "ring-2 ring-primary";
    }
    
    const maxSize = dicePoolService.getPoolMaxSize(pool, character);
    const percentage = (pool.currentDice.length / maxSize) * 100;
    const baseColor = getResourceColor(pool.definition.colorScheme, percentage);
    
    return "";
  };

  const getPoolIcon = (pool: DicePoolInstance) => {
    if (pool.definition.icon) {
      return getIconById(pool.definition.icon);
    }
    return Dices;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-4 h-auto">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-500" />
            Dice Pools
          </h2>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-4 p-4">
          {dicePools.map((pool: DicePoolInstance) => {
            const maxSize = dicePoolService.getPoolMaxSize(pool, character);
            const currentValue = dicePoolService.getPoolCurrentValue(pool);
            const canAddDice = dicePoolService.canAddDiceToPool(pool, character);
            const hasSelectedDie = selectedDice[pool.definition.id] !== null && selectedDice[pool.definition.id] !== undefined;
            const Icon = getPoolIcon(pool);
            
            return (
              <Card key={pool.definition.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: getResourceColor(pool.definition.colorScheme, 75) }} />
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
                  {/* Dice display */}
                  <div className="flex flex-wrap gap-2">
                    {pool.currentDice.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic">No dice in pool</span>
                    ) : (
                      pool.currentDice.map((value: number, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleDieClick(pool.definition.id, index)}
                          className={cn(
                            "w-10 h-10 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all",
                            "hover:scale-105 hover:shadow-md",
                            selectedDice[pool.definition.id] === index
                              ? "ring-2 ring-primary border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                          style={{
                            backgroundColor: selectedDice[pool.definition.id] === index 
                              ? undefined 
                              : getResourceColor(pool.definition.colorScheme, 75) + "20",
                            borderColor: selectedDice[pool.definition.id] === index
                              ? undefined
                              : getResourceColor(pool.definition.colorScheme, 75) + "80",
                          }}
                        >
                          {value}
                        </button>
                      ))
                    )}
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
                        <span>Reset Type: {pool.definition.resetType === "to_max" ? "Fill Pool" : "Clear Pool"}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}