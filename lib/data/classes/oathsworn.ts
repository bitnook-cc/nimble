import { ClassDefinition, ClassFeature } from '../../types/class';

const oathswornFeatures: ClassFeature[] = [
  {
    id: 'radiant-judgment',
    level: 1,
    type: 'passive_feature',
    name: 'Radiant Judgment',
    description: 'Whenever an enemy attacks you, if you have no Judgment Dice, roll your Judgment dice (2d6). On your next melee attack this encounter, if you hit, deal that much additional radiant damage. The dice are expended whether you hit or miss.',
    category: 'combat'
  },
  {
    id: 'lay-on-hands',
    level: 1,
    type: 'ability',
    name: 'Lay on Hands',
    description: 'Gain a magical pool of healing power. This pool\'s maximum is always equal to 5 × LVL and recharges on a Safe Rest. Action: Touch a target and spend any amount of remaining healing power to restore that many HP.',
    ability: {
      id: 'lay-on-hands',
      name: 'Lay on Hands',
      description: 'Touch a target and spend any amount of remaining healing power to restore that many HP.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'lay-on-hands-pool',
    level: 1,
    type: 'resource',
    name: 'Lay on Hands Pool',
    description: 'Magical healing power that can be spent to restore HP.',
    resourceDefinition: {
      id: 'lay-on-hands-pool',
      name: 'Lay on Hands',
      description: 'Healing power to restore HP',
      colorScheme: 'yellow-radiant',
      icon: 'heart',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: 0,
      maxValue: 5 // Will be calculated as 5 × LVL
    },
    startingAmount: 5
  },
  {
    id: 'mana-and-radiant-spellcasting',
    level: 2,
    type: 'resource',
    name: 'Mana Pool',
    description: 'You know Radiant cantrips, tier 1 Radiant spells, and gain a mana pool. Your mana pool is equal to WIL + LVL and recharges on a Safe Rest.',
    resourceDefinition: {
      id: 'oathsworn-mana',
      name: 'Mana',
      description: 'Divine energy used to cast spells',
      colorScheme: 'yellow-radiant',
      icon: 'sun',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: 0,
      maxValue: 10 // Will be calculated as WIL + LVL
    },
    startingAmount: 4 // Level 2 with assumed WIL 2
  },
  {
    id: 'zealot',
    level: 2,
    type: 'ability',
    name: 'Zealot',
    description: 'When you melee attack with a melee weapon, you may spend mana (up to your highest unlocked spell tier) to choose one for each mana spent:\n• Condemning Strike: Deal +5 radiant damage.\n• Blessed Aim: Decrease your target\'s armor by 1 step for this attack.',
    ability: {
      id: 'zealot',
      name: 'Zealot',
      description: 'Enhance melee attacks by spending mana for Condemning Strike (+5 radiant damage) or Blessed Aim (decrease target\'s armor by 1 step).',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'paragon-of-virtue',
    level: 2,
    type: 'passive_feature',
    name: 'Paragon of Virtue',
    description: 'Advantage on Influence checks to convince someone when you are forthrightly telling the truth, disadvantage when misleading.',
    category: 'social'
  },
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Sacred Oath',
    description: 'Commit yourself to an Oath and gain its benefits.'
  },
  {
    id: 'radiant-judgment-2',
    level: 3,
    type: 'passive_feature',
    name: 'Radiant Judgment (2)',
    description: 'Your Judgment Dice are d8s.',
    category: 'combat'
  },
  {
    id: 'sacred-decree-1',
    level: 3,
    type: 'passive_feature',
    name: 'Sacred Decree',
    description: 'Learn 1 Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'serve-selflessly',
    level: 3,
    type: 'passive_feature',
    name: 'Serve Selflessly',
    description: 'Whenever you perform a notable selfless act during a Safe Rest, you may choose different Oathsworn options available to you.',
    category: 'utility'
  },
  {
    id: 'my-life-for-my-friends',
    level: 4,
    type: 'ability',
    name: 'My Life, for My Friends',
    description: 'You can Interpose for free.',
    ability: {
      id: 'my-life-for-my-friends',
      name: 'My Life, for My Friends',
      description: 'You can Interpose for free.',
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
    description: '+1 STR or WIL.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'radiant-judgment-3',
    level: 5,
    type: 'passive_feature',
    name: 'Radiant Judgment (3)',
    description: 'Your Judgment Dice are d10s.',
    category: 'combat'
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
    id: 'secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or INT.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
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
    id: 'sacred-decree-2',
    level: 6,
    type: 'passive_feature',
    name: 'Sacred Decree (2)',
    description: 'Learn a 2nd Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Oathsworn subclass feature.',
    category: 'combat'
  },
  {
    id: 'master-of-radiance-1',
    level: 7,
    type: 'passive_feature',
    name: 'Master of Radiance',
    description: 'Choose 1 Radiant Utility Spell.',
    category: 'utility'
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
    id: 'radiant-judgment-4',
    level: 8,
    type: 'passive_feature',
    name: 'Radiant Judgment (4)',
    description: 'Your Judgment Dice are d12s.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'sacred-decree-3',
    level: 9,
    type: 'passive_feature',
    name: 'Sacred Decree (3)',
    description: 'Learn a 3rd Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
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
    id: 'radiant-judgment-5',
    level: 10,
    type: 'passive_feature',
    name: 'Radiant Judgment (5)',
    description: 'Your Judgment Dice are d20s.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Oathsworn subclass feature.',
    category: 'combat'
  },
  {
    id: 'master-of-radiance-2',
    level: 11,
    type: 'passive_feature',
    name: 'Master of Radiance (2)',
    description: 'Choose a 2nd Radiant Utility Spell.',
    category: 'utility'
  },
  {
    id: 'sacred-decree-4',
    level: 12,
    type: 'passive_feature',
    name: 'Sacred Decree (4)',
    description: 'Learn a 4th Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or WIL.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'tier-6-spells',
    level: 13,
    type: 'spell_tier_access',
    name: 'Tier 6 Spells',
    description: 'You may now cast tier 6 spells and upcast spells at tier 6.',
    maxTier: 6
  },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or INT.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'sacred-decree-5',
    level: 14,
    type: 'passive_feature',
    name: 'Sacred Decree (5)',
    description: 'Learn a 5th Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'radiant-judgment-6',
    level: 14,
    type: 'passive_feature',
    name: 'Radiant Judgment (6)',
    description: 'Whenever you roll Judgment Dice, roll 1 more.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Oathsworn subclass feature.',
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
    id: 'sacred-decree-6',
    level: 16,
    type: 'passive_feature',
    name: 'Sacred Decree (6)',
    description: 'Learn a 6th Sacred Decree.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 STR or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'tier-7-spells',
    level: 17,
    type: 'spell_tier_access',
    name: 'Tier 7 Spells',
    description: 'You may now cast tier 7 spells and upcast spells at tier 7.',
    maxTier: 7
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 DEX or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'unending-judgment',
    level: 18,
    type: 'passive_feature',
    name: 'Unending Judgment',
    description: 'While you have no Judgment Dice, gain +5 damage to melee attacks.',
    category: 'combat'
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
    id: 'glorious-paragon',
    level: 20,
    type: 'passive_feature',
    name: 'Glorious Paragon',
    description: '+1 to any 2 of your stats. Defend for free whenever you Interpose.',
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

export const oathsworn: ClassDefinition = {
  id: 'oathsworn',
  name: 'Oathsworn',
  description: 'A holy warrior bound by sacred oaths, wielding radiant magic and divine judgment.',
  hitDieSize: 10,
  keyAttributes: ['strength', 'will'],
  startingHP: 17,
  armorProficiencies: [{ type: 'cloth' }, { type: 'leather' }, { type: 'mail' }, { type: 'plate' }],
  weaponProficiencies: [{ type: 'strength_weapons' }],
  saveAdvantages: { strength: 'advantage', dexterity: 'disadvantage' },
  startingEquipment: ['mace', 'rusty-mail', 'wooden-buckler', 'manacles'],
  features: oathswornFeatures
};

export const oathswornClass = oathsworn;