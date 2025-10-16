import { SpellAbilityDefinition } from "@/lib/schemas/abilities";

// Import casting method handlers
import { ManaCastingHandler } from "./casting-methods/mana-casting";
import {
  CastingCost,
  CastingMethodContext,
  CastingMethodHandler,
  CastingMethodType,
  CastingResult,
  SpellCastingOptions,
} from "./spell-casting-types";

export class SpellCastingService {
  private static instance: SpellCastingService;
  private handlers: Map<CastingMethodType, CastingMethodHandler> = new Map();

  private constructor() {
    // Register all casting method handlers
    this.registerHandler(new ManaCastingHandler());
  }

  static getInstance(): SpellCastingService {
    if (!SpellCastingService.instance) {
      SpellCastingService.instance = new SpellCastingService();
    }
    return SpellCastingService.instance;
  }

  private registerHandler(handler: CastingMethodHandler) {
    this.handlers.set(handler.methodType, handler);
  }

  /**
   * Get all available casting methods for a spell
   */
  getAvailableMethods(spell: SpellAbilityDefinition, castingTier?: number): CastingMethodType[] {
    const actualCastingTier = castingTier ?? spell.tier;
    const context: CastingMethodContext = { spell, castingTier: actualCastingTier };
    const availableMethods: CastingMethodType[] = [];

    for (const [methodType, handler] of this.handlers) {
      if (handler.isAvailable(context)) {
        availableMethods.push(methodType);
      }
    }

    return availableMethods;
  }

  /**
   * Calculate the cost of casting a spell with a specific method
   */
  calculateCastingCost(
    spell: SpellAbilityDefinition,
    methodType: CastingMethodType,
    castingTier?: number,
  ): CastingCost {
    const handler = this.handlers.get(methodType);
    if (!handler) {
      return {
        canAfford: false,
        description: "Unknown casting method",
        riskLevel: "none",
      };
    }

    const actualCastingTier = castingTier ?? spell.tier;
    const context: CastingMethodContext = { spell, castingTier: actualCastingTier };
    return handler.calculateCost(context);
  }

  /**
   * Cast a spell using the specified method
   */
  async castSpell(
    spell: SpellAbilityDefinition,
    options: SpellCastingOptions,
  ): Promise<CastingResult> {
    const handler = this.handlers.get(options.methodType);
    if (!handler) {
      return {
        success: false,
        error: "Unknown casting method",
      };
    }

    const actualCastingTier = options.castingTier ?? spell.tier;
    const context: CastingMethodContext = {
      spell,
      castingTier: actualCastingTier,
    };

    // Check if the method is available
    if (!handler.isAvailable(context)) {
      return {
        success: false,
        error: `${handler.getDisplayName()} is not available`,
      };
    }

    // Check if the character can afford the cost
    const cost = handler.calculateCost(context);
    if (!cost.canAfford) {
      return {
        success: false,
        error: `Cannot afford to cast using ${handler.getDisplayName()}: ${cost.description}`,
      };
    }

    // Execute the casting
    return await handler.cast(context);
  }

  /**
   * Get display information for a casting method
   */
  getMethodInfo(
    methodType: CastingMethodType,
  ): { displayName: string; description: string } | null {
    const handler = this.handlers.get(methodType);
    if (!handler) return null;

    return {
      displayName: handler.getDisplayName(),
      description: handler.getDescription(),
    };
  }

  /**
   * Get all registered casting method types
   */
  getAllMethodTypes(): CastingMethodType[] {
    return Array.from(this.handlers.keys());
  }
}
