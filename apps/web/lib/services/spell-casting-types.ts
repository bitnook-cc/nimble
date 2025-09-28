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

export interface CastingMethodContext {
  spell: SpellAbilityDefinition;
  castingTier: number;
}

export interface CastingMethodHandler {
  readonly methodType: CastingMethodType;

  /**
   * Check if this casting method is available for the given spell
   */
  isAvailable(context: CastingMethodContext): boolean;

  /**
   * Calculate the cost and risk of using this casting method
   */
  calculateCost(context: CastingMethodContext): CastingCost;

  /**
   * Execute the spell casting using this method
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

export interface SpellCastingOptions {
  methodType: CastingMethodType;
  castingTier?: number;
}
