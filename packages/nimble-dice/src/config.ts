/**
 * Configuration for the Nimble dice rolling engine
 */
export const diceConfig = {
  /**
   * Maximum number of dice that can be rolled in a single dice notation.
   * This prevents performance issues and abuse from expressions like "9999d20".
   * Note: This applies to the base dice count, not including advantage/disadvantage extras.
   */
  maxDiceCount: 100,

  /**
   * Maximum number of consecutive critical explosions allowed.
   * Prevents infinite loops when rolling with exploding criticals.
   */
  maxCriticalExplosions: 10,

  /**
   * Valid dice types that can be rolled
   */
  validDiceTypes: [4, 6, 8, 10, 12, 20, 100] as const,

  /**
   * Double-digit dice types (roll two dice for tens and ones)
   */
  doubleDigitDiceTypes: [44, 66, 88] as const,
};

export type ValidDiceType = (typeof diceConfig.validDiceTypes)[number];
export type DoubleDigitDiceType = (typeof diceConfig.doubleDigitDiceTypes)[number];