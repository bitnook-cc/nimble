import { SpellAbility } from "../../types/abilities";

export const lightningSchoolSpells: SpellAbility[] = [
  // Tier 0 (Cantrips)
  {
    id: "zap",
    name: "Zap",
    description:
      "Cantrip, 1 Action, Single Target. Range: 12. Damage: 2d8. On miss: the lightning fails to find ground, and strikes you instead. High Levels: +6 damage every 5 levels.",
    type: "spell",
    school: "lightning",
    tier: 0,
    actionCost: 1,
    roll: {
      dice: { count: 2, sides: 8 },
    },
  },
  {
    id: "overload",
    name: "Overload",
    description:
      "Cantrip, 1 Action, AoE. Castiable only if you are Charged, ending the condition. Reach: 2. Damage: 2d8 to others within Reach. High Levels: +4 damage every 5 levels. Charged: Whenever you take lightning damage, you are Charged for 1 minute.",
    type: "spell",
    school: "lightning",
    tier: 0,
    actionCost: 1,
    roll: {
      dice: { count: 2, sides: 8 },
    },
  },

  // Tier 1
  {
    id: "arc-lightning",
    name: "Arc Lightning",
    description:
      "Tier 1, 2 Actions, Single Target. Range: 12. Damage: 3d8. The bolt also damages the next closest creature to your target. On miss: the lightning fails to find ground and strikes you instead. Upcast: +4 damage. Next Closest: If you or an ally is the next closest, they are hit! If 2 creatures are equally close, the GM can roll for it or select the one wearing the most metal.",
    type: "spell",
    school: "lightning",
    tier: 1,
    actionCost: 2,
    roll: {
      dice: { count: 3, sides: 8 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "alacrity",
    name: "Alacrity",
    description:
      "Tier 2, 1 Action, Self. Range: 4. Reaction: When attacked. Defend for free. After damage is dealt, you gain the Charged condition then teleport anywhere within Range. Upcast: +4 Range.",
    type: "spell",
    school: "lightning",
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
    id: "stormlash",
    name: "Stormlash",
    description:
      "Tier 3, 2 Actions, AoE. Line: 12. Damage: 3d8+4 (ignoring metal armor). Surviving creatures are Dazed on a failed STR save, or Incapacitated instead for 1 of their turns if they fail by 5 or more. Creatures with a large amount of metal (e.g., armor or a longsword) roll with disadvantage. Upcast: +4 damage.",
    type: "spell",
    school: "lightning",
    tier: 3,
    actionCost: 2,
    roll: {
      dice: { count: 3, sides: 8 },
      modifier: 4,
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 3,
    },
  },

  // Tier 4
  {
    id: "electrickery",
    name: "Electrickery",
    description:
      "Tier 4, 3 Actions, 2 Targets. Range: 8. Reaction: When an ally is attacked. Choose another creature within Range to swap places with your ally on a failed WIL save (they become the new target). Costs 1 Action while Charged, ending the condition. Upcast: +2 Range.",
    type: "spell",
    school: "lightning",
    tier: 4,
    actionCost: 3,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 4,
    },
  },

  // Tier 5
  {
    id: "electrocharge",
    name: "Electrocharge",
    description:
      "Tier 5, 2 Actions, Single Target. Concentration: Up to 1 minute. A creature you touch gains the Charged condition, +1 max action, +5 armor, 2x speed, and advantage on DEX saves. Upcast: +4 Range.",
    type: "spell",
    school: "lightning",
    tier: 5,
    actionCost: 2,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 6
  {
    id: "ride-the-lightning",
    name: "Ride the Lightning",
    description:
      "Tier 6, 3 Actions, AoE. Teleport up to 12 spaces away to a spot you can see (if a willing creature is there, swap places with them). Adjacent creatures take d88 damage. Surviving creatures must make a STR save or be hurled back 3 spaces, knocked Prone, and deafened for 1 day. Upcast: +1 DC. D88: Roll 2d8. The leftmost die is the tens place, and the second is the ones (e.g., 4 and 5 deal 45 damage).",
    type: "spell",
    school: "lightning",
    tier: 6,
    actionCost: 3,
    roll: {
      dice: { count: 2, sides: 8 }, // d88 represented as 2d8 with special interpretation
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 6,
    },
  },

  // Tier 9
  {
    id: "seething-storm",
    name: "Seething Storm",
    description:
      "Tier 9, 3 Actions, AoE. Concentration: Up to 1 minute. Reach: 4. You become a cloud of tempestuous storm. You can fly, move for free 1/round, and attacks against you are made with disadvantage. At the end of each of your turns, strike up to 4 creatures within Reach with a bolt of lightning for d88 damage (a creature can only be struck 1/round). +2 Reach and number of bolts each round. Costs 3 actions each round to maintain. Once you cast this spell, you must Safe Rest for 1 week before you can use it again.",
    type: "spell",
    school: "lightning",
    tier: 9,
    actionCost: 3,
    roll: {
      dice: { count: 2, sides: 8 }, // d88 represented as 2d8
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 9,
    },
  },
];
