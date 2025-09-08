import { SpellAbilityDefinition } from "../../types/abilities";
import { fireSchoolSpells } from "./fire";
import { iceSchoolSpells } from "./ice";
import { lightningSchoolSpells } from "./lightning";
import { necroticSchoolSpells } from "./necrotic";
import { radiantSchoolSpells } from "./radiant";
import { utilitySpellsBySchool } from "./utility-spells";
import { windSchoolSpells } from "./wind";

/**
 * Get spells from a specific school
 */
export function getSpellsBySchool(schoolId: string): SpellAbilityDefinition[] {
  switch (schoolId) {
    case "fire":
      return fireSchoolSpells;
    case "ice":
      return iceSchoolSpells;
    case "lightning":
      return lightningSchoolSpells;
    case "wind":
      return windSchoolSpells;
    case "radiant":
      return radiantSchoolSpells;
    case "necrotic":
      return necroticSchoolSpells;
    default:
      return [];
  }
}

/**
 * Get utility spells from a specific school
 */
export function getUtilitySpellsBySchool(schoolId: string): SpellAbilityDefinition[] {
  return utilitySpellsBySchool[schoolId] || [];
}

/**
 * Get all available spell schools
 */
export function getAllSpellSchools(): { id: string; name: string; spells: SpellAbilityDefinition[] }[] {
  return [
    { id: "fire", name: "Fire Spells", spells: fireSchoolSpells },
    { id: "ice", name: "Ice Spells", spells: iceSchoolSpells },
    { id: "lightning", name: "Lightning Spells", spells: lightningSchoolSpells },
    { id: "wind", name: "Wind Spells", spells: windSchoolSpells },
    { id: "radiant", name: "Radiant Spells", spells: radiantSchoolSpells },
    { id: "necrotic", name: "Necrotic Spells", spells: necroticSchoolSpells },
  ];
}

// Re-export individual school spells for backward compatibility
export {
  fireSchoolSpells,
  iceSchoolSpells,
  lightningSchoolSpells,
  windSchoolSpells,
  radiantSchoolSpells,
  necroticSchoolSpells,
  utilitySpellsBySchool,
};
