import { SpellAbilityDefinition } from "@/lib/schemas/abilities";
import { SpellSchoolWithSpells } from "@/lib/services/content-repository-service";

const necroticSchoolSpells: SpellAbilityDefinition[] = [
  // Tier 0 (Cantrips)
  {
    id: "entice",
    name: "Entice",
    description:
      "Cantrip, 1 Action, Single Target. Range: 8. Damage: 1d4 (ignoring armor). On hit: target moves 2 spaces closer to you. High Levels: Increment the die size 1 step every 5 levels (d6 → d8 → d10 → d12).",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d4",
  },
  {
    id: "withering-touch",
    name: "Withering Touch",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 1. Damage: 1d12. On hit: Target is considered undead for 1 round. High Levels: +6 damage every 5 levels.",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d12",
    scalingBonus: "+6",
  },

  // Tier 1
  {
    id: "shadow-trap",
    name: "Shadow Trap",
    description:
      "Tier 1, 2 Actions, Single Target. Concentration: Up to 1 minute. The next creature to move adjacent to you suffers 3d12 damage, if Small or Tiny, it is also Restrained by shadow tendrils for as long as you maintain concentration or until they escape. Upcast: +1 size category, +1d12 damage when they escape.",
    type: "spell",
    school: "necrotic",
    tier: 1,
    category: "combat",
    actionCost: 2,
    diceFormula: "3d12",
    upcastBonus: "+1d12",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "dread-visage",
    name: "Dread Visage",
    description:
      "Tier 2, 1 Action, Self. Reaction: When attacked, Defend for free. Melee attackers are Frightened for 1 round. 1d12 damage if they attack you this round. Costs 2 mana less while dying. Upcast: +2 damage, +2 armor.",
    type: "spell",
    school: "necrotic",
    tier: 2,
    category: "combat",
    actionCost: 1,
    diceFormula: "1d12",
    upcastBonus: "+2",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 2,
    },
  },

  // Tier 3
  {
    id: "vampiric-greed",
    name: "Vampiric Greed",
    description:
      "Tier 3, 2 Actions, AoE. Gain 1 Wound. 4d12 to all adjacent creatures, and heal HP equal to the damage done. Any surviving creatures make a STR save. Gain 1 additional wound for each creature that saves. Upcast: +1 DC.",
    type: "spell",
    school: "necrotic",
    tier: 3,
    category: "combat",
    actionCost: 2,
    diceFormula: "4d12",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "greater-shadow",
    name: "Greater Shadow",
    description:
      "Tier 4, 2 Actions. Summon a 5d12 Greater Shadow minion (max 1) adjacent to you. When it dies, it explodes into 5 shadow minions (see Summon Shadow). Place them anywhere within 8 spaces. Upcast: +1d12 damage, +1 shadow minion on explosion.",
    type: "spell",
    school: "necrotic",
    tier: 4,
    category: "combat",
    actionCost: 2,
    diceFormula: "5d12",
    upcastBonus: "+1d12",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "gangrenous-burst",
    name: "Gangrenous Burst",
    description:
      "Tier 5, 2 Actions, AoE. Reach: Up to 8. Other damaged creatures must make a STR save or take 3d20 damage (ignoring armor), half on save. The save is rolled with disadvantage while Bloodied. Upcast: +10 damage.",
    type: "spell",
    school: "necrotic",
    tier: 5,
    category: "combat",
    actionCost: 2,
    diceFormula: "3d20",
    upcastBonus: "+10",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 6
  {
    id: "unspeakable-word",
    name: "Unspeakable Word",
    description:
      "Tier 6, 2 Actions, Special. Reach: 8. Damage: d66 (with advantage, ignoring armor, does not miss or crit) on a failed INT save. Target rolls with disadvantage if Bloodied or Frightened. On a success, you both take half of this damage instead. Upcast: +1 DC, +10 damage. D66 with advantage: Roll 3d6 and drop the lowest die. The leftmost die is the tens place, and the second is the ones (e.g., 2, 3, and 4 deals 34 damage).",
    type: "spell",
    school: "necrotic",
    tier: 6,
    category: "combat",
    actionCost: 2,
    diceFormula: "3d6", // d66 with advantage represented as 3d6
    upcastBonus: "+10",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 6,
    },
  },

  // Tier 7
  {
    id: "creeping-death",
    name: "Creeping Death",
    description:
      "Tier 7, 3 Actions, AoE. Reach: 8. Damage: 4d20. If this kills the creature, it violently erupts and you MUST deal the same amount of damage to another creature within 8 spaces of it that has not yet been damaged by this effect. Repeat until a creature survives this damage or no other creatures are within Reach. Upcast: +1d20 damage.",
    type: "spell",
    school: "necrotic",
    tier: 7,
    category: "combat",
    actionCost: 3,
    diceFormula: "4d20",
    upcastBonus: "+1d20",
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },
];

const necroticUtilitySpells: SpellAbilityDefinition[] = [
  {
    id: "gravecraft",
    name: "Gravecraft",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    actionCost: 1,
    description:
      "**Gravemark.** Action: Soil a surface with blood, filth, or other disgusting things. OR: **Gravework.** Casting time 1 minute: Shape/move a body-sized plot of earth.",
  },
  {
    id: "false-face",
    name: "False Face",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    description:
      "Change your appearance to look like someone else for 10 minutes. Requires a piece of them.",
  },
  {
    id: "thought-leech",
    name: "Thought Leech",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    actionCost: 1,
    description:
      "**Reach:** 6. Read the surface thoughts of a creature within Reach. Creatures can sense you doing this and may not like it.",
  },
];

export const necroticSpellSchool: SpellSchoolWithSpells = {
  id: "necrotic",
  name: "Necrotic Spells",
  description: "Dark magic that manipulates death, shadow, and the undead",
  color: "text-purple-700",
  icon: "skull",
  spells: [...necroticSchoolSpells, ...necroticUtilitySpells], // Combine all spells (combat and utility)
};

// Legacy export for backward compatibility
export { necroticSchoolSpells };
