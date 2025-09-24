import { Character } from "../schemas/character";

export interface SkillPointInfo {
  totalAvailable: number;
  totalAllocated: number;
  isOverAllocated: boolean;
}

/**
 * Calculate total skill points available for a character
 * Formula: startingPoints + (level - 1) * pointsPerLevel
 */
export function calculateAvailableSkillPoints(character: Character): number {
  const { startingPoints, pointsPerLevel } = character.config.skillPoints;
  return startingPoints + (character.level - 1) * pointsPerLevel;
}

/**
 * Calculate total skill points allocated across all skills
 */
export function calculateAllocatedSkillPoints(character: Character): number {
  return Object.values(character._skills).reduce((total, skill) => total + skill.modifier, 0);
}

/**
 * Get comprehensive skill point information for a character
 */
export function getSkillPointInfo(character: Character): SkillPointInfo {
  const totalAvailable = calculateAvailableSkillPoints(character);
  const totalAllocated = calculateAllocatedSkillPoints(character);

  return {
    totalAvailable,
    totalAllocated,
    isOverAllocated: totalAllocated > totalAvailable,
  };
}
