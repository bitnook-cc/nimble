import { Effect, EffectResult } from "../types/effects";
import { activityLogService } from "./activity-log-service";
import { dicePoolService } from "./dice-pool-service";
import { DiceFormulaResult } from "./dice-service";
import { diceService } from "./dice-service";
import { getCharacterService } from "./service-factory";

export interface EffectServiceInterface {
  applyEffects(effects: Effect[], source: string): Promise<EffectResult[]>;
  getEffectPreview(effect: Effect): string;
  getEffectIcon(effect: Effect): string;
}

export class EffectService implements EffectServiceInterface {
  private static instance: EffectService;

  public static getInstance(): EffectService {
    if (!EffectService.instance) {
      EffectService.instance = new EffectService();
    }
    return EffectService.instance;
  }

  /**
   * Apply effects to the current character
   */
  async applyEffects(effects: Effect[], source: string): Promise<EffectResult[]> {
    const results: EffectResult[] = [];
    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();

    if (!character) {
      throw new Error("No character selected");
    }

    for (const effect of effects) {
      try {
        const result = await this.applyEffect(effect, character.id, source);
        results.push(result);
      } catch (error) {
        results.push({
          effect,
          value: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Apply a single effect
   */
  private async applyEffect(
    effect: Effect,
    characterId: string,
    source: string,
  ): Promise<EffectResult> {
    const characterService = getCharacterService();
    const character = characterService.character;
    if (!character) {
      throw new Error("Character not found");
    }

    // Evaluate the dice formula
    const rollResult = this.evaluateEffectFormula(effect);
    const value = Math.floor(rollResult.total);

    // Log the dice roll for the effect
    const rollEntry = activityLogService.createDiceRollEntry(
      `${source} (Effect: ${this.getEffectTypeName(effect.type)})`,
      rollResult,
      0,
    );
    activityLogService.addLogEntry(rollEntry);

    // Apply the effect based on type
    switch (effect.type) {
      case "damage": {
        await characterService.applyDamage(Math.abs(value));
        break;
      }

      case "healing": {
        await characterService.applyHealing(Math.abs(value));
        break;
      }

      case "tempHP": {
        await characterService.applyTemporaryHP(Math.abs(value));
        break;
      }

      case "resourceChange": {
        const resourceId = effect.resourceId;

        if (value > 0) {
          // Restore resource (logging is handled by the method)
          await characterService.restoreResource(resourceId, Math.abs(value));
        } else if (value < 0) {
          // Spend resource (logging is handled by the method)
          await characterService.spendResource(resourceId, Math.abs(value));
        }

        break;
      }

      case "dicePoolChange": {
        const poolId = effect.poolId;
        const pools = characterService.getDicePools();
        const pool = pools.find((p) => p.definition.id === poolId);
        if (!pool) {
          throw new Error(`Dice pool ${poolId} not found`);
        }

        let updatedPools = pools;

        if (value > 0) {
          // Add dice to pool
          for (let i = 0; i < value; i++) {
            const result = await dicePoolService.addDiceToPoolWithLogging(
              updatedPools,
              poolId,
              character,
            );
            if (result.rolledValue !== null) {
              updatedPools = result.pools;
            }
          }
        } else if (value < 0) {
          // Remove dice from pool (remove from end)
          const currentPool = updatedPools.find((p) => p.definition.id === poolId);
          if (currentPool) {
            const toRemove = Math.min(Math.abs(value), currentPool.currentDice.length);
            for (let i = 0; i < toRemove; i++) {
              const dieIndex = currentPool.currentDice.length - 1 - i;
              if (dieIndex >= 0) {
                const result = await dicePoolService.useDieFromPoolWithLogging(
                  updatedPools,
                  poolId,
                  dieIndex,
                );
                if (result.usedValue !== null) {
                  updatedPools = result.pools;
                }
              }
            }
          }
        }

        await characterService.updateCharacterFields({ _dicePools: updatedPools });
        break;
      }

      default:
        throw new Error(`Unknown effect type: ${(effect as any).type}`);
    }

    return {
      effect,
      value,
      success: true,
    };
  }

  /**
   * Evaluate the dice formula for an effect
   */
  private evaluateEffectFormula(effect: Effect): DiceFormulaResult {
    let formula: string;

    switch (effect.type) {
      case "damage":
      case "healing":
      case "tempHP":
        formula = effect.diceFormula;
        break;
      case "resourceChange":
        formula = effect.diceFormula;
        break;
      case "dicePoolChange":
        formula = effect.diceFormula;
        break;
    }

    // Evaluate without advantage/disadvantage
    return diceService.evaluateDiceFormula(formula);
  }

  /**
   * Get a human-readable preview of an effect
   */
  getEffectPreview(effect: Effect): string {
    switch (effect.type) {
      case "damage":
        return `Deal ${effect.diceFormula} damage`;
      case "healing":
        return `Heal ${effect.diceFormula} HP`;
      case "tempHP":
        return `Gain ${effect.diceFormula} temporary HP`;
      case "resourceChange": {
        const isPositive = !effect.diceFormula.startsWith("-");
        return isPositive
          ? `Gain ${effect.diceFormula} ${effect.resourceId}`
          : `Lose ${effect.diceFormula.substring(1)} ${effect.resourceId}`;
      }
      case "dicePoolChange": {
        const isPositive = !effect.diceFormula.startsWith("-");
        return isPositive
          ? `Add ${effect.diceFormula} dice to ${effect.poolId}`
          : `Remove ${effect.diceFormula.substring(1)} dice from ${effect.poolId}`;
      }
      default:
        return "Unknown effect";
    }
  }

  /**
   * Get an icon for the effect type
   */
  getEffectIcon(effect: Effect): string {
    switch (effect.type) {
      case "damage":
        return "⚔️";
      case "healing":
        return "❤️";
      case "tempHP":
        return "🛡️";
      case "resourceChange":
        return "✨";
      case "dicePoolChange":
        return "🎲";
    }
  }

  /**
   * Get the display name for an effect type
   */
  private getEffectTypeName(type: Effect["type"]): string {
    switch (type) {
      case "damage":
        return "Damage";
      case "healing":
        return "Healing";
      case "tempHP":
        return "Temporary HP";
      case "resourceChange":
        return "Resource Change";
      case "dicePoolChange":
        return "Dice Pool Change";
    }
  }
}

// Export singleton instance
export const effectService = EffectService.getInstance();
