import { ClassDefinition, ClassFeature } from '../../types/class';

const mageFeatures: ClassFeature[] = [
  {
    id: 'elemental-spellcasting',
    level: 1,
    type: 'passive_feature',
    name: 'Elemental Spellcasting',
    description: 'You know Fire, Ice, and Lightning cantrips.',
    category: 'combat'
  },
  {
    id: 'mana-and-unlock-tier-1-spells',
    level: 2,
    type: 'resource',
    name: 'Mana Pool',
    description: 'You unlock tier 1 Fire, Ice, and Lightning spells and gain a mana pool to cast these spells. This mana pool\'s maximum is always equal to (INT × 3) + LVL and recharges on a Safe Rest.',
    resourceDefinition: {
      id: 'mage-mana',
      name: 'Mana',
      description: 'Magical energy used to cast spells',
      colorScheme: 'blue-magic',
      icon: 'sparkles',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: 0,
      maxValue: 20 // Will be calculated dynamically based on (INT × 3) + LVL
    },
    startingAmount: 7 // Starting at level 2 with assumed INT 2: (2 × 3) + 1 = 7
  },
  {
    id: 'talented-researcher',
    level: 2,
    type: 'passive_feature',
    name: 'Talented Researcher',
    description: 'Gain advantage on Arcana or Lore checks when you have access to a large amount of books and time to study them.',
    category: 'exploration'
  },
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Mage Subclass',
    description: 'Choose a Mage subclass.'
  },
  {
    id: 'elemental-mastery',
    level: 3,
    type: 'passive_feature',
    name: 'Elemental Mastery',
    description: 'Learn the Utility Spells from 1 spell school you know.',
    category: 'utility'
  },
  {
    id: 'spellshaper',
    level: 4,
    type: 'ability',
    name: 'Spellshaper',
    description: 'You gain the ability to enhance your spells with powerful effects by spending additional mana. Choose 2 Spellshaper abilities.',
    ability: {
      id: 'spellshaper',
      name: 'Spellshaper',
      description: 'Enhance your spells with powerful effects by spending additional mana.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'tier-2-spells',
    level: 4,
    type: 'spell_tier_access',
    name: 'Tier 2 Spells',
    description: 'You may now cast tier 2 spells and upcast spells at tier 2.',
    maxTier: 2
  },
  {
    id: 'key-stat-increase-1',
    level: 4,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'elemental-surge',
    level: 5,
    type: 'passive_feature',
    name: 'Elemental Surge',
    description: 'A surge of adrenaline and your attunement with the elements grants you additional power as combat begins. When you roll Initiative, regain WIL mana (this expires at the end of combat if unused).',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or DEX.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'upgraded-cantrips-1',
    level: 5,
    type: 'passive_feature',
    name: 'Upgraded Cantrips',
    description: 'Your cantrips grow stronger.',
    category: 'combat'
  },
  {
    id: 'tier-3-spells',
    level: 6,
    type: 'spell_tier_access',
    name: 'Tier 3 Spells',
    description: 'You may now cast tier 3 spells and upcast spells at tier 3.',
    maxTier: 3
  },
  {
    id: 'elemental-mastery-2',
    level: 6,
    type: 'passive_feature',
    name: 'Elemental Mastery (2)',
    description: 'Learn the Utility Spells from a 2nd spell school you know.',
    category: 'utility'
  },
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Mage subclass feature.',
    category: 'combat'
  },
  {
    id: 'tier-4-spells',
    level: 8,
    type: 'spell_tier_access',
    name: 'Tier 4 Spells',
    description: 'You may now cast tier 4 spells and upcast spells at tier 4.',
    maxTier: 4
  },
  {
    id: 'key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'spellshaper-2',
    level: 9,
    type: 'passive_feature',
    name: 'Spellshaper (2)',
    description: 'Choose 1 additional Spellshaper ability.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or DEX.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'elemental-surge-2',
    level: 10,
    type: 'passive_feature',
    name: 'Elemental Surge (2)',
    description: 'Your Elemental Surge ability now regains WIL + 1d4 mana.',
    category: 'combat'
  },
  {
    id: 'tier-5-spells',
    level: 10,
    type: 'spell_tier_access',
    name: 'Tier 5 Spells',
    description: 'You may now cast tier 5 spells and upcast spells at tier 5.',
    maxTier: 5
  },
  {
    id: 'upgraded-cantrips-2',
    level: 10,
    type: 'passive_feature',
    name: 'Upgraded Cantrips',
    description: 'Your cantrips grow stronger.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Mage subclass feature.',
    category: 'combat'
  },
  {
    id: 'tier-6-spells',
    level: 12,
    type: 'spell_tier_access',
    name: 'Tier 6 Spells',
    description: 'You may now cast tier 6 spells and upcast spells at tier 6.',
    maxTier: 6
  },
  {
    id: 'key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'spellshaper-3',
    level: 13,
    type: 'passive_feature',
    name: 'Spellshaper (3)',
    description: 'Choose 1 additional Spellshaper ability.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or DEX.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'tier-7-spells',
    level: 14,
    type: 'spell_tier_access',
    name: 'Tier 7 Spells',
    description: 'You may now cast tier 7 spells and upcast spells at tier 7.',
    maxTier: 7
  },
  {
    id: 'elemental-mastery-3',
    level: 14,
    type: 'passive_feature',
    name: 'Elemental Mastery (3)',
    description: 'Learn the Utility Spells from a 3rd spell school you know.',
    category: 'utility'
  },
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Mage subclass feature.',
    category: 'combat'
  },
  {
    id: 'upgraded-cantrips-3',
    level: 15,
    type: 'passive_feature',
    name: 'Upgraded Cantrips',
    description: 'Your cantrips grow stronger.',
    category: 'combat'
  },
  {
    id: 'tier-8-spells',
    level: 16,
    type: 'spell_tier_access',
    name: 'Tier 8 Spells',
    description: 'You may now cast tier 8 spells and upcast spells at tier 8.',
    maxTier: 8
  },
  {
    id: 'key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'elemental-surge-3',
    level: 17,
    type: 'passive_feature',
    name: 'Elemental Surge (3)',
    description: 'Your Elemental Surge ability now regains WIL + 2d4 mana.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or DEX.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'tier-9-spells',
    level: 18,
    type: 'spell_tier_access',
    name: 'Tier 9 Spells',
    description: 'You may now cast tier 9 spells and upcast spells at tier 9.',
    maxTier: 9
  },
  {
    id: 'epic-boon',
    level: 19,
    type: 'passive_feature',
    name: 'Epic Boon',
    description: 'Choose an Epic Boon.',
    category: 'utility'
  },
  {
    id: 'archmage',
    level: 20,
    type: 'passive_feature',
    name: 'Archmage',
    description: '+1 to any 2 of your stats. The first tiered spell you cast each encounter costs 1 action less and 5 fewer mana.',
    category: 'combat'
  },
  {
    id: 'upgraded-cantrips-4',
    level: 20,
    type: 'passive_feature',
    name: 'Upgraded Cantrips',
    description: 'Your cantrips grow stronger.',
    category: 'combat'
  }
];

export const mage: ClassDefinition = {
  id: 'mage',
  name: 'Mage',
  description: 'A master of elemental magic who wields fire, ice, and lightning to devastating effect.',
  hitDieSize: 6,
  keyAttributes: ['intelligence', 'will'],
  startingHP: 10,
  armorProficiencies: [{ type: 'cloth' }],
  weaponProficiencies: [{ type: 'freeform', name: 'Blades, Staves, Wands' }],
  saveAdvantages: { intelligence: 'advantage', strength: 'disadvantage' },
  startingEquipment: ['adventurers-garb', 'staff', 'soap'],
  features: mageFeatures
};

export const mageClass = mage;