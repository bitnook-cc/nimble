import { AttributeName, CharacterFeature, HitDieSize, SaveAdvantageMap } from "./character";

// Feature pool - a collection of features that players can choose from
export interface FeaturePool {
  id: string; // Unique identifier for the pool (e.g., 'warlock-invocations', 'fighter-maneuvers')
  name: string; // Display name (e.g., 'Eldritch Invocations', 'Battle Maneuvers')
  description: string; // Description of the pool and what features it contains
  features: ClassFeature[]; // Array of features available for selection
}

// Class feature - now contains multiple effects
export interface ClassFeature extends CharacterFeature {
  level: number;
}

export type ArmorProficiency =
  | { type: "cloth" }
  | { type: "leather" }
  | { type: "mail" }
  | { type: "plate" }
  | { type: "shields" }
  | { type: "freeform"; name: string };

export type WeaponProficiency =
  | { type: "strength_weapons" }
  | { type: "dexterity_weapons" }
  | { type: "freeform"; name: string };

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

// Helper to check if a feature has a specific effect type
export function hasEffectType(feature: ClassFeature, effectType: string): boolean {
  return feature.effects.some((effect) => effect.type === effectType);
}
