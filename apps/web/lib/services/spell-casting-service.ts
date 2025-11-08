import { SpellAbilityDefinition } from "@/lib/schemas/abilities";

// Import casting method handlers
import { ManaCastingHandler } from "./casting-methods/mana-casting";
import { SlotCastingHandler } from "./casting-methods/slot-casting";
import { getCharacterService } from "./service-factory";
import {
  CastingCost,
  CastingMethodContext,
  CastingMethodHandler,
  CastingMethodType,
  CastingResult,
  ManaCastingOptions,
  SpellCastingOptions,
} from "./spell-casting-types";

export class SpellCastingService {
  private static instance: SpellCastingService;
  private handlers: Map<CastingMethodType, CastingMethodHandler> = new Map();

  private constructor() {
    // Register all casting method handlers
    this.registerHandler(new ManaCastingHandler());
    this.registerHandler(new SlotCastingHandler());
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
   * Main entry point: Cast a spell by ID with method-specific options
   * This orchestrates the entire spell casting process
   */
  async castSpell(spellId: string, options: SpellCastingOptions): Promise<CastingResult> {
    // 1. Get the spell from character service
    const characterService = getCharacterService();
    const spell = characterService
      .getAbilities()
      .find((a) => a.id === spellId && a.type === "spell") as SpellAbilityDefinition | undefined;

    if (!spell) {
      return {
        success: false,
        error: `Spell ${spellId} not found`,
      };
    }

    // 2. Get the appropriate handler based on options
    const handler = this.handlers.get(options.methodType);
    if (!handler) {
      return {
        success: false,
        error: `Unknown casting method: ${options.methodType}`,
      };
    }

    // 3. Create context for the handler
    const context: CastingMethodContext = {
      spell,
      options,
    };

    // 4. Check if the method is available
    if (!handler.isAvailable(context)) {
      return {
        success: false,
        error: `${handler.getDisplayName()} is not available for this spell`,
      };
    }

    // 5. Check if the character can afford the cost
    const cost = handler.calculateCost(context);
    if (!cost.canAfford) {
      return {
        success: false,
        error: cost.warningMessage || `Cannot afford to cast using ${handler.getDisplayName()}`,
      };
    }

    // 6. Delegate to handler to execute the casting
    // Handler will:
    // - Deduct resources/actions
    // - Apply effects
    // - Log the spell cast
    return await handler.cast(context);
  }

  /**
   * Get all available casting methods for a spell
   */
  getAvailableMethods(
    spellId: string,
    options?: Partial<SpellCastingOptions>,
  ): CastingMethodType[] {
    const characterService = getCharacterService();
    const spell = characterService
      .getAbilities()
      .find((a) => a.id === spellId && a.type === "spell") as SpellAbilityDefinition | undefined;

    if (!spell) return [];

    const availableMethods: CastingMethodType[] = [];

    for (const [methodType, handler] of this.handlers) {
      // Create a minimal context for availability check
      const testOptions: SpellCastingOptions =
        options?.methodType === methodType
          ? (options as SpellCastingOptions)
          : this.getDefaultOptions(methodType, spell);

      const context: CastingMethodContext = {
        spell,
        options: testOptions,
      };

      if (handler.isAvailable(context)) {
        availableMethods.push(methodType);
      }
    }

    return availableMethods;
  }

  /**
   * Calculate the cost of casting a spell with specific options
   */
  calculateCastingCost(spellId: string, options: SpellCastingOptions): CastingCost | null {
    const characterService = getCharacterService();
    const spell = characterService
      .getAbilities()
      .find((a) => a.id === spellId && a.type === "spell") as SpellAbilityDefinition | undefined;

    if (!spell) return null;

    const handler = this.handlers.get(options.methodType);
    if (!handler) return null;

    const context: CastingMethodContext = { spell, options };

    // Check if the method is available before calculating cost
    if (!handler.isAvailable(context)) {
      return null;
    }

    return handler.calculateCost(context);
  }

  /**
   * Check if a spell can be upcast with the given casting method
   */
  canUpcastSpell(spellId: string, options: SpellCastingOptions): boolean {
    const characterService = getCharacterService();
    const spell = characterService
      .getAbilities()
      .find((a) => a.id === spellId && a.type === "spell") as SpellAbilityDefinition | undefined;

    if (!spell) return false;

    const handler = this.handlers.get(options.methodType);
    if (!handler) return false;

    const context: CastingMethodContext = { spell, options };
    return handler.canUpcast(context);
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

  /**
   * Helper to create default options for a casting method
   */
  private getDefaultOptions(
    methodType: CastingMethodType,
    spell: SpellAbilityDefinition,
  ): SpellCastingOptions {
    switch (methodType) {
      case "mana":
        return {
          methodType: "mana",
          targetTier: spell.tier,
        } as ManaCastingOptions;
      default:
        throw new Error(`No default options for method: ${methodType}`);
    }
  }
}
