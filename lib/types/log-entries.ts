import { DiceType } from './dice';

// Base interface for all log entries
export interface BaseLogEntry {
  id: string;
  timestamp: Date;
  description: string;
}

// Single die interface (used in dice rolls)
export interface SingleDie {
  type: DiceType; // e.g., 6 for d6, 20 for d20
  result: number;
  isCritical?: boolean; // True if this die was a critical hit
}

// Dice roll log entry
export interface DiceRollEntry extends BaseLogEntry {
  type: 'roll';
  dice: SingleDie[]; // Array of individual dice (after advantage/disadvantage applied)
  droppedDice?: SingleDie[]; // Dice that were dropped due to advantage/disadvantage
  modifier: number;
  total: number;
  rollExpression: string; // Original dice expression like "2d6+3" or "d20+5"
  isMiss?: boolean; // For attack rolls
  criticalHits?: number; // Number of critical hits that occurred
  advantageLevel?: number; // Positive for advantage, negative for disadvantage, 0/undefined for normal
}

// Damage log entry
export interface DamageEntry extends BaseLogEntry {
  type: 'damage';
  amount: number; // Amount of damage taken
  targetType: 'hp' | 'temp_hp'; // What type of HP was affected
}

// Healing log entry
export interface HealingEntry extends BaseLogEntry {
  type: 'healing';
  amount: number; // Amount healed
}

// Temporary HP log entry
export interface TempHPEntry extends BaseLogEntry {
  type: 'temp_hp';
  amount: number; // Amount of temporary HP gained
  previous?: number; // Previous temp HP amount (if replacing)
}

// Initiative entry for combat tracking
export interface InitiativeEntry extends BaseLogEntry {
  type: 'initiative';
  total: number; // Initiative roll result
  actionsGranted: number; // Number of actions granted by this roll
}

// Ability usage entry
export interface AbilityUsageEntry extends BaseLogEntry {
  type: 'ability_usage';
  abilityName: string; // Name of the ability used
  frequency: 'per_turn' | 'per_encounter' | 'per_safe_rest' | 'at_will'; // Frequency of the ability
  usesRemaining: number; // Uses remaining after this usage
  maxUses: number; // Maximum uses for this ability
}

// Safe rest entry
export interface SafeRestEntry extends BaseLogEntry {
  type: 'safe_rest';
  healingAmount: number; // Amount of HP restored
  hitDiceRestored: number; // Number of hit dice restored
  woundsRemoved: number; // Number of wounds removed
  abilitiesReset: number; // Number of abilities reset
}

// Catch breath entry (short rest)
export interface CatchBreathEntry extends BaseLogEntry {
  type: 'catch_breath';
  hitDiceSpent: number; // Number of hit dice spent for healing
  healingAmount: number; // Amount of HP restored
  abilitiesReset: number; // Number of abilities reset
}

// Make camp entry (long rest)
export interface MakeCampEntry extends BaseLogEntry {
  type: 'make_camp';
  healingAmount: number; // Amount of HP restored
  hitDiceRestored: number; // Number of hit dice restored
  abilitiesReset: number; // Number of abilities reset
}


// Resource usage entry (generic replacement for mana)
export interface ResourceUsageEntry extends BaseLogEntry {
  type: 'resource';
  resourceId: string; // ID of the resource (mana, fury, focus, etc.)
  resourceName: string; // Display name of the resource
  amount: number; // Amount spent or restored
  action: 'spent' | 'restored'; // Whether resource was spent or restored
  currentAmount: number; // Current amount after the action
  maxAmount: number; // Maximum amount for this resource
}

// Spell cast entry
export interface SpellCastEntry extends BaseLogEntry {
  type: 'spell_cast';
  spellName: string; // Name of the spell cast
  school: string; // Spell school (e.g., 'fire', 'radiant')
  tier: number; // Spell tier (1-9)
  resourceCost?: {
    resourceId: string;
    resourceName: string;
    amount: number;
  }; // Resource cost if any
  actionCost: number; // Action cost (0 = bonus action, 1 = action, etc.)
}

// Item consumption entry
export interface ItemConsumptionEntry extends BaseLogEntry {
  type: 'item_consumption';
  itemName: string; // Name of the item consumed
  itemType: 'consumable' | 'ammunition'; // Type of item consumed
  countBefore: number; // Count before consumption
  countAfter: number; // Count after consumption
  itemRemoved: boolean; // True if item was completely removed from inventory
}

// Union type for all log entries
export type LogEntry = DiceRollEntry | DamageEntry | HealingEntry | TempHPEntry | InitiativeEntry | AbilityUsageEntry | SafeRestEntry | CatchBreathEntry | MakeCampEntry | ResourceUsageEntry | SpellCastEntry | ItemConsumptionEntry;