import { ClassDefinition, ClassFeature, FeaturePool } from '../../types/class';

// Sacred Graces - Feature Pool
const sacredGraces: ClassFeature[] = [
  {
    id: 'assist-me-my-friend',
    level: 3,
    type: 'ability',
    name: 'Assist Me, My Friend!',
    description: 'Whenever you make your first melee attack each round, you may add your Lifebinding Spirit\'s damage to the attack.',
    ability: {
      id: 'assist-me-my-friend',
      name: 'Assist Me, My Friend!',
      description: 'Add your Lifebinding Spirit\'s damage to your first melee attack each round.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'empowered-companion',
    level: 3,
    type: 'passive_feature',
    name: 'Empowered Companion',
    description: 'Whenever you spend mana to call forth your Lifebinding Spirit, you cast it as if you spent 1 additional mana (ignoring the typical spell tier restrictions). The maximum die size is now a d20.',
    category: 'combat'
  },
  {
    id: 'guiding-spirit',
    level: 3,
    type: 'passive_feature',
    name: 'Guiding Spirit',
    description: 'When your Lifebinding Spirit rolls a 6 or higher on its damage die, the target begins to glow with radiant light. The next attack against that target has advantage.',
    category: 'combat'
  },
  {
    id: 'hasty-companion',
    level: 3,
    type: 'passive_feature',
    name: 'Hasty Companion',
    description: '+4 Reach for your Lifebinding Spirit. It can also act for free when summoned.',
    category: 'combat'
  },
  {
    id: 'illuminate-soul',
    level: 3,
    type: 'ability',
    name: 'Illuminate Soul',
    description: 'Action: A creature within 6 spaces begins to glow with radiant light. For 1 Round, attacks against them are made with your choice of advantage or disadvantage. You may do this WIL times per Safe Rest.',
    ability: {
      id: 'illuminate-soul',
      name: 'Illuminate Soul',
      description: 'Make a creature glow with radiant light. Attacks against them have advantage or disadvantage for 1 round.',
      type: 'action',
      frequency: 'per_safe_rest',
      actionCost: 1
    }
  },
  {
    id: 'light-bearer',
    level: 3,
    type: 'passive_feature',
    name: 'Light Bearer',
    description: 'Regain 1 use of Searing Light when you roll Initiative (this expires if unspent at the end of combat).',
    category: 'combat'
  },
  {
    id: 'not-beyond-my-reach',
    level: 3,
    type: 'passive_feature',
    name: 'Not Beyond MY Reach',
    description: 'You may target creatures who have been dead less than 1 round for healing. For every 10 HP a dead creature is healed this way, you may have them recover 1 Wound instead (you must heal at least 1 Wound to revive them).',
    category: 'utility'
  },
  {
    id: 'vengeful-spirit',
    level: 3,
    type: 'ability',
    name: 'Vengeful Spirit',
    description: 'Action: Your Lifebinding Spirit sacrifices itself to transform into a swirling vortex of radiant light. At the end of your turn, it damages all enemies within 3 spaces of you, ignoring armor and cover. This lasts for a number of rounds equal to the healing charges left on the Lifebinding Spirit. This effect ends early if you summon your spirit again.',
    ability: {
      id: 'vengeful-spirit',
      name: 'Vengeful Spirit',
      description: 'Transform your Lifebinding Spirit into a damaging vortex of radiant light.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  }
];

// Shepherd Features
const shepherdFeatures: ClassFeature[] = [
  {
    id: 'keeper-of-life-and-death',
    level: 1,
    type: 'passive_feature',
    name: 'Keeper of Life & Death',
    description: 'You know Radiant and Necrotic cantrips. Searing Light (WIL times/Safe Rest) Action: Heal or Inflict grievous injuries: Heal WIL d8 HP to a Dying creature within Reach 6. OR: Inflict WIL d8 radiant damage to an undead or Bloodied enemy within Reach 6.',
    category: 'combat'
  },
  {
    id: 'mana-and-unlock-tier-1-spells',
    level: 2,
    type: 'resource',
    name: 'Mana Pool',
    description: 'You unlock tier 1 Radiant and Necrotic spells and gain a mana pool to cast these spells. This mana pool\'s maximum is always equal to (WIL × 3) + LVL and recharges on a Safe Rest.',
    resourceDefinition: {
      id: 'shepherd-mana',
      name: 'Mana',
      description: 'Divine energy used to cast spells',
      colorScheme: 'yellow-divine',
      icon: 'sun',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: { type: 'fixed', value: 0 },
      maxValue: { type: 'fixed', value: 20 } // Will be calculated dynamically based on (WIL × 3) + LVL
    },
  },
  {
    id: 'lifebinding-spirit',
    level: 2,
    type: 'ability',
    name: 'Lifebinding Spirit',
    description: '(Radiant Spell, Tier 1) Action: Summon a spirit companion that follows you and is immune to harm. It lasts until you cast this spell again, take a Safe Rest, or it heals a number of times equal to the mana spent summoning it. Action: It attacks or heals a creature within Reach 4. It attacks for 1d6+WIL radiant damage (ignoring armor), or heals for the same amount. Upcasting: Increment its die size by 1 (max d12), +1 healing use.',
    ability: {
      id: 'lifebinding-spirit',
      name: 'Lifebinding Spirit',
      description: 'Summon a spirit companion that can attack or heal.',
      type: 'spell',
      school: 'radiant',
      tier: 1,
      actionCost: 1,
      resourceCost: {
        type: 'fixed',
        resourceId: 'mana',
        amount: 1
      }
    }
  },
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Subclass',
    description: 'Choose a Shepherd subclass.'
  },
  {
    id: 'master-of-twilight-1',
    level: 3,
    type: 'pick_feature_from_pool',
    name: 'Master of Twilight',
    description: 'Choose 1 Necrotic and 1 Radiant Utility Spell.',
    poolId: 'sacred-graces',
    choicesAllowed: 1
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
    description: '+1 WIL or STR.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or DEX.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
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
    id: 'sacred-grace-1',
    level: 5,
    type: 'pick_feature_from_pool',
    name: 'Sacred Grace',
    description: 'Choose 2 Sacred Graces.',
    poolId: 'sacred-graces',
    choicesAllowed: 2
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
    id: 'master-of-twilight-2',
    level: 6,
    type: 'passive_feature',
    name: 'Master of Twilight (2)',
    description: 'Choose a 2nd Necrotic and Radiant Utility Spell.',
    category: 'utility'
  },
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Shepherd subclass feature.',
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
    description: '+1 WIL or STR.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'sacred-grace-2',
    level: 9,
    type: 'pick_feature_from_pool',
    name: 'Sacred Grace (2)',
    description: 'Choose a 3rd Sacred Grace.',
    poolId: 'sacred-graces',
    choicesAllowed: 1
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or DEX.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
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
    description: 'Gain your Shepherd subclass feature.',
    category: 'combat'
  },
  {
    id: 'master-of-twilight-3',
    level: 11,
    type: 'passive_feature',
    name: 'Master of Twilight (3)',
    description: 'You know all Necrotic and Radiant Utility Spells.',
    category: 'utility'
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
    description: '+1 WIL or STR.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'sacred-grace-3',
    level: 13,
    type: 'pick_feature_from_pool',
    name: 'Sacred Grace (3)',
    description: 'Choose a 4th Sacred Grace.',
    poolId: 'sacred-graces',
    choicesAllowed: 1
  },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or DEX.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
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
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Shepherd subclass feature.',
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
    description: '+1 WIL or STR.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'revitalizing-blessing',
    level: 17,
    type: 'ability',
    name: 'Revitalizing Blessing',
    description: '(1/round) Whenever you roll a 6 or higher on one or more healing die, the target may recover one Wound.',
    ability: {
      id: 'revitalizing-blessing',
      name: 'Revitalizing Blessing',
      description: 'When you roll 6+ on healing dice, target may recover one Wound.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or DEX.',
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
    description: 'Choose an Epic Boon (see pg. 23 of the GM\'s Guide).',
    category: 'utility'
  },
  {
    id: 'twilight-sage',
    level: 20,
    type: 'passive_feature',
    name: 'Twilight Sage',
    description: '+1 to any 2 of your stats. Your Lifebinding Spirit rolls twice as many dice.',
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


// Main Class Definition
export const shepherd: ClassDefinition = {
  id: 'shepherd',
  name: 'Shepherd',
  description: 'A divine warrior who walks the line between life and death, wielding both radiant and necrotic magic to heal allies and harm enemies.',
  hitDieSize: 10,
  keyAttributes: ['will', 'strength'],
  startingHP: 17,
  armorProficiencies: [{ type: 'mail' }, { type: 'shields' }],
  weaponProficiencies: [{ type: 'strength_weapons' }, { type: 'freeform', name: 'Wands' }],
  saveAdvantages: { will: 'advantage', dexterity: 'disadvantage' },
  startingEquipment: ['rusty-mail', 'mace', 'wooden-buckler', 'bell'],
  features: shepherdFeatures,
  featurePools: [
    {
      id: 'sacred-graces',
      name: 'Sacred Graces',
      description: 'Divine gifts that enhance your Lifebinding Spirit and grant special abilities.',
      features: sacredGraces
    }
  ]
};

export const shepherdClass = shepherd;