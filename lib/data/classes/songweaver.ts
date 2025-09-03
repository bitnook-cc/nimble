import { ClassDefinition, ClassFeature, FeaturePool } from '../../types/class';

// Lyrical Weaponry - Feature Pool
const lyricalWeaponry: ClassFeature[] = [
  {
    id: 'heroic-ballad',
    level: 4,
    type: 'ability',
    name: 'Heroic Ballad',
    description: '+2 max Songweaver\'s Inspiration charges. When used to reroll an attack, your Songweaver\'s Inspiration also grants them +WIL damage on the attack.',
    ability: {
      id: 'heroic-ballad',
      name: 'Heroic Ballad',
      description: 'Songweaver\'s Inspiration grants +WIL damage when used to reroll attacks.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'inspiring-anthem',
    level: 4,
    type: 'ability',
    name: 'Inspiring Anthem',
    description: '(1/encounter) Action: Grant all friendly Dying creatures who can hear you 1d4+WIL+1 actions.',
    ability: {
      id: 'inspiring-anthem',
      name: 'Inspiring Anthem',
      description: 'Grant all friendly Dying creatures who can hear you 1d4+WIL+1 actions.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 },
      actionCost: 1
    }
  },
  {
    id: 'not-my-beautiful-feaaaah',
    level: 4,
    type: 'ability',
    name: 'Not My Beautiful Feaaaah!',
    description: '(1/encounter) When you Defend, force the attacker to roll again or be defended within range on a failed WIL save (if there is none, the attack fails). If they fail by 5 or more, they attack themselves as punishment for even thinking they could harm you! On save, they attack you with disadvantage.',
    ability: {
      id: 'not-my-beautiful-feaaaah',
      name: 'Not My Beautiful Feaaaah!',
      description: 'When defending, force attacker to make WIL save or be redirected.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'rhapsody-of-the-normal',
    level: 4,
    type: 'passive_feature',
    name: 'Rhapsody of the Normal',
    description: 'When you roll 4 or more on your Vicious Mockery, you may spend a Songweaver\'s Inspiration charge to temporarily suppress any special abilities they have until the end of their next turn. They can do what an untrained average villager can do, attack once for 1d4 damage and move up to 6 spaces (no armor, spellcasting, flying, extraordinary or other inherent or trained features).',
    category: 'combat'
  },
  {
    id: 'song-of-domination',
    level: 4,
    type: 'ability',
    name: 'Song of Domination',
    description: '(1/encounter) 2 actions: Play a haunting tune, and all enemies within 6 spaces who hear it must make a WIL save. If they fail, you move them up to 6 spaces in any direction, and they cannot move on their next turn.',
    ability: {
      id: 'song-of-domination',
      name: 'Song of Domination',
      description: 'Enemies who fail WIL save are moved 6 spaces and cannot move next turn.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 },
      actionCost: 2
    }
  }
];

// A "People" Person - Feature Pool
const peoplePerson: ClassFeature[] = [
  {
    id: 'stompy',
    level: 5,
    type: 'passive_feature',
    name: 'Stompy',
    description: '3 actions: Summon a huge hill giant for 1 round. As he enters the battlefield adjacent to you, use Stompy\'s Stomp: Make a DC 10 Influence check. On a success, he moves 6 spaces in a direction you choose; on a failure, he moves towards YOU instead ("YOU NOT FRIEND!"). He deals everything in his path damage equal to LVL + Influence check. ANY creature within 6 spaces of Stompy can use this ability once instead of an attack. (advantage if you ask him to do something he would find mischievous or fun, with disadvantage if it is something that hurt good or menial).',
    category: 'combat'
  },
  {
    id: 'mal-the-malevolent-imp',
    level: 5,
    type: 'passive_feature',
    name: 'Mal, the Malevolent Imp',
    description: 'Summon a tiny fiend for 1 night. He can find out dangerous information you have no right to know. DC 10 "Devil\'s Choice" of a problem with only the slightest chance of things going wrong. Make an Influence check to convince him to help you. Gran Gran (NOT a hag): When resting, you may summon her for 1 hour to soothe your wounds (and hassle you for not eating enough). She bakes and hands out pastries equal to your WIL+INT. Eating one recovers one mana, Hit Die, or Wound. Eat them while they\'re warm! They expire in 10 minutes.',
    category: 'utility'
  },
  {
    id: 'gran-gran-not-a-hag',
    level: 5,
    type: 'ability',
    name: 'Gran Gran (NOT a hag)',
    description: 'When resting, you may summon her for 1 hour to soothe your wounds (and hassle you for not eating enough). She bakes and hands out pastries equal to your WIL+INT. Eating one recovers one mana, Hit Die, or Wound. Eat them while they\'re warm! They expire in 10 minutes.',
    ability: {
      id: 'gran-gran',
      name: 'Gran Gran (NOT a hag)',
      description: 'Summon Gran Gran to bake healing pastries during rest.',
      type: 'action',
      frequency: 'per_safe_rest',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'linos-the-everfriendly',
    level: 5,
    type: 'passive_feature',
    name: 'Linos, the Everfriendly',
    description: 'Summon a legendary helpful friendly creature to take you and your party wherever you need to go. He may request a very large amount of food as payment.',
    category: 'exploration'
  }
];

// Songweaver Features
const songweaverFeatures: ClassFeature[] = [
  {
    id: 'wind-spellcasting',
    level: 1,
    type: 'passive_feature',
    name: 'Wind Spellcasting and...',
    description: 'You know cantrips from the Wind school and 1 other school of your choice. You also know the cantrip Vicious Mockery.',
    category: 'combat'
  },
  {
    id: 'vicious-mockery',
    level: 1,
    type: 'ability',
    name: 'Vicious Mockery',
    description: '(Wind cantrip) Action: Range: 12. Damage: 1d4+INT psychic (ignoring armor). On hit: the target is Taunted during their next turn. High Levels: +2 damage every 5 levels.',
    ability: {
      id: 'vicious-mockery',
      name: 'Vicious Mockery',
      description: 'Deal psychic damage and taunt the target.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1,
      roll: {
        dice: { count: 1, sides: 4 },
        attribute: 'intelligence'
      }
    }
  },
  {
    id: 'songweavers-inspiration',
    level: 1,
    type: 'ability',
    name: 'Songweaver\'s Inspiration',
    description: '(2×WIL times/Safe Rest) Free Reaction: Allow an ally to reroll a single die related to an attack or save (must keep either result).',
    ability: {
      id: 'songweavers-inspiration',
      name: 'Songweaver\'s Inspiration',
      description: 'Allow an ally to reroll a single die for an attack or save.',
      type: 'action',
      frequency: 'per_safe_rest',
      maxUses: { type: 'fixed', value: 2 },
    }
  },
  {
    id: 'mana-and-unlock-tier-1-spells',
    level: 2,
    type: 'resource',
    name: 'Mana Pool',
    description: 'You unlock tier 1 spells in the schools you know and gain a mana pool to cast them. This mana pool\'s maximum is always equal to (INT×3)+LVL and recharges on a Safe Rest.',
    resourceDefinition: {
      id: 'songweaver-mana',
      name: 'Mana',
      description: 'Magical energy used to cast spells',
      colorScheme: 'purple-arcane',
      icon: 'music',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: 0,
      maxValue: 20 // Will be calculated dynamically based on (INT×3)+LVL
    },
    startingAmount: 7 // Starting at level 2 with assumed INT 2: (2×3)+1 = 7
  },
  {
    id: 'jack-of-all-trades',
    level: 2,
    type: 'passive_feature',
    name: 'Jack of All Trades',
    description: 'When you Safe Rest, you may move a skill point as if you just leveled up.',
    category: 'utility'
  },
  {
    id: 'song-of-rest',
    level: 2,
    type: 'passive_feature',
    name: 'Song of Rest',
    description: '(1/day) Whenever you Field Rest, you may play a song and allow anyone who spends Hit Dice to heal additional HP equal to your WIL.',
    category: 'utility'
  },
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Subclass',
    description: 'Choose a Songweaver subclass.'
  },
  {
    id: 'quick-wit',
    level: 3,
    type: 'passive_feature',
    name: 'Quick Wit',
    description: 'When you roll Initiative, you may regain 2 spent uses of your Songweaver\'s Inspiration (these expire at the end of combat if left unused).',
    category: 'combat'
  },
  {
    id: 'windbag',
    level: 3,
    type: 'passive_feature',
    name: 'Windbag',
    description: 'Choose 1 Utility Spell from each spell school you know.',
    category: 'utility'
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
    description: '+1 WIL or INT.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'lyrical-weaponry-1',
    level: 4,
    type: 'pick_feature_from_pool',
    name: 'Lyrical Weaponry',
    description: 'Choose 1 ability from the Lyrical Weaponry list.',
    poolId: 'lyrical-weaponry',
    choicesAllowed: 1
  },
  {
    id: 'people-person',
    level: 5,
    type: 'pick_feature_from_pool',
    name: 'A "People" Person',
    description: 'You\'ve met many people in your travels; some have even agreed to come to your aid should you need it. Choose 2 friends you know: you can temporarily summon 1 using song (1/Safe Rest each).',
    poolId: 'people-person',
    choicesAllowed: 2
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
    description: '+1 STR or DEX.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
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
    id: 'windbag-2',
    level: 6,
    type: 'passive_feature',
    name: 'Windbag (2)',
    description: 'Choose a 2nd Utility Spell from each spell school you know.',
    category: 'utility'
  },
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Songweaver subclass feature.',
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
    description: '+1 WIL or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'lyrical-weaponry-2',
    level: 9,
    type: 'pick_feature_from_pool',
    name: 'Lyrical Weaponry (2)',
    description: 'Choose a 2nd ability from the Lyrical Weaponry list.',
    poolId: 'lyrical-weaponry',
    choicesAllowed: 1
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
    description: 'Gain your Songweaver subclass feature.',
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
    description: '+1 WIL or INT.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'lyrical-weaponry-3',
    level: 13,
    type: 'pick_feature_from_pool',
    name: 'Lyrical Weaponry (3)',
    description: 'Choose a 3rd ability from the Lyrical Weaponry list.',
    poolId: 'lyrical-weaponry',
    choicesAllowed: 1
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
    id: 'windbag-3',
    level: 14,
    type: 'passive_feature',
    name: 'Windbag (3)',
    description: 'You know all Utility Spells from the spell schools you know.',
    category: 'utility'
  },
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Songweaver subclass feature.',
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
    description: '+1 WIL or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'lyrical-weaponry-4',
    level: 17,
    type: 'pick_feature_from_pool',
    name: 'Lyrical Weaponry (4)',
    description: 'Choose a 4th ability from the Lyrical Weaponry list.',
    poolId: 'lyrical-weaponry',
    choicesAllowed: 1
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
    description: 'Choose an Epic Boon (see pg. 23 of the GM\'s Guide).',
    category: 'utility'
  },
  {
    id: 'im-so-famous',
    level: 20,
    type: 'passive_feature',
    name: 'I\'m So Famous!',
    description: '+1 to any 2 of your stats. Your Songweaver\'s Inspiration cannot fail (your target succeeds).',
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
export const songweaver: ClassDefinition = {
  id: 'songweaver',
  name: 'Songweaver',
  description: 'A charismatic bard who weaves magic through song and story, inspiring allies and mocking enemies.',
  hitDieSize: 8,
  keyAttributes: ['will', 'intelligence'],
  startingHP: 13,
  armorProficiencies: [{ type: 'cloth' }, { type: 'leather' }],
  weaponProficiencies: [{ type: 'dexterity_weapons' }, { type: 'freeform', name: 'Wands' }],
  saveAdvantages: { will: 'advantage', strength: 'disadvantage' },
  startingEquipment: ['adventurers-garb', 'instrument', 'dagger', 'mirror'],
  features: songweaverFeatures,
  featurePools: [
    {
      id: 'lyrical-weaponry',
      name: 'Lyrical Weaponry',
      description: 'Musical abilities that weaponize your performances and enhance your bardic magic.',
      features: lyricalWeaponry
    },
    {
      id: 'people-person',
      name: 'A "People" Person',
      description: 'Friends and allies you\'ve met in your travels who can be summoned to aid you.',
      features: peoplePerson
    }
  ]
};

export const songweaverClass = songweaver;