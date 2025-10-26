import { SpellAbilityDefinition } from "@/lib/schemas/abilities";

export type CastingMethodType = "mana";

export interface CastingResult {
  success: boolean;
  error?: string;
  damage?: number;
  consequences?: string[];
  effectiveSpellTier?: number;
}

export interface CastingCost {
  canAfford: boolean;
  description: string;
  warningMessage?: string;
  riskLevel: "none" | "low" | "medium" | "high";
}

// Mana-specific casting options
export interface ManaCastingOptions {
  methodType: "mana";
  targetTier: number; // The tier to cast the spell at
}

// Union type for all casting options (only mana for now)
export type SpellCastingOptions = ManaCastingOptions;

export interface CastingMethodContext {
  spell: SpellAbilityDefinition;
  options: SpellCastingOptions;
}

export interface CastingMethodHandler {
  readonly methodType: CastingMethodType;

  /**
   * Check if this casting method is available for the given spell and options
   */
  isAvailable(context: CastingMethodContext): boolean;

  /**
   * Calculate the cost and risk of using this casting method
   */
  calculateCost(context: CastingMethodContext): CastingCost;

  /**
   * Execute the spell casting using this method
   * Responsible for:
   * - Deducting resources (via CharacterService.spendResource)
   * - Deducting actions (via CharacterService.updateActionTracker)
   * - Applying effects (via EffectService)
   * - Logging spell cast (via ActivityLogService)
   */
  cast(context: CastingMethodContext): Promise<CastingResult>;

  /**
   * Get a human-readable description of this casting method
   */
  getDescription(): string;

  /**
   * Get display name for UI buttons
   */
  getDisplayName(): string;
}
