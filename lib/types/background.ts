import { CharacterFeature } from "./character";

export interface BackgroundDefinition {
  id: string; // Unique identifier for the background
  name: string; // Display name (e.g., "Noble", "Scholar", "Soldier")
  description: string; // Brief description of the background
  features: CharacterFeature[]; // All features provided by this background
}
