import { SpellAbilityDefinition } from "../../schemas/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";

const iceSchoolSpells: SpellAbilityDefinition[] = [
  // Tier 0 (Cantrips)
  {
    id: "ice-lance",
    name: "Ice Lance",
    description:
      "Cantrip, 1 Action, Single Target. Range: 12. Damage: 1d6 cold or piercing damage. On hit: Slowed.",
    type: "spell",
    school: "ice",
    tier: 0,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d6",
    scalingBonus: "+3",
  },
  {
    id: "snowblind",
    name: "Snowblind",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 1. Damage: 1d6. On hit: Blinded until the end of their next turn.",
    type: "spell",
    school: "ice",
    tier: 0,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d6",
    scalingBonus: "+3",
  },

  // Tier 1
  {
    id: "frost-shield",
    name: "Frost Shield",
    description:
      "Tier 1, 1 Action, Self. Reaction: When attacked, Gain 2×KEY temp HP and Defend. Until the 1st time melts and these temp HP are lost at the start of your next turn. Upcast: +2×KEY temp HP.",
    type: "spell",
    school: "ice",
    tier: 1,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "shatter",
    name: "Shatter",
    description:
      "Tier 2, 2 Actions, Single Target. Range: 12. Damage: 3d6. If any die rolls the max against a Hampered target, this counts as a crit. On crit: +20 damage. Deal freeze increase the crit range by 1. ANY die by 1. +5 damage on crit.",
    type: "spell",
    school: "ice",
    tier: 2,
    category: "combat",
    actionCost: 2,
    diceFormula: "3d6",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 2,
    },
  },

  // Tier 3
  {
    id: "cryosleep",
    name: "Cryosleep",
    description:
      "Tier 3, 2 Actions, AoE. Reach: 12. Creatures in a 2×2 area within Reach are Dazed. On a failed STR save, they fall asleep instead, becoming Incapacitated until their next two turns have passed, until damaged, or until an ally uses an action to wake them. Upcast: +1 area, +1 turn asleep.",
    type: "spell",
    school: "ice",
    tier: 3,
    category: "combat",
    actionCost: 2,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "rimeblades",
    name: "Rimeblades",
    description:
      "Tier 4, 3 Actions, AoE. Concentration: Up to 1 minute. Reach: 12. Conjure razor-sharp icy spikes in 5 contiguous spaces within Reach. This area is difficult terrain. Creatures that enter these spaces (or who are in the area when you conjure them) suffer 2d6 damage for each space they touch. Upcast: +1 space, +1 damage.",
    type: "spell",
    school: "ice",
    tier: 4,
    category: "combat",
    actionCost: 3,
    diceFormula: "2d6",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "arctic-blast",
    name: "Arctic Blast",
    description:
      "Tier 5, 2 Actions, AoE. Reach: Cone 4. Damage: 4d6+10 damage. This area is difficult terrain until the end of your next turn. Surviving creatures must make a STR save or be frozen in place (Restrained) until the end of their next turn; creatures already Hampered are Incapacitated for 1 turn instead. Upcast: +1 Reach.",
    type: "spell",
    school: "ice",
    tier: 5,
    category: "combat",
    actionCost: 2,
    diceFormula: "4d6+10",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 8
  {
    id: "glacier-strike",
    name: "Glacier Strike",
    description:
      "Tier 8, 3 Actions, AoE. Range: 12. Damage: d66 bludgeoning to creatures in a 3×3 area. Creatures adjacent to that area take half as much. The entire area permanently becomes difficult terrain. Upcast: +1 initial area.",
    type: "spell",
    school: "ice",
    tier: 8,
    category: "combat",
    actionCost: 3,
    diceFormula: "1d66",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 8,
    },
  },

  // Tier 9
  {
    id: "arctic-annihilation",
    name: "Arctic Annihilation",
    description:
      "Tier 9, 3 Actions, AoE. Reach: 12. Choose any number of objects or willing creatures within Reach to encase in ice. They are Incapacitated and immune to damage and negative effects until the start of their next turn. All other creatures and objects within Reach take d66 damage. Any surviving creature who took this damage must make a STR save or be Incapacitated for 1 round. Once you cast this spell, you must Safe Rest for 1 week before using it again.",
    type: "spell",
    school: "ice",
    tier: 9,
    category: "combat",
    actionCost: 3,
    diceFormula: "1d66",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 9,
    },
  },
];

const iceUtilitySpells: SpellAbilityDefinition[] = [
  {
    id: "ice-disk",
    name: "Ice Disk",
    type: "spell",
    school: "ice",
    tier: 0,
    category: "utility",
    description:
      "Conjure a disk of ice that floats just above the ground and follows you. It can carry up to 250 lbs / 115 kg of weight for 1 hour or until you cast this spell again.",
  },
  {
    id: "chillcraft",
    name: "Chillcraft",
    type: "spell",
    school: "ice",
    tier: 0,
    category: "utility",
    description:
      "Harmlessly freeze, thaw, or move a bath-sized amount of water near you. OR: Conjure a sheet of opaque, mirror-like, or transparent ice the size of a window or small door.",
  },
  {
    id: "wintry-scrying",
    name: "Wintry Scrying",
    type: "spell",
    school: "ice",
    tier: 0,
    category: "utility",
    description:
      "Turn a small patch of water into a reflective icy mirror. Looking though it grants you vision of any desired location near this same body of water for 10 minutes.",
  },
];

export const iceSpellSchool: SpellSchoolWithSpells = {
  id: "ice",
  name: "Ice Spells",
  description: "Ice and cold elemental magic that manipulates temperature and frozen matter",
  color: "text-blue-500",
  icon: "snowflake",
  spells: [...iceSchoolSpells, ...iceUtilitySpells], // Combine all spells (combat and utility)
};

// Legacy export for backward compatibility
export { iceSchoolSpells };
