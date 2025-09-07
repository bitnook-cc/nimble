import { NameConfig } from "../utils/name-generator";
import { CharacterFeature } from "./character";

// Size categories for different ancestries
export type SizeCategory = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

export type AncestryRarity = "common" | "exotic";

export interface AncestryDefinition {
  id: string; // Unique identifier for the ancestry
  name: string; // Display name (e.g., "Human", "Elf", "Dwarf")
  description: string; // Brief description of the ancestry
  size: SizeCategory; // Default size category
  rarity: AncestryRarity; // Common or exotic
  features: CharacterFeature[]; // All features provided by this ancestry
  nameConfig?: NameConfig; // Optional name generation configuration
}
