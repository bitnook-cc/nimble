import { StatBonus } from './stat-bonus';

export type BackgroundFeatureType = 'passive_feature';

// Base interface for all background features
interface BaseBackgroundFeature {
  name: string;
  description: string;
}

// Passive feature - background benefits, social traits, knowledge, etc.
export interface BackgroundPassiveFeature extends BaseBackgroundFeature {
  type: 'passive_feature';
  statBonus?: StatBonus; // Optional stat bonuses provided by this feature
}

export type BackgroundFeature = BackgroundPassiveFeature;

export interface BackgroundDefinition {
  id: string; // Unique identifier for the background
  name: string; // Display name (e.g., "Noble", "Scholar", "Soldier")
  description: string; // Brief description of the background
  features: BackgroundFeature[]; // All features provided by this background
}

// Helper types for working with background data
export interface BackgroundFeatureGrant {
  featureId: string; // Unique ID for this feature grant
  backgroundId: string;
  feature: BackgroundFeature;
  grantedAt: Date; // When this feature was granted to the character
}

// Background trait for character reference
export interface BackgroundTrait {
  backgroundId: string;
  grantedFeatures: string[]; // IDs of background features already granted to this character
}