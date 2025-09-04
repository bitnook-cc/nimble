import { Ability } from './abilities';
import { StatBoost, ProficiencyGrant } from './class';
import { NameConfig } from '../utils/name-generator';
import { StatBonus } from './stat-bonus';


export type AncestryFeatureType = 'ability' | 'passive_feature' | 'stat_boost' | 'proficiency' | 'darkvision' | 'resistance';

// Size categories for different ancestries
export type SizeCategory = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

// Damage/condition resistances
export interface Resistance {
  type: 'damage' | 'condition';
  name: string; // e.g., 'fire', 'poison', 'charm', 'fear'
  description?: string;
}

// Base interface for all ancestry features
interface BaseAncestryFeature {
  name: string;
  description: string;
}

// Ability feature - grants a new ability to the character
export interface AncestryAbilityFeature extends BaseAncestryFeature {
  type: 'ability';
  ability: Ability;
}

// Passive feature - background benefits, cultural traits
export interface AncestryPassiveFeature extends BaseAncestryFeature {
  type: 'passive_feature';
  statBonus?: StatBonus; // Optional stat bonuses provided by this feature
}

// Stat boost - racial attribute modifiers
export interface AncestryStatBoostFeature extends BaseAncestryFeature {
  type: 'stat_boost';
  statBoosts: StatBoost[];
}

// Proficiency - cultural or biological proficiencies
export interface AncestryProficiencyFeature extends BaseAncestryFeature {
  type: 'proficiency';
  proficiencies: ProficiencyGrant[];
}

// Speed modifier and other special movement handled through passive features

// Darkvision - enhanced vision in darkness
export interface AncestryDarkvisionFeature extends BaseAncestryFeature {
  type: 'darkvision';
  range: number; // Range in feet
}

// Resistance - damage or condition resistances
export interface AncestryResistanceFeature extends BaseAncestryFeature {
  type: 'resistance';
  resistances: Resistance[];
}

export type AncestryFeature = 
  | AncestryAbilityFeature 
  | AncestryPassiveFeature 
  | AncestryStatBoostFeature 
  | AncestryProficiencyFeature 
  | AncestryDarkvisionFeature
  | AncestryResistanceFeature;

export type AncestryRarity = 'common' | 'exotic';

export interface AncestryDefinition {
  id: string; // Unique identifier for the ancestry
  name: string; // Display name (e.g., "Human", "Elf", "Dwarf")
  description: string; // Brief description of the ancestry
  size: SizeCategory; // Default size category
  rarity: AncestryRarity; // Common or exotic
  features: AncestryFeature[]; // All features provided by this ancestry
  nameConfig?: NameConfig; // Optional name generation configuration
}

// Helper types for working with ancestry data
export interface AncestryFeatureGrant {
  featureId: string; // Unique ID for this feature grant
  ancestryId: string;
  feature: AncestryFeature;
  grantedAt: Date; // When this feature was granted to the character
}

// Ancestry trait for character reference
export interface AncestryTrait {
  ancestryId: string;
  grantedFeatures: string[]; // IDs of ancestry features already granted to this character
}