// Nimble classes
export { berserkerClass as berserker } from './berserker';
export { cheatClass as cheat } from './cheat';
export { commanderClass as commander } from './commander';
export { hunterClass as hunter } from './hunter';
export { mageClass as mage } from './mage';
export { oathswornClass as oathsworn } from './oathsworn';
export { shadowmancerClass as shadowmancer } from './shadowmancer';
export { shepherdClass as shepherd } from './shepherd';
export { songweaverClass as songweaver } from './songweaver';
export { stormshifterClass as stormshifter } from './stormshifter';
export { zephyrClass as zephyr } from './zephyr';

// Import all class definitions for the main classes object
import { berserkerClass as berserker } from './berserker';
import { cheatClass as cheat } from './cheat';
import { commanderClass as commander } from './commander';
import { hunterClass as hunter } from './hunter';
import { mageClass as mage } from './mage';
import { oathswornClass as oathsworn } from './oathsworn';
import { shadowmancerClass as shadowmancer } from './shadowmancer';
import { shepherdClass as shepherd } from './shepherd';
import { songweaverClass as songweaver } from './songweaver';
import { stormshifterClass as stormshifter } from './stormshifter';
import { zephyrClass as zephyr } from './zephyr';

import { ClassDefinition } from '../../types/class';

// Main class definitions array
export const classDefinitions: ClassDefinition[] = [
  berserker,
  cheat,
  commander,
  hunter,
  mage,
  oathsworn,
  shadowmancer,
  shepherd,
  songweaver,
  stormshifter,
  zephyr
];

// Helper function to get a class definition by ID
export function getClassDefinition(classId: string): ClassDefinition | null {
  return classDefinitions.find(cls => cls.id === classId) || null;
}

// Helper function to get all available classes
export function getAllClasses(): ClassDefinition[] {
  return classDefinitions;
}

// Helper function to get features for a specific class and level
export function getClassFeaturesForLevel(classId: string, level: number): ClassDefinition['features'] {
  const classDef = getClassDefinition(classId);
  if (!classDef) return [];
  
  return classDef.features.filter(feature => feature.level === level);
}

// Helper function to get all features up to a specific level
export function getAllClassFeaturesUpToLevel(classId: string, level: number): ClassDefinition['features'] {
  const classDef = getClassDefinition(classId);
  if (!classDef) return [];
  
  return classDef.features.filter(feature => feature.level <= level);
}

// Helper function to get all subclasses for a specific class
export function getSubclassesForClass(classId: string): any[] {
  // For now, return empty array - subclasses will be handled by class service
  return [];
}