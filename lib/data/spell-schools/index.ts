import { SpellAbilityDefinition } from "../../types/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";
import { fireSpellSchool, fireSchoolSpells } from "./fire";
import { iceSpellSchool, iceSchoolSpells } from "./ice";
import { lightningSpellSchool, lightningSchoolSpells } from "./lightning";
import { necroticSpellSchool, necroticSchoolSpells } from "./necrotic";
import { radiantSpellSchool, radiantSchoolSpells } from "./radiant";
import { utilitySpellsBySchool } from "./utility-spells";
import { windSpellSchool, windSchoolSpells } from "./wind";

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
