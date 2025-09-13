import { ClassFeature } from "@/lib/schemas/features";

import { ClassDefinition } from "../../schemas/class";

// Lyrical Weaponry - Feature Pool
const lyricalWeaponry: ClassFeature[] = [
  {
    id: "heroic-ballad",
    level: 4,
    name: "Heroic Ballad",
    description:
      "+2 max Songweaver's Inspiration charges. When used to reroll an attack, your Songweaver's Inspiration also grants them +WIL damage on the attack.",
    traits: [
      {
        id: "heroic-ballad-0",
        type: "ability",
        ability: {
          id: "heroic-ballad",
          name: "Heroic Ballad",
          description: "Songweaver's Inspiration grants +WIL damage when used to reroll attacks.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "inspiring-anthem",
    level: 4,
    name: "Inspiring Anthem",
    description:
      "(1/encounter) Action: Grant all friendly Dying creatures who can hear you 1d4 + WIL+1 actions.",
    traits: [
      {
        id: "inspiring-anthem-0",
        type: "ability",
        ability: {
          id: "inspiring-anthem",
          name: "Inspiring Anthem",
          description: "Grant all friendly Dying creatures who can hear you 1d4 + WIL+1 actions.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "not-my-beautiful-feaaaah",
    level: 4,
    name: "Not My Beautiful Feaaaah!",
    description:
      "(1/encounter) When you Defend, force the attacker to roll again or be defended within range on a failed WIL save (if there is none, the attack fails). If they fail by 5 or more, they attack themselves as punishment for even thinking they could harm you! On save, they attack you with disadvantage.",
    traits: [
      {
        id: "not-my-beautiful-feaaaah-0",
        type: "ability",
        ability: {
          id: "not-my-beautiful-feaaaah",
          name: "Not My Beautiful Feaaaah!",
          description: "When defending, force attacker to make WIL save or be redirected.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "rhapsody-of-the-normal",
    level: 4,
    name: "Rhapsody of the Normal",
    description:
      "When you roll 4 or more on your Vicious Mockery, you may spend a Songweaver's Inspiration charge to temporarily suppress any special abilities they have until the end of their next turn. They can do what an untrained average villager can do, attack once for 1d4 damage and move up to 6 spaces (no armor, spellcasting, flying, extraordinary or other inherent or trained features).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "song-of-domination",
    level: 4,
    name: "Song of Domination",
    description:
      "(1/encounter) 2 actions: Play a haunting tune, and all enemies within 6 spaces who hear it must make a WIL save. If they fail, you move them up to 6 spaces in any direction, and they cannot move on their next turn.",
    traits: [
      {
        id: "song-of-domination-0",
        type: "ability",
        ability: {
          id: "song-of-domination",
          name: "Song of Domination",
          description: "Enemies who fail WIL save are moved 6 spaces and cannot move next turn.",
          type: "action",
          frequency: "per_encounter",
          maxUses: { type: "fixed", value: 1 },
          actionCost: 2,
        },
      },
    ],
  },
];

// A "People" Person - Feature Pool
const peoplePerson: ClassFeature[] = [
  {
    id: "stompy",
    level: 5,
    name: "Stompy",
    description:
      '3 actions: Summon a huge hill giant for 1 round. As he enters the battlefield adjacent to you, use Stompy\'s Stomp: Make a DC 10 Influence check. On a success, he moves 6 spaces in a direction you choose; on a failure, he moves towards YOU instead ("YOU NOT FRIEND!"). He deals everything in his path damage equal to LVL + Influence check. ANY creature within 6 spaces of Stompy can use this ability once instead of an attack. (advantage if you ask him to do something he would find mischievous or fun, with disadvantage if it is something that hurt good or menial).',
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "mal-the-malevolent-imp",
    level: 5,
    name: "Mal, the Malevolent Imp",
    description:
      "Summon a tiny fiend for 1 night. He can find out dangerous information you have no right to know. DC 10 \"Devil's Choice\" of a problem with only the slightest chance of things going wrong. Make an Influence check to convince him to help you. Gran Gran (NOT a hag): When resting, you may summon her for 1 hour to soothe your wounds (and hassle you for not eating enough). She bakes and hands out pastries equal to your WIL+INT. Eating one recovers one mana, Hit Die, or Wound. Eat them while they're warm! They expire in 10 minutes.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "gran-gran-not-a-hag",
    level: 5,
    name: "Gran Gran (NOT a hag)",
    description:
      "When resting, you may summon her for 1 hour to soothe your wounds (and hassle you for not eating enough). She bakes and hands out pastries equal to your WIL+INT. Eating one recovers one mana, Hit Die, or Wound. Eat them while they're warm! They expire in 10 minutes.",
    traits: [
      {
        id: "gran-gran-not-a-hag-0",
        type: "ability",
        ability: {
          id: "gran-gran",
          name: "Gran Gran (NOT a hag)",
          description: "Summon Gran Gran to bake healing pastries during rest.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "linos-the-everfriendly",
    level: 5,
    name: "Linos, the Everfriendly",
    description:
      "Summon a legendary helpful friendly creature to take you and your party wherever you need to go. He may request a very large amount of food as payment.",
    traits: [], // Passive feature - no mechanical traits to process
  },
];

// Songweaver Features
const songweaverFeatures: ClassFeature[] = [
  {
    id: "wind-spellcasting",
    level: 1,
    name: "Wind Spellcasting and...",
    description:
      "You know cantrips from the Wind school and 1 other school of your choice. You also know the cantrip Vicious Mockery.",
    traits: [
      {
        id: "wind-spellcasting-0",
        type: "spell_school",
        schoolId: "wind",
      },
      {
        id: "wind-spellcasting-1",
        type: "spell_school_choice",
        numberOfChoices: 1,
      },
      {
        id: "vicious-mockery-0",
        type: "ability",
        ability: {
          id: "vicious-mockery",
          name: "Vicious Mockery",
          description:
            "Action: Range: 12. Damage: 1d4 + INT psychic (ignoring armor). On hit: the target is Taunted during their next turn. High Levels: +2 damage every 5 levels.",
          type: "spell",
          school: "wind",
          tier: 0,
          category: "combat",
          actionCost: 1,
          diceFormula: "1d4+INT",
        },
      },
    ],
  },
  {
    id: "songweavers-inspiration",
    level: 1,
    name: "Songweaver's Inspiration",
    description:
      "(2×WIL times/Safe Rest) Free Reaction: Allow an ally to reroll a single die related to an attack or save (must keep either result).",
    traits: [
      {
        id: "songweavers-inspiration-0",
        type: "ability",
        ability: {
          id: "songweavers-inspiration",
          name: "Songweaver's Inspiration",
          description: "Allow an ally to reroll a single die for an attack or save.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "formula", expression: "2 * WIL" },
        },
      },
    ],
  },
  {
    id: "mana-and-unlock-tier-1-spells",
    level: 2,
    name: "Mana Pool",
    description:
      "You unlock tier 1 spells in the schools you know and gain a mana pool to cast them. This mana pool's maximum is always equal to (INT×3)+LVL and recharges on a Safe Rest.",
    traits: [
      {
        id: "mana-and-unlock-tier-1-spells-0",
        type: "resource",
        resourceDefinition: {
          id: "mana",
          name: "Mana",
          description: "Magical energy used to cast spells",
          colorScheme: "purple-arcane",
          icon: "music",
          resetCondition: "safe_rest",
          resetType: "to_max",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "formula", expression: "(INT * 3) + LVL" },
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
    id: "jack-of-all-trades",
    level: 2,
    name: "Jack of All Trades",
    description: "When you Safe Rest, you may move a skill point as if you just leveled up.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "song-of-rest",
    level: 2,
    name: "Song of Rest",
    description:
      "(1/day) Whenever you Field Rest, you may play a song and allow anyone who spends Hit Dice to heal additional HP equal to your WIL.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "subclass",
    level: 3,
    name: "Subclass",
    description: "Choose a Songweaver subclass.",
    traits: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "quick-wit",
    level: 3,
    name: "Quick Wit",
    description:
      "When you roll Initiative, you may regain 2 spent uses of your Songweaver's Inspiration (these expire at the end of combat if left unused).",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "windbag",
    level: 3,
    name: "Windbag",
    description: "Choose 1 Utility Spell from each spell school you know.",
    traits: [
      {
        id: "windbag-0",
        type: "utility_spells",
        numberOfSpells: 1,
        selectionMode: "per_school",
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
    description: "+1 WIL or INT.",
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
    id: "lyrical-weaponry-1",
    level: 4,
    name: "Lyrical Weaponry",
    description: "Choose 1 ability from the Lyrical Weaponry list.",
    traits: [
      {
        id: "lyrical-weaponry-1-0",
        type: "pick_feature_from_pool",
        poolId: "lyrical-weaponry",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "people-person",
    level: 5,
    name: 'A "People" Person',
    description:
      "You've met many people in your travels; some have even agreed to come to your aid should you need it. Choose 2 friends you know: you can temporarily summon 1 using song (1/Safe Rest each).",
    traits: [
      {
        id: "people-person-0",
        type: "pick_feature_from_pool",
        poolId: "people-person",
        choicesAllowed: 2,
      },
    ],
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
    description: "+1 STR or DEX.",
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
    id: "windbag-2",
    level: 6,
    name: "Windbag (2)",
    description: "Choose a 2nd Utility Spell from each spell school you know.",
    traits: [
      {
        id: "windbag-2-0",
        type: "utility_spells",
        numberOfSpells: 1,
        selectionMode: "per_school",
      },
    ],
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Songweaver subclass feature.",
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
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 WIL or INT.",
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
    id: "lyrical-weaponry-2",
    level: 9,
    name: "Lyrical Weaponry (2)",
    description: "Choose a 2nd ability from the Lyrical Weaponry list.",
    traits: [
      {
        id: "lyrical-weaponry-2-0",
        type: "pick_feature_from_pool",
        poolId: "lyrical-weaponry",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Songweaver subclass feature.",
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "tier-6-spells",
    level: 12,
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
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 WIL or INT.",
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
    id: "lyrical-weaponry-3",
    level: 13,
    name: "Lyrical Weaponry (3)",
    description: "Choose a 3rd ability from the Lyrical Weaponry list.",
    traits: [
      {
        id: "lyrical-weaponry-3-0",
        type: "pick_feature_from_pool",
        poolId: "lyrical-weaponry",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    id: "tier-7-spells",
    level: 14,
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
    id: "windbag-3",
    level: 14,
    name: "Windbag (3)",
    description: "You know all Utility Spells from the spell schools you know.",
    traits: [
      {
        id: "windbag-3-0",
        type: "utility_spells",
        numberOfSpells: 1,
        selectionMode: "per_school",
      },
    ],
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Songweaver subclass feature.",
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
    id: "tier-8-spells",
    level: 16,
    name: "Tier 8 Spells",
    description: "You may now cast tier 8 spells and upcast spells at tier 8.",
    traits: [
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
    description: "+1 WIL or INT.",
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
    id: "lyrical-weaponry-4",
    level: 17,
    name: "Lyrical Weaponry (4)",
    description: "Choose a 4th ability from the Lyrical Weaponry list.",
    traits: [
      {
        id: "lyrical-weaponry-4-0",
        type: "pick_feature_from_pool",
        poolId: "lyrical-weaponry",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    id: "tier-9-spells",
    level: 18,
    name: "Tier 9 Spells",
    description: "You may now cast tier 9 spells and upcast spells at tier 9.",
    traits: [
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
    traits: [], // Passive feature - no mechanical traits to process
  },
  {
    id: "im-so-famous",
    level: 20,
    name: "I'm So Famous!",
    description:
      "+1 to any 2 of your stats. Your Songweaver's Inspiration cannot fail (your target succeeds).",
    traits: [], // Passive feature - no mechanical traits to process
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

// Main Class Definition
export const songweaver: ClassDefinition = {
  id: "songweaver",
  name: "Songweaver",
  description:
    "A charismatic bard who weaves magic through song and story, inspiring allies and mocking enemies.",
  hitDieSize: 8,
  keyAttributes: ["will", "intelligence"],
  startingHP: 13,
  armorProficiencies: [{ type: "cloth" }, { type: "leather" }],
  weaponProficiencies: [{ type: "dexterity_weapons" }, { type: "freeform", name: "Wands" }],
  saveAdvantages: { will: "advantage", strength: "disadvantage" },
  startingEquipment: ["adventurers-garb", "instrument", "dagger", "mirror"],
  features: songweaverFeatures,
  featurePools: [
    {
      id: "lyrical-weaponry",
      name: "Lyrical Weaponry",
      description:
        "Musical abilities that weaponize your performances and enhance your bardic magic.",
      features: lyricalWeaponry,
    },
    {
      id: "people-person",
      name: 'A "People" Person',
      description: "Friends and allies you've met in your travels who can be summoned to aid you.",
      features: peoplePerson,
    },
  ],
};

export const songweaverClass = songweaver;
