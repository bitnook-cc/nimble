import { realtime } from "@nimble/shared";

import { gameConfig } from "../config/game-config";
import { logEntrySchema } from "../schemas/activity-log";
import {
  AbilityUsageEntry,
  CatchBreathEntry,
  DamageEntry,
  DicePoolEntry,
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
import { ResourceDefinition } from "../schemas/resources";
import { DiceFormulaResult } from "./dice-service";
import { getActivitySharingService } from "./service-factory";
import { getCharacterService } from "./service-factory";
import { toastService } from "./toast-service";

type LogChangeListener = (entries: LogEntry[]) => void;

export class ActivityLogService {
  private readonly storageKey = "nimble-navigator-activity-log";
  private readonly maxEntries = gameConfig.storage.maxRollHistory;
  private listeners: Set<LogChangeListener> = new Set();
  private cachedEntries: LogEntry[] | null = null;

  async getLogEntries(): Promise<LogEntry[]> {
    // Return cached entries if available
    if (this.cachedEntries) {
      return this.cachedEntries;
    }

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      this.cachedEntries = [];
      return this.cachedEntries;
    }

    try {
      const parsed = JSON.parse(stored);
      const entries = parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      // Validate each entry and filter out invalid ones
      const validEntries = entries.filter((entry: any) => {
        try {
          logEntrySchema.parse(entry);
          return true;
        } catch {
          console.warn("Invalid log entry found and removed:", entry);
          return false;
        }
      });

      if (validEntries.length !== entries.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(validEntries));
      }

      this.cachedEntries = validEntries;
      return validEntries;
    } catch {
      this.cachedEntries = [];
      return this.cachedEntries;
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
    
    // Update cache and notify listeners
    this.cachedEntries = updatedEntries;
    this.notifyListeners();

    // Auto-share to session if in one and entry matches session character
    const currentCharacter = this.getCurrentCharacter();
    const activitySharingService = getActivitySharingService();
    if (
      activitySharingService.isInSession() &&
      currentCharacter &&
      newEntry.characterId === activitySharingService.getCurrentCharacterId()
    ) {
      try {
        const sessionId = activitySharingService.getCurrentSessionId();
        const characterId = activitySharingService.getCurrentCharacterId();
        if (sessionId && characterId) {
          await activitySharingService.shareActivity(sessionId, {
            characterId,
            logEntry: newEntry,
          } satisfies realtime.ShareActivityRequest);
        }
      } catch (error) {
        console.warn("Failed to auto-share activity log entry:", error);
      }
    }

    // Show toast notification
    this.showToastForLogEntry(newEntry);
  }

  private showToastForLogEntry(entry: LogEntry): void {
    const { description } = entry;

    switch (entry.type) {
      case "roll":
        const rollEntry = entry as DiceRollEntry;
        // Use toast service with dice data for consistent display
        toastService.showDiceRoll(description, rollEntry.diceData);
        break;

      case "damage":
        toastService.showError(description);
        break;

      case "healing":
        toastService.showSuccess(description);
        break;

      case "temp_hp":
        toastService.showInfo(description);
        break;

      case "initiative":
        const initiativeEntry = entry as InitiativeEntry;
        if (initiativeEntry.diceData) {
          const actionsText = `${initiativeEntry.actionsGranted} ${initiativeEntry.actionsGranted === 1 ? "action" : "actions"}`;
          toastService.showDiceRoll(`Initiative Roll (${actionsText})`, initiativeEntry.diceData);
        } else {
          toastService.showInfo(description);
        }
        break;

      case "ability_usage":
        toastService.showInfo(description);
        break;

      case "safe_rest":
        toastService.showSuccess(description);
        break;

      case "resource":
        const resourceEntry = entry as ResourceUsageEntry;
        if (resourceEntry.action === "spent") {
          toastService.showWarning(description);
        } else {
          toastService.showSuccess(description);
        }
        break;

      case "spell_cast":
        toastService.showInfo(description);
        break;

      default:
        toastService.showInfo(description);
    }
  }

  async clearLogEntries(): Promise<void> {
    localStorage.removeItem(this.storageKey);
    this.cachedEntries = [];
    this.notifyListeners();
  }

  // Subscription methods
  subscribe(listener: LogChangeListener): () => void {
    this.listeners.add(listener);
    // Provide initial state
    if (this.cachedEntries) {
      listener(this.cachedEntries);
    } else {
      // Load and provide initial state
      this.getLogEntries().then(entries => listener(entries));
    }
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    if (this.cachedEntries) {
      this.listeners.forEach(listener => listener(this.cachedEntries!));
    }
  }

  // Get current character from character service
  private getCurrentCharacter() {
    const characterService = getCharacterService();
    return characterService.getCurrentCharacter();
  }

  // Helper methods to create specific log entries
  createDiceRollEntry(
    description: string,
    rollResult: DiceFormulaResult,
    advantageLevel?: number,
  ): DiceRollEntry {
    if (!rollResult.diceData) {
      throw new Error("DiceFormulaResult must include diceData");
    }

    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    const entry: DiceRollEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "roll",
      description,
      characterId: currentCharacter.id,
      rollExpression: rollResult.substitutedFormula || rollResult.formula,
      advantageLevel: advantageLevel !== 0 ? advantageLevel : undefined,
      diceData: rollResult.diceData,
    };

    return entry;
  }

  createDamageEntry(amount: number, targetType: "hp" | "temp_hp" = "hp"): DamageEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "damage",
      description: `Took ${amount} damage${targetType === "temp_hp" ? " (temporary HP)" : ""}`,
      characterId: currentCharacter.id,
      amount,
      targetType,
    };
  }

  createHealingEntry(amount: number): HealingEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "healing",
      description: `Healed ${amount} HP`,
      characterId: currentCharacter.id,
      amount,
    };
  }

  createTempHPEntry(amount: number, previous?: number): TempHPEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    const description =
      previous !== undefined
        ? `Gained ${amount} temporary HP (replaced ${previous})`
        : `Gained ${amount} temporary HP`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "temp_hp",
      description,
      characterId: currentCharacter.id,
      amount,
      previous,
    };
  }

  createInitiativeEntry(
    actionsGranted: number,
    rollExpression?: string,
    diceData?: any,
  ): InitiativeEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "initiative",
      description: `Initiative roll`,
      characterId: currentCharacter.id,
      actionsGranted,
      rollExpression,
      diceData,
    };
  }

  createAbilityUsageEntry(
    abilityName: string,
    frequency: "per_turn" | "per_encounter" | "per_safe_rest" | "at_will",
    usesRemaining: number,
    maxUses: number,
  ): AbilityUsageEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

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
      characterId: currentCharacter.id,
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
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

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
      characterId: currentCharacter.id,
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
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

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
      characterId: currentCharacter.id,
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
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

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
      characterId: currentCharacter.id,
      healingAmount,
      hitDiceRestored,
      abilitiesReset,
    };
  }

  createResourceEntry(
    resourceDefinition: ResourceDefinition,
    amount: number,
    action: "spent" | "restored",
    currentAmount: number,
    maxAmount: number,
  ): ResourceUsageEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    const description =
      action === "spent"
        ? `Spent ${amount} ${resourceDefinition.name} (${currentAmount}/${maxAmount} remaining)`
        : `Restored ${amount} ${resourceDefinition.name} (${currentAmount}/${maxAmount} current)`;

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "resource",
      description,
      characterId: currentCharacter.id,
      resourceId: resourceDefinition.id,
      resourceName: resourceDefinition.name,
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
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

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
      characterId: currentCharacter.id,
      spellName,
      school,
      tier,
      resourceCost,
      actionCost,
    };
  }

  createDicePoolEntry(
    subtype: "add" | "use" | "reset",
    poolName: string,
    value?: number,
    diceSize?: number,
    poolSize?: number,
  ): DicePoolEntry {
    const currentCharacter = this.getCurrentCharacter();
    if (!currentCharacter) {
      throw new Error("No current character selected for log entry creation");
    }

    let description: string;
    switch (subtype) {
      case "add":
        description =
          diceSize && value !== undefined
            ? `Added d${diceSize} (${value}) to ${poolName}`
            : `Added die to ${poolName}`;
        break;
      case "use":
        description =
          value !== undefined ? `Used ${value} from ${poolName}` : `Used die from ${poolName}`;
        break;
      case "reset":
        description = `Reset ${poolName}`;
        break;
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "dice-pool",
      description,
      characterId: currentCharacter.id,
      subtype,
      poolName,
      diceSize,
      value,
      poolSize,
    };
  }
}

export const activityLogService = new ActivityLogService();
