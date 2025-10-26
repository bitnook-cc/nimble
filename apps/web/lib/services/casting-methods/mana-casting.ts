import { activityLogService } from "@/lib/services/activity-log-service";
import { getCharacterService } from "@/lib/services/service-factory";

import {
  CastingCost,
  CastingMethodContext,
  CastingResult,
  ManaCastingOptions,
} from "../spell-casting-types";
import { BaseCastingHandler } from "./base-casting-handler";

export class ManaCastingHandler extends BaseCastingHandler {
  readonly methodType = "mana" as const;

  isAvailable(context: CastingMethodContext): boolean {
    const { spell, options } = context;

    // Type guard for mana options
    if (options.methodType !== "mana") return false;

    const manaOptions = options as ManaCastingOptions;
    const characterService = getCharacterService();

    // Check if character has spell tier access for the requested casting tier
    const maxTier = characterService.getSpellTierAccess();
    if (manaOptions.targetTier > maxTier) {
      return false;
    }

    // Mana casting is available for:
    // 1. Cantrips (tier 0) - free casting
    // 2. Spells with mana resource costs
    if (spell.tier === 0) {
      return true;
    }

    return !!spell.resourceCost && spell.resourceCost.resourceId === "mana";
  }

  calculateCost(context: CastingMethodContext): CastingCost {
    const { spell, options } = context;

    if (options.methodType !== "mana") {
      return {
        canAfford: false,
        description: "Invalid casting method",
        riskLevel: "none",
      };
    }

    const manaOptions = options as ManaCastingOptions;
    const characterService = getCharacterService();

    // Handle cantrips (tier 0) - always free
    if (spell.tier === 0) {
      return {
        canAfford: true,
        description: "0 mana",
        riskLevel: "none",
      };
    }

    // Calculate mana cost: base spell tier + extra tiers = total mana cost
    // Each tier above base costs 1 additional mana
    const baseCost = spell.tier;
    const extraTiers = Math.max(0, manaOptions.targetTier - spell.tier);
    const totalCost = baseCost + extraTiers;

    // Check current mana
    const currentMana = characterService.getResourceValue("mana");
    const canAfford = currentMana >= totalCost;

    const description = `${totalCost} Mana`;
    const warningMessage = canAfford
      ? undefined
      : `Insufficient Mana (${currentMana}/${totalCost} required)`;

    return {
      canAfford,
      description,
      warningMessage,
      riskLevel: "none",
    };
  }

  async cast(context: CastingMethodContext): Promise<CastingResult> {
    const { spell, options } = context;

    if (options.methodType !== "mana") {
      return {
        success: false,
        error: "Invalid casting method for mana handler",
      };
    }

    const manaOptions = options as ManaCastingOptions;
    const characterService = getCharacterService();

    try {
      // 1. Deduct action cost (if in encounter)
      const actionCost = spell.actionCost || 0;
      if (actionCost > 0) {
        const character = characterService.getCurrentCharacter();
        if (character?.inEncounter) {
          // Check if enough actions available
          if (character.actionTracker.current < actionCost) {
            return {
              success: false,
              error: `Not enough actions (need ${actionCost}, have ${character.actionTracker.current})`,
            };
          }

          await characterService.updateActionTracker({
            ...character.actionTracker,
            current: character.actionTracker.current - actionCost,
          });
        }
      }

      // 2. Calculate and spend mana (if not cantrip)
      let manaCost = 0;
      if (spell.tier > 0) {
        const baseCost = spell.tier;
        const extraTiers = Math.max(0, manaOptions.targetTier - spell.tier);
        manaCost = baseCost + extraTiers;

        // Check if character can afford the mana cost
        const cost = this.calculateCost(context);
        if (!cost.canAfford) {
          return {
            success: false,
            error: "Cannot afford to cast using Mana",
          };
        }

        // Spend the mana
        await characterService.spendResource("mana", manaCost);
      }

      // 3. Apply effects (if any)
      if (spell.effects && spell.effects.length > 0) {
        const { effectService } = await import("@/lib/services/effect-service");
        await effectService.applyEffects(spell.effects, spell.name);
      }

      // 4. Log the spell cast
      const manaResource =
        manaCost > 0
          ? {
              resourceId: "mana",
              resourceName: "Mana",
              amount: manaCost,
            }
          : undefined;

      const logEntry = activityLogService.createSpellCastEntry(
        spell.name,
        spell.school,
        manaOptions.targetTier,
        actionCost,
        manaResource,
      );

      await activityLogService.addLogEntry(logEntry);

      // 5. Return success
      return {
        success: true,
        effectiveSpellTier: manaOptions.targetTier,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cast spell",
      };
    }
  }

  getDescription(): string {
    return "Traditional spellcasting using your magical resources (mana). Safe and predictable.";
  }

  getDisplayName(): string {
    return "Mana";
  }
}
