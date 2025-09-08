import { ClassDefinition, ClassFeature, FeaturePool } from "../../schemas/class";

// Shadow Invocations - Lesser Invocations Feature Pool
const lesserInvocations: ClassFeature[] = [
  {
    id: "abhorrent-speech",
    level: 2,
    name: "Abhorrent Speech",
    description: "You can communicate with horrible creatures (aberrations, undead, etc.).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "beguiling-influence",
    level: 2,
    name: "Beguiling Influence",
    description: "(1/day) You may reroll an Influence check.",
    effects: [
      {
        id: "beguiling-influence-0",
        type: "ability",
        ability: {
          id: "beguiling-influence",
          name: "Beguiling Influence",
          description: "Reroll an Influence check.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "blood-sight",
    level: 2,
    name: "Blood Sight",
    description:
      "(1/day) You may reroll an Examination check. Additionally, you can detect traces of blood on a surface, even after it has been cleaned.",
    effects: [
      {
        id: "blood-sight-0",
        type: "ability",
        ability: {
          id: "blood-sight",
          name: "Blood Sight",
          description: "Reroll an Examination check. You can also detect traces of blood.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
  {
    id: "devoted-acolyte",
    level: 2,
    name: "Devoted Acolyte",
    description:
      "Learn 2 of the following languages: Celestial, Draconic, Deep Speak, Infernal, or Primordial. Advantage on Lore checks related to those 2 languages.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "eldritch-sense",
    level: 2,
    name: "Eldritch Sense",
    description:
      "You can sense the presence of any shapechanger or creature concealed by magic while within 6 spaces of them.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "gaze-of-two-minds",
    level: 2,
    name: "Gaze of Two Minds",
    description:
      "Touch a willing creature and perceive through its senses instead of your own for as long as you hold concentration.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "knowledge-from-beyond",
    level: 2,
    name: "Knowledge from Beyond",
    description:
      "Whenever you fail an Insight or Arcana check, you may suffer 1 Wound to succeed instead.",
    effects: [
      {
        id: "knowledge-from-beyond-0",
        type: "ability",
        ability: {
          id: "knowledge-from-beyond",
          name: "Knowledge from Beyond",
          description: "Suffer 1 Wound to succeed on a failed Insight or Arcana check.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
  {
    id: "my-favored-pet",
    level: 2,
    name: "My Favored Pet",
    description:
      "One shadow minion can begrudgingly tolerate you outside of combat. It can (very creepily) do any menial task a below average commoner could.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "voice-of-the-dark",
    level: 2,
    name: "Voice of the Dark",
    description: "You can communicate telepathically with a humanoid within 6 spaces.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "whispers-of-the-grave",
    level: 2,
    name: "Whispers of the Grave",
    description:
      "(1/day) You can ask a dead creature 3 yes/no questions. It can never be questioned this way again.",
    effects: [
      {
        id: "whispers-of-the-grave-0",
        type: "ability",
        ability: {
          id: "whispers-of-the-grave",
          name: "Whispers of the Grave",
          description: "Ask a dead creature 3 yes/no questions.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "fixed", value: 1 },
        },
      },
    ],
  },
];

// Shadow Invocations - Greater Invocations Feature Pool
const greaterInvocations: ClassFeature[] = [
  {
    id: "armor-of-shadows",
    level: 2,
    name: "Armor of Shadows",
    description:
      "Reduce all damage you receive by an amount equal to the number of minions you have.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "fiendish-boon",
    level: 2,
    name: "Fiendish Boon",
    description: "Increase your DEX or INT by 1. You have 1 fewer maximum Hit Dice.",
    effects: [
      {
        id: "fiendish-boon-0",
        type: "attribute_boost",
        allowedAttributes: ["dexterity"],
        amount: 1,
      },
    ],
  },
  {
    id: "hungering-shadows",
    level: 2,
    name: "Hungering Shadows",
    description:
      "Whenever one of your shadows would crit, the next tiered spell you cast this encounter does not cost any use of Pilfered Power.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "one-with-shadows",
    level: 2,
    name: "One with Shadows",
    description:
      "Action: When you are in an area of dim light or darkness, you may become Invisible until you move or attack.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "repelling-blast",
    level: 2,
    name: "Repelling Blast",
    description:
      "When you hit a Medium or smaller creature with Shadow Blast, you can push the creature up to 2 spaces away from yourself.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "shadow-magus",
    level: 2,
    name: "Shadow Magus",
    description: "Your minions gain +4 Reach and deal 1d10 damage instead.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "shadow-spear",
    level: 2,
    name: "Shadow Spear",
    description:
      "Your Shadow Blast can target creatures twice as far away, it ignores cover, and you may attack Prone targets with advantage while it (instead of disadvantage).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "shadow-rush",
    level: 2,
    name: "Shadow Rush",
    description:
      "When your shadow minions attack, instead of rolling damage, you may have any of them deal the max amount, then die.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "shadow-warp",
    level: 2,
    name: "Shadow Warp",
    description:
      "Action: Switch places with a creature within 12 spaces that has been dealt necrotic damage this turn.",
    effects: [
      {
        id: "shadow-warp-0",
        type: "ability",
        ability: {
          id: "shadow-warp",
          name: "Shadow Warp",
          description:
            "Switch places with a creature within 12 spaces that has been dealt necrotic damage this turn.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "swarming-shadows",
    level: 2,
    name: "Swarming Shadows",
    description:
      "Whenever one of your shadows would crit, summon another shadow minion adjacent to the target.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "vengeful-blast",
    level: 2,
    name: "Vengeful Blast",
    description:
      "Whenever a minion dies, you may cast Shadow Blast as a reaction (even if you already cast it this turn).",
    effects: [
      {
        id: "vengeful-blast-0",
        type: "ability",
        ability: {
          id: "vengeful-blast",
          name: "Vengeful Blast",
          description: "Cast Shadow Blast as a reaction when a minion dies.",
          type: "action",
          frequency: "at_will",
        },
      },
    ],
  },
];

// Shadowmancer Features
const shadowmancerFeatures: ClassFeature[] = [
  {
    id: "conduit-of-shadow",
    level: 1,
    name: "Conduit of Shadow",
    description:
      "Your Patron grants you knowledge of: Shadow Blast (Necrotic cantrip) Action (1/turn) Range: 8 Damage: 1d12 + KEY. High Levels: +1d12 damage every 5 levels.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "summon-shadows",
    level: 1,
    name: "Summon Shadows",
    description:
      "(Necrotic cantrip) High Levels: +1 Reach every 5 levels. Action: Summon a shadow minion within Reach 1 (you can summon a max of INT or LVL minions this way, whichever is lower). Action (1/turn) Command ALL of your minions to move 6 then attack (Reach 1, 1d12 each).",
    effects: [
      {
        id: "summon-shadows-0",
        type: "ability",
        ability: {
          id: "summon-shadows",
          name: "Summon Shadows",
          description:
            "Summon a shadow minion within Reach 1. Command ALL minions to move 6 then attack.",
          type: "action",
          frequency: "at_will",
          actionCost: 1,
        },
      },
    ],
  },
  {
    id: "master-of-darkness",
    level: 2,
    name: "Master of Darkness",
    description: "Your Patron grants you knowledge of Necrotic cantrips and tier 1 spells.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "pilfered-power",
    level: 2,
    name: "Pilfered Power",
    description:
      "You may steal power from your patron to cast tiered spells, always casting them at the highest tier you have unlocked. You can do this DEX times before your patron takes notice. Each time you exceed this limit, your patron damages you for half your max HP as recompense. This limit resets when you commune with your patron during a Safe Rest.",
    effects: [
      {
        id: "pilfered-power-0",
        type: "ability",
        ability: {
          id: "pilfered-power",
          name: "Pilfered Power",
          description:
            "Cast tiered spells at highest unlocked tier. DEX uses before patron takes notice.",
          type: "action",
          frequency: "per_safe_rest",
          maxUses: { type: "formula", expression: "DEX" },
        },
      },
    ],
  },
  {
    id: "the-pact-is-sealed",
    level: 3,
    name: "THE PACT IS SEALED",
    description: "Choose a subclass and 1 Lesser Shadow Invocation.",
    effects: [
      {
        id: "the-pact-is-sealed-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "key-stat-increase-1",
    level: 4,
    name: "Key Stat Increase",
    description: "+1 INT or DEX.",
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
    id: "gift-from-the-master-1",
    level: 4,
    name: "A Gift from the Master",
    description: "Choose 1 Greater Shadow Invocation.",
    effects: [
      {
        id: "gift-from-the-master-1-0",
        type: "pick_feature_from_pool",
        poolId: "greater-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "tier-2-spells",
    level: 5,
    name: "Tier 2 Spells",
    description: "You may now cast tier 2 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-2-spells-0",
        type: "spell_tier_access",
        maxTier: 2,
      },
    ],
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
    description: "+1 STR or WIL.",
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
    id: "gift-from-the-master-2",
    level: 6,
    name: "A Gift from the Master (2)",
    description:
      "Choose a 2nd Greater Shadow Invocation. Shadowmastery: Choose 1 Necrotic Utility Spell.",
    effects: [
      {
        id: "gift-from-the-master-2-0",
        type: "pick_feature_from_pool",
        poolId: "greater-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "shadowmastery-1",
    level: 6,
    name: "Shadowmastery",
    description: "Choose 1 Necrotic Utility Spell.",
    effects: [
      {
        id: "shadowmastery-1-0",
        type: "spell_school",
        schoolId: "shadow",
      },
    ],
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Shadowmancer subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "tier-3-spells",
    level: 7,
    name: "Tier 3 Spells",
    description: "You may now cast tier 3 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-3-spells-0",
        type: "spell_tier_access",
        maxTier: 3,
      },
    ],
  },
  {
    id: "key-stat-increase-2",
    level: 8,
    name: "Key Stat Increase",
    description: "+1 INT or DEX.",
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
    id: "lesser-invocation-2",
    level: 8,
    name: "Lesser Invocation (2)",
    description: "Choose a 2nd Lesser Shadow Invocation.",
    effects: [
      {
        id: "lesser-invocation-2-0",
        type: "pick_feature_from_pool",
        poolId: "lesser-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "gift-from-the-master-3",
    level: 9,
    name: "A Gift from the Master (3)",
    description: "Choose a 3rd Greater Shadow Invocation.",
    effects: [
      {
        id: "gift-from-the-master-3-0",
        type: "pick_feature_from_pool",
        poolId: "greater-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "tier-4-spells",
    level: 10,
    name: "Tier 4 Spells",
    description: "You may now cast tier 4 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-4-spells-0",
        type: "spell_tier_access",
        maxTier: 4,
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
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Shadowmancer subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "lesser-invocation-3",
    level: 11,
    name: "Lesser Invocation (3)",
    description: "Choose a 3rd Lesser Shadow Invocation.",
    effects: [
      {
        id: "lesser-invocation-3-0",
        type: "pick_feature_from_pool",
        poolId: "lesser-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "greedy-pact",
    level: 12,
    name: "Greedy Pact",
    description:
      "When you would take damage from Pilfer Power, make a STR save: 1-9: Suffer damage as normal. 10-19: Suffer only 10 HP of damage. 20+: Suffer no damage and cast the spell as if it were 1 tier higher.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "key-stat-increase-3",
    level: 12,
    name: "Key Stat Increase",
    description: "+1 INT or DEX.",
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
    id: "tier-5-spells",
    level: 13,
    name: "Tier 5 Spells",
    description: "You may now cast tier 5 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-5-spells-0",
        type: "spell_tier_access",
        maxTier: 5,
      },
    ],
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "gift-from-the-master-4",
    level: 14,
    name: "A Gift from the Master (4)",
    description: "Choose a 4th Greater Shadow Invocation.",
    effects: [
      {
        id: "gift-from-the-master-4-0",
        type: "pick_feature_from_pool",
        poolId: "greater-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "shadowmastery-2",
    level: 14,
    name: "Shadowmastery (2)",
    description: "You know all Necrotic Utility Spells.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Shadowmancer subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "upgraded-cantrips-3",
    level: 15,
    name: "Upgraded Cantrips",
    description: "Your cantrips grow stronger.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "tier-6-spells",
    level: 16,
    name: "Tier 6 Spells",
    description: "You may now cast tier 6 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-6-spells-0",
        type: "spell_tier_access",
        maxTier: 6,
      },
    ],
  },
  {
    id: "key-stat-increase-4",
    level: 16,
    name: "Key Stat Increase",
    description: "+1 INT or DEX.",
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
    id: "dire-shadows",
    level: 17,
    name: "Dire Shadows",
    description:
      "Attacks against your shadow minions are made with disadvantage. They take no damage from successful saves.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 STR or WIL.",
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
    id: "gift-from-the-master-5",
    level: 18,
    name: "A Gift from the Master (5)",
    description: "Choose a 5th Greater Shadow Invocation.",
    effects: [
      {
        id: "gift-from-the-master-5-0",
        type: "pick_feature_from_pool",
        poolId: "greater-invocations",
        choicesAllowed: 1,
      },
    ],
  },
  {
    id: "tier-7-spells",
    level: 19,
    name: "Tier 7 Spells",
    description: "You may now cast tier 7 spells; all of your spells are cast at this tier.",
    effects: [
      {
        id: "tier-7-spells-0",
        type: "spell_tier_access",
        maxTier: 7,
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
    id: "eldritch-usurper",
    level: 20,
    name: "Eldritch Usurper",
    description:
      "+1 to any 2 of your stats. Whenever you summon a single shadow minion, summon 2 instead. They die only when they receive 12 or more damage at one time.",
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

// Main Class Definition
export const shadowmancer: ClassDefinition = {
  id: "shadowmancer",
  name: "Shadowmancer",
  description:
    "A dark warlock who has made a pact with a powerful shadow entity, wielding necrotic magic and summoning shadow minions.",
  hitDieSize: 8,
  keyAttributes: ["intelligence", "dexterity"],
  startingHP: 13,
  armorProficiencies: [{ type: "cloth" }],
  weaponProficiencies: [{ type: "freeform", name: "Blades, Wands" }],
  saveAdvantages: { intelligence: "advantage", will: "advantage" },
  startingEquipment: ["adventurers-garb", "sickle", "shovel"],
  features: shadowmancerFeatures,
  featurePools: [
    {
      id: "lesser-invocations",
      name: "Lesser Shadow Invocations",
      description:
        "Minor powers granted by your shadow patron that enhance your abilities outside of combat.",
      features: lesserInvocations,
    },
    {
      id: "greater-invocations",
      name: "Greater Shadow Invocations",
      description:
        "Major powers granted by your shadow patron that enhance your combat abilities and shadow magic.",
      features: greaterInvocations,
    },
  ],
};

export const shadowmancerClass = shadowmancer;
