import { SpellAbility } from "../../types/abilities";

export const fireSchoolSpells: SpellAbility[] = [
  // Tier 0 (Cantrips)
  {
    id: "flame-dart",
    name: "Flame Dart",
    description:
      "Cantrip, 1 Action, Single Target. Range: 8. Damage: 1d10. On crit: Smoldering. High Levels: +5 damage every 5 levels.",
    type: "spell",
    school: "fire",
    tier: 0,
    actionCost: 1,
    roll: {
      dice: { count: 1, sides: 10 },
    },
  },
  {
    id: "hearts-fire",
    name: "Heart's Fire",
    description:
      "Cantrip, 1 Action, Single Target. Range: 4. Give an ally within Range an extra action. Spend 1 mana to cast this when it is not your turn. High Levels: +1 Range every 5 levels.",
    type: "spell",
    school: "fire",
    tier: 0,
    actionCost: 1,
  },

  // Tier 1
  {
    id: "ignite",
    name: "Ignite",
    description:
      "Tier 1, 2 Actions, Single Target. Range: 8. Damage: 4d10 to a Smoldering target, ending the condition on hit. Upcast: +10 damage.",
    type: "spell",
    school: "fire",
    tier: 1,
    actionCost: 2,
    roll: {
      dice: { count: 4, sides: 10 },
    },
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 1,
    },
  },

  // Tier 2
  {
    id: "enchant-weapon",
    name: "Enchant Weapon",
    description:
      "Tier 2, 1 Action, Single Target. Concentration: Up to 1 minute. A weapon you touch is enchanted with magical flame. It deals +KEY damage and inflicts Smoldering on crit. Upcast: +KEY damage.",
    type: "spell",
    school: "fire",
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
    id: "flame-barrier",
    name: "Flame Barrier",
    description:
      "Tier 3, 1 Action, Self. Reaction: When attacked. Defend for free. Until the start of your next turn, melee attackers against you take KEY damage (ignoring armor) and gain Smoldering. Upcast: +KEY damage.",
    type: "spell",
    school: "fire",
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
    id: "pyroclasm",
    name: "Pyroclasm",
    description:
      "Tier 4, 2 Actions, AoE. Reach: 3. Others within Reach take 2d20+10 damage (ignoring armor) on a failed DEX save. Half damage on save. Smoldering creatures fail. Upcast: +1 Reach, +2 damage.",
    type: "spell",
    school: "fire",
    tier: 4,
    actionCost: 2,
    roll: {
      dice: { count: 2, sides: 20 },
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
    id: "fiery-embrace",
    name: "Fiery Embrace",
    description:
      "Tier 5, 2 Actions, AoE. Concentration: Up to 1 minute. Reach: 3. While within Reach: 1 ally gains the effects of Enchant Weapon. Enemies gain Smoldering, lose damage resistance, and their damage immunity is reduced to resistance. Upcast: +1 ally.",
    type: "spell",
    school: "fire",
    tier: 5,
    actionCost: 2,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 5,
    },
  },

  // Tier 7
  {
    id: "living-inferno",
    name: "Living Inferno",
    description:
      "Tier 7, 3 Actions, Self. The effects of Flame Barrier until your next turn. At the end of this turn and your next turn, cast Pyroclasm for free. Upcast: Upcast Flame Barrier and Pyroclasm.",
    type: "spell",
    school: "fire",
    tier: 7,
    actionCost: 3,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 7,
    },
  },

  // Tier 9
  {
    id: "dragonform",
    name: "Dragonform",
    description:
      "Tier 9, 5 Actions, Self. Transform into a Huge dragon. Gain 3 actions, a fly speed of 12, LVL Armor, 10+LVL temp HP, and: TOOTH & CLAW (Action, Reach 2): 1d20+LVL damage (ignoring armor), inflicts Smoldering. IMMOLATING BREATH (2 Actions, Reach 6, Cone 8): DC 20 DEX save, KEY d20 damage, half on save. Smoldering targets fail. You can maintain this form for as long as the temp HP granted by this spell remain (max. 10 minutes). When it ends, you drop to 0 HP.",
    type: "spell",
    school: "fire",
    tier: 9,
    actionCost: 5,
    resourceCost: {
      type: "fixed",
      resourceId: "mana",
      amount: 9,
    },
  },
];
