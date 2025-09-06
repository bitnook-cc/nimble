import { gameConfig } from "../config/game-config";
import { DiceExpression, DiceType } from "../types/dice";
import { SingleDie } from "../types/log-entries";
import { parseDiceExpression } from "../utils/dice-parser";

export interface DiceRollResult {
  dice: SingleDie[];
  droppedDice: SingleDie[];
  total: number;
  criticalHits: number;
  isMiss: boolean;
}

export class DiceService {
  rollSingleDie(sides: DiceType): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  rollMultipleDice(count: number, sides: DiceType): SingleDie[] {
    const dice: SingleDie[] = [];
    for (let i = 0; i < count; i++) {
      dice.push({
        type: sides,
        result: this.rollSingleDie(sides),
      });
    }
    return dice;
  }

  applyAdvantageDisadvantage(
    dice: SingleDie[],
    advantageLevel: number,
  ): { finalDice: SingleDie[]; droppedDice: SingleDie[] } {
    if (advantageLevel === 0) {
      return { finalDice: dice, droppedDice: [] };
    }

    const sortedDice = [...dice].sort((a, b) => a.result - b.result);

    if (advantageLevel > 0) {
      // Advantage: drop lowest dice
      const numToDrop = Math.min(advantageLevel, dice.length - 1);
      const droppedDice = sortedDice.slice(0, numToDrop);
      const finalDice = sortedDice.slice(numToDrop);
      return { finalDice, droppedDice };
    } else {
      // Disadvantage: drop highest dice
      const numToDrop = Math.min(Math.abs(advantageLevel), dice.length - 1);
      const droppedDice = sortedDice.slice(-numToDrop);
      const finalDice = sortedDice.slice(0, -numToDrop);
      return { finalDice, droppedDice };
    }
  }

  rollDiceWithCriticals(
    count: number,
    sides: DiceType,
    advantageLevel: number = 0,
  ): { dice: SingleDie[]; droppedDice: SingleDie[]; criticalHits: number } {
    // Calculate total dice to roll (base count + advantage/disadvantage dice)
    const totalDiceToRoll = count + Math.abs(advantageLevel);
    const initialDice: SingleDie[] = [];

    // Roll initial dice (including advantage/disadvantage extra dice)
    for (let i = 0; i < totalDiceToRoll; i++) {
      initialDice.push({
        type: sides,
        result: this.rollSingleDie(sides),
      });
    }

    // Apply advantage/disadvantage to get final dice and dropped dice
    const { finalDice, droppedDice } = this.applyAdvantageDisadvantage(initialDice, advantageLevel);

    // Check if the first die (primary damage die) rolled its maximum for critical hits
    let criticalHits = 0;
    if (finalDice.length > 0 && finalDice[0].result === sides) {
      finalDice[0].isCritical = true;
      criticalHits++;

      // Keep rolling additional dice while they also roll maximum (no advantage/disadvantage on critical dice)
      let consecutiveCrits = 0;
      while (consecutiveCrits < gameConfig.dice.maxCriticalHitsInRow) {
        const additionalDie: SingleDie = {
          type: sides,
          result: this.rollSingleDie(sides),
        };
        finalDice.push(additionalDie);

        // Check if this additional die also rolled maximum (another crit)
        if (additionalDie.result === sides) {
          additionalDie.isCritical = true;
          criticalHits++;
          consecutiveCrits++;
        } else {
          // This additional die didn't crit, stop rolling more
          break;
        }
      }
    }

    return { dice: finalDice, droppedDice, criticalHits };
  }

  rollBasicDice(
    count: number,
    sides: DiceType,
    advantageLevel: number = 0,
  ): { dice: SingleDie[]; droppedDice: SingleDie[] } {
    // Calculate total dice to roll (base count + advantage/disadvantage dice)
    const totalDiceToRoll = count + Math.abs(advantageLevel);
    const initialDice: SingleDie[] = [];

    // Roll initial dice (including advantage/disadvantage extra dice)
    for (let i = 0; i < totalDiceToRoll; i++) {
      initialDice.push({
        type: sides,
        result: this.rollSingleDie(sides),
      });
    }

    // Apply advantage/disadvantage to get final dice and dropped dice
    const { finalDice, droppedDice } = this.applyAdvantageDisadvantage(initialDice, advantageLevel);

    return { dice: finalDice, droppedDice };
  }

  /**
   * Roll a basic attribute/skill check (d20 + modifier)
   */
  rollAttributeCheck(modifier: number, advantageLevel: number = 0): DiceRollResult {
    const { dice, droppedDice } = this.rollBasicDice(1, 20, advantageLevel);
    const diceTotal = dice.reduce((sum, die) => sum + die.result, 0);
    const total = diceTotal + modifier;

    return {
      dice,
      droppedDice,
      total,
      criticalHits: 0,
      isMiss: false,
    };
  }

  /**
   * Roll an attack with damage dice and critical hit mechanics
   */
  rollAttack(diceExpression: string, modifier: number, advantageLevel: number = 0): DiceRollResult {
    const parsed = parseDiceExpression(diceExpression);
    if (!parsed) {
      throw new Error(`Invalid dice expression: ${diceExpression}`);
    }

    const { dice, droppedDice, criticalHits } = this.rollDiceWithCriticals(
      parsed.count,
      parsed.sides,
      advantageLevel,
    );
    const diceTotal = dice.reduce((sum, die) => sum + die.result, 0);
    const total = diceTotal + modifier;

    // Check for miss - only if first die is 1 (and using miss rule) - check AFTER advantage/disadvantage
    const isMiss = gameConfig.combat.missOnFirstDieOne && dice.length > 0 && dice[0].result === 1;

    return {
      dice,
      droppedDice,
      total: isMiss ? 0 : total, // Miss = 0 damage
      criticalHits,
      isMiss,
    };
  }
}

export const diceService = new DiceService();
