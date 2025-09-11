// Import all ancestry definitions for the main ancestries object
// Common ancestries
import { AncestryDefinition } from "../../schemas/ancestry";
import { birdfolk } from "./birdfolk";
// Exotic ancestries
import { bunbun } from "./bunbun";
import { celestial } from "./celestial";
import { changeling } from "./changeling";
import { crystalborn } from "./crystalborn";
import { dragonborn } from "./dragonborn";
import { dryad } from "./dryad";
import { dwarf } from "./dwarf";
import { elf } from "./elf";
import { fiendkin } from "./fiendkin";
import { gnome } from "./gnome";
import { goblin } from "./goblin";
import { halfGiant } from "./half-giant";
import { halfling } from "./halfling";
import { human } from "./human";
import { kobold } from "./kobold";
import { minotaur } from "./minotaur";
import { oozeling } from "./oozeling";
import { orc } from "./orc";
import { planarbeing } from "./planarbeing";
import { ratfolk } from "./ratfolk";
import { stoatling } from "./stoatling";
import { turtlefolk } from "./turtlefolk";
import { wyrdling } from "./wyrdling";

export { human } from "./human";
export { elf } from "./elf";
export { dwarf } from "./dwarf";
export { halfling } from "./halfling";
export { gnome } from "./gnome";

export { bunbun } from "./bunbun";
export { goblin } from "./goblin";
export { dragonborn } from "./dragonborn";
export { kobold } from "./kobold";
export { fiendkin } from "./fiendkin";
export { orc } from "./orc";
export { birdfolk } from "./birdfolk";
export { celestial } from "./celestial";
export { changeling } from "./changeling";
export { crystalborn } from "./crystalborn";
export { dryad } from "./dryad";
export { halfGiant } from "./half-giant";
export { minotaur } from "./minotaur";
export { oozeling } from "./oozeling";
export { planarbeing } from "./planarbeing";
export { ratfolk } from "./ratfolk";
export { stoatling } from "./stoatling";
export { turtlefolk } from "./turtlefolk";
export { wyrdling } from "./wyrdling";

// Common ancestries

// Exotic ancestries

// Main ancestry definitions array
export const ancestryDefinitions: AncestryDefinition[] = [
  // Common ancestries
  human,
  elf,
  dwarf,
  halfling,
  gnome,

  // Exotic ancestries
  bunbun,
  goblin,
  dragonborn,
  kobold,
  fiendkin,
  orc,
  birdfolk,
  celestial,
  changeling,
  crystalborn,
  dryad,
  halfGiant,
  minotaur,
  oozeling,
  planarbeing,
  ratfolk,
  stoatling,
  turtlefolk,
  wyrdling,
];

// Helper function to get an ancestry definition by ID
export function getAncestryDefinition(ancestryId: string): AncestryDefinition | null {
  return ancestryDefinitions.find((ancestry) => ancestry.id === ancestryId) || null;
}

// Helper function to get all available ancestries
export function getAllAncestries(): AncestryDefinition[] {
  return ancestryDefinitions;
}

// Helper function to get ancestry features
export function getAncestryFeatures(ancestryId: string): AncestryDefinition["features"] {
  const ancestryDef = getAncestryDefinition(ancestryId);
  if (!ancestryDef) return [];

  return ancestryDef.features;
}

// Helper function to check if an ancestry is available
export function isValidAncestry(ancestryId: string): boolean {
  return ancestryDefinitions.some((ancestry) => ancestry.id === ancestryId);
}
