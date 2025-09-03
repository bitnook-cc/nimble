import { HitDieSize, AttributeName, SaveAdvantageMap } from './character';
import { Ability } from './abilities';
import { ResourceDefinition } from './resources';

export type ClassFeatureType = 'ability' | 'passive_feature' | 'stat_boost' | 'proficiency' | 'spell_school' | 'spell_school_choice' | 'utility_spells' | 'spell_tier_access' | 'resource' | 'subclass_choice' | 'pick_feature_from_pool';

export interface StatBoost {
  attribute: AttributeName;
  amount: number;
}

export interface ProficiencyGrant {
  type: 'skill' | 'save' | 'tool' | 'language';
  name: string;
  bonus?: number; // Optional bonus beyond proficiency
}

export interface SpellSchool {
  schoolId: string; // Unique identifier for the school (e.g., 'fire', 'radiant')
  name: string; // Display name (e.g., 'Fire Magic', 'Radiant Magic')
  description: string; // Description of the school
  // Spells are accessed via ContentRepositoryService.getSpellsBySchool(schoolId)
}

// Feature pool - a collection of features that players can choose from
export interface FeaturePool {
  id: string; // Unique identifier for the pool (e.g., 'warlock-invocations', 'fighter-maneuvers')
  name: string; // Display name (e.g., 'Eldritch Invocations', 'Battle Maneuvers')
  description: string; // Description of the pool and what features it contains
  features: ClassFeature[]; // Array of features available for selection
}


// Base interface for all class features
interface BaseClassFeature {
  id: string; // Unique identifier for the feature
  level: number;
  name: string;
  description: string;
}

// Ability feature - grants a new ability to the character
export interface AbilityFeature extends BaseClassFeature {
  type: 'ability';
  ability: Ability; // The actual ability definition
}

// Passive feature - background benefits, rules modifications
export interface PassiveFeature extends BaseClassFeature {
  type: 'passive_feature';
  category?: 'combat' | 'exploration' | 'social' | 'utility'; // Optional categorization
}

// Stat boost - permanent attribute increases
export interface StatBoostFeature extends BaseClassFeature {
  type: 'stat_boost';
  statBoosts: StatBoost[];
}

// Proficiency - grants new proficiencies
export interface ProficiencyFeature extends BaseClassFeature {
  type: 'proficiency';
  proficiencies: ProficiencyGrant[];
}

// Spell school - grants access to a specific school of magic
export interface SpellSchoolFeature extends BaseClassFeature {
  type: 'spell_school';
  spellSchool: SpellSchool;
}

// Spell school choice - allows player to choose a spell school
export interface SpellSchoolChoiceFeature extends BaseClassFeature {
  type: 'spell_school_choice';
  availableSchools?: string[]; // Optional: specific schools to choose from. If not provided, any school can be chosen
  numberOfChoices?: number; // Optional: number of schools to choose (default: 1)
}

// Utility spells - grants access to utility spells from specific schools
export interface UtilitySpellsFeature extends BaseClassFeature {
  type: 'utility_spells';
  schools: string[]; // Array of school IDs to grant utility spells from
  spellsPerSchool?: number; // Optional: how many utility spells to grant per school (default: all)
}

// Resource - grants new resources (like Ki, Bardic Inspiration, etc.)
export interface ResourceFeature extends BaseClassFeature {
  type: 'resource';
  resourceDefinition: ResourceDefinition;
  startingAmount?: number; // Optional override for initial current amount (defaults to maxValue)
}

// Spell Tier Access - grants access to higher tiers of spells
export interface SpellTierAccessFeature extends BaseClassFeature {
  type: 'spell_tier_access';
  maxTier: number; // Maximum spell tier this feature grants access to (1-9)
}

// Subclass Choice - allows player to choose a subclass specialization
export interface SubclassChoiceFeature extends BaseClassFeature {
  type: 'subclass_choice';
}

// Pick Feature From Pool - allows player to choose a feature from a specific pool
export interface PickFeatureFromPoolFeature extends BaseClassFeature {
  type: 'pick_feature_from_pool';
  poolId: string; // ID of the feature pool to choose from
  choicesAllowed: number; // Number of features that can be chosen (default: 1)
}

export type ClassFeature = 
  | AbilityFeature 
  | PassiveFeature 
  | StatBoostFeature 
  | ProficiencyFeature 
  | SpellSchoolFeature 
  | SpellSchoolChoiceFeature
  | UtilitySpellsFeature
  | SpellTierAccessFeature
  | ResourceFeature
  | SubclassChoiceFeature
  | PickFeatureFromPoolFeature;

export type ArmorProficiency = 
  | { type: 'cloth' }
  | { type: 'leather' } 
  | { type: 'mail' }
  | { type: 'plate' }
  | { type: 'shields' }
  | { type: 'freeform'; name: string };

export type WeaponProficiency = 
  | { type: 'strength_weapons' }
  | { type: 'dexterity_weapons' }
  | { type: 'freeform'; name: string };

export interface SubclassDefinition {
  id: string; // Unique identifier for the subclass
  name: string; // Display name (e.g., "Champion", "Battle Master")
  description: string; // Brief description of the subclass
  parentClassId: string; // Which class this subclass belongs to
  features: ClassFeature[]; // Features provided by this subclass
}

export interface ClassDefinition {
  id: string; // Unique identifier for the class
  name: string; // Display name (e.g., "Fighter", "Wizard")
  description: string; // Brief description of the class
  hitDieSize: HitDieSize; // Hit die size for this class (d6, d8, d10, etc.)
  keyAttributes: AttributeName[]; // Primary attributes for the class
  startingHP: number; // Fixed starting hit points at level 1
  armorProficiencies: ArmorProficiency[]; // Armor types the class is proficient with
  weaponProficiencies: WeaponProficiency[]; // Weapon categories the class is proficient with
  saveAdvantages: SaveAdvantageMap; // Default save advantages/disadvantages for this class
  startingEquipment: string[]; // Array of repository item IDs for starting equipment
  features: ClassFeature[]; // All features available to this class
  featurePools?: FeaturePool[]; // Feature pools available for selection
}

// Helper types for working with class data
export interface ClassFeatureGrant {
  featureId: string; // Unique ID for this feature grant
  classId: string;
  level: number;
  feature: ClassFeature;
  grantedAt: Date; // When this feature was granted to the character
}