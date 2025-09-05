import { SpellSchool } from '../types/feature-effects';

/**
 * Predefined spell school definitions
 * Note: Spells for each school are maintained separately in example-abilities.ts
 */
export const PREDEFINED_SPELL_SCHOOLS: SpellSchool[] = [
  {
    schoolId: 'fire',
    name: 'Fire Magic',
    description: 'Destructive flames and burning magic that harnesses the power of fire and heat'
  },
  {
    schoolId: 'radiant',
    name: 'Radiant Magic', 
    description: 'Divine light and healing magic that channels holy radiance and positive energy'
  },
  {
    schoolId: 'frost',
    name: 'Frost Magic',
    description: 'Ice and cold elemental magic that manipulates temperature and frozen matter'
  },
  {
    schoolId: 'nature',
    name: 'Nature Magic',
    description: 'Plant, animal, and natural magic that draws power from the living world'
  },
  {
    schoolId: 'shadow',
    name: 'Shadow Magic',
    description: 'Necromancy and dark energy that manipulates death and negative forces'
  },
  {
    schoolId: 'arcane',
    name: 'Arcane Magic',
    description: 'Pure magical force and manipulation of raw arcane energy'
  }
];

/**
 * Get a spell school definition by ID
 */
export function getSpellSchoolDefinition(schoolId: string): SpellSchool | null {
  return PREDEFINED_SPELL_SCHOOLS.find(school => school.schoolId === schoolId) || null;
}

/**
 * Get all predefined spell school definitions
 */
export function getAllSpellSchoolDefinitions(): SpellSchool[] {
  return [...PREDEFINED_SPELL_SCHOOLS];
}

/**
 * Check if a school ID is a predefined school
 */
export function isPredefinedSpellSchool(schoolId: string): boolean {
  return PREDEFINED_SPELL_SCHOOLS.some(school => school.schoolId === schoolId);
}