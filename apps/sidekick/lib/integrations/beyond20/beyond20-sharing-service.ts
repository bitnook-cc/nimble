/**
 * Beyond20 Sharing Service
 *
 * Handles sending dice rolls from Sidekick to Beyond20 VTT integration.
 * Converts activity log entries to Beyond20 roll request format.
 */
import { DiceRollEntry, InitiativeEntry, LogEntry } from "@/lib/schemas/activity-log";
import { Character } from "@/lib/schemas/character";
import { settingsService } from "@/lib/services/settings-service";

import { beyond20DetectionService } from "./beyond20-detection-service";
import { Beyond20RollRequest } from "./types";

export class Beyond20SharingService {
  /**
   * Send a dice roll to Beyond20 if enabled and installed
   */
  public async sendRoll(entry: LogEntry, character: Character): Promise<void> {
    // Check if Beyond20 integration should be active
    const shouldShare = await this.shouldShare();
    if (!shouldShare) {
      return;
    }

    // Convert the entry to Beyond20 format
    const rollRequest = this.convertToRollRequest(entry, character);
    if (!rollRequest) {
      return; // Entry type not supported for VTT sharing
    }

    // Dispatch Beyond20 event
    this.dispatchBeyond20Event(rollRequest);
  }

  /**
   * Activate the Beyond20 icon in the browser extension
   */
  public activateIcon(): void {
    if (!beyond20DetectionService.getIsInstalled()) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    try {
      // Send activate event to Beyond20
      const event = new CustomEvent("Beyond20_Activate_Icon");
      document.dispatchEvent(event);
    } catch (error) {
      console.warn("Failed to activate Beyond20 icon:", error);
    }
  }

  /**
   * Check if we should share rolls to Beyond20
   */
  private async shouldShare(): Promise<boolean> {
    // Must be installed
    if (!beyond20DetectionService.getIsInstalled()) {
      return false;
    }

    // Must be enabled in settings
    const settings = await settingsService.getSettings();
    return settings.beyond20Enabled === true;
  }

  /**
   * Convert activity log entry to Beyond20 roll request
   */
  private convertToRollRequest(entry: LogEntry, character: Character): Beyond20RollRequest | null {
    switch (entry.type) {
      case "roll":
        return this.convertDiceRoll(entry, character);
      case "initiative":
        return this.convertInitiativeRoll(entry, character);
      default:
        return null; // Other entry types not supported for VTT sharing
    }
  }

  /**
   * Convert a dice roll entry to Beyond20 format
   */
  private convertDiceRoll(entry: DiceRollEntry, character: Character): Beyond20RollRequest {
    const { diceResult, description, advantageLevel } = entry;

    // Determine advantage state (0 = normal, 1 = advantage, 2 = disadvantage)
    let advantage = 0;
    if (advantageLevel !== undefined) {
      advantage = advantageLevel > 0 ? 1 : advantageLevel < 0 ? 2 : 0;
    }

    return {
      action: "roll",
      type: "custom",
      character: {
        name: character.name,
        level: character.level,
      },
      name: description,
      roll: diceResult.total,
      formula: diceResult.substitutedFormula || diceResult.formula,
      advantage,
      d20: this.isD20Roll(diceResult.formula),
    };
  }

  /**
   * Convert an initiative roll to Beyond20 format
   */
  private convertInitiativeRoll(
    entry: InitiativeEntry,
    character: Character,
  ): Beyond20RollRequest | null {
    if (!entry.diceResult) {
      return null; // No dice result, can't send to VTT
    }

    const { diceResult } = entry;

    return {
      action: "roll",
      type: "initiative",
      character: {
        name: character.name,
        level: character.level,
      },
      roll: diceResult.total,
      formula: diceResult.substitutedFormula || diceResult.formula,
      advantage: 0,
      d20: true,
    };
  }

  /**
   * Check if a formula contains a d20 roll
   */
  private isD20Roll(formula: string): boolean {
    return /d20\b/i.test(formula);
  }

  /**
   * Dispatch Beyond20 SendMessage event
   */
  private dispatchBeyond20Event(request: Beyond20RollRequest): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const event = new CustomEvent("Beyond20_SendMessage", {
        detail: [request],
      });
      document.dispatchEvent(event);
      console.log("Sent roll to Beyond20:", request);
    } catch (error) {
      console.error("Failed to send roll to Beyond20:", error);
    }
  }
}

// Singleton instance
export const beyond20SharingService = new Beyond20SharingService();
