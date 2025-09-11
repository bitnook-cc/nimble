import { SpellAbilityDefinition } from "../../schemas/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";
import { fireSchoolSpells, fireSpellSchool } from "./fire";
import { iceSchoolSpells, iceSpellSchool } from "./ice";
import { lightningSchoolSpells, lightningSpellSchool } from "./lightning";
import { necroticSchoolSpells, necroticSpellSchool } from "./necrotic";
import { radiantSchoolSpells, radiantSpellSchool } from "./radiant";
import { utilitySpellsBySchool } from "./utility-spells";
import { windSchoolSpells, windSpellSchool } from "./wind";

/**
 * Get all built-in spell schools with full definitions
 */
export function getBuiltInSpellSchools(): SpellSchoolWithSpells[] {
  return [
    fireSpellSchool,
    iceSpellSchool,
    lightningSpellSchool,
    windSpellSchool,
    radiantSpellSchool,
    necroticSpellSchool,
  ];
}
