import { FeatureEffect } from "./feature-effects";

// Background feature - now contains multiple effects
export interface BackgroundFeature {
  id: string; // Unique identifier for the feature
  name: string;
  description: string;
  effects: FeatureEffect[]; // Array of effects this feature provides
}

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
