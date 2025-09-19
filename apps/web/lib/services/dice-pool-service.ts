import { DiceType } from "@nimble/dice";

import { Character } from "../schemas/character";
import { DicePoolInstance } from "../schemas/dice-pools";
import { calculateFlexibleValue as evaluateFlexibleValue } from "../types/flexible-value";
import { activityLogService } from "./activity-log-service";

export interface DicePoolServiceInterface {
  addDiceToPools(
    pools: DicePoolInstance[],
    poolId: string,
    character: Character,
  ): { pools: DicePoolInstance[]; rolledValue: number | null };
  useDieFromPool(
    pools: DicePoolInstance[],
    poolId: string,
    dieIndex: number,
  ): { pools: DicePoolInstance[]; usedValue: number | null };
  resetDicePools(
    pools: DicePoolInstance[],
    resetCondition: "safe_rest" | "encounter_end" | "turn_end" | "manual",
    character: Character,
  ): DicePoolInstance[];
  getPoolCurrentValue(pool: DicePoolInstance): number;
  getPoolMaxSize(pool: DicePoolInstance, character: Character): number;
  canAddDiceToPool(pool: DicePoolInstance, character: Character): boolean;
}

export class DicePoolService implements DicePoolServiceInterface {
  private static instance: DicePoolService;

  public static getInstance(): DicePoolService {
    if (!DicePoolService.instance) {
      DicePoolService.instance = new DicePoolService();
    }
    return DicePoolService.instance;
  }

  private rollDice(sides: DiceType): number {
    // Handle double-digit dice (44, 66, 88)
    if (sides === 44 || sides === 66 || sides === 88) {
      const baseValue = sides / 11;
      const tens = Math.floor(Math.random() * baseValue) + 1;
      const ones = Math.floor(Math.random() * baseValue) + 1;
      return tens * 10 + ones;
    }
    // Standard dice
    return Math.floor(Math.random() * sides) + 1;
  }

  addDiceToPools(
    pools: DicePoolInstance[],
    poolId: string,
    character: Character,
  ): { pools: DicePoolInstance[]; rolledValue: number | null } {
    const poolIndex = pools.findIndex((p) => p.definition.id === poolId);
    if (poolIndex === -1) {
      return { pools, rolledValue: null };
    }

    const pool = pools[poolIndex];
    if (!this.canAddDiceToPool(pool, character)) {
      return { pools, rolledValue: null };
    }

    // Roll a new die
    const rolledValue = this.rollDice(pool.definition.diceSize);

    // Create updated pool with new die added
    const updatedPool: DicePoolInstance = {
      ...pool,
      currentDice: [...pool.currentDice, rolledValue],
    };

    // Update pools array
    const updatedPools = [...pools];
    updatedPools[poolIndex] = updatedPool;

    return { pools: updatedPools, rolledValue };
  }

  useDieFromPool(
    pools: DicePoolInstance[],
    poolId: string,
    dieIndex: number,
  ): { pools: DicePoolInstance[]; usedValue: number | null } {
    const poolIndex = pools.findIndex((p) => p.definition.id === poolId);
    if (poolIndex === -1) {
      return { pools, usedValue: null };
    }

    const pool = pools[poolIndex];
    if (dieIndex < 0 || dieIndex >= pool.currentDice.length) {
      return { pools, usedValue: null };
    }

    // Get the value being used
    const usedValue = pool.currentDice[dieIndex];

    // Remove the die from the pool
    const updatedDice = [...pool.currentDice];
    updatedDice.splice(dieIndex, 1);

    const updatedPool: DicePoolInstance = {
      ...pool,
      currentDice: updatedDice,
    };

    // Update pools array
    const updatedPools = [...pools];
    updatedPools[poolIndex] = updatedPool;

    return { pools: updatedPools, usedValue };
  }

  resetDicePools(
    pools: DicePoolInstance[],
    resetCondition: "safe_rest" | "encounter_end" | "turn_end" | "manual",
    character: Character,
  ): DicePoolInstance[] {
    return pools.map((pool) => {
      if (pool.definition.resetCondition === resetCondition) {
        if (pool.definition.resetType === "to_max") {
          // Fill the pool with rolled dice up to max size
          const maxSize = this.getPoolMaxSize(pool, character);
          const newDice: number[] = [];
          for (let i = 0; i < maxSize; i++) {
            newDice.push(this.rollDice(pool.definition.diceSize));
          }
          return {
            ...pool,
            currentDice: newDice,
          };
        } else {
          // Reset to zero (clear all dice)
          return {
            ...pool,
            currentDice: [],
          };
        }
      }
      return pool;
    });
  }

  getPoolCurrentValue(pool: DicePoolInstance): number {
    return pool.currentDice.reduce((sum, die) => sum + die, 0);
  }

  getPoolMaxSize(pool: DicePoolInstance, character: Character): number {
    return evaluateFlexibleValue(pool.definition.maxDice);
  }

  canAddDiceToPool(pool: DicePoolInstance, character: Character): boolean {
    const maxSize = this.getPoolMaxSize(pool, character);
    return pool.currentDice.length < maxSize;
  }

  // Logging versions of methods
  async addDiceToPoolWithLogging(
    pools: DicePoolInstance[],
    poolId: string,
    character: Character,
  ): Promise<{ pools: DicePoolInstance[]; rolledValue: number | null }> {
    const result = this.addDiceToPools(pools, poolId, character);

    if (result.rolledValue !== null) {
      const pool = pools.find((p) => p.definition.id === poolId);
      if (pool) {
        const poolSize =
          result.pools.find((p) => p.definition.id === poolId)?.currentDice.length || 0;
        const logEntry = activityLogService.createDicePoolEntry(
          "add",
          pool.definition.name,
          result.rolledValue,
          pool.definition.diceSize,
          poolSize,
        );
        await activityLogService.addLogEntry(logEntry);
      }
    }

    return result;
  }

  async useDieFromPoolWithLogging(
    pools: DicePoolInstance[],
    poolId: string,
    dieIndex: number,
  ): Promise<{ pools: DicePoolInstance[]; usedValue: number | null }> {
    const pool = pools.find((p) => p.definition.id === poolId);
    const result = this.useDieFromPool(pools, poolId, dieIndex);

    if (result.usedValue !== null && pool) {
      const poolSize =
        result.pools.find((p) => p.definition.id === poolId)?.currentDice.length || 0;
      const logEntry = activityLogService.createDicePoolEntry(
        "use",
        pool.definition.name,
        result.usedValue,
        undefined,
        poolSize,
      );
      await activityLogService.addLogEntry(logEntry);
    }

    return result;
  }

  async resetDicePoolsWithLogging(
    pools: DicePoolInstance[],
    resetCondition: "safe_rest" | "encounter_end" | "turn_end" | "manual",
    character: Character,
  ): Promise<DicePoolInstance[]> {
    const resetPools = pools.filter((pool) => pool.definition.resetCondition === resetCondition);

    // Log reset for each pool that will be reset
    for (const pool of resetPools) {
      if (pool.currentDice.length > 0) {
        const logEntry = activityLogService.createDicePoolEntry("reset", pool.definition.name);
        await activityLogService.addLogEntry(logEntry);
      }
    }

    return this.resetDicePools(pools, resetCondition, character);
  }
}

// Export singleton instance
export const dicePoolService = DicePoolService.getInstance();
