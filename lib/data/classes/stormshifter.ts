import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition, FeaturePool } from "../../schemas/class";

// Chimeric Boons - Feature Pool
const chimericBoonsFeatures: ClassFeature[] = [
  {
    id: "beast-of-the-sea",
    level: 1,
    name: "Beast of the Sea",
    description: "Can move, breathe, and fight underwater without penalty.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "climber",
    level: 1,
    name: "Climber",
    description: "Can walk across walls and ceilings, ignores difficult terrain.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "fleet-footed",
    level: 1,
    name: "Fleet Footed",
    description: "+2 speed. Advantage on Stealth checks against the Grappled condition.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "earthwalker",
    level: 1,
    name: "Earthwalker",
    description:
      "+2 armor. Can burrow through dirt and unworked rock at half speed (leaving a tunnel behind). Advantage against the Prone condition.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "keen-senses",
    level: 1,
    name: "Keen Senses",
    description: "Advantage on Perception and Assess checks. Unaffected by Blinded.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "leader-of-the-pack",
    level: 1,
    name: "Leader of the Pack",
    description:
      "Advantage against fear and charm effects for yourself and allies within 6 spaces.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "phasebeast",
    level: 1,
    name: "Phasebeast",
    description:
      "Whenever you shift between this form and your normal form (and vice versa), you may teleport up to 6 spaces away to a place you can see.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "prehensile-tail",
    level: 1,
    name: "Prehensile Tail",
    description:
      "Creatures you hit in melee that are your size or smaller are Grappled. If you hit a larger creature, you may move with it when it moves.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "winged",
    level: 1,
    name: "Winged",
    description: "Gain a flying speed. Forced movement moves you twice as far while flying.",
    effects: [], // Passive feature - no mechanical effects to process
  },
];

const stormshifterFeatures: ClassFeature[] = [
  // Level 1
  {
    id: "master-of-storms",
    level: 1,
    name: "Master of Storms",
    description: "You know cantrips from the Lightning and Wind schools.",
    effects: [
      {
        id: "master-of-storms-0",
        type: "spell_school",
        schoolId: "lightning",
      },
      {
        id: "master-of-storms-1",
        type: "spell_school",
        schoolId: "wind",
      }
    ],
  },
  {
    id: "beastshift",
    level: 1,
    name: "Beastshift",
    description:
      "Action: You can transform into a harmless beast (squirrel, pigeon, etc.). While transformed, you can speak with animals. This form lasts until you drop to 0 HP, cast a spell, or if you end the form for free. You have DEX Beastshift charges; they reset on a Safe Rest.",
    effects: [
      {
        id: "beastshift-0",
        type: "ability",
        ability: {
          id: "beastshift",
          name: "Beastshift",
          description:
            "Transform into a harmless beast. While transformed, you can speak with animals. Lasts until you drop to 0 HP, cast a spell, or end it for free.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 2 },
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "tiny-beasts",
    level: 1,
    name: "Tiny Beasts",
    description:
      "Whenever you shapeshift into a Tiny beast, attacks against you are made with disadvantage, but ANY damage ends that shapeshift form.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 2
  {
    id: "direbeast-form",
    level: 2,
    name: "Direbeast Form",
    description: "You can Beastshift into a Fearsome Beast.",
    effects: [
      {
        id: "direbeast-form-0",
        type: "ability",
        ability: {
          id: "direbeast-form",
          name: "Direbeast Form",
          description: "Beastshift into a Fearsome Beast.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 2 },
        },
      },
    ],
  },
  {
    id: "mana-and-unlock-tier-1-spells",
    level: 2,
    name: "Mana and Unlock Tier 1 Spells",
    description:
      "You unlock tier 1 Wind and Lightning spells and gain a mana pool to cast these spells. This mana pool's maximum is always equal to (WIL × 3) + LVL and recharges on a Safe Rest.",
    effects: [
      {
        id: "mana-and-unlock-tier-1-spells-0",
        type: "resource",
        resourceDefinition: {
          id: "mana",
          name: "Mana",
          description: "Natural energy used to cast spells",
          colorScheme: "cyan-storm",
          icon: "zap",
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
  // Level 3
  {
    id: "subclass",
    level: 3,
    name: "Subclass",
    description: "Choose a Stormshifter subclass.",
    effects: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "direbeast-form-2",
    level: 3,
    name: "Direbeast Form (2)",
    description: "You can Beastshift into a Beast of the Pack.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 4
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
    description: "+1 WIL or DEX.",
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
    id: "stormcaller",
    level: 4,
    name: "Stormcaller",
    description: "Learn a Utility Spell from each spell school you know.",
    effects: [
      {
        id: "stormcaller-0",
        type: "utility_spells",
        numberOfSpells: 1,
        selectionMode: "per_school",
      },
    ],
  },
  {
    id: "be-wild",
    level: 4,
    name: "Be Wild",
    description:
      "Whenever you spend a day with wild animals during a Safe Rest, you may choose different Stormshifter options available to you.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 5
  {
    id: "direbeast-form-3",
    level: 5,
    name: "Direbeast Form (3)",
    description: "You can Beastshift into a Beast of Nightmares.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-1",
    level: 5,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    effects: [
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
    id: "chimeric-boon",
    level: 6,
    name: "Chimeric Boon",
    description:
      "Choose 2 Chimeric Boons. Whenever you shapeshift into a Direbeast form, you may modify it with 1 Chimeric Boon you know.",
    effects: [
      {
        id: "chimeric-boon-0",
        type: "pick_feature_from_pool",
        poolId: "chimeric-boons-pool",
        choicesAllowed: 2,
      },
    ],
  },
  {
    id: "expert-shifter",
    level: 6,
    name: "Expert Shifter",
    description: "Gain 1 additional use of Beastshift per Safe Rest.",
    effects: [], // Passive feature - no mechanical effects to process
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
  // Level 7
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Stormshifter subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "stormcaller-2",
    level: 7,
    name: "Stormcaller (2)",
    description: "Learn a 2nd Utility Spell from each spell school you know.",
    effects: [
      {
        id: "stormcaller-2-0",
        type: "utility_spells",
        numberOfSpells: 1,
        selectionMode: "per_school",
      },
    ],
  },
  // Level 8
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
    description: "+1 WIL or DEX.",
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
    id: "stormborn",
    level: 8,
    name: "Stormborn",
    description:
      "Gain resistance to lightning damage. (1/day) You may gain advantage on a Naturecraft check or Concentration check.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 9
  {
    id: "chimeric-boon-2",
    level: 9,
    name: "Chimeric Boon (2)",
    description: "Choose a 3rd Chimeric Boon.",
    effects: [
      {
        id: "chimeric-boon-2-0",
        type: "pick_feature_from_pool",
        poolId: "chimeric-boons-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "expert-shifter-2",
    level: 9,
    name: "Expert Shifter (2)",
    description: "Gain 1 additional use of Beastshift per Safe Rest.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    effects: [
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
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 11
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Stormshifter subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 12
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
    description: "+1 WIL or DEX.",
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
    id: "chimeric-boon-4",
    level: 12,
    name: "Chimeric Boon (4)",
    description: "Select a 4th Chimeric Boon.",
    effects: [
      {
        id: "chimeric-boon-4-0",
        type: "pick_feature_from_pool",
        poolId: "chimeric-boons-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "expert-shifter-3",
    level: 12,
    name: "Expert Shifter (3)",
    description: "Gain 1 additional use of Beastshift per Safe Rest.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 13
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
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
    id: "stormborn-2",
    level: 13,
    name: "Stormborn (2)",
    description:
      "Instead of rolling dice, deal the max damage of a Wind spell by spending a charge of your Beastshift, you may cast a cantrip for free.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 14
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
  // Level 15
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Stormshifter subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-3",
    level: 15,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 16
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
    description: "+1 WIL or DEX.",
    effects: [
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
    id: "chimeric-boon-5",
    level: 17,
    name: "Chimeric Boon (5)",
    description: "Select a 5th Chimeric Boon.",
    effects: [
      {
        id: "chimeric-boon-5-0",
        type: "pick_feature_from_pool",
        poolId: "chimeric-boons-pool",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 STR or INT.",
    effects: [
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
  // Level 19
  {
    id: "epic-boon",
    level: 19,
    name: "Epic Boon",
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  // Level 20
  {
    id: "archdruid",
    level: 20,
    name: "Archdruid",
    description:
      "+1 to any 2 of your stats. (1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-4",
    level: 20,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [], // Passive feature - no mechanical effects to process
  },
];

// Direbeast Forms definitions
const direbestFormsPool: FeaturePool = {
  id: "direbeast-forms-pool",
  name: "Direbeast Forms",
  description: "Different beast forms that Stormshifters can transform into.",
  features: [
    {
      id: "fearsome-beast",
      level: 2,
      name: "Fearsome Beast (Large)",
      description:
        "Transform into any Large beast. Gain DEX + LVL temp HP (until Beastshift ends), melee attack, armor, Gore. Action: 1d6 + LVL damage, on hit: Gain LVL temp HP. Fearsome. Whenever you Interpose or Defend, you may spend 1 mana to force them to reroll (if you must choose either result).",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "beast-of-the-pack",
      level: 3,
      name: "Beast of the Pack (Medium)",
      description:
        "Transform into a Medium beast. Gain +DEX speed, Supercharge, and the Thunderfang attack. Whenever you crit or kill one or more enemies, Thunderfang gains a cumulative +1d6 damage (resets at end combat). Thunderfang. Action: 1d4 + LVL piercing damage. Supercharge. Spend up to WIL mana, and your next Thunderfang attack deals an additional 1d8 lightning damage per mana spent (you take this damage on a miss).",
      effects: [], // Passive feature - no mechanical effects to process
    },
    {
      id: "beast-of-nightmares",
      level: 5,
      name: "Beast of Nightmares (Tiny)",
      description:
        "Transform into any Tiny beast or insect (provided it is horrible). Gain the Sting attack and Silent But Deadly. Sting. (1/round) Action: Reach: 0. 1d4 piercing + 3×LVL acid damage (ignoring armor), on crit: 4×LVL damage instead. Silent But Deadly. Speed: 2. You cannot Defend or Interpose. Attackers cannot target you until you become conspicuous (e.g., being seen transforming).",
      effects: [], // Passive feature - no mechanical effects to process
    },
  ],
};

export const stormshifterClass: ClassDefinition = {
  id: "stormshifter",
  name: "Stormshifter",
  description:
    "A primal spellcaster who masters the storms and transforms into various beast forms. Stormshifters blend natural magic with shapeshifting abilities to adapt to any situation.",
  hitDieSize: 8,
  keyAttributes: ["will", "dexterity"],
  startingHP: 13,
  armorProficiencies: [{ type: "cloth" }, { type: "leather" }],
  weaponProficiencies: [
    { type: "freeform", name: "Staves" },
    { type: "freeform", name: "Wands" },
  ],
  saveAdvantages: {
    will: "advantage",
    strength: "disadvantage",
  },
  startingEquipment: ["cheap-hides", "staff", "strange-plant"],
  features: stormshifterFeatures,
  featurePools: [
    {
      id: "chimeric-boons-pool",
      name: "Chimeric Boons",
      description: "Special modifications that can be applied to Direbeast forms.",
      features: chimericBoonsFeatures,
    },
    direbestFormsPool,
  ],
};
