import { ClassDefinition } from "@/lib/schemas/class";
import { ClassFeature } from "@/lib/schemas/features";

// Thrill of the Hunt abilities - Feature Pool
const thrillOfTheHuntFeatures: ClassFeature[] = [
  {
    id: "addling-arrow",
    level: 1,
    name: "Addling Arrow",
    description:
      "Action: Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random.",
    traits: [
      {
        id: "addling-arrow-0",
        type: "ability",
        ability: {
          id: "addling-arrow",
          name: "Addling Arrow",
          description:
            "Attack with a ranged weapon. The next attack the target makes must be against the closest other creature, chosen at random.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "come-get-some",
    level: 1,
    name: "Come Get Some!",
    description: "Action: Attack a target. It is Taunted by you until the end of their next turn.",
    traits: [
      {
        id: "come-get-some-0",
        type: "ability",
        ability: {
          id: "come-get-some",
          name: "Come Get Some!",
          description: "Attack a target. It is Taunted by you until the end of their next turn.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "decoy",
    level: 1,
    name: "Decoy",
    description:
      "When you Defend: The attack misses instead, and you can move up to half your speed away (where you really were all along!).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "fleet-feet",
    level: 1,
    name: "Fleet Feet",
    description: "Move up to your speed for free, ignoring difficult terrain.",
    traits: [
      {
        id: "fleet-feet-0",
        type: "ability",
        ability: {
          id: "fleet-feet",
          name: "Fleet Feet",
          description: "Move up to your speed for free, ignoring difficult terrain.",
          type: "action",
          frequency: "at_will",
          actionCost: 0,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "grease-trap",
    level: 1,
    name: "Grease Trap",
    description:
      "(1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Target falls Prone, is vulnerable to the next fire damage it takes, and is treated as if it is Smoldering.",
    traits: [
      {
        id: "grease-trap-0",
        type: "ability",
        ability: {
          id: "grease-trap",
          name: "Grease Trap",
          description:
            "Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Target falls Prone, is vulnerable to the next fire damage it takes, and is treated as if it is Smoldering.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
          actionCost: 0,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "hail-of-arrows",
    level: 1,
    name: "Hail of Arrows",
    description:
      "(Half range) 2 actions: Shoot all creatures within a 3×3 area. Their speed is halved until the end of their next turn.",
    traits: [
      {
        id: "hail-of-arrows-0",
        type: "ability",
        ability: {
          id: "hail-of-arrows",
          name: "Hail of Arrows",
          description:
            "(Half range) Shoot all creatures within a 3×3 area. Their speed is halved until the end of their next turn.",
          type: "action",
          frequency: "at_will",
          actionCost: 2,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "heavy-shot",
    level: 1,
    name: "Heavy Shot",
    description:
      "(Half range) Action: Attack with a ranged weapon and push your target: 4 spaces for a small creature, 2 for a medium creature, 1 for a large creature.",
    traits: [
      {
        id: "heavy-shot-0",
        type: "ability",
        ability: {
          id: "heavy-shot",
          name: "Heavy Shot",
          description:
            "(Half range) Attack with a ranged weapon and push your target: 4 spaces for a small creature, 2 for a medium creature, 1 for a large creature.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "incendiary-shot",
    level: 1,
    name: "Incendiary Shot",
    description: "(Half range) Action: Attack with a ranged weapon, add WIL d8 fire damage.",
    traits: [
      {
        id: "incendiary-shot-0",
        type: "ability",
        ability: {
          id: "incendiary-shot",
          name: "Incendiary Shot",
          description: "(Half range) Attack with a ranged weapon, add WIL d8 fire damage.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "multishot",
    level: 1,
    name: "Multishot",
    description:
      "(Half range) Action: Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces of them to take the same amount of damage.",
    traits: [
      {
        id: "multishot-0",
        type: "ability",
        ability: {
          id: "multishot",
          name: "Multishot",
          description:
            "(Half range) Attack your quarry with a ranged weapon and load an extra projectile. Select a 2nd target within 2 spaces of them to take the same amount of damage.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "pinning-shot",
    level: 1,
    name: "Pinning Shot",
    description:
      "Spend 3 actions shooting your quarry. They are Restrained until they can escape (DC 10+WIL).",
    traits: [
      {
        id: "pinning-shot-0",
        type: "ability",
        ability: {
          id: "pinning-shot",
          name: "Pinning Shot",
          description: "Shoot your quarry. They are Restrained until they can escape (DC 10+WIL).",
          type: "action",
          frequency: "at_will",
          actionCost: 3,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "snare-trap",
    level: 1,
    name: "Snare Trap",
    description:
      "(1/encounter) Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL).",
    traits: [
      {
        id: "snare-trap-0",
        type: "ability",
        ability: {
          id: "snare-trap",
          name: "Snare Trap",
          description:
            "Reaction (when an enemy moves adjacent to you or an ally within 6 spaces): Move them back 1 space, they are Restrained until they can escape (DC 10+WIL).",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
          actionCost: 0,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "sharpshooter",
    level: 1,
    name: "Sharpshooter",
    description:
      "Action: If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage.",
    traits: [
      {
        id: "sharpshooter-0",
        type: "ability",
        ability: {
          id: "sharpshooter",
          name: "Sharpshooter",
          description:
            "If you have not moved this turn and your quarry is 4 or more spaces away, attack them for double damage.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "vital-shot",
    level: 1,
    name: "Vital Shot",
    description:
      "(Half Range) Action: Attack your Hampered quarry with a ranged weapon, ignoring their armor or doubling your Hunter's Mark damage bonus if they have none.",
    traits: [
      {
        id: "vital-shot-0",
        type: "ability",
        ability: {
          id: "vital-shot",
          name: "Vital Shot",
          description:
            "(Half Range) Attack your Hampered quarry with a ranged weapon, ignoring their armor or doubling your Hunter's Mark damage bonus if they have none.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "wild-instinct",
    level: 1,
    name: "Wild Instinct",
    description:
      "(1/round, costs 0 TotH charges if you have none.) Assess for free, with advantage.",
    traits: [
      {
        id: "wild-instinct-0",
        type: "ability",
        ability: {
          id: "wild-instinct",
          name: "Wild Instinct",
          description:
            "(1/round, costs 0 TotH charges if you have none.) Assess for free, with advantage.",
          type: "action",
          frequency: "per_turn",
          maxUses: { type: "fixed", value: 1 },
          actionCost: 0,
          resourceCost: {
            type: "fixed",
            resourceId: "thrill-of-the-hunt-charges",
            amount: 1,
          },
        },
      },
    ],
  },
];

const hunterFeatures: ClassFeature[] = [
  {
    id: "hunters-mark",
    level: 1,
    name: "Hunter's Mark",
    description:
      "Mark a creature as your quarry for 1 day. It can't be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage.",
    traits: [
      {
        id: "hunters-mark-0",
        type: "ability",
        ability: {
          id: "hunters-mark",
          name: "Hunter's Mark",
          description:
            "Mark a creature you can see as your quarry for 1 day (or until you mark another creature). It can't be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage (choose before each attack).",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "forager",
    level: 1,
    name: "Forager",
    description: "Gain advantage on skill checks to find food and water in the wild.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "thrill-of-the-hunt-resource",
    level: 2,
    name: "Thrill of the Hunt Charges",
    description:
      "Charges used to fuel Thrill of the Hunt abilities. Gain charges when your quarry dies or when you hit your quarry in melee/crit at range.",
    traits: [
      {
        id: "thrill-of-the-hunt-resource-0",
        type: "resource",
        resourceDefinition: {
          id: "thrill-of-the-hunt-charges",
          name: "Thrill of the Hunt",
          description: "Charges used to fuel Hunter abilities",
          colorScheme: "green-nature",
          icon: "zap",
          resetCondition: "encounter_end",
          resetType: "to_zero",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "fixed", value: 10 },
        },
      },
      {
        id: "thrill-of-the-hunt-resource-1",
        type: "ability",
        ability: {
          id: "gain-charge",
          name: "Gain Charge",
          description: "Gain 1 Thrill of the Hunt charge.",
          type: "action",
          frequency: "at_will",
          actionCost: 0,
          effects: [
            {
              type: "resourceChange",
              resourceId: "thrill-of-the-hunt-charges",
              diceFormula: "1",
            },
          ],
        },
      },
    ],
  },
  {
    id: "thrill-of-the-hunt-1",
    level: 2,
    name: "Thrill of the Hunt",
    description:
      "Choose 2 Thrill of the Hunt (ToH) abilities. Gain a charge to use these abilities during that encounter whenever:\n• Your quarry dies.\n• You hit your quarry in melee or crit your quarry at range.",
    traits: [
      {
        id: "thrill-of-the-hunt-1-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 2,
      },
    ],
  },
  {
    id: "roll-and-strike",
    level: 2,
    name: "Roll & Strike",
    description:
      "If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.",
    traits: [
      {
        id: "roll-and-strike-0",
        type: "ability",
        ability: {
          id: "roll-and-strike",
          name: "Roll & Strike",
          description:
            "If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "remember-the-wild",
    level: 2,
    name: "Remember the Wild",
    description:
      "Whenever you spend a day in the wilderness during a Safe Rest, you may choose different Hunter options available to you.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass",
    level: 3,
    name: "Hunter Subclass",
    description: "Choose a Hunter subclass.",
    traits: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "trackers-intuition",
    level: 3,
    name: "Tracker's Intuition",
    description:
      "You can discern the events of a past encounter by studying tracks and other subtle environmental clues, accurately determining the kind and amount of creatures, their direction, key actions, and passage of time.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "thrill-of-the-hunt-2",
    level: 4,
    name: "Thrill of the Hunt (2)",
    description: "Choose a 3rd Thrill of the Hunt ability.",
    traits: [
      {
        id: "thrill-of-the-hunt-2-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-1",
    level: 4,
    name: "Key Stat Increase",
    description: "+1 DEX or WIL.",
    traits: [
      {
        id: "key-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "explorer-of-the-wilds",
    level: 4,
    name: "Explorer of the Wilds",
    description: "+2 speed, gain a climbing speed.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "hunters-resolve",
    level: 5,
    name: "Hunter's Resolve",
    description:
      "Whenever you have no Thrill of the Hunt charges, gain Hunter's Resolve until the end of your turn: treat all creatures as your quarry for the purposes of movement and melee attacks.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "final-takedown",
    level: 5,
    name: "Final Takedown",
    description:
      "Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter's Mark. If they survive, they crit you back.",
    traits: [
      {
        id: "final-takedown-0",
        type: "ability",
        ability: {
          id: "final-takedown",
          name: "Final Takedown",
          description:
            "Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter's Mark. If they survive, they crit you back.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    traits: [
      {
        id: "secondary-stat-increase-1-0",

        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "versatile-bowmaster",
    level: 6,
    name: "Versatile Bowmaster",
    description:
      "Whenever you attack with a Longbow, you may roll 2d4 instead of 1d8; or with a Crossbow, 2d8 instead of 4d4.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "thrill-of-the-hunt-3",
    level: 6,
    name: "Thrill of the Hunt (3)",
    description: "Choose a 4th Thrill of the Hunt ability.",
    traits: [
      {
        id: "thrill-of-the-hunt-3-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Hunter subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "thrill-of-the-hunt-4",
    level: 8,
    name: "Thrill of the Hunt (4)",
    description: "Choose a 5th Thrill of the Hunt ability.",
    traits: [
      {
        id: "thrill-of-the-hunt-4-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 DEX or WIL.",
    traits: [
      {
        id: "key-stat-increase-2-0",

        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "no-escape",
    level: 9,
    name: "No Escape",
    description:
      "Whenever you see one or more allies make an opportunity attack, you may also make a ranged opportunity attack against the same target.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    traits: [
      {
        id: "secondary-stat-increase-2-0",

        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "veteran-stalker",
    level: 10,
    name: "Veteran Stalker",
    description:
      "Gain a Thrill of the Hunt charge whenever you are first Bloodied in an encounter and for every Wound you gain.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "keen-eye-steady-hand",
    level: 10,
    name: "Keen Eye, Steady Hand",
    description: "Add WIL to your ranged weapon damage.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Hunter subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "thrill-of-the-hunt-5",
    level: 12,
    name: "Thrill of the Hunt (5)",
    description: "Choose a 6th Thrill of the Hunt ability.",
    traits: [
      {
        id: "thrill-of-the-hunt-5-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 DEX or WIL.",
    traits: [
      {
        id: "key-stat-increase-3-0",

        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "keen-sight",
    level: 13,
    name: "Keen Sight",
    description: "Advantage on Perception checks.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    traits: [
      {
        id: "secondary-stat-increase-3-0",

        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "thrill-of-the-hunt-6",
    level: 14,
    name: "Thrill of the Hunt (6)",
    description: "Choose a 7th Thrill of the Hunt ability.",
    traits: [
      {
        id: "thrill-of-the-hunt-6-0",
        type: "pick_feature_from_pool",
        poolId: "thrill-of-the-hunt-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Hunter subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 DEX or WIL.",
    traits: [
      {
        id: "key-stat-increase-4-0",

        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "peerless-hunter",
    level: 17,
    name: "Peerless Hunter",
    description: "You can Defend against your quarry for free.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    traits: [
      {
        id: "secondary-stat-increase-4-0",

        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "wild-endurance",
    level: 18,
    name: "Wild Endurance",
    description: "Gain 1 Thrill of the Hunt charge at the start of your turns.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "epic-boon",
    level: 19,
    name: "Epic Boon",
    description: "Choose an Epic Boon.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "nemesis",
    level: 20,
    name: "Nemesis",
    description:
      "+1 to any 2 of your stats. Your Hunter's Mark can target any number of creatures simultaneously.",
    traits: [
      {
        id: "nemesis-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
      {
        id: "nemesis-1",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
    ],
  },
];

export const hunter: ClassDefinition = {
  id: "hunter",
  name: "Hunter",
  description:
    "A master tracker and wilderness survivor who forms a bond with nature and excels at ranged combat.",
  hitDieSize: 8,
  keyAttributes: ["dexterity", "will"],
  startingHP: 13,
  armorProficiencies: [{ type: "leather" }],
  weaponProficiencies: [{ type: "dexterity_weapons" }],
  saveAdvantages: {},
  startingEquipment: ["shortbow", "cheap-hides", "dagger", "hunting-trap"],
  features: hunterFeatures,
  featurePools: [
    {
      id: "thrill-of-the-hunt-pool",
      name: "Thrill of the Hunt",
      description:
        "A collection of special abilities that Hunters can use by spending Thrill of the Hunt charges. Each ability costs 1 charge to use and cannot miss. Abilities that spend charges cannot generate new ones. Unused charges are lost when combat ends.",
      features: thrillOfTheHuntFeatures,
    },
  ],
};

export const hunterClass = hunter;
