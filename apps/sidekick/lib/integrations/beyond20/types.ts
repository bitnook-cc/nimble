/**
 * Beyond20 Integration Types
 *
 * Types for integrating with the Beyond20 browser extension API.
 * See: https://beyond20.here-for-more.info/api.html
 */

export interface Beyond20Settings {
  vtt?: string;
  [key: string]: unknown;
}

export interface Beyond20RollRequest {
  action: "roll";
  type: string; // "custom", "initiative", "attack", "damage", "skill", "ability", etc.
  character?: {
    name: string;
    level?: number;
    [key: string]: unknown;
  };
  name?: string; // Roll description/name
  roll?: number; // Roll result
  formula?: string; // Dice formula
  advantage?: number; // 0 = normal, 1 = advantage, 2 = disadvantage
  d20?: boolean; // Whether this is a d20 roll (for crit detection)
  [key: string]: unknown;
}

export type Beyond20EventCallback = (data: unknown) => void;

export interface Beyond20Integration {
  isInstalled: boolean;
  settings: Beyond20Settings | null;
}
