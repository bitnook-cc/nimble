import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition } from "../../schemas/class";

const oathswornFeatures: ClassFeature[] = [
  {
    id: "radiant-judgment",
    level: 1,
    name: "Radiant Judgment",
    description:
      "Whenever an enemy attacks you, if you have no Judgment Dice, roll your Judgment dice (2d6). On your next melee attack this encounter, if you hit, deal that much additional radiant damage. The dice are expended whether you hit or miss.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "lay-on-hands",
    level: 1,
    name: "Lay on Hands",
    description:
      "Gain a magical pool of healing power. This pool's maximum is always equal to 5 × LVL and recharges on a Safe Rest. Action: Touch a target and spend any amount of remaining healing power to restore that many HP.",
    traits: [
      {
        id: "lay-on-hands-pool-0",
        type: "resource",
        resourceDefinition: {
          id: "lay-on-hands-pool",
          name: "Lay on Hands",
          description: "Healing power to restore HP",
          colorScheme: "yellow-radiant",
          icon: "heart",
          resetCondition: "safe_rest",
          resetType: "to_max",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "formula", expression: "5 * LVL" },
        },
      },
      {
        id: "lay-on-hands-0",
        type: "ability",
        ability: {
          id: "lay-on-hands",
          name: "Lay on Hands",
          description:
            "Touch a target and spend any amount of remaining healing power to restore that many HP.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
          resourceCost: {
            type: "variable",
            resourceId: "lay-on-hands-pool",
            minAmount: 1,
          },
        },
      },
    ],
  },
  {
    id: "mana-and-radiant-spellcasting",
    level: 2,
    name: "Mana Pool",
    description:
      "You know Radiant cantrips, tier 1 Radiant spells, and gain a mana pool. Your mana pool is equal to WIL + LVL and recharges on a Safe Rest.",
    traits: [
      {
        id: "mana-and-radiant-spellcasting-0",
        type: "resource",
        resourceDefinition: {
          id: "mana",
          name: "Mana",
          description: "Divine energy used to cast spells",
          colorScheme: "yellow-radiant",
          icon: "sun",
          resetCondition: "safe_rest",
          resetType: "to_max",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "formula", expression: "WIL + LVL" },
        },
      },
      {
        id: "mana-and-radiant-spellcasting-1",
        type: "spell_tier_access",
        maxTier: 1,
      },
    ],
  },
  {
    id: "zealot",
    level: 2,
    name: "Zealot",
    description:
      "When you melee attack with a melee weapon, you may spend mana (up to your highest unlocked spell tier) to choose one for each mana spent:\n• Condemning Strike: Deal +5 radiant damage.\n• Blessed Aim: Decrease your target's armor by 1 step for this attack.",
    traits: [
      {
        id: "zealot-0",
        type: "ability",
        ability: {
          id: "zealot",
          name: "Zealot",
          description:
            "Enhance melee attacks by spending mana for Condemning Strike (+5 radiant damage) or Blessed Aim (decrease target's armor by 1 step).",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "paragon-of-virtue",
    level: 2,
    name: "Paragon of Virtue",
    description:
      "Advantage on Influence checks to convince someone when you are forthrightly telling the truth, disadvantage when misleading.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass",
    level: 3,
    name: "Sacred Oath",
    description: "Commit yourself to an Oath and gain its benefits.",
    traits: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "radiant-judgment-2",
    level: 3,
    name: "Radiant Judgment (2)",
    description: "Your Judgment Dice are d8s.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "sacred-decree-1",
    level: 3,
    name: "Sacred Decree",
    description: "Learn 1 Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "serve-selflessly",
    level: 3,
    name: "Serve Selflessly",
    description:
      "Whenever you perform a notable selfless act during a Safe Rest, you may choose different Oathsworn options available to you.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "my-life-for-my-friends",
    level: 4,
    name: "My Life, for My Friends",
    description: "You can Interpose for free.",
    traits: [
      {
        id: "my-life-for-my-friends-0",
        type: "ability",
        ability: {
          id: "my-life-for-my-friends",
          name: "My Life, for My Friends",
          description: "You can Interpose for free.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "tier-2-spells",
    level: 4,
    name: "Tier 2 Spells",
    description: "You may now cast tier 2 spells and upcast spells at tier 2.",
    traits: [
      {
        id: "tier-2-spells-0",
        type: "spell_tier_access",
        maxTier: 2,
      },
    ],
  },
  {
    id: "key-stat-increase-1",
    level: 4,
    name: "Key Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "radiant-judgment-3",
    level: 5,
    name: "Radiant Judgment (3)",
    description: "Your Judgment Dice are d10s.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "upgraded-cantrips-1",
    level: 5,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    traits: [
      {
        id: "upgraded-cantrips-1-0",
        type: "spell_scaling",
        multiplier: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 DEX or INT.",
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
    id: "tier-3-spells",
    level: 6,
    name: "Tier 3 Spells",
    description: "You may now cast tier 3 spells and upcast spells at tier 3.",
    traits: [
      {
        id: "tier-3-spells-0",
        type: "spell_tier_access",
        maxTier: 3,
      },
    ],
  },
  {
    id: "sacred-decree-2",
    level: 6,
    name: "Sacred Decree (2)",
    description: "Learn a 2nd Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Oathsworn subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "master-of-radiance-1",
    level: 7,
    name: "Master of Radiance",
    description: "Choose 1 Radiant Utility Spell.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "tier-4-spells",
    level: 8,
    name: "Tier 4 Spells",
    description: "You may now cast tier 4 spells and upcast spells at tier 4.",
    traits: [
      {
        id: "tier-4-spells-0",
        type: "spell_tier_access",
        maxTier: 4,
      },
    ],
  },
  {
    id: "radiant-judgment-4",
    level: 8,
    name: "Radiant Judgment (4)",
    description: "Your Judgment Dice are d12s.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "sacred-decree-3",
    level: 9,
    name: "Sacred Decree (3)",
    description: "Learn a 3rd Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 DEX or INT.",
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
    id: "tier-5-spells",
    level: 10,
    name: "Tier 5 Spells",
    description: "You may now cast tier 5 spells and upcast spells at tier 5.",
    traits: [
      {
        id: "tier-5-spells-0",
        type: "spell_tier_access",
        maxTier: 5,
      },
    ],
  },
  {
    id: "upgraded-cantrips-2",
    level: 10,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    traits: [
      {
        id: "upgraded-cantrips-2-0",
        type: "spell_scaling",
        multiplier: 2,
      },
    ],
  },
  {
    id: "radiant-judgment-5",
    level: 10,
    name: "Radiant Judgment (5)",
    description: "Your Judgment Dice are d20s.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Oathsworn subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "master-of-radiance-2",
    level: 11,
    name: "Master of Radiance (2)",
    description: "Choose a 2nd Radiant Utility Spell.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "sacred-decree-4",
    level: 12,
    name: "Sacred Decree (4)",
    description: "Learn a 4th Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "tier-6-spells",
    level: 13,
    name: "Tier 6 Spells",
    description: "You may now cast tier 6 spells and upcast spells at tier 6.",
    traits: [
      {
        id: "tier-6-spells-0",
        type: "spell_tier_access",
        maxTier: 6,
      },
    ],
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 DEX or INT.",
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
    id: "sacred-decree-5",
    level: 14,
    name: "Sacred Decree (5)",
    description: "Learn a 5th Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "radiant-judgment-6",
    level: 14,
    name: "Radiant Judgment (6)",
    description: "Whenever you roll Judgment Dice, roll 1 more.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Oathsworn subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "upgraded-cantrips-3",
    level: 15,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    traits: [
      {
        id: "upgraded-cantrips-3-0",
        type: "spell_scaling",
        multiplier: 3,
      },
    ],
  },
  {
    id: "sacred-decree-6",
    level: 16,
    name: "Sacred Decree (6)",
    description: "Learn a 6th Sacred Decree.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "tier-7-spells",
    level: 17,
    name: "Tier 7 Spells",
    description: "You may now cast tier 7 spells and upcast spells at tier 7.",
    traits: [
      {
        id: "tier-7-spells-0",
        type: "spell_tier_access",
        maxTier: 7,
      },
    ],
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 DEX or INT.",
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
    id: "unending-judgment",
    level: 18,
    name: "Unending Judgment",
    description: "While you have no Judgment Dice, gain +5 damage to melee attacks.",
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
    id: "glorious-paragon",
    level: 20,
    name: "Glorious Paragon",
    description: "+1 to any 2 of your stats. Defend for free whenever you Interpose.",
    traits: [
      {
        id: "glorious-paragon-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
      {
        id: "glorious-paragon-1",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity", "intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "upgraded-cantrips-4",
    level: 20,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    traits: [
      {
        id: "upgraded-cantrips-4-0",
        type: "spell_scaling",
        multiplier: 4,
      },
    ],
  },
];

export const oathsworn: ClassDefinition = {
  id: "oathsworn",
  name: "Oathsworn",
  description: "A holy warrior bound by sacred oaths, wielding radiant magic and divine judgment.",
  hitDieSize: 10,
  keyAttributes: ["strength", "will"],
  startingHP: 17,
  armorProficiencies: [{ type: "cloth" }, { type: "leather" }, { type: "mail" }, { type: "plate" }],
  weaponProficiencies: [{ type: "strength_weapons" }],
  saveAdvantages: { strength: "advantage", dexterity: "disadvantage" },
  startingEquipment: ["mace", "rusty-mail", "wooden-buckler", "manacles"],
  features: oathswornFeatures,
};

export const oathswornClass = oathsworn;
