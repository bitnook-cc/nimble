import { SpellAbilityDefinition } from "../../schemas/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";

const windSchoolSpells: SpellAbilityDefinition[] = [
  // Tier 0 (Cantrips)
  {
    id: "razor-wind",
    name: "Razor Wind",
    description:
      "Cantrip, 1 Action, Single Target. Range: 12. Damage: 1d4 slashing (Vicious: roll 1 additional die whenever you roll crit damage). Also damages up to 1 adjacent target. High Levels: +2 damage every 5 levels.",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "combat",
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 4 },
    },
  },
  {
    id: "breath-of-life",
    name: "Breath of Life",
    description:
      "Cantrip, 1 Action, Single Target. Range: 6. Restore 1 HP to a Dying creature. High Levels: +2 Range every 5 levels.",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "combat",
    actionCost: 1,
  },

  // Tier 1
  {
    id: "blustery-gale",
    name: "Blustery Gale",
    description:
      "Tier 1, 2 Actions, Single Target. Range: 12. Damage: 3d4 bludgeoning, advantage against flying, Small, or Tiny targets. On hit: Move a Med target 2 spaces away, Small/Tiny twice as far, Large half as far (round down). For each space you would roll due to forced movement from this spell, deal +5 damage instead. Upcast: +1 movement.",
    type: "spell",
    school: "wind",
    tier: 1,
    category: "combat",
    actionCost: 2,
    roll: {
      dice: { count: 3, sides: 4 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "barrier-of-wind",
    name: "Barrier of Wind",
    description:
      "Tier 2, 1 Action, Self. Reaction: When attacked at Range. Defend for free. Ranged attacks have disadvantage against you this round (including the triggering attack). Upcast: +3 Armor.",
    type: "spell",
    school: "wind",
    tier: 2,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 2,
    },
  },

  // Tier 3
  {
    id: "fly",
    name: "Fly",
    description:
      "Tier 3, 1 Action, Single Target. Concentration: Up to 10 minutes. Touch a creature, grant a flying speed of 12. Upcast: +1 target.",
    type: "spell",
    school: "wind",
    tier: 3,
    category: "combat",
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "eye-of-the-storm",
    name: "Eye of the Storm",
    description:
      "Tier 4, 2 Actions, AoE. Reach: 3. Damage: 4d4+10 bludgeoning to enemies within Reach. You may place surviving creatures anywhere within 1 space of the storm's Reach on a failed STR save. Upcast: +1 Reach.",
    type: "spell",
    school: "wind",
    tier: 4,
    category: "combat",
    actionCost: 2,
    roll: {
      dice: { count: 4, sides: 4 },
      modifier: 10,
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "updraft",
    name: "Updraft",
    description:
      "Tier 5, 3 Actions, AoE. Reach: 12. Enemies within a 5×5 area must repeat a DEX save until they succeed. For each time they failed they suffer 1d6 falling damage and land Prone. Upcast: +2 Range, +1 area.",
    type: "spell",
    school: "wind",
    tier: 5,
    category: "combat",
    actionCost: 3,
    roll: {
      dice: { count: 1, sides: 6 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 6
  {
    id: "thousand-cuts",
    name: "Thousand Cuts",
    description:
      "Tier 6, 3 Actions, AoE. Range: 12. Damage: d44 slashing damage (roll with advantage), also damages enemies within Reach 1 of your target. Upcast: +1 Reach. D44 with advantage: Roll 3d4 and drop the lowest die. The leftmost die is the tens place, and the second is the ones (e.g., 2, 3, and 4 deal 34 damage).",
    type: "spell",
    school: "wind",
    tier: 6,
    category: "combat",
    actionCost: 3,
    roll: {
      dice: { count: 3, sides: 4 }, // d44 with advantage represented as 3d4
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 6,
    },
  },

  // Tier 7
  {
    id: "boisterous-winds",
    name: "Boisterous Winds",
    description:
      "Tier 7, 2 Actions, Multi-target. Concentration: Up to 1 minute. You and up to 12 allies within Reach 12 gain: Ranged attacks have disadvantage against you, a flying speed of 12, and can move for free 1/round. Upcast: +1 minute or +2 targets. SONGWEAVER ONLY",
    type: "spell",
    school: "wind",
    tier: 7,
    category: "combat",
    actionCost: 2,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },

  // Tier 1 (Songweaver only)
  {
    id: "vicious-mockery",
    name: "Vicious Mockery",
    description:
      "Cantrip, 1 Action, Single Target. Range: 12. Damage: 1d4+INT psychic (ignoring armor). On hit: the target is haunted during their next turn. High Levels: +2 damage every 5 levels. SONGWEAVER ONLY",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "combat",
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 4 },
      attribute: "intelligence",
    },
  },
];

const windUtilitySpells: SpellAbilityDefinition[] = [
  {
    id: "storm-warning",
    name: "Storm Warning",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "utility",
    description:
      "You feel the weather patterns around you for the next 8 hours. If severe weather looms, you gain an impression of the storm's arrival time and intensity.",
  },
  {
    id: "windcraft",
    name: "Windcraft",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "utility",
    description:
      "Control the wind within 3 spaces of you, creating gusts or silence. Create any smell, sound, or small illusion that could believably be carried by wind. You can also perfectly mimic any voice or sound you've heard.",
  },
  {
    id: "flight",
    name: "Flight",
    type: "spell",
    school: "wind",
    tier: 0,
    category: "utility",
    description:
      "Grant yourself a flying speed of 2 for up to 10 minutes (requires concentration). Your speed drops to 0 if you are wearing armor or encumbered by heavy objects.",
  },
];

export const windSpellSchool: SpellSchoolWithSpells = {
  id: "wind",
  name: "Wind Spells",
  description: "Ancient mastery over wind and storms, controlling the very air itself",
  color: "text-teal-500",
  icon: "Wind",
  spells: windSchoolSpells,
  utilitySpells: windUtilitySpells,
};

// Legacy export for backward compatibility
export { windSchoolSpells };
