import { SpellSchoolWithSpells } from "@/lib/services/content-repository-service";

import { fireSpellSchool } from "./fire";
import { iceSpellSchool } from "./ice";
import { lightningSpellSchool } from "./lightning";
import { necroticSpellSchool } from "./necrotic";
import { radiantSpellSchool } from "./radiant";
import { windSpellSchool } from "./wind";

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
