import { useCallback } from "react";

import { AttributeName, SkillName } from "@/lib/schemas/character";
import { diceFormulaService } from "@/lib/services/dice-formula-service";
import { getActivityLog, getDiceService } from "@/lib/services/service-factory";

import { useActivityLog } from "./use-activity-log";

export interface UseDiceActionsReturn {
  rollAttribute: (
    attributeName: AttributeName,
    value: number,
    advantageLevel: number,
  ) => Promise<void>;
  rollSave: (attributeName: AttributeName, value: number, advantageLevel: number) => Promise<void>;
  rollSkill: (
    skillName: SkillName,
    attributeValue: number,
    skillModifier: number,
    advantageLevel: number,
  ) => Promise<void>;
  attack: (
    weaponName: string,
    damage: string,
    attributeModifier: number,
    advantageLevel: number,
  ) => Promise<void>;
  rollInitiative: (
    totalModifier: number,
    advantageLevel: number,
  ) => Promise<{ rollTotal: number; actionsGranted: number }>;
}

/**
 * Custom hook that provides direct access to dice rolling functionality.
 * Eliminates the need for React Context by using services directly.
 *
 * Updated to have a cleaner API - no external parameters needed.
 * Consolidated from duplicate implementation in use-dice-service.ts
 */
export function useDiceActions(): UseDiceActionsReturn {
  const diceService = getDiceService();
  const activityLogService = getActivityLog();
  const { addLogEntry } = useActivityLog();

  const rollAttribute = useCallback(
    async (attributeName: AttributeName, value: number, advantageLevel: number) => {
      try {
        const attributeLabel = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        const rollResult = diceService.rollAttributeCheck(value, advantageLevel);
        const rollExpression = `d20${value !== 0 ? (value >= 0 ? "+" : "") + value : ""}`;
        const logEntry = activityLogService.createDiceRollEntry(
          rollResult.dice,
          rollResult.droppedDice,
          value,
          rollResult.total,
          `${attributeLabel} check`,
          rollExpression,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [diceService, activityLogService, addLogEntry],
  );

  const rollSave = useCallback(
    async (attributeName: AttributeName, value: number, advantageLevel: number) => {
      try {
        const attributeLabel = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        const rollResult = diceService.rollAttributeCheck(value, advantageLevel);
        const rollExpression = `d20${value !== 0 ? (value >= 0 ? "+" : "") + value : ""}`;
        const logEntry = activityLogService.createDiceRollEntry(
          rollResult.dice,
          rollResult.droppedDice,
          value,
          rollResult.total,
          `${attributeLabel} save`,
          rollExpression,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [diceService, activityLogService, addLogEntry],
  );

  const rollSkill = useCallback(
    async (
      skillName: SkillName,
      attributeValue: number,
      skillModifier: number,
      advantageLevel: number,
    ) => {
      try {
        const totalModifier = attributeValue + skillModifier;
        const rollResult = diceService.rollAttributeCheck(totalModifier, advantageLevel);
        const rollExpression = `d20${totalModifier !== 0 ? (totalModifier >= 0 ? "+" : "") + totalModifier : ""}`;
        const logEntry = activityLogService.createDiceRollEntry(
          rollResult.dice,
          rollResult.droppedDice,
          totalModifier,
          rollResult.total,
          `${skillName} skill check`,
          rollExpression,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [diceService, activityLogService, addLogEntry],
  );

  const rollInitiative = useCallback(
    async (totalModifier: number, advantageLevel: number) => {
      try {
        // Build the formula string
        const formula = totalModifier >= 0 
          ? `1d20 + ${totalModifier}`
          : `1d20 - ${Math.abs(totalModifier)}`;
        
        // Roll using dice formula service (no crits/fumbles for initiative)
        const rollResult = diceFormulaService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: false,
          allowFumbles: false,
        });
        
        const actionsGranted = Math.max(1, rollResult.total);

        const logEntry = activityLogService.createInitiativeEntry(
          actionsGranted,
          formula,
          rollResult.diceData
        );
        await addLogEntry(logEntry);

        return { rollTotal: rollResult.total, actionsGranted };
      } catch (error) {
        console.error("Failed to roll initiative:", error);
        return { rollTotal: 1, actionsGranted: 1 };
      }
    },
    [activityLogService, addLogEntry],
  );

  const attack = useCallback(
    async (
      weaponName: string,
      damage: string,
      attributeModifier: number,
      advantageLevel: number,
    ) => {
      try {
        const rollResult = diceService.rollAttack(damage, attributeModifier, advantageLevel);
        const rollExpression = `${damage}${attributeModifier !== 0 ? (attributeModifier >= 0 ? "+" : "") + attributeModifier : ""}`;
        const logEntry = activityLogService.createDiceRollEntry(
          rollResult.dice,
          rollResult.droppedDice,
          attributeModifier,
          rollResult.total,
          `${weaponName} attack`,
          rollExpression,
          advantageLevel,
          rollResult.isMiss,
          rollResult.criticalHits,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll attack:", error);
      }
    },
    [diceService, activityLogService, addLogEntry],
  );

  return {
    rollAttribute,
    rollSave,
    rollSkill,
    rollInitiative,
    attack,
  };
}
