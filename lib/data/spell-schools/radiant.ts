import { SpellAbility } from "../../types/abilities";

export const radiantSchoolSpells: SpellAbility[] = [
  // Tier 0 (Cantrips)
  {
    id: "rebuke",
    name: "Rebuke",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 4. Damage: 1d6 (ignoring armor), does not miss. 2× damage against undead or cowardly (those Frightened or behind cover). High Levels: +2 damage every 5 levels.",
    type: "spell",
    school: "radiant",
    tier: 0,
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 6 },
    },
  },
  {
    id: "true-strike",
    name: "True Strike",
    description:
      "Cantrip, 1 Action, Single Target. Reach: 2. Give a creature advantage on the next attack they make (until the end of their next turn). High Levels: +1 Reach every 5 levels.",
    type: "spell",
    school: "radiant",
    tier: 0,
    actionCost: 1,
  },

  // Tier 1
  {
    id: "heal",
    name: "Heal",
    description:
      "Tier 1, 1 Action, Single Target. Reach: 1. Heal a creature 1d6+KEY HP. Upcast: Choose one: +1 target, +4 Reach, +1d6 healing. If 5+ mana is spent, you may also heal 1 negative condition (e.g., Blind, Poisoned, 1 Wound).",
    type: "spell",
    school: "radiant",
    tier: 1,
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 6 },
      attribute: "intelligence",
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "warding-bond",
    name: "Warding Bond",
    description:
      "Tier 2, 1 Action, Single Target. Designate a willing creature as your ward for 1 minute. They take half damage from all attacks; you are attacked for the other half. Upcast: +1 creature.",
    type: "spell",
    school: "radiant",
    tier: 2,
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 2,
    },
  },

  // Tier 3
  {
    id: "shield-of-justice",
    name: "Shield of Justice",
    description:
      "Tier 3, 1 Action, Self. Reaction: When attacked, Defend for free and reflect Radiant damage back at the attacker equal to the amount blocked (ignoring armor). Upcast: +5 Armor.",
    type: "spell",
    school: "radiant",
    tier: 3,
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "condemn",
    name: "Condemn",
    description:
      "Tier 4, 2 Actions, Single Target. Reach: 4. Damage: 30. Can only target an enemy that crit you or an ally since your last turn. Cannot be reduced by any means. The next attack against that enemy is made with advantage. Upcast: +1 Reach, +1 advantage.",
    type: "spell",
    school: "radiant",
    tier: 4,
    actionCost: 2,
    // Fixed 30 damage, no roll needed
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "vengeance",
    name: "Vengeance",
    description:
      "Tier 5, 2 Actions, Single Target. Reach: 1. Damage: 1d100, to a creature that attacked a Dying ally or reduced one to 0 HP since your last turn. Upcast: +1 Reach, roll w/ advantage.",
    type: "spell",
    school: "radiant",
    tier: 5,
    actionCost: 2,
    roll: {
      dice: { count: 1, sides: 100 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 6
  {
    id: "sacrifice",
    name: "Sacrifice",
    description:
      "Tier 6, 1 Action, Special. Reach: 4. Reduce yourself to 0 HP. You cannot have more than 0 HP until you Safe Rest. Heal a number of HP equal to your maximum HP, divided as you choose to any other creatures within Reach. Also revive a creature that has died in the past minute if you give them at least 20 HP (also healing 2 Wounds from them), provided they have not been revived with this spell before. Upcast: +4 Reach.",
    type: "spell",
    school: "radiant",
    tier: 6,
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 6,
    },
  },

  // Tier 7
  {
    id: "redeem",
    name: "Redeem",
    description:
      "Tier 7, AoE. Casting Time: 24 hours. Requires: A diamond worth at least 10,000 gp, which this spell consumes. Revive any number of deceased creatures you choose–within 1 mile–that have died in the past year, provided they have not died of old age or been revived with this spell before. SHEPHERD ONLY",
    type: "spell",
    school: "radiant",
    tier: 7,
    actionCost: 1,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },

  // Tier 1 (Shepherd only)
  {
    id: "lifebinding-spirit",
    name: "Lifebinding Spirit",
    description:
      "Tier 1, 1 Action. Summon a spirit companion that follows you and is immune to harm. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it. Action: It attacks or heals a creature within Reach 4. It attacks for 1d6+WIL radiant damage (ignoring armor), or heals for the same amount. Upcast: Increment its die size by 1 (max d12), +1 healing use. SHEPHERD ONLY",
    type: "spell",
    school: "radiant",
    tier: 1,
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 6 },
      attribute: "will",
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },
];
