import { toast } from "sonner";

import { createElement } from "react";

import { gameConfig } from "../config/game-config";
import { logEntrySchema } from "../schemas/activity-log";
import {
  AbilityUsageEntry,
  CatchBreathEntry,
  DamageEntry,
  DiceRollEntry,
  HealingEntry,
  InitiativeEntry,
  LogEntry,
  MakeCampEntry,
  ResourceUsageEntry,
  SafeRestEntry,
  SpellCastEntry,
  TempHPEntry,
} from "../schemas/activity-log";

export class ActivityLogService {
  private readonly storageKey = "nimble-navigator-activity-log";
  private readonly maxEntries = gameConfig.storage.maxRollHistory;

  async getLogEntries(): Promise<LogEntry[]> {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      const entries = parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      // Validate each entry and filter out invalid ones
      return entries.filter((entry: any) => {
        try {
          logEntrySchema.parse(entry);
          return true;
        } catch {
          console.warn("Invalid log entry found and removed:", entry);
          return false;
        }
      });
    } catch {
      return [];
    }
  }

  async addLogEntry(newEntry: LogEntry): Promise<void> {
    // Validate the new entry before adding
    try {
      logEntrySchema.parse(newEntry);
    } catch (error) {
      console.error("Invalid log entry provided:", newEntry, error);
      throw new Error("Invalid log entry format");
    }

    const existingEntries = await this.getLogEntries();
    const updatedEntries = [newEntry, ...existingEntries].slice(0, this.maxEntries);
    localStorage.setItem(this.storageKey, JSON.stringify(updatedEntries));

    // Show toast notification
    this.showToastForLogEntry(newEntry);
  }

  private createDiceDisplayComponent(rollEntry: DiceRollEntry) {
    // If no advantage/disadvantage, show normally
    if (!rollEntry.advantageLevel || rollEntry.advantageLevel === 0) {
      const diceText = rollEntry.dice
        .map((d) => `${d.result}${d.isCritical ? "*" : ""}`)
        .join(", ");
      return createElement("span", { className: "font-mono" }, diceText);
    }

    // For advantage/disadvantage, combine all dice and mark dropped ones
    const allDice = [...rollEntry.dice, ...(rollEntry.droppedDice || [])];
    const droppedSet = new Set((rollEntry.droppedDice || []).map((d) => `${d.result}-${d.type}`));

    const diceElements = allDice.map((d, index) => {
      const result = `${d.result}${d.isCritical ? "*" : ""}`;
      const diceKey = `${d.result}-${d.type}`;
      const isDropped = droppedSet.has(diceKey);

      return createElement(
        "span",
        {
          key: index,
          className: isDropped ? "line-through text-gray-500" : "",
        },
        result + (index < allDice.length - 1 ? " " : ""),
      );
    });

    return createElement("span", { className: "font-mono" }, ...diceElements);
  }

  private showToastForLogEntry(entry: LogEntry): void {
    const { description } = entry;

    switch (entry.type) {
      case "roll":
        const rollEntry = entry as DiceRollEntry;
        const modifierText =
          rollEntry.modifier !== 0
            ? ` ${rollEntry.modifier >= 0 ? "+" : ""}${rollEntry.modifier}`
            : "";

        const detailedComponent = createElement(
          "div",
          { className: "font-mono" },
          `${rollEntry.rollExpression}: [`,
          this.createDiceDisplayComponent(rollEntry),
          `]${modifierText} = ${rollEntry.total}`,
        );

        if (rollEntry.isMiss) {
          toast.error(`${description}: MISS`, { description: detailedComponent });
        } else if (rollEntry.criticalHits && rollEntry.criticalHits > 0) {
          const critComponent = createElement(
            "div",
            {},
            detailedComponent,
            createElement(
              "div",
              { className: "text-yellow-600 font-semibold" },
              ` (${rollEntry.criticalHits} crit${rollEntry.criticalHits > 1 ? "s" : ""}!)`,
            ),
          );
          toast.success(`${description}: ${rollEntry.total}`, { description: critComponent });
        } else {
          toast.info(`${description}: ${rollEntry.total}`, { description: detailedComponent });
        }
        break;

      case "damage":
        toast.error(description);
        break;

      case "healing":
        toast.success(description);
        break;

      case "temp_hp":
        toast.info(description);
        break;

      case "initiative":
        toast.info(description);
        break;

      case "ability_usage":
        toast.info(description);
        break;

      case "safe_rest":
        toast.success(description);
        break;

      case "resource":
        const resourceEntry = entry as ResourceUsageEntry;
        if (resourceEntry.action === "spent") {
          toast.warning(description);
        } else {
          toast.success(description);
        }
        break;

      case "spell_cast":
        toast.info(description);
        break;

      default:
        toast(description);
    }
  }

  async clearLogEntries(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  // Helper methods to create specific log entries
  createDiceRollEntry(
    dice: any[],
    droppedDice: any[] | undefined,
    modifier: number,
    total: number,
    description: string,
    rollExpression: string,
    advantageLevel?: number,
    isMiss?: boolean,
    criticalHits?: number,
  ): DiceRollEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "roll",
      dice,
      droppedDice: droppedDice?.length ? droppedDice : undefined,
      modifier,
      total,
      description,
      rollExpression,
      advantageLevel: advantageLevel !== 0 ? advantageLevel : undefined,
      isMiss,
      criticalHits: criticalHits && criticalHits > 0 ? criticalHits : undefined,
    };
  }

  createDamageEntry(amount: number, targetType: "hp" | "temp_hp" = "hp"): DamageEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "damage",
      description: `Took ${amount} damage${targetType === "temp_hp" ? " (temporary HP)" : ""}`,
      amount,
      targetType,
    };
  }

  createHealingEntry(amount: number): HealingEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "healing",
      description: `Healed ${amount} HP`,
      amount,
    };
  }

  createTempHPEntry(amount: number, previous?: number): TempHPEntry {
    const description =
      previous !== undefined
        ? `Gained ${amount} temporary HP (replaced ${previous})`
        : `Gained ${amount} temporary HP`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "temp_hp",
      description,
      amount,
      previous,
    };
  }

  createInitiativeEntry(total: number, actionsGranted: number): InitiativeEntry {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "initiative",
      description: `Initiative ${total} - Combat started with ${actionsGranted} actions`,
      total,
      actionsGranted,
    };
  }

  createAbilityUsageEntry(
    abilityName: string,
    frequency: "per_turn" | "per_encounter" | "per_safe_rest" | "at_will",
    usesRemaining: number,
    maxUses: number,
  ): AbilityUsageEntry {
    const frequencyText =
      frequency === "per_turn"
        ? "per turn"
        : frequency === "per_encounter"
          ? "per encounter"
          : frequency === "per_safe_rest"
            ? "per safe rest"
            : "at will";
    const usageText =
      frequency === "at_will"
        ? `Used ${abilityName} (${frequencyText})`
        : `Used ${abilityName} (${frequencyText}) - ${usesRemaining}/${maxUses} remaining`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "ability_usage",
      description: usageText,
      abilityName,
      frequency,
      usesRemaining,
      maxUses,
    };
  }

  createSafeRestEntry(
    healingAmount: number,
    hitDiceRestored: number,
    woundsRemoved: number,
    abilitiesReset: number,
  ): SafeRestEntry {
    const parts: string[] = [];
    if (healingAmount > 0) parts.push(`restored ${healingAmount} HP`);
    if (hitDiceRestored > 0) parts.push(`restored ${hitDiceRestored} hit dice`);
    if (woundsRemoved > 0)
      parts.push(`removed ${woundsRemoved} wound${woundsRemoved !== 1 ? "s" : ""}`);
    if (abilitiesReset > 0) parts.push(`reset ${abilitiesReset} abilities`);

    const description =
      parts.length > 0 ? `Safe Rest completed - ${parts.join(", ")}` : "Safe Rest completed";

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "safe_rest",
      description,
      healingAmount,
      hitDiceRestored,
      woundsRemoved,
      abilitiesReset,
    };
  }

  createCatchBreathEntry(
    hitDiceSpent: number,
    healingAmount: number,
    abilitiesReset: number,
  ): CatchBreathEntry {
    const parts: string[] = [];
    if (hitDiceSpent > 0) parts.push(`spent ${hitDiceSpent} hit dice`);
    if (healingAmount > 0) parts.push(`restored ${healingAmount} HP`);
    if (abilitiesReset > 0) parts.push(`reset ${abilitiesReset} abilities`);

    const description =
      parts.length > 0 ? `Catch Breath completed - ${parts.join(", ")}` : "Catch Breath completed";

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "catch_breath",
      description,
      hitDiceSpent,
      healingAmount,
      abilitiesReset,
    };
  }

  createMakeCampEntry(
    healingAmount: number,
    hitDiceRestored: number,
    abilitiesReset: number,
  ): MakeCampEntry {
    const parts: string[] = [];
    if (healingAmount > 0) parts.push(`restored ${healingAmount} HP`);
    if (hitDiceRestored > 0) parts.push(`restored ${hitDiceRestored} hit dice`);
    if (abilitiesReset > 0) parts.push(`reset ${abilitiesReset} abilities`);

    const description =
      parts.length > 0 ? `Make Camp completed - ${parts.join(", ")}` : "Make Camp completed";

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "make_camp",
      description,
      healingAmount,
      hitDiceRestored,
      abilitiesReset,
    };
  }

  createResourceEntry(
    resourceId: string,
    amount: number,
    action: "spent" | "restored",
    currentAmount: number,
    maxAmount: number,
  ): ResourceUsageEntry {
    const description =
      action === "spent"
        ? `Spent ${amount} ${resourceId} (${currentAmount}/${maxAmount} remaining)`
        : `Restored ${amount} ${resourceId} (${currentAmount}/${maxAmount} current)`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "resource",
      description,
      resourceId,
      resourceName: resourceId, // Will be updated by caller if needed
      amount,
      action,
      currentAmount,
      maxAmount,
    };
  }

  createSpellCastEntry(
    spellName: string,
    school: string,
    tier: number,
    actionCost: number,
    resourceCost?: {
      resourceId: string;
      resourceName: string;
      amount: number;
    },
  ): SpellCastEntry {
    const resourceText = resourceCost
      ? ` (cost: ${resourceCost.amount} ${resourceCost.resourceName})`
      : "";
    const actionText =
      actionCost === 0 ? "bonus action" : `${actionCost} action${actionCost > 1 ? "s" : ""}`;
    const description = `Cast ${spellName} (${school}, tier ${tier}, ${actionText})${resourceText}`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "spell_cast",
      description,
      spellName,
      school,
      tier,
      resourceCost,
      actionCost,
    };
  }
}

export const activityLogService = new ActivityLogService();
