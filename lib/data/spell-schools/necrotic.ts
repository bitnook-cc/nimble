import { SpellAbilityDefinition } from "../../schemas/abilities";
import { SpellSchoolWithSpells } from "../../services/content-repository-service";

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
    roll: {
      dice: { count: 1, sides: 4 },
    },
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
    roll: {
      dice: { count: 1, sides: 12 },
    },
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
    roll: {
      dice: { count: 3, sides: 12 },
    },
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
    roll: {
      dice: { count: 1, sides: 12 },
    },
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
    roll: {
      dice: { count: 4, sides: 12 },
    },
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
    roll: {
      dice: { count: 5, sides: 12 },
    },
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
    roll: {
      dice: { count: 3, sides: 20 },
    },
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
    roll: {
      dice: { count: 3, sides: 6 }, // d66 with advantage represented as 3d6
    },
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
    roll: {
      dice: { count: 4, sides: 20 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },

  // Shadowmancer only spells
  {
    id: "shadow-blast",
    name: "Shadow Blast",
    description:
      "Cantrip, 1 Action, Single Target. Range: 8. Damage: 1d12+KEY. 1/round. High Levels: +1d12 every 5 levels. SHADOWMANCER ONLY",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "combat",
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 12 },
      attribute: "intelligence",
    },
  },
  {
    id: "summon-shadow",
    name: "Summon Shadow",
    description:
      "Cantrip, 1 Action. Summon a shadow minion within Reach 1 (you can summon a max of WIL or LVL minions, whichever is lower). Your shadow minions follow the normal minion rules: they have 1 HP, no damage bonus, and do not crit. They abandon you immediately outside of combat. Action: 1 (turn) you may command ALL of your minions to move up to 6 then attack (Reach 1, d12 each). High Levels: +1 Reach every 5 levels.",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "combat",
    actionCost: 1,
  },
];

const necroticUtilitySpells: SpellAbilityDefinition[] = [
  {
    id: "reaper-sight",
    name: "Reaper Sight",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    description:
      "For 10 minutes, you can see life force. Living creatures glow with vitality, undead emanate dark energy, and you can see the recently deceased (within 1 day). You can also determine if a creature is near death (less than half HP).",
  },
  {
    id: "whispers-of-the-grave",
    name: "Whispers of the Grave",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    description:
      "You may ask a single question to a corpse that has been dead for less than 1 week. The corpse provides a brief, cryptic answer based on what it knew in life. A corpse can only ever answer 1 question.",
  },
  {
    id: "read-the-bones",
    name: "Read the Bones",
    type: "spell",
    school: "necrotic",
    tier: 0,
    category: "utility",
    description:
      "Read the surface thoughts of a creature within Reach. Creatures can sense you doing this and may not like it.",
  },
];

export const necroticSpellSchool: SpellSchoolWithSpells = {
  id: "necrotic",
  name: "Necrotic Spells",
  description: "Dark magic that manipulates death, shadow, and the undead",
  color: "text-purple-700",
  icon: "skull",
  spells: necroticSchoolSpells,
  utilitySpells: necroticUtilitySpells,
};

// Legacy export for backward compatibility
export { necroticSchoolSpells };
