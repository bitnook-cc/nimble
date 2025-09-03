// Berserker subclasses
export { berserkerRedMist } from './berserker-red-mist';
export { berserkerMountainheart } from './berserker-mountainheart';

// Cheat subclasses
export { cheatSilentBlade } from './cheat-silent-blade';
export { cheatScoundrel } from './cheat-scoundrel';

// Commander subclasses
export { commanderBulwark } from './commander-bulwark';
export { commanderVanguard } from './commander-vanguard';

// Hunter subclasses
export { hunterWildheart } from './hunter-wildheart';
export { hunterShadowpath } from './hunter-shadowpath';

// Mage subclasses
export { mageChaos } from './mage-chaos';
export { mageControl } from './mage-control';

// Oathsworn subclasses
export { oathswornVengeance } from './oathsworn-vengeance';
export { oathswornRefuge } from './oathsworn-refuge';

// Stormshifter subclasses
export { circleOfSkyAndStorm } from './stormshifter-sky-storm';
export { circleOfFangAndClaw } from './stormshifter-fang-claw';

// Zephyr subclasses
export { wayOfPain } from './zephyr-pain';
export { wayOfFlame } from './zephyr-flame';

// Import all subclass definitions for the main subclasses object
import { berserkerRedMist } from './berserker-red-mist';
import { berserkerMountainheart } from './berserker-mountainheart';
import { cheatSilentBlade } from './cheat-silent-blade';
import { cheatScoundrel } from './cheat-scoundrel';
import { commanderBulwark } from './commander-bulwark';
import { commanderVanguard } from './commander-vanguard';
import { hunterWildheart } from './hunter-wildheart';
import { hunterShadowpath } from './hunter-shadowpath';
import { mageChaos } from './mage-chaos';
import { mageControl } from './mage-control';
import { oathswornVengeance } from './oathsworn-vengeance';
import { oathswornRefuge } from './oathsworn-refuge';
import { circleOfSkyAndStorm } from './stormshifter-sky-storm';
import { circleOfFangAndClaw } from './stormshifter-fang-claw';
import { wayOfPain } from './zephyr-pain';
import { wayOfFlame } from './zephyr-flame';

import { SubclassDefinition } from '../../types/class';

// All subclass definitions
export const subclassDefinitions: SubclassDefinition[] = [
  berserkerRedMist,
  berserkerMountainheart,
  cheatSilentBlade,
  cheatScoundrel,
  commanderBulwark,
  commanderVanguard,
  hunterWildheart,
  hunterShadowpath,
  mageChaos,
  mageControl,
  oathswornVengeance,
  oathswornRefuge,
  circleOfSkyAndStorm,
  circleOfFangAndClaw,
  wayOfPain,
  wayOfFlame
];

// Helper function to get a subclass definition by ID
export function getSubclassDefinition(subclassId: string): SubclassDefinition | null {
  return subclassDefinitions.find(subclass => subclass.id === subclassId) || null;
}

// Helper function to get all subclasses for a specific class
export function getSubclassesForClass(classId: string): SubclassDefinition[] {
  return subclassDefinitions.filter(subclass => subclass.parentClassId === classId);
}

// Helper function to get features for a specific subclass and level
export function getSubclassFeaturesForLevel(subclassId: string, level: number): SubclassDefinition['features'] {
  const subclassDef = getSubclassDefinition(subclassId);
  if (!subclassDef) return [];
  
  return subclassDef.features.filter(feature => feature.level === level);
}

// Helper function to get all subclass features up to a specific level
export function getAllSubclassFeaturesUpToLevel(subclassId: string, level: number): SubclassDefinition['features'] {
  const subclassDef = getSubclassDefinition(subclassId);
  if (!subclassDef) return [];
  
  return subclassDef.features.filter(feature => feature.level <= level);
}