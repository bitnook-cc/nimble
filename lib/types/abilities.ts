import { AttributeName } from './character';
import { DiceExpression } from './dice';

export type AbilityFrequency = 'per_turn' | 'per_encounter' | 'per_safe_rest' | 'at_will';

export interface FixedAbilityUses {
  type: 'fixed';
  value: number;
}

export interface FormulaAbilityUses {
  type: 'formula';
  expression: string; // e.g., "DEX + WIL + 1", "STR * 2", "level + 3"
}

export type AbilityUses = FixedAbilityUses | FormulaAbilityUses;

export interface AbilityRoll {
  dice: DiceExpression;
  modifier?: number; // fixed modifier, e.g., +2
  attribute?: AttributeName; // attribute to add to the roll
}

export interface FixedResourceCost {
  type: 'fixed';
  resourceId: string;
  amount: number;
}

export interface VariableResourceCost {
  type: 'variable';
  resourceId: string;
  minAmount: number;
  maxAmount: number;
}

export type ResourceCost = FixedResourceCost | VariableResourceCost;

export interface BaseAbility {
  id: string;
  name: string;
  description: string;
}

export interface FreeformAbility extends BaseAbility {
  type: 'freeform';
}

export interface ActionAbility extends BaseAbility {
  type: 'action';
  frequency: AbilityFrequency;
  maxUses?: AbilityUses; // Optional for at-will abilities
  currentUses?: number; // Optional for at-will abilities
  roll?: AbilityRoll; // Optional roll information
  actionCost?: number; // Optional action cost (0 = free action, 1 = action, etc.)
  resourceCost?: ResourceCost; // Optional resource cost
}

export interface SpellAbility extends BaseAbility {
  type: 'spell';
  school: string; // Which spell school this belongs to (e.g., 'fire', 'radiant')
  tier: number; // Spell tier from 1 to 9
  roll?: AbilityRoll; // Optional roll information
  actionCost?: number; // Optional action cost (0 = free action, 1 = action, etc.)
  resourceCost?: ResourceCost; // Optional resource cost
}

export type Ability = FreeformAbility | ActionAbility | SpellAbility;