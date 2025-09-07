import { AttributeName } from "./character";
import { DiceExpression } from "./dice";
import { FlexibleValue } from "./flexible-value";

export type AbilityFrequency = "per_turn" | "per_encounter" | "per_safe_rest" | "at_will";

export interface AbilityRoll {
  dice: DiceExpression;
  modifier?: number; // fixed modifier, e.g., +2
  attribute?: AttributeName; // attribute to add to the roll
}

export interface FixedResourceCost {
  type: "fixed";
  resourceId: string;
  amount: number;
}

export interface VariableResourceCost {
  type: "variable";
  resourceId: string;
  minAmount: number;
  maxAmount: number;
}

export type ResourceCost = FixedResourceCost | VariableResourceCost;

export interface BaseAbilityDefinition {
  id: string;
  name: string;
  description: string;
}

export interface UsableAbilityDefinition extends BaseAbilityDefinition {
  actionCost?: number; // Optional action cost (0 = free action, 1 = action, etc.)
  resourceCost?: ResourceCost; // Optional resource cost
}

export interface FreeformAbilityDefinition extends BaseAbilityDefinition {
  type: "freeform";
}

export interface ActionAbilityDefinition extends UsableAbilityDefinition {
  type: "action";
  frequency: AbilityFrequency;
  maxUses?: FlexibleValue; // Optional for at-will abilities
  roll?: AbilityRoll; // Optional roll information
}

export interface SpellAbilityDefinition extends UsableAbilityDefinition {
  type: "spell";
  school: string; // Which spell school this belongs to (e.g., 'fire', 'radiant')
  tier: number; // Spell tier from 1 to 9
  roll?: AbilityRoll; // Optional roll information
}

export type AbilityDefinition =
  | FreeformAbilityDefinition
  | ActionAbilityDefinition
  | SpellAbilityDefinition;
