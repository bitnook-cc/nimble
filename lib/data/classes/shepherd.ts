import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition } from "../../schemas/class";

// Sacred Graces - Feature Pool
const sacredGraces: ClassFeature[] = [
  {
    id: "assist-me-my-friend",
    level: 3,
    name: "Assist Me, My Friend!",
    description:
      "Whenever you make your first melee attack each round, you may add your Lifebinding Spirit's damage to the attack.",
    effects: [
      {
        id: "assist-me-my-friend-0",
        type: "ability",
        ability: {
          id: "assist-me-my-friend",
          name: "Assist Me, My Friend!",
          description:
            "Add your Lifebinding Spirit's damage to your first melee attack each round.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "empowered-companion",
    level: 3,
    name: "Empowered Companion",
    description:
      "Whenever you spend mana to call forth your Lifebinding Spirit, you cast it as if you spent 1 additional mana (ignoring the typical spell tier restrictions). The maximum die size is now a d20.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "guiding-spirit",
    level: 3,
    name: "Guiding Spirit",
    description:
      "When your Lifebinding Spirit rolls a 6 or higher on its damage die, the target begins to glow with radiant light. The next attack against that target has advantage.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "hasty-companion",
    level: 3,
    name: "Hasty Companion",
    description: "+4 Reach for your Lifebinding Spirit. It can also act for free when summoned.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "illuminate-soul",
    level: 3,
    name: "Illuminate Soul",
    description:
      "Action: A creature within 6 spaces begins to glow with radiant light. For 1 Round, attacks against them are made with your choice of advantage or disadvantage. You may do this WIL times per Safe Rest.",
    effects: [
      {
        id: "illuminate-soul-0",
        type: "ability",
        ability: {
          id: "illuminate-soul",
          name: "Illuminate Soul",
          description:
            "Make a creature glow with radiant light. Attacks against them have advantage or disadvantage for 1 round.",
          type: "action",
          frequency: "per_safe_rest",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "light-bearer",
    level: 3,
    name: "Light Bearer",
    description:
      "Regain 1 use of Searing Light when you roll Initiative (this expires if unspent at the end of combat).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "not-beyond-my-reach",
    level: 3,
    name: "Not Beyond MY Reach",
    description:
      "You may target creatures who have been dead less than 1 round for healing. For every 10 HP a dead creature is healed this way, you may have them recover 1 Wound instead (you must heal at least 1 Wound to revive them).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "vengeful-spirit",
    level: 3,
    name: "Vengeful Spirit",
    description:
      "Action: Your Lifebinding Spirit sacrifices itself to transform into a swirling vortex of radiant light. At the end of your turn, it damages all enemies within 3 spaces of you, ignoring armor and cover. This lasts for a number of rounds equal to the healing charges left on the Lifebinding Spirit. This effect ends early if you summon your spirit again.",
    effects: [
      {
        id: "vengeful-spirit-0",
        type: "ability",
        ability: {
          id: "vengeful-spirit",
          name: "Vengeful Spirit",
          description: "Transform your Lifebinding Spirit into a damaging vortex of radiant light.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
];

// Shepherd Features
const shepherdFeatures: ClassFeature[] = [
  {
    id: "keeper-of-life-and-death",
    level: 1,
    name: "Keeper of Life & Death",
    description:
      "You know Radiant and Necrotic cantrips. Searing Light (WIL times/Safe Rest) Action: Heal or Inflict grievous injuries: Heal WIL d8 HP to a Dying creature within Reach 6. OR: Inflict WIL d8 radiant damage to an undead or Bloodied enemy within Reach 6.",
    effects: [
      {
        id: "keeper-of-life-and-death-0",
        type: "spell_school",
        schoolId: "radiant",
      },
      {
        id: "keeper-of-life-and-death-1",
        type: "spell_school",
        schoolId: "necrotic",
      },
      {
        id: "keeper-of-life-and-death-2",
        type: "ability",
        ability: {
          id: "searing-light",
          name: "Searing Light",
          description:
            "Action: Heal or Inflict grievous injuries: Heal WIL d8 HP to a Dying creature within Reach 6. OR: Inflict WIL d8 radiant damage to an undead or Bloodied enemy within Reach 6.",
          type: "action",
          frequency: "per_safe_rest",
          actionCost: 1,
          maxUses: { type: "formula", expression: "WIL" },
          diceFormula: "WILd8",
        },
      },
    ],
  },
  {
    id: "mana-and-unlock-tier-1-spells",
    level: 2,
    name: "Mana Pool",
    description:
      "You unlock tier 1 Radiant and Necrotic spells and gain a mana pool to cast these spells. This mana pool's maximum is always equal to (WIL × 3) + LVL and recharges on a Safe Rest.",
    effects: [
      {
        id: "mana-and-unlock-tier-1-spells-0",
        type: "resource",
        resourceDefinition: {
          id: "mana",
          name: "Mana",
          description: "Divine energy used to cast spells",
          colorScheme: "yellow-divine",
          icon: "sun",
          resetCondition: "safe_rest",
          resetType: "to_max",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "formula", expression: "(WIL * 3) + LVL" },
        },
      },
      {
        id: "mana-and-unlock-tier-1-spells-1",
        type: "spell_tier_access",
        maxTier: 1,
      },
    ],
  },
  {
    id: "lifebinding-spirit",
    level: 2,
    name: "Lifebinding Spirit",
    description:
      "(Radiant Spell, Tier 1) Action: Summon a spirit companion that follows you and is immune to harm. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it. Action: It attacks or heals a creature within Reach 4. It attacks for 1d6 + WIL radiant damage (ignoring armor), or heals for the same amount. Upcasting: Increment its die size by 1 (max d12), +1 healing use.",
    effects: [
      {
        id: "lifebinding-spirit-0",
        type: "ability",
        ability: {
          id: "lifebinding-spirit",
          name: "Lifebinding Spirit",
          description: "Summon a spirit companion that can attack or heal.",
          type: "spell",
          school: "radiant",
          tier: 1,
          category: "combat",
          actionCost: 1,
          resourceCost: {
            type: "fixed",
            resourceId: "mana",
            amount: 1,
          },
        },
      },
    ],
  },
  {
    id: "subclass",
    level: 3,
    name: "Subclass",
    description: "Choose a Shepherd subclass.",
    effects: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "master-of-twilight-1",
    level: 3,
    name: "Master of Twilight",
    description: "Choose 1 Necrotic and 1 Radiant Utility Spell.",
    effects: [
      {
        id: "master-of-twilight-1-0",
        type: "utility_spells",
        schools: ["radiant", "necrotic"],
        selectionMode: "per_school" as const,
        numberOfSpells: 1,
      },
    ],
  },
  {
    id: "tier-2-spells",
    level: 4,
    name: "Tier 2 Spells",
    description: "You may now cast tier 2 spells and upcast spells at tier 2.",
    effects: [
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
    description: "+1 WIL or STR.",
    effects: [
      {
        id: "key-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 INT or DEX.",
    effects: [
      {
        id: "secondary-stat-increase-1-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "upgraded-cantrips-1",
    level: 5,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [
      {
        id: "upgraded-cantrips-1-0",
        type: "spell_scaling",
        multiplier: 1,
      },
    ],
  },
  {
    id: "sacred-grace-1",
    level: 5,
    name: "Sacred Grace",
    description: "Choose 2 Sacred Graces.",
    effects: [
      {
        id: "sacred-grace-1-0",
        type: "pick_feature_from_pool",
        poolId: "sacred-graces",
        choicesAllowed: 2,
      },
    ],
  },
  {
    id: "tier-3-spells",
    level: 6,
    name: "Tier 3 Spells",
    description: "You may now cast tier 3 spells and upcast spells at tier 3.",
    effects: [
      {
        id: "tier-3-spells-0",
        type: "spell_tier_access",
        maxTier: 3,
      },
    ],
  },
  {
    id: "master-of-twilight-2",
    level: 6,
    name: "Master of Twilight (2)",
    description: "Choose a 2nd Necrotic and Radiant Utility Spell.",
    effects: [
      {
        id: "master-of-twilight-2-0",
        type: "utility_spells",
        schools: ["radiant", "necrotic"],
        selectionMode: "per_school" as const,
        numberOfSpells: 1,
      },
    ],
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Shepherd subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "tier-4-spells",
    level: 8,
    name: "Tier 4 Spells",
    description: "You may now cast tier 4 spells and upcast spells at tier 4.",
    effects: [
      {
        id: "tier-4-spells-0",
        type: "spell_tier_access",
        maxTier: 4,
      },
    ],
  },
  {
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 WIL or STR.",
    effects: [
      {
        id: "key-stat-increase-2-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "sacred-grace-2",
    level: 9,
    name: "Sacred Grace (2)",
    description: "Choose a 3rd Sacred Grace.",
    effects: [
      {
        id: "sacred-grace-2-0",
        type: "pick_feature_from_pool",
        poolId: "sacred-graces",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 INT or DEX.",
    effects: [
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
    effects: [
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
    effects: [
      {
        id: "upgraded-cantrips-2-0",
        type: "spell_scaling",
        multiplier: 2,
      },
    ],
  },
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Shepherd subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "master-of-twilight-3",
    level: 11,
    name: "Master of Twilight (3)",
    description: "You know all Necrotic and Radiant Utility Spells.",
    effects: [
      {
        id: "master-of-twilight-3-0",
        type: "utility_spells",
        schools: ["radiant", "necrotic"],
        selectionMode: "per_school" as const,
        numberOfSpells: 1,
      },
    ],
  },
  {
    id: "tier-6-spells",
    level: 12,
    name: "Tier 6 Spells",
    description: "You may now cast tier 6 spells and upcast spells at tier 6.",
    effects: [
      {
        id: "tier-6-spells-0",
        type: "spell_tier_access",
        maxTier: 6,
      },
    ],
  },
  {
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 WIL or STR.",
    effects: [
      {
        id: "key-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "sacred-grace-3",
    level: 13,
    name: "Sacred Grace (3)",
    description: "Choose a 4th Sacred Grace.",
    effects: [
      {
        id: "sacred-grace-3-0",
        type: "pick_feature_from_pool",
        poolId: "sacred-graces",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 INT or DEX.",
    effects: [
      {
        id: "secondary-stat-increase-3-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "tier-7-spells",
    level: 14,
    name: "Tier 7 Spells",
    description: "You may now cast tier 7 spells and upcast spells at tier 7.",
    effects: [
      {
        id: "tier-7-spells-0",
        type: "spell_tier_access",
        maxTier: 7,
      },
    ],
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Shepherd subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-3",
    level: 15,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [
      {
        id: "upgraded-cantrips-3-0",
        type: "spell_scaling",
        multiplier: 3,
      },
    ],
  },
  {
    id: "tier-8-spells",
    level: 16,
    name: "Tier 8 Spells",
    description: "You may now cast tier 8 spells and upcast spells at tier 8.",
    effects: [
      {
        id: "tier-8-spells-0",
        type: "spell_tier_access",
        maxTier: 8,
      },
    ],
  },
  {
    id: "key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 WIL or STR.",
    effects: [
      {
        id: "key-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["intelligence", "will"],
        amount: 1,
      },
    ],
  },
  {
    id: "revitalizing-blessing",
    level: 17,
    name: "Revitalizing Blessing",
    description:
      "(1/round) Whenever you roll a 6 or higher on one or more healing die, the target may recover one Wound.",
    effects: [
      {
        id: "revitalizing-blessing-0",
        type: "ability",
        ability: {
          id: "revitalizing-blessing",
          name: "Revitalizing Blessing",
          description: "When you roll 6+ on healing dice, target may recover one Wound.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 INT or DEX.",
    effects: [
      {
        id: "secondary-stat-increase-4-0",
        type: "attribute_boost",
        allowedAttributes: ["strength", "dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "tier-9-spells",
    level: 18,
    name: "Tier 9 Spells",
    description: "You may now cast tier 9 spells and upcast spells at tier 9.",
    effects: [
      {
        id: "tier-9-spells-0",
        type: "spell_tier_access",
        maxTier: 9,
      },
    ],
  },
  {
    id: "epic-boon",
    level: 19,
    name: "Epic Boon",
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "twilight-sage",
    level: 20,
    name: "Twilight Sage",
    description: "+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-4",
    level: 20,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [
      {
        id: "upgraded-cantrips-4-0",
        type: "spell_scaling",
        multiplier: 4,
      },
    ],
  },
];

// Main Class Definition
export const shepherd: ClassDefinition = {
  id: "shepherd",
  name: "Shepherd",
  description:
    "A divine warrior who walks the line between life and death, wielding both radiant and necrotic magic to heal allies and harm enemies.",
  hitDieSize: 10,
  keyAttributes: ["will", "strength"],
  startingHP: 17,
  armorProficiencies: [{ type: "mail" }, { type: "shields" }],
  weaponProficiencies: [{ type: "strength_weapons" }, { type: "freeform", name: "Wands" }],
  saveAdvantages: { will: "advantage", dexterity: "disadvantage" },
  startingEquipment: ["rusty-mail", "mace", "wooden-buckler", "bell"],
  features: shepherdFeatures,
  featurePools: [
    {
      id: "sacred-graces",
      name: "Sacred Graces",
      description: "Divine gifts that enhance your Lifebinding Spirit and grant special abilities.",
      features: sacredGraces,
    },
  ],
};

export const shepherdClass = shepherd;
