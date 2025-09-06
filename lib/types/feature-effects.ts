import { Ability } from "./abilities";
import { AttributeName } from "./character";
import { ResourceDefinition } from "./resources";
import { StatBonus } from "./stat-bonus";

export type FeatureEffectType =
  | "ability"
  | "attribute_boost"
  | "stat_bonus"
  | "proficiency"
  | "spell_school"
  | "spell_school_choice"
  | "utility_spells"
  | "spell_tier_access"
  | "resource"
  | "subclass_choice"
  | "pick_feature_from_pool"
  | "resistance";

// Shared types used across multiple effect types
export interface ProficiencyGrant {
  type: "skill" | "save" | "tool" | "language";
  name: string;
  bonus?: number; // Optional bonus beyond proficiency
}

export interface SpellSchool {
  schoolId: string; // Unique identifier for the school (e.g., 'fire', 'radiant')
  name: string; // Display name (e.g., 'Fire Magic', 'Radiant Magic')
  description: string; // Description of the school
  // Spells are accessed via ContentRepositoryService.getSpellsBySchool(schoolId)
}

// Damage/condition resistances (from ancestry)
export interface Resistance {
  type: "damage" | "condition";
  name: string; // e.g., 'fire', 'poison', 'charm', 'fear'
  description?: string;
}

// Base interface for all feature effects
interface BaseFeatureEffect {
  id: string; // Unique identifier generated as ${parentFeatureId}-${effectIndex}
}

// Ability effect - grants a new ability to the character
export interface AbilityFeatureEffect extends BaseFeatureEffect {
  type: "ability";
  ability: Ability; // The actual ability definition
}

// Attribute boost effect - permanent attribute increases that require user selection
export interface AttributeBoostFeatureEffect extends BaseFeatureEffect {
  type: "attribute_boost";
  allowedAttributes: AttributeName[];
  amount: number;
}

// Stat bonus effect - ongoing bonuses to attributes (from backgrounds, passives, etc.)
export interface StatBonusFeatureEffect extends BaseFeatureEffect {
  type: "stat_bonus";
  statBonus: StatBonus; // Uses the existing StatBonus type from stat-bonus.ts
}

// Proficiency effect - grants new proficiencies
export interface ProficiencyFeatureEffect extends BaseFeatureEffect {
  type: "proficiency";
  proficiencies: ProficiencyGrant[];
}

// Spell school effect - grants access to a specific school of magic
export interface SpellSchoolFeatureEffect extends BaseFeatureEffect {
  type: "spell_school";
  schoolId: string; // ID of the school to grant access to
}

// Spell school choice effect - allows player to choose a spell school
export interface SpellSchoolChoiceFeatureEffect extends BaseFeatureEffect {
  type: "spell_school_choice";
  availableSchools?: string[]; // Optional: specific schools to choose from. If not provided, any school can be chosen
  numberOfChoices?: number; // Optional: number of schools to choose (default: 1)
}

// Utility spells effect - grants access to utility spells from specific schools
export interface UtilitySpellsFeatureEffect extends BaseFeatureEffect {
  type: "utility_spells";
  schools: string[]; // Array of school IDs to grant utility spells from
  spellsPerSchool?: number; // Optional: how many utility spells to grant per school (default: all)
}

// Resource effect - grants new resources (like Ki, Bardic Inspiration, etc.)
export interface ResourceFeatureEffect extends BaseFeatureEffect {
  type: "resource";
  resourceDefinition: ResourceDefinition;
}

// Spell Tier Access effect - grants access to higher tiers of spells
export interface SpellTierAccessFeatureEffect extends BaseFeatureEffect {
  type: "spell_tier_access";
  maxTier: number; // Maximum spell tier this effect grants access to (1-9)
}

// Subclass Choice effect - allows player to choose a subclass specialization
export interface SubclassChoiceFeatureEffect extends BaseFeatureEffect {
  type: "subclass_choice";
}

// Pick Feature From Pool effect - allows player to choose a feature from a specific pool
export interface PickFeatureFromPoolFeatureEffect extends BaseFeatureEffect {
  type: "pick_feature_from_pool";
  poolId: string; // ID of the feature pool to choose from
  choicesAllowed: number; // Number of features that can be chosen (default: 1)
}

// Resistance effect - damage or condition resistances (from ancestry)
export interface ResistanceFeatureEffect extends BaseFeatureEffect {
  type: "resistance";
  resistances: Resistance[];
}

export type FeatureEffect =
  | AbilityFeatureEffect
  | AttributeBoostFeatureEffect
  | StatBonusFeatureEffect
  | ProficiencyFeatureEffect
  | SpellSchoolFeatureEffect
  | SpellSchoolChoiceFeatureEffect
  | UtilitySpellsFeatureEffect
  | SpellTierAccessFeatureEffect
  | ResourceFeatureEffect
  | SubclassChoiceFeatureEffect
  | PickFeatureFromPoolFeatureEffect
  | ResistanceFeatureEffect;

// Helper types for tracking effect grants
export interface FeatureEffectGrant {
  effectId: string; // Unique ID for this effect grant
  parentFeatureId: string; // ID of the feature that contains this effect
  sourceType: "class" | "subclass" | "ancestry" | "background"; // What type of content granted this effect
  sourceId: string; // ID of the class/ancestry/background that granted this effect
  level?: number; // Level at which this effect was granted (for class/subclass effects)
  effect: FeatureEffect;
}
