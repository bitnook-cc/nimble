import { ActionAbilityDefinition } from "@/lib/schemas/abilities";
import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition } from "../../schemas/class";

const sneakAttackDefinition: ActionAbilityDefinition = {
  id: "sneak-attack",
  name: "Sneak Attack",
  description: "(1/turn) When you crit, deal +1d6 damage.",
  type: "action",
  frequency: "per_turn",
  maxUses: { type: "fixed", value: 1 },
  diceFormula: "1d6",
};

// Underhanded Abilities - Feature Pool
const underhandedAbilitiesFeatures: ClassFeature[] = [
  {
    id: "creative-accounting",
    level: 1,
    name: '"Creative" Accounting',
    description:
      "Steal up to INT actions from your next turn (Gain up to INT actions now, the next time you would gain actions, subtract the number stolen). You cannot use this 2 turns in a row.",
    traits: [
      {
        id: "creative-accounting-0",
        type: "ability",
        ability: {
          id: "creative-accounting",
          name: '"Creative" Accounting',
          description:
            "Steal up to INT actions from your next turn and then move up to half your speed for free.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "exploit-weakness",
    level: 1,
    name: "Exploit Weakness",
    description:
      "Action: Make a contested INT check against an enemy. If you win, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use this ability against another target.",
    traits: [
      {
        id: "exploit-weakness-0",
        type: "ability",
        ability: {
          id: "exploit-weakness",
          name: "Exploit Weakness",
          description:
            "Make a contested INT check against an enemy. If you win, you can use Vicious Opportunist against them, even if they are not Distracted. This lasts for 1 minute or until you use this ability against another target.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          diceFormula: "1d20 + INT",
        },
      },
    ],
  },
  {
    id: "feinting-attack",
    level: 1,
    name: "Feinting Attack",
    description:
      "If you miss for the 2nd time in a single round, you may change the primary die to any result instead.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "how-d-you-get-here",
    level: 1,
    name: "How'd YOU get here?!",
    description:
      '2 actions: "Teleport" up to 4 spaces away, adjacent to a Distracted target, and make a melee attack against them. If you crit, you may "teleport" again.',
    traits: [
      {
        id: "how-d-you-get-here-0",
        type: "ability",
        ability: {
          id: "how-d-you-get-here",
          name: "How'd YOU get here?!",
          description:
            '"Teleport" up to 4 spaces away, adjacent to a Distracted target, and make a melee attack against them. If you crit, you may "teleport" again.',
          type: "action",
          frequency: "at_will",
          actionCost: 2,
        },
      },
    ],
  },
  {
    id: "im-outta-here",
    level: 1,

    name: "I'm Outta Here!",
    description:
      "When an ally within 4 spaces is crit, you may turn invisible until the end of your next turn.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "misdirection",
    level: 1,
    name: "Misdirection",
    description: "Gain INT armor. Whenever you Defend, you may halve the damage instead.",
    traits: [
      {
        id: "misdirection-0",
        type: "stat_bonus",
        statBonus: {
          armorBonus: { type: "formula", expression: "INT" },
        },
      },
    ], // Passive feature - no mechanical traits to process
  },
  {
    id: "steal-tempo",
    level: 1,
    name: "Steal Tempo",
    description:
      "When you land a critical hit for the second time on a turn, your target loses 1 action and you gain 1 action.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "sunder-armor-medium",
    level: 1,
    name: "Sunder Armor (Medium)",
    description:
      "Action: When you crit an enemy with medium armor, sunder their armor. Until the start of your next turn, ALL melee attacks against that target ignore its armor.",
    traits: [
      {
        id: "sunder-armor-medium-0",
        type: "ability",
        ability: {
          id: "sunder-armor-medium",
          name: "Sunder Armor (Medium)",
          description:
            "When you crit an enemy with medium armor, sunder their armor. Until the start of your next turn, ALL melee attacks against that target ignore its armor.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "sunder-armor-heavy",
    level: 1,
    name: "Sunder Armor (Heavy)",
    description:
      "Req. Sunder Armor (Medium). Your Sunder Armor ability now also applies to enemies wearing heavy armor.",
    traits: [
      {
        id: "sunder-armor-heavy-0",
        type: "ability",
        ability: {
          id: "sunder-armor-heavy",
          name: "Sunder Armor (Heavy)",
          description: "Your Sunder Armor ability now also applies to enemies wearing heavy armor.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "trickshot",
    level: 1,
    name: "Trickshot",
    description:
      "When you throw a dagger, it returns back to your hand at the end of your turn. On a hit, it ricochets to another creature within 2 spaces, dealing half as much damage to them.",
    traits: [], // Passive feature - no mechanical traits to process
  },
];

const cheatFeatures: ClassFeature[] = [
  // Level 1
  {
    id: "cheat-sneak-attack",
    level: 1,
    name: "Sneak Attack",
    description: "When you crit, deal +1d6 damage.",
    traits: [
      {
        id: "cheat-sneak-attack-0",
        type: "ability",
        ability: sneakAttackDefinition,
      },
    ],
  },
  {
    id: "cheat-vicious-opportunist",
    level: 1,
    name: "Vicious Opportunist",
    description:
      "(1/turn) When you hit a Distracted target with a melee attack, you may change the Primary Die roll to whatever you like (changing it to the max value counts as a crit).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 2
  {
    id: "cheat-cheat",
    level: 2,

    name: "Cheat",
    description:
      "You're a well-rounded cheater. Gain the following abilities: (1/round) You may either Move or Hide for free. (1/day) You may change any skill check to 10+INT. If you roll less than 10 on Initiative, you may change it to 10 instead. You may gain advantage on skill checks while playing any games, competitions, or placing wagers. If you're caught though...",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 3
  {
    id: "cheat-subclass-choice",
    level: 3,
    name: "Cheat Subclass",
    description: "Choose your path of deception.",
    traits: [
      {
        id: "cheat-subclass-choice-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "cheat-sneak-attack-2",
    level: 3,
    name: "Sneak Attack (2)",
    description: "Your Sneak Attack becomes 1d8.",
    traits: [
      {
        id: "cheat-sneak-attack-2-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +1d8 damage.",
          diceFormula: "1d8",
        },
      },
    ],
  },
  {
    id: "cheat-thieves-cant",
    level: 3,

    name: "Thieves' Cant",
    description: "You learn the secret language of rogues and scoundrels.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 4
  {
    id: "cheat-key-stat-increase-1",
    level: 4,
    name: "Key Stat Increase",
    description: "+1 DEX or INT",
    traits: [
      {
        id: "cheat-key-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity", "intelligence"],
        amount: 1,
      },
    ],
  },
  {
    id: "cheat-underhanded-ability-1",
    level: 4,
    name: "Underhanded Ability",
    description: "Choose an Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-1-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 5
  {
    id: "cheat-twist-the-blade",
    level: 5,
    name: "Twist the Blade",
    description: "Action: Change one of your Sneak Attack dice to whatever you like.",
    traits: [
      {
        id: "cheat-twist-the-blade-0",
        type: "ability",
        ability: {
          id: "twist-the-blade",
          name: "Twist the Blade",
          description: "Change one of your Sneak Attack dice to whatever you like.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "cheat-quick-read",
    level: 5,
    name: "Quick Read",
    description:
      "(1/encounter) Gain advantage on an Assess check. (1/day) Gain advantage on an Examination check.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "cheat-secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 WIL or STR",
    traits: [
      {
        id: "cheat-secondary-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["will", "strength"],
        amount: 1,
      },
    ],
  },
  // Level 6
  {
    id: "cheat-underhanded-ability-2",
    level: 6,
    name: "Underhanded Ability (2)",
    description: "Choose a 2nd Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-2-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 7
  {
    id: "cheat-subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Cheat subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "cheat-sneak-attack-3",
    level: 7,
    name: "Sneak Attack (3)",
    description: "Your Sneak Attack becomes 2d8.",
    traits: [
      {
        id: "cheat-sneak-attack-3-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +2d8 damage.",
          diceFormula: "2d8",
        },
      },
    ],
  },
  // Level 8
  {
    id: "cheat-underhanded-ability-3",
    level: 8,
    name: "Underhanded Ability (3)",
    description: "Choose a 3rd Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-3-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "cheat-key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 DEX or INT",
    traits: [
      {
        id: "cheat-key-stat-increase-2-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity", "intelligence"],
        amount: 1,
      },
    ],
  },
  // Level 9
  {
    id: "cheat-sneak-attack-4",
    level: 9,
    name: "Sneak Attack (4)",
    description: "Your Sneak Attack becomes 2d10.",
    traits: [
      {
        id: "cheat-sneak-attack-4-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +2d10 damage.",
          diceFormula: "2d10",
        },
      },
    ],
  },
  {
    id: "cheat-secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 WIL or STR",
    traits: [
      {
        id: "cheat-secondary-stat-increase-2-0",
        type: "attribute_boost",
        allowedAttributes: ["will", "strength"],
        amount: 1,
      },
    ],
  },
  // Level 10
  {
    id: "cheat-underhanded-ability-4",
    level: 10,

    name: "Underhanded Ability (4)",
    description: "Choose a 4th Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-4-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 11
  {
    id: "cheat-subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Cheat subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "cheat-sneak-attack-5",
    level: 11,
    name: "Sneak Attack (5)",
    description: "Your Sneak Attack becomes 2d12.",
    traits: [
      {
        id: "cheat-sneak-attack-5-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +2d12 damage.",
          diceFormula: "2d12",
        },
      },
    ],
  },
  // Level 12
  {
    id: "cheat-underhanded-ability-5",
    level: 12,

    name: "Underhanded Ability (5)",
    description: "Choose a 5th Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-5-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "cheat-key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 DEX or INT",
    traits: [
      {
        id: "cheat-key-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity", "intelligence"],
        amount: 1,
      },
    ],
  },
  // Level 13
  {
    id: "cheat-twist-the-blade-2",
    level: 13,
    name: "Twist the Blade (2)",
    description: "(1/turn) You can Twist the Blade for free.",
    traits: [
      {
        id: "cheat-twist-the-blade-2-0",
        type: "ability",
        ability: {
          id: "twist-the-blade-2",
          name: "Twist the Blade (2)",
          description: "You can Twist the Blade for free.",
          type: "action",
          frequency: "per_turn",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "cheat-secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 WIL or STR",
    traits: [
      {
        id: "cheat-secondary-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["will", "strength"],
        amount: 1,
      },
    ],
  },
  // Level 14
  {
    id: "cheat-underhanded-ability-6",
    level: 14,

    name: "Underhanded Ability (6)",
    description: "Choose a 6th Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-6-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 15
  {
    id: "cheat-subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Cheat subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "cheat-sneak-attack-6",
    level: 15,
    name: "Sneak Attack (6)",
    description: "Your Sneak Attack becomes 2d20.",
    traits: [
      {
        id: "cheat-sneak-attack-6-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +2d20 damage.",
          diceFormula: "2d20",
        },
      },
    ],
  },
  // Level 16
  {
    id: "cheat-underhanded-ability-7",
    level: 16,

    name: "Underhanded Ability (7)",
    description: "Choose a 7th Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-7-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "cheat-key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 DEX or INT",
    traits: [
      {
        id: "cheat-key-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity", "intelligence"],
        amount: 1,
      },
    ],
  },
  // Level 17
  {
    id: "cheat-sneak-attack-7",
    level: 17,
    name: "Sneak Attack (7)",
    description: "Your Sneak Attack becomes 3d20.",
    traits: [
      {
        id: "cheat-sneak-attack-7-0",
        type: "ability",
        ability: {
          ...sneakAttackDefinition,
          description: "(1/turn) When you crit, deal +3d20 damage.",
          diceFormula: "3d20",
        },
      },
    ],
  },
  {
    id: "cheat-secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 WIL or STR",
    traits: [
      {
        id: "cheat-secondary-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["will", "strength"],
        amount: 1,
      },
    ],
  },
  // Level 18
  {
    id: "cheat-underhanded-ability-8",
    level: 18,

    name: "Underhanded Ability (8)",
    description: "Choose an 8th Underhanded Ability.",
    traits: [
      {
        id: "cheat-underhanded-ability-8-0",
        type: "pick_feature_from_pool",
        poolId: "underhanded-abilities-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 19
  {
    id: "cheat-epic-boon",
    level: 19,

    name: "Epic Boon",
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 20
  {
    id: "cheat-supreme-execution",
    level: 20,
    name: "Supreme Execution",
    description:
      "+1 to any 2 of your stats. When you attack with a blade, you do not require targets to be Distracted to trigger Vicious Opportunist.",
    traits: [
      {
        id: "cheat-supreme-execution-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
      {
        id: "cheat-supreme-execution-1",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
    ],
  },
];

// Trade Secrets feature
const tradeSecrets: ClassFeature = {
  id: "cheat-trade-secrets",
  level: 1,

  name: "Trade Secrets",
  description:
    "Whenever you spend a night talking shop with other roguish types during a Safe Rest, you may choose different Cheat options available to you.",
  traits: [], // Passive feature - no mechanical traits to process
};

// Distracted feature (important mechanic)
const distracted: ClassFeature = {
  id: "cheat-distracted",
  level: 1,

  name: "Distracted",
  description:
    "A target is Distracted if it is adjacent to or Taunted by an ally, or if it cannot see you.",
  traits: [], // Passive feature - no mechanical traits to process
};

// Magic feature
const magic: ClassFeature = {
  id: "cheat-magic",
  level: 2,

  name: "Magic?",
  description:
    "The Cheat has some abilities that look magical-they might be, but don't have to be. You have your ways, okay? No need to explain how you did that, not even to the GM!",
  traits: [], // Passive feature - no mechanical traits to process
};

export const cheatClass: ClassDefinition = {
  id: "cheat",
  name: "The Cheat",
  description:
    "A cunning rogue who relies on deception, misdirection, and underhanded tactics to overcome challenges. Cheats excel at exploiting weaknesses and creating opportunities where none existed.",
  hitDieSize: 6,
  keyAttributes: ["dexterity", "intelligence"],
  startingHP: 10,
  armorProficiencies: [{ type: "leather" }],
  weaponProficiencies: [{ type: "dexterity_weapons" }],
  saveAdvantages: {
    dexterity: "advantage",
    will: "disadvantage",
  },
  startingEquipment: ["daggers-2", "sling", "cheap-hides", "chalk"],
  features: [...cheatFeatures, tradeSecrets, distracted, magic],
  featurePools: [
    {
      id: "underhanded-abilities-pool",
      name: "Underhanded Abilities",
      description:
        "A collection of sneaky tricks and exploits that Cheats can learn as they progress.",
      features: underhandedAbilitiesFeatures,
    },
  ],
};
