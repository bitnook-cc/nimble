import { useCallback } from "react";

import { AttributeName, SkillName } from "@/lib/schemas/character";
import { diceService } from "@/lib/services/dice-service";
import { getActivityLog } from "@/lib/services/service-factory";

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
  const activityLogService = getActivityLog();
  const { addLogEntry } = useActivityLog();

  const rollAttribute = useCallback(
    async (attributeName: AttributeName, value: number, advantageLevel: number) => {
      try {
        const attributeLabel = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        const formula = value >= 0 ? `1d20 + ${value}` : `1d20 - ${Math.abs(value)}`;
        
        const rollResult = diceService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: false, // Attribute checks don't crit
          allowFumbles: false, // Attribute checks don't fumble
        });
        
        const logEntry = activityLogService.createDiceRollEntry(
          `${attributeLabel} check`,
          rollResult,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [activityLogService, addLogEntry],
  );

  const rollSave = useCallback(
    async (attributeName: AttributeName, value: number, advantageLevel: number) => {
      try {
        const attributeLabel = attributeName.charAt(0).toUpperCase() + attributeName.slice(1);
        const formula = value >= 0 ? `1d20 + ${value}` : `1d20 - ${Math.abs(value)}`;
        
        const rollResult = diceService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: false, // Saves don't crit
          allowFumbles: false, // Saves don't fumble
        });
        
        const logEntry = activityLogService.createDiceRollEntry(
          `${attributeLabel} save`,
          rollResult,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [activityLogService, addLogEntry],
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
        const formula = totalModifier >= 0 
          ? `1d20 + ${totalModifier}`
          : `1d20 - ${Math.abs(totalModifier)}`;
        
        const rollResult = diceService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: false, // Skill checks don't crit
          allowFumbles: false, // Skill checks don't fumble
        });
        
        const logEntry = activityLogService.createDiceRollEntry(
          `${skillName} skill check`,
          rollResult,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll dice:", error);
      }
    },
    [activityLogService, addLogEntry],
  );

  const rollInitiative = useCallback(
    async (totalModifier: number, advantageLevel: number) => {
      try {
        // Build the formula string
        const formula = totalModifier >= 0 
          ? `1d20 + ${totalModifier}`
          : `1d20 - ${Math.abs(totalModifier)}`;
        
        // Roll using dice formula service (no crits/fumbles for initiative)
        const rollResult = diceService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: false,
          allowFumbles: false,
        });
        
        // Calculate actions based on initiative roll total (game rules)
        let actionsGranted: number;
        if (rollResult.total < 10) {
          actionsGranted = 1;
        } else if (rollResult.total <= 20) {
          actionsGranted = 2;
        } else {
          actionsGranted = 3;
        }

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
        // Build formula with modifier
        const formula = attributeModifier >= 0 
          ? `${damage} + ${attributeModifier}`
          : `${damage} - ${Math.abs(attributeModifier)}`;
        
        const rollResult = diceService.evaluateDiceFormula(formula, {
          advantageLevel,
          allowCriticals: true, // Attacks can crit
          allowFumbles: true, // Attacks can fumble
        });
        
        const logEntry = activityLogService.createDiceRollEntry(
          `${weaponName} attack`,
          rollResult,
          advantageLevel,
        );
        await addLogEntry(logEntry);
      } catch (error) {
        console.error("Failed to roll attack:", error);
      }
    },
    [activityLogService, addLogEntry],
  );

  return {
    rollAttribute,
    rollSave,
    rollSkill,
    rollInitiative,
    attack,
  };
}
