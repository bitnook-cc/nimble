import { getCharacterService } from "@/lib/services/service-factory";

import { CastingCost, CastingMethodContext, CastingResult } from "../spell-casting-types";
import { BaseCastingHandler } from "./base-casting-handler";

export class ManaCastingHandler extends BaseCastingHandler {
  readonly methodType = "mana" as const;

  isAvailable(context: CastingMethodContext): boolean {
    const { spell, castingTier } = context;
    const characterService = getCharacterService();

    // Check if character has spell tier access for the requested casting tier
    const maxTier = characterService.getSpellTierAccess();
    if (castingTier > maxTier) {
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
    const { spell, castingTier } = context;
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
    // Spell costs 1 mana per tier above its base tier
    const baseCost = spell.tier;
    const extraTiers = Math.max(0, castingTier - spell.tier);
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
    const { spell, castingTier } = context;
    const characterService = getCharacterService();

    // Handle cantrips (tier 0) - no resource consumption
    if (spell.tier === 0) {
      await this.logSpellUsage(spell, castingTier, 0);
      await this.applySpellEffects(spell);
      return {
        success: true,
        effectiveSpellTier: castingTier,
      };
    }

    // Check if we can afford the spell
    const cost = this.calculateCost(context);
    if (!cost.canAfford) {
      return {
        success: false,
        error: "Cannot afford to cast using Mana",
      };
    }

    try {
      // Calculate and spend mana
      const baseCost = spell.tier;
      const extraTiers = Math.max(0, castingTier - spell.tier);
      const totalCost = baseCost + extraTiers;

      await characterService.spendResource("mana", totalCost);

      // Log usage and apply effects
      await this.logSpellUsage(spell, castingTier, totalCost);
      await this.applySpellEffects(spell);

      return {
        success: true,
        effectiveSpellTier: castingTier,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cast spell",
      };
    }
  }

  private async logSpellUsage(spell: any, castingTier: number, manaCost: number): Promise<void> {
    // For now, skip the logging since logAbilityUsage is private
    // TODO: Consider making logAbilityUsage public or creating a public wrapper method
    // The spell casting will be logged at a higher level if needed
  }

  private async applySpellEffects(spell: any): Promise<void> {
    // Replicate effect application logic from performUseAbility
    if (spell.effects && spell.effects.length > 0) {
      const { effectService } = await import("@/lib/services/effect-service");
      await effectService.applyEffects(spell.effects, spell.name);
    }
  }

  getDescription(): string {
    return "Traditional spellcasting using your magical resources (mana). Safe and predictable.";
  }

  getDisplayName(): string {
    return "Mana";
  }
}
