import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition } from "../../schemas/class";

// Martial Arts Abilities - Feature Pool
const martialArtsAbilities: ClassFeature[] = [
  {
    id: "airshift",
    level: 1,
    name: "Airshift",
    description:
      "You cannot be Grappled while conscious. While moving, you may travel across all terrain as normal ground, ignoring all ill traits (e.g., walls/ceilings, water, treetops, lava, spikes, clouds).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "blur",
    level: 1,
    name: "Blur",
    description:
      "(1/encounter) When you Defend, you may first move up to half your speed away, taking no damage if you are now out of range or have Full Cover.",
    traits: [
      {
        id: "blur-0",
        type: "ability",
        ability: {
          id: "blur",
          name: "Blur",
          description:
            "When you Defend, first move up to half your speed away. Take no damage if out of range or have Full Cover.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "bodily-discipline",
    level: 1,
    name: "Bodily Discipline",
    description: "You may spend 1 action to end any non-Wound condition on yourself.",
    traits: [
      {
        id: "bodily-discipline-0",
        type: "ability",
        ability: {
          id: "bodily-discipline",
          name: "Bodily Discipline",
          description: "End any non-Wound condition on yourself.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "enduring-soul",
    level: 1,
    name: "Enduring Soul",
    description:
      "Each time you roll Initiative, gain Hit Dice equal to the actions you get on your first turn. These Hit Dice expire at the end of combat if unused.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "i-jump-on-his-back",
    level: 1,
    name: "I Jump On His Back!",
    description:
      "While moving with your Windstep, if you move into the space of a creature your size or larger, you may jump onto its back. While on a creature this way, gain advantage on melee attacks against it, and any damage you avoid is dealt to it instead.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "kinetic-barrage",
    level: 1,
    name: "Kinetic Barrage",
    description:
      "Whenever you miss an attack, gain a cumulative +STR bonus to all damage you do for the rest of this encounter (a disciplined martial artist does not miss on purpose).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "mighty-soul",
    level: 1,
    name: "Mighty Soul",
    description:
      "You cannot be moved against your will. Whenever you would fail a saving throw, you may gain a Wound in order to add your STR to the result you rolled. You may repeat this any number of times.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "quickstrike",
    level: 1,
    name: "Quickstrike",
    description:
      "When you Interpose, you may first make an unarmed strike against the enemy for free.",
    traits: [
      {
        id: "quickstrike-0",
        type: "ability",
        ability: {
          id: "quickstrike",
          name: "Quickstrike",
          description:
            "When you Interpose, first make an unarmed strike against the enemy for free.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "use-momentum",
    level: 1,
    name: "Use Momentum",
    description:
      "Whenever you avoid all of the damage of a melee attack (whether it misses or you Defend), you may swap places with the attacker and then choose another target that is now within the attack's reach, and they are hit instead.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "vital-rejuvenation",
    level: 1,
    name: "Vital Rejuvenation",
    description:
      "When you receive healing for the first time on a turn, you may heal another target within 6 spaces HP equal to your STR.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "windstrider",
    level: 1,
    name: "Windstrider",
    description:
      "If you move through the space of a willing creature while using Windstep, they can move with you and choose any space adjacent to your path of movement to end in.",
    traits: [], // Passive feature - no mechanical traits to process
  },
];

const zephyrFeatures: ClassFeature[] = [
  // Level 1
  {
    id: "iron-defense",
    level: 1,
    name: "Iron Defense",
    description: "Your armor equals DEX + STR as long as you are unarmored.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "swift-fists",
    level: 1,
    name: "Swift Fists",
    description:
      "Your unarmed strikes are not subject to disadvantage imposed by Rushed Attacks (see pg. 13 of the Core Rules), and their damage is 1d4 + STR.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 2
  {
    id: "swift-feet",
    level: 2,
    name: "Swift Feet",
    description: "While unarmored, gain +2 speed and +LVL Initiative.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "burst-of-speed",
    level: 2,
    name: "Burst of Speed",
    description:
      "When you roll Initiative, gain DEX Bursts of Speed to use during that encounter. (1/turn) You may spend 1 Burst of Speed to use any of the following maneuvers for free: Slipstream, Whirling Defense, Swiftstrike, Windstep.",
    traits: [
      {
        id: "burst-of-speed-0",
        type: "ability",
        ability: {
          id: "burst-of-speed",
          name: "Burst of Speed",
          description:
            "Gain DEX Bursts of Speed when rolling Initiative. Spend 1 per turn to use maneuvers for free.",
          type: "action",
          frequency: "per_encounter",
        },
      },
    ],
  },
  {
    id: "slipstream",
    level: 2,
    name: "Slipstream",
    description: "Defend, and the attack misses.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "whirling-defense",
    level: 2,
    name: "Whirling Defense",
    description: "Defend and apply your armor to every attack this round.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "swiftstrike",
    level: 2,
    name: "Swiftstrike",
    description: "Attack on your turn, and ignore disadvantage from Rushed Attacks.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "windstep",
    level: 2,
    name: "Windstep",
    description: "Move on your turn, ignoring difficult terrain.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 3
  {
    id: "subclass",
    level: 3,
    name: "Subclass",
    description: "Choose a Zephyr subclass.",
    traits: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "kinetic-momentum",
    level: 3,
    name: "Kinetic Momentum",
    description: "Whenever you gain a Wound, gain a Burst of Speed.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "ethereal-projection",
    level: 3,
    name: "Ethereal Projection",
    description:
      "(1/day) By meditating for at least 10 minutes, you can project an ethereal version of yourself up to 30 ft. away, passing through solid objects or barriers. You see through your projection's eyes, and it is visible to other creatures as a translucent version of yourself. It cannot interact physically with the environment but can move freely within the distance limit and lasts for up to 10 minutes.",
    traits: [
      {
        id: "ethereal-projection-0",
        type: "ability",
        ability: {
          id: "ethereal-projection",
          name: "Ethereal Projection",
          description:
            "Project an ethereal version of yourself up to 30 ft. away that can pass through solid objects.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  // Level 4
  {
    id: "unyielding-resolve",
    level: 4,
    name: "Unyielding Resolve",
    description:
      "Ignore the first Wound you would suffer each encounter (when Wounded abilities, such as Kinetic Momentum, still trigger).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "key-stat-increase-1",
    level: 4,
    name: "Key Stat Increase",
    description: "+1 DEX or STR.",
    traits: [
      {
        id: "key-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "martial-master-1",
    level: 4,
    name: "Martial Master",
    description: "Choose a Martial Arts ability.",
    traits: [
      {
        id: "martial-master-1-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 5
  {
    id: "reverberating-strikes",
    level: 5,
    name: "Reverberating Strikes",
    description:
      "You learn to focus your energy and transfer it as an additional concussive force into your foes. Add LVL bludgeoning damage to all of your melee attacks.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 INT or WIL.",
    traits: [
      {
        id: "secondary-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  // Level 6
  {
    id: "martial-master-2",
    level: 6,
    name: "Martial Master (2)",
    description: "Choose a 2nd Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-2-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "infuse-strength",
    level: 6,
    name: "Infuse Strength",
    description:
      "Action: Make an unarmed strike against an ally and infuse them with a portion of your own strength instead of harming them. Expend any number of Hit Dice and roll them as you would heal yourself during a Field Rest (roll them and add your STR to each).",
    traits: [
      {
        id: "infuse-strength-0",
        type: "ability",
        ability: {
          id: "infuse-strength",
          name: "Infuse Strength",
          description: "Strike an ally to heal them by expending Hit Dice and adding STR to each.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  // Level 7
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Zephyr subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 8
  {
    id: "martial-master-3",
    level: 8,
    name: "Martial Master (3)",
    description: "Choose a 3rd Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-3-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 DEX or STR.",
    traits: [
      {
        id: "key-stat-increase-2-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  // Level 9
  {
    id: "swift-feet-2",
    level: 9,
    name: "Swift Feet (2)",
    description: "Gain an additional +2 speed as long as you are unarmored.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 INT or WIL.",
    traits: [
      {
        id: "secondary-stat-increase-2-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  // Level 10
  {
    id: "martial-master-4",
    level: 10,
    name: "Martial Master (4)",
    description: "Choose a 4th Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-4-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "unyielding-resolve-2",
    level: 10,
    name: "Unyielding Resolve (2)",
    description: "Ignore the first 2 Wounds you would suffer each encounter.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 11
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Zephyr subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 12
  {
    id: "martial-master-5",
    level: 12,
    name: "Martial Master (5)",
    description: "Choose a 5th Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-5-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 DEX or STR.",
    traits: [
      {
        id: "key-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  // Level 13
  {
    id: "iron-defense-2",
    level: 13,
    name: "Iron Defense (2)",
    description: "Your armor is doubled while unarmored.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 INT or WIL.",
    traits: [
      {
        id: "secondary-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  // Level 14
  {
    id: "martial-master-6",
    level: 14,
    name: "Martial Master (6)",
    description: "Choose a 6th Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-6-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 15
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Zephyr subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 16
  {
    id: "martial-master-7",
    level: 16,
    name: "Martial Master (7)",
    description: "Choose a 7th Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-7-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 DEX or STR.",
    traits: [
      {
        id: "key-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  // Level 17
  {
    id: "unyielding-resolve-3",
    level: 17,
    name: "Unyielding Resolve (3)",
    description:
      "Ignore the first 3 Wounds you would suffer each encounter. You have advantage on STR saves while Dying.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 INT or WIL.",
    traits: [
      {
        id: "secondary-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  // Level 18
  {
    id: "martial-master-8",
    level: 18,
    name: "Martial Master (8)",
    description: "Choose an 8th Martial Arts Ability.",
    traits: [
      {
        id: "martial-master-8-0",
        type: "pick_feature_from_pool",
        poolId: "martial-arts-pool",
        choicesAllowed: 1,
      },
    ],
  },
  // Level 19
  {
    id: "epic-boon",
    level: 19,
    name: "Epic Boon",
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  // Level 20
  {
    id: "windborne",
    level: 20,
    name: "Windborne",
    description:
      "+1 to any 2 of your stats. +1 additional burst of speed when you roll Initiative. Permanently gain 1 action (while Dying, you have a max of 2 actions).",
    traits: [
      {
        id: "windborne-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
      {
        id: "windborne-1",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
    ],
  },
];

// Focus ability that appears at multiple levels
const focusAbility: ClassFeature = {
  id: "focus",
  level: 1,
  name: "Focus",
  description:
    "Whenever you spend time meditating alone in a windy place during a Safe Rest, you may choose different Zephyr options available to you.",
  traits: [], // Passive feature - no mechanical traits to process
};

export const zephyrClass: ClassDefinition = {
  id: "zephyr",
  name: "Zephyr",
  description:
    "A swift martial artist who combines unarmed combat with incredible speed and agility. Zephyrs master the art of movement and strikes, becoming untouchable whirlwinds in battle.",
  hitDieSize: 8,
  keyAttributes: ["dexterity", "strength"],
  startingHP: 13,
  armorProficiencies: [{ type: "freeform", name: "None" }],
  weaponProficiencies: [{ type: "freeform", name: "Melee Weapons" }],
  saveAdvantages: {
    dexterity: "advantage",
    intelligence: "disadvantage",
  },
  startingEquipment: ["staff", "traveling-robes", "sandals"],
  features: [...zephyrFeatures, focusAbility],
  featurePools: [
    {
      id: "martial-arts-pool",
      name: "Martial Arts Abilities",
      description: "Special martial arts techniques that Zephyrs can master.",
      features: martialArtsAbilities,
    },
  ],
};
