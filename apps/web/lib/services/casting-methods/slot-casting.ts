import { activityLogService } from "@/lib/services/activity-log-service";
import { diceService } from "@/lib/services/dice-service";
import { getCharacterService } from "@/lib/services/service-factory";

import {
  CastingCost,
  CastingMethodContext,
  CastingResult,
  SlotCastingOptions,
} from "../spell-casting-types";
import { BaseCastingHandler } from "./base-casting-handler";

export class SlotCastingHandler extends BaseCastingHandler {
  readonly methodType = "slot" as const;
  private readonly resourceId = "pilfered_power";

  isAvailable(context: CastingMethodContext): boolean {
    const { spell, options } = context;

    // Type guard for slot options
    if (options.methodType !== "slot") return false;

    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();
    if (!character) return false;

    // Check if character has spell tier access
    const maxTier = characterService.getSpellTierAccess();
    if (maxTier < spell.tier) {
      return false;
    }

    // Cantrips (tier 0) don't require pilfered power resource
    if (spell.tier === 0) {
      return true;
    }

    // For tiered spells, check if character has the pilfered power resource
    const resourceDef = character._resourceDefinitions.find((r) => r.id === this.resourceId);
    return !!resourceDef;
  }

  calculateCost(context: CastingMethodContext): CastingCost {
    const { spell, options } = context;

    if (options.methodType !== "slot") {
      return {
        canAfford: false,
        description: "Invalid casting method",
        riskLevel: "none",
      };
    }

    const characterService = getCharacterService();
    const character = characterService.getCurrentCharacter();

    if (!character) {
      return {
        canAfford: false,
        description: "No character loaded",
        riskLevel: "none",
      };
    }

    // Cantrips are always free
    if (spell.tier === 0) {
      return {
        canAfford: true,
        description: "0 slots (cantrip)",
        riskLevel: "none",
      };
    }

    // Find the pilfered power resource definition for tiered spells
    const resourceDef = character._resourceDefinitions.find((r) => r.id === this.resourceId);

    if (!resourceDef) {
      return {
        canAfford: false,
        description: "Missing pilfered power resource",
        warningMessage: "Character does not have the pilfered power resource",
        riskLevel: "none",
      };
    }

    // Slot casting always costs 1 slot for tiered spells
    const currentSlots = characterService.getResourceValue(this.resourceId);
    const canAfford = currentSlots > 0;

    const effectiveTier = characterService.getSpellTierAccess();

    const description = canAfford ? `1 Slot (cast at tier ${effectiveTier})` : "No slots available";

    const warningMessage = canAfford ? undefined : `No pilfered power slots remaining`;

    // Risk level is always none for now (damage mechanic handled later)
    return {
      canAfford,
      description,
      warningMessage,
      riskLevel: "none",
      resourceCost: {
        resourceId: this.resourceId,
        resourceName: resourceDef.name,
        amount: 1,
      },
    };
  }

  async cast(context: CastingMethodContext): Promise<CastingResult> {
    const { spell, options } = context;

    if (options.methodType !== "slot") {
      return {
        success: false,
        error: "Invalid casting method for slot handler",
      };
    }

    const characterService = getCharacterService();

    try {
      const character = characterService.getCurrentCharacter();
      if (!character) {
        return {
          success: false,
          error: "No character loaded",
        };
      }

      // Check if we can afford the cast
      const cost = this.calculateCost(context);
      if (!cost.canAfford) {
        return {
          success: false,
          error: "Cannot afford to cast spell",
        };
      }

      // 1. Deduct action cost (if in encounter)
      const actionCost = spell.actionCost || 0;
      if (actionCost > 0 && character.inEncounter) {
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

      // 2. Spend slot for tiered spells (not cantrips)
      let resourceDef;
      if (spell.tier > 0) {
        resourceDef = character._resourceDefinitions.find((r) => r.id === this.resourceId);

        if (!resourceDef) {
          return {
            success: false,
            error: "Character does not have the pilfered power resource",
          };
        }

        await characterService.spendResource(this.resourceId, 1);
      }

      // 3. Determine effective casting tier
      // Cantrips are always tier 0, tiered spells use highest unlocked tier
      const effectiveTier = spell.tier === 0 ? 0 : characterService.getSpellTierAccess();

      // 4. Roll dice if spell has a dice formula
      if (spell.diceFormula) {
        const slotOptions = options as SlotCastingOptions;
        const advantageLevel = slotOptions.advantageLevel ?? 0;
        const rollResult = diceService.evaluateDiceFormula(spell.diceFormula, {
          advantageLevel,
          allowCriticals: true,
          allowFumbles: true,
        });

        const rollLogEntry = activityLogService.createDiceRollEntry(
          `${spell.name} (Spell)`,
          rollResult,
          advantageLevel,
        );
        await activityLogService.addLogEntry(rollLogEntry);
      }

      // 5. Apply effects (if any)
      if (spell.effects && spell.effects.length > 0) {
        const { effectService } = await import("@/lib/services/effect-service");
        await effectService.applyEffects(spell.effects, spell.name);
      }

      // 6. Log the spell cast
      const slotResource =
        spell.tier > 0 && resourceDef
          ? {
              resourceId: this.resourceId,
              resourceName: resourceDef.name,
              amount: 1,
            }
          : undefined;

      const logEntry = activityLogService.createSpellCastEntry(
        spell.name,
        spell.school,
        effectiveTier,
        actionCost,
        slotResource,
      );

      await activityLogService.addLogEntry(logEntry);

      // 7. Return success
      return {
        success: true,
        effectiveSpellTier: effectiveTier,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cast spell",
      };
    }
  }

  getDescription(): string {
    return "Channel power from your patron to cast spells at maximum tier. Limited uses before consequences.";
  }

  getDisplayName(): string {
    return "Slot Casting";
  }
}
