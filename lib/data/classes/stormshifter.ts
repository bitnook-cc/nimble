import { ClassDefinition, ClassFeature, FeaturePool } from '../../types/class';

// Chimeric Boons - Feature Pool
const chimericBoonsFeatures: ClassFeature[] = [
  {
    id: 'beast-of-the-sea',
    level: 1,
    type: 'passive_feature',
    name: 'Beast of the Sea',
    description: 'Can move, breathe, and fight underwater without penalty.',
    category: 'exploration'
  },
  {
    id: 'climber',
    level: 1,
    type: 'passive_feature',
    name: 'Climber',
    description: 'Can walk across walls and ceilings, ignores difficult terrain.',
    category: 'exploration'
  },
  {
    id: 'fleet-footed',
    level: 1,
    type: 'passive_feature',
    name: 'Fleet Footed',
    description: '+2 speed. Advantage on Stealth checks against the Grappled condition.',
    category: 'exploration'
  },
  {
    id: 'earthwalker',
    level: 1,
    type: 'passive_feature',
    name: 'Earthwalker',
    description: '+2 armor. Can burrow through dirt and unworked rock at half speed (leaving a tunnel behind). Advantage against the Prone condition.',
    category: 'exploration'
  },
  {
    id: 'keen-senses',
    level: 1,
    type: 'passive_feature',
    name: 'Keen Senses',
    description: 'Advantage on Perception and Assess checks. Unaffected by Blinded.',
    category: 'exploration'
  },
  {
    id: 'leader-of-the-pack',
    level: 1,
    type: 'passive_feature',
    name: 'Leader of the Pack',
    description: 'Advantage against fear and charm effects for yourself and allies within 6 spaces.',
    category: 'combat'
  },
  {
    id: 'phasebeast',
    level: 1,
    type: 'passive_feature',
    name: 'Phasebeast',
    description: 'Whenever you shift between this form and your normal form (and vice versa), you may teleport up to 6 spaces away to a place you can see.',
    category: 'utility'
  },
  {
    id: 'prehensile-tail',
    level: 1,
    type: 'passive_feature',
    name: 'Prehensile Tail',
    description: 'Creatures you hit in melee that are your size or smaller are Grappled. If you hit a larger creature, you may move with it when it moves.',
    category: 'combat'
  },
  {
    id: 'winged',
    level: 1,
    type: 'passive_feature',
    name: 'Winged',
    description: 'Gain a flying speed. Forced movement moves you twice as far while flying.',
    category: 'exploration'
  }
];

const stormshifterFeatures: ClassFeature[] = [
  // Level 1
  {
    id: 'master-of-storms',
    level: 1,
    type: 'passive_feature',
    name: 'Master of Storms',
    description: 'You know cantrips from the Lightning and Wind schools.',
    category: 'combat'
  },
  {
    id: 'beastshift',
    level: 1,
    type: 'ability',
    name: 'Beastshift',
    description: 'Action: You can transform into a harmless beast (squirrel, pigeon, etc.). While transformed, you can speak with animals. This form lasts until you drop to 0 HP, cast a spell, or if you end the form for free. You have DEX Beastshift charges; they reset on a Safe Rest.',
    ability: {
      id: 'beastshift',
      name: 'Beastshift',
      description: 'Transform into a harmless beast. While transformed, you can speak with animals. Lasts until you drop to 0 HP, cast a spell, or end it for free.',
      type: 'action',
      frequency: 'per_safe_rest',
      actionCost: 1
    }
  },
  {
    id: 'tiny-beasts',
    level: 1,
    type: 'passive_feature',
    name: 'Tiny Beasts',
    description: 'Whenever you shapeshift into a Tiny beast, attacks against you are made with disadvantage, but ANY damage ends that shapeshift form.',
    category: 'combat'
  },
  // Level 2
  {
    id: 'direbeast-form',
    level: 2,
    type: 'ability',
    name: 'Direbeast Form',
    description: 'You can Beastshift into a Fearsome Beast.',
    ability: {
      id: 'direbeast-form',
      name: 'Direbeast Form',
      description: 'Beastshift into a Fearsome Beast.',
      type: 'action',
      frequency: 'per_safe_rest'
    }
  },
  {
    id: 'mana-and-unlock-tier-1-spells',
    level: 2,
    type: 'resource',
    name: 'Mana and Unlock Tier 1 Spells',
    description: 'You unlock tier 1 Wind and Lightning spells and gain a mana pool to cast these spells. This mana pool\'s maximum is always equal to (WIL × 3) + LVL and recharges on a Safe Rest.',
    resourceDefinition: {
      id: 'stormshifter-mana',
      name: 'Mana',
      description: 'Natural energy used to cast spells',
      colorScheme: 'cyan-storm',
      icon: 'zap',
      resetCondition: 'safe_rest',
      resetType: 'to_max',
      minValue: 0,
      maxValue: 20 // Will be calculated dynamically based on (WIL × 3) + LVL
    },
    startingAmount: 7 // Starting at level 2 with assumed WIL 2: (2 × 3) + 1 = 7
  },
  // Level 3
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Subclass',
    description: 'Choose a Stormshifter subclass.'
  },
  {
    id: 'direbeast-form-2',
    level: 3,
    type: 'passive_feature',
    name: 'Direbeast Form (2)',
    description: 'You can Beastshift into a Beast of the Pack.',
    category: 'combat'
  },
  // Level 4
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
    description: '+1 WIL or DEX.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'stormcaller',
    level: 4,
    type: 'spell_school',
    name: 'Stormcaller',
    description: 'Learn a Utility Spell from each spell school you know.',
    spellSchool: {
      schoolId: 'storm-utility',
      name: 'Storm Utility',
      description: 'Utility spells from Wind and Lightning schools'
    }
  },
  {
    id: 'be-wild',
    level: 4,
    type: 'passive_feature',
    name: 'Be Wild',
    description: 'Whenever you spend a day with wild animals during a Safe Rest, you may choose different Stormshifter options available to you.',
    category: 'utility'
  },
  // Level 5
  {
    id: 'direbeast-form-3',
    level: 5,
    type: 'passive_feature',
    name: 'Direbeast Form (3)',
    description: 'You can Beastshift into a Beast of Nightmares.',
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
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  // Level 6
  {
    id: 'chimeric-boon',
    level: 6,
    type: 'pick_feature_from_pool',
    name: 'Chimeric Boon',
    description: 'Choose 2 Chimeric Boons. Whenever you shapeshift into a Direbeast form, you may modify it with 1 Chimeric Boon you know.',
    poolId: 'chimeric-boons-pool',
    choicesAllowed: 2
  },
  {
    id: 'expert-shifter',
    level: 6,
    type: 'passive_feature',
    name: 'Expert Shifter',
    description: 'Gain 1 additional use of Beastshift per Safe Rest.',
    category: 'utility'
  },
  {
    id: 'tier-3-spells',
    level: 6,
    type: 'spell_tier_access',
    name: 'Tier 3 Spells',
    description: 'You may now cast tier 3 spells and upcast spells at tier 3.',
    maxTier: 3
  },
  // Level 7
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Stormshifter subclass feature.',
    category: 'combat'
  },
  {
    id: 'stormcaller-2',
    level: 7,
    type: 'passive_feature',
    name: 'Stormcaller (2)',
    description: 'Learn a 2nd Utility Spell from each spell school you know.',
    category: 'utility'
  },
  // Level 8
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
    description: '+1 WIL or DEX.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'stormborn',
    level: 8,
    type: 'passive_feature',
    name: 'Stormborn',
    description: 'Gain resistance to lightning damage. (1/day) You may gain advantage on a Naturecraft check or Concentration check.',
    category: 'combat'
  },
  // Level 9
  {
    id: 'chimeric-boon-2',
    level: 9,
    type: 'pick_feature_from_pool',
    name: 'Chimeric Boon (2)',
    description: 'Choose a 3rd Chimeric Boon.',
    poolId: 'chimeric-boons-pool',
    choicesAllowed: 1
  },
  {
    id: 'expert-shifter-2',
    level: 9,
    type: 'passive_feature',
    name: 'Expert Shifter (2)',
    description: 'Gain 1 additional use of Beastshift per Safe Rest.',
    category: 'utility'
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  // Level 10
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
  // Level 11
  {
    id: 'subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Stormshifter subclass feature.',
    category: 'combat'
  },
  // Level 12
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
    description: '+1 WIL or DEX.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'chimeric-boon-4',
    level: 12,
    type: 'pick_feature_from_pool',
    name: 'Chimeric Boon (4)',
    description: 'Select a 4th Chimeric Boon.',
    poolId: 'chimeric-boons-pool',
    choicesAllowed: 1
  },
  {
    id: 'expert-shifter-3',
    level: 12,
    type: 'passive_feature',
    name: 'Expert Shifter (3)',
    description: 'Gain 1 additional use of Beastshift per Safe Rest.',
    category: 'utility'
  },
  // Level 13
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'stormborn-2',
    level: 13,
    type: 'passive_feature',
    name: 'Stormborn (2)',
    description: 'Instead of rolling dice, deal the max damage of a Wind spell by spending a charge of your Beastshift, you may cast a cantrip for free.',
    category: 'combat'
  },
  // Level 14
  {
    id: 'tier-7-spells',
    level: 14,
    type: 'spell_tier_access',
    name: 'Tier 7 Spells',
    description: 'You may now cast tier 7 spells and upcast spells at tier 7.',
    maxTier: 7
  },
  // Level 15
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Stormshifter subclass feature.',
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
  // Level 16
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
    description: '+1 WIL or DEX.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  // Level 17
  {
    id: 'chimeric-boon-5',
    level: 17,
    type: 'pick_feature_from_pool',
    name: 'Chimeric Boon (4)',
    description: 'Select a 5th Chimeric Boon.',
    poolId: 'chimeric-boons-pool',
    choicesAllowed: 1
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  // Level 18
  {
    id: 'tier-9-spells',
    level: 18,
    type: 'spell_tier_access',
    name: 'Tier 9 Spells',
    description: 'You may now cast tier 9 spells and upcast spells at tier 9.',
    maxTier: 9
  },
  // Level 19
  {
    id: 'epic-boon',
    level: 19,
    type: 'passive_feature',
    name: 'Epic Boon',
    description: "Choose an Epic Boon (see pg. 23 of the GM's Guide).",
    category: 'utility'
  },
  // Level 20
  {
    id: 'archdruid',
    level: 20,
    type: 'passive_feature',
    name: 'Archdruid',
    description: '+1 to any 2 of your stats. (1/encounter) Cast a spell up to tier 4 for free when you enter or leave a Beastshift form.',
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

// Direbeast Forms definitions
const direbestFormsPool: FeaturePool = {
  id: 'direbeast-forms-pool',
  name: 'Direbeast Forms',
  description: 'Different beast forms that Stormshifters can transform into.',
  features: [
    {
      id: 'fearsome-beast',
      level: 2,
      type: 'passive_feature',
      name: 'Fearsome Beast (Large)',
      description: 'Transform into any Large beast. Gain DEX + LVL temp HP (until Beastshift ends), melee attack, armor, Gore. Action: 1d6 + LVL damage, on hit: Gain LVL temp HP. Fearsome. Whenever you Interpose or Defend, you may spend 1 mana to force them to reroll (if you must choose either result).',
      category: 'combat'
    },
    {
      id: 'beast-of-the-pack',
      level: 3,
      type: 'passive_feature',
      name: 'Beast of the Pack (Medium)',
      description: 'Transform into a Medium beast. Gain +DEX speed, Supercharge, and the Thunderfang attack. Whenever you crit or kill one or more enemies, Thunderfang gains a cumulative +1d6 damage (resets at end combat). Thunderfang. Action: 1d4 + LVL piercing damage. Supercharge. Spend up to WIL mana, and your next Thunderfang attack deals an additional 1d8 lightning damage per mana spent (you take this damage on a miss).',
      category: 'combat'
    },
    {
      id: 'beast-of-nightmares',
      level: 5,
      type: 'passive_feature',
      name: 'Beast of Nightmares (Tiny)',
      description: 'Transform into any Tiny beast or insect (provided it is horrible). Gain the Sting attack and Silent But Deadly. Sting. (1/round) Action: Reach: 0. 1d4 piercing + 3×LVL acid damage (ignoring armor), on crit: 4×LVL damage instead. Silent But Deadly. Speed: 2. You cannot Defend or Interpose. Attackers cannot target you until you become conspicuous (e.g., being seen transforming).',
      category: 'combat'
    }
  ]
};

export const stormshifterClass: ClassDefinition = {
  id: 'stormshifter',
  name: 'Stormshifter',
  description: 'A primal spellcaster who masters the storms and transforms into various beast forms. Stormshifters blend natural magic with shapeshifting abilities to adapt to any situation.',
  hitDieSize: 8,
  keyAttributes: ['will', 'dexterity'],
  startingHP: 13,
  armorProficiencies: [
    { type: 'cloth' },
    { type: 'leather' }
  ],
  weaponProficiencies: [
    { type: 'freeform', name: 'Staves' },
    { type: 'freeform', name: 'Wands' }
  ],
  saveAdvantages: {
    will: 'advantage',
    strength: 'disadvantage'
  },
  startingEquipment: [
    'cheap-hides',
    'staff',
    'strange-plant'
  ],
  features: stormshifterFeatures,
  featurePools: [
    {
      id: 'chimeric-boons-pool',
      name: 'Chimeric Boons',
      description: 'Special modifications that can be applied to Direbeast forms.',
      features: chimericBoonsFeatures
    },
    direbestFormsPool
  ]
};