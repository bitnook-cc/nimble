import { NameConfig } from "../utils/name-generator";
import { FeatureEffect } from "./feature-effects";

// Size categories for different ancestries
export type SizeCategory = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

// Ancestry feature - now contains multiple effects
export interface AncestryFeature {
  id: string; // Unique identifier for the feature
  name: string;
  description: string;
  effects: FeatureEffect[]; // Array of effects this feature provides
}

export type AncestryRarity = "common" | "exotic";

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
