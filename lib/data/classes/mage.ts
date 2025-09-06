import { ClassDefinition, ClassFeature } from "../../types/class";

const mageFeatures: ClassFeature[] = [
  {
    id: "elemental-spellcasting",
    level: 1,
    name: "Elemental Spellcasting",
    description: "You know Fire, Ice, and Lightning cantrips.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "mana-and-unlock-tier-1-spells",
    level: 2,
    name: "Mana Pool",
    description:
      "You unlock tier 1 Fire, Ice, and Lightning spells and gain a mana pool to cast these spells. This mana pool's maximum is always equal to (INT × 3) + LVL and recharges on a Safe Rest.",
    effects: [
      {
        id: "mana-and-unlock-tier-1-spells-0",
        type: "resource",
        resourceDefinition: {
          id: "mage-mana",
          name: "Mana",
          description: "Magical energy used to cast spells",
          colorScheme: "blue-magic",
          icon: "sparkles",
          resetCondition: "safe_rest",
          resetType: "to_max",
          minValue: { type: "fixed", value: 0 },
          maxValue: { type: "fixed", value: 20 }, // Will be calculated dynamically based on (INT × 3) + LVL
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
    id: "talented-researcher",
    level: 2,
    name: "Talented Researcher",
    description:
      "Gain advantage on Arcana or Lore checks when you have access to a large amount of books and time to study them.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "subclass",
    level: 3,
    name: "Mage Subclass",
    description: "Choose a Mage subclass.",
    effects: [
      {
        id: "subclass-0",
        type: "subclass_choice",
      },
    ],
  },
  {
    id: "elemental-mastery",
    level: 3,
    name: "Elemental Mastery",
    description: "Learn the Utility Spells from 1 spell school you know.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "spellshaper",
    level: 4,
    name: "Spellshaper",
    description:
      "You gain the ability to enhance your spells with powerful effects by spending additional mana. Choose 2 Spellshaper abilities.",
    effects: [
      {
        id: "spellshaper-0",
        type: "ability",
        ability: {
          id: "spellshaper",
          name: "Spellshaper",
          description: "Enhance your spells with powerful effects by spending additional mana.",
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
    description: "+1 INT or WIL.",
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
    id: "elemental-surge",
    level: 5,
    name: "Elemental Surge",
    description:
      "A surge of adrenaline and your attunement with the elements grants you additional power as combat begins. When you roll Initiative, regain WIL mana (this expires at the end of combat if unused).",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-1",
    level: 5,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
  {
    id: "elemental-mastery-2",
    level: 6,
    name: "Elemental Mastery (2)",
    description: "Learn the Utility Spells from a 2nd spell school you know.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "subclass-feature-7",
    level: 7,
    name: "Subclass Feature",
    description: "Gain your Mage subclass feature.",
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
    description: "+1 INT or WIL.",
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
    id: "spellshaper-2",
    level: 9,
    name: "Spellshaper (2)",
    description: "Choose 1 additional Spellshaper ability.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-2",
    level: 9,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    id: "elemental-surge-2",
    level: 10,
    name: "Elemental Surge (2)",
    description: "Your Elemental Surge ability now regains WIL + 1d4 mana.",
    effects: [], // Passive feature - no mechanical effects to process
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
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "subclass-feature-11",
    level: 11,
    name: "Subclass Feature",
    description: "Gain your Mage subclass feature.",
    effects: [], // Passive feature - no mechanical effects to process
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
    description: "+1 INT or WIL.",
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
    id: "spellshaper-3",
    level: 13,
    name: "Spellshaper (3)",
    description: "Choose 1 additional Spellshaper ability.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-3",
    level: 13,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    id: "elemental-mastery-3",
    level: 14,
    name: "Elemental Mastery (3)",
    description: "Learn the Utility Spells from a 3rd spell school you know.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "subclass-feature-15",
    level: 15,
    name: "Subclass Feature",
    description: "Gain your Mage subclass feature.",
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
    description: "+1 INT or WIL.",
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
    id: "elemental-surge-3",
    level: 17,
    name: "Elemental Surge (3)",
    description: "Your Elemental Surge ability now regains WIL + 2d4 mana.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "secondary-stat-increase-4",
    level: 17,
    name: "Secondary Stat Increase",
    description: "+1 STR or DEX.",
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
    description: "Choose an Epic Boon.",
    effects: [], // Passive feature - no mechanical effects to process
  },
  {
    id: "archmage",
    level: 20,
    name: "Archmage",
    description:
      "+1 to any 2 of your stats. The first tiered spell you cast each encounter costs 1 action less and 5 fewer mana.",
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

export const mage: ClassDefinition = {
  id: "mage",
  name: "Mage",
  description:
    "A master of elemental magic who wields fire, ice, and lightning to devastating effect.",
  hitDieSize: 6,
  keyAttributes: ["intelligence", "will"],
  startingHP: 10,
  armorProficiencies: [{ type: "cloth" }],
  weaponProficiencies: [{ type: "freeform", name: "Blades, Staves, Wands" }],
  saveAdvantages: { intelligence: "advantage", strength: "disadvantage" },
  startingEquipment: ["adventurers-garb", "staff", "soap"],
  features: mageFeatures,
};

export const mageClass = mage;
