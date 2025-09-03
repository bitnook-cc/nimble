import { ClassDefinition, ClassFeature, FeaturePool } from '../../types/class';

// Martial Arts Abilities - Feature Pool
const martialArtsAbilities: ClassFeature[] = [
  {
    id: 'airshift',
    level: 1,
    type: 'passive_feature',
    name: 'Airshift',
    description: 'You cannot be Grappled while conscious. While moving, you may travel across all terrain as normal ground, ignoring all ill effects (e.g., walls/ceilings, water, treetops, lava, spikes, clouds).',
    category: 'exploration'
  },
  {
    id: 'blur',
    level: 1,
    type: 'ability',
    name: 'Blur',
    description: '(1/encounter) When you Defend, you may first move up to half your speed away, taking no damage if you are now out of range or have Full Cover.',
    ability: {
      id: 'blur',
      name: 'Blur',
      description: 'When you Defend, first move up to half your speed away. Take no damage if out of range or have Full Cover.',
      type: 'action',
      frequency: 'per_encounter',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  {
    id: 'bodily-discipline',
    level: 1,
    type: 'ability',
    name: 'Bodily Discipline',
    description: 'You may spend 1 action to end any non-Wound condition on yourself.',
    ability: {
      id: 'bodily-discipline',
      name: 'Bodily Discipline',
      description: 'End any non-Wound condition on yourself.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'enduring-soul',
    level: 1,
    type: 'passive_feature',
    name: 'Enduring Soul',
    description: 'Each time you roll Initiative, gain Hit Dice equal to the actions you get on your first turn. These Hit Dice expire at the end of combat if unused.',
    category: 'combat'
  },
  {
    id: 'i-jump-on-his-back',
    level: 1,
    type: 'passive_feature',
    name: 'I Jump On His Back!',
    description: 'While moving with your Windstep, if you move into the space of a creature your size or larger, you may jump onto its back. While on a creature this way, gain advantage on melee attacks against it, and any damage you avoid is dealt to it instead.',
    category: 'combat'
  },
  {
    id: 'kinetic-barrage',
    level: 1,
    type: 'passive_feature',
    name: 'Kinetic Barrage',
    description: 'Whenever you miss an attack, gain a cumulative +STR bonus to all damage you do for the rest of this encounter (a disciplined martial artist does not miss on purpose).',
    category: 'combat'
  },
  {
    id: 'mighty-soul',
    level: 1,
    type: 'passive_feature',
    name: 'Mighty Soul',
    description: 'You cannot be moved against your will. Whenever you would fail a saving throw, you may gain a Wound in order to add your STR to the result you rolled. You may repeat this any number of times.',
    category: 'combat'
  },
  {
    id: 'quickstrike',
    level: 1,
    type: 'ability',
    name: 'Quickstrike',
    description: 'When you Interpose, you may first make an unarmed strike against the enemy for free.',
    ability: {
      id: 'quickstrike',
      name: 'Quickstrike',
      description: 'When you Interpose, first make an unarmed strike against the enemy for free.',
      type: 'action',
      frequency: 'at_will'
    }
  },
  {
    id: 'use-momentum',
    level: 1,
    type: 'passive_feature',
    name: 'Use Momentum',
    description: 'Whenever you avoid all of the damage of a melee attack (whether it misses or you Defend), you may swap places with the attacker and then choose another target that is now within the attack\'s reach, and they are hit instead.',
    category: 'combat'
  },
  {
    id: 'vital-rejuvenation',
    level: 1,
    type: 'passive_feature',
    name: 'Vital Rejuvenation',
    description: 'When you receive healing for the first time on a turn, you may heal another target within 6 spaces HP equal to your STR.',
    category: 'combat'
  },
  {
    id: 'windstrider',
    level: 1,
    type: 'passive_feature',
    name: 'Windstrider',
    description: 'If you move through the space of a willing creature while using Windstep, they can move with you and choose any space adjacent to your path of movement to end in.',
    category: 'exploration'
  }
];

const zephyrFeatures: ClassFeature[] = [
  // Level 1
  {
    id: 'iron-defense',
    level: 1,
    type: 'passive_feature',
    name: 'Iron Defense',
    description: 'Your armor equals DEX + STR as long as you are unarmored.',
    category: 'combat'
  },
  {
    id: 'swift-fists',
    level: 1,
    type: 'passive_feature',
    name: 'Swift Fists',
    description: 'Your unarmed strikes are not subject to disadvantage imposed by Rushed Attacks (see pg. 13 of the Core Rules), and their damage is 1d4 + STR.',
    category: 'combat'
  },
  // Level 2
  {
    id: 'swift-feet',
    level: 2,
    type: 'passive_feature',
    name: 'Swift Feet',
    description: 'While unarmored, gain +2 speed and +LVL Initiative.',
    category: 'combat'
  },
  {
    id: 'burst-of-speed',
    level: 2,
    type: 'ability',
    name: 'Burst of Speed',
    description: 'When you roll Initiative, gain DEX Bursts of Speed to use during that encounter. (1/turn) You may spend 1 Burst of Speed to use any of the following maneuvers for free: Slipstream, Whirling Defense, Swiftstrike, Windstep.',
    ability: {
      id: 'burst-of-speed',
      name: 'Burst of Speed',
      description: 'Gain DEX Bursts of Speed when rolling Initiative. Spend 1 per turn to use maneuvers for free.',
      type: 'action',
      frequency: 'per_encounter'
    }
  },
  {
    id: 'slipstream',
    level: 2,
    type: 'passive_feature',
    name: 'Slipstream',
    description: 'Defend, and the attack misses.',
    category: 'combat'
  },
  {
    id: 'whirling-defense',
    level: 2,
    type: 'passive_feature',
    name: 'Whirling Defense',
    description: 'Defend and apply your armor to every attack this round.',
    category: 'combat'
  },
  {
    id: 'swiftstrike',
    level: 2,
    type: 'passive_feature',
    name: 'Swiftstrike',
    description: 'Attack on your turn, and ignore disadvantage from Rushed Attacks.',
    category: 'combat'
  },
  {
    id: 'windstep',
    level: 2,
    type: 'passive_feature',
    name: 'Windstep',
    description: 'Move on your turn, ignoring difficult terrain.',
    category: 'exploration'
  },
  // Level 3
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Subclass',
    description: 'Choose a Zephyr subclass.'
  },
  {
    id: 'kinetic-momentum',
    level: 3,
    type: 'passive_feature',
    name: 'Kinetic Momentum',
    description: 'Whenever you gain a Wound, gain a Burst of Speed.',
    category: 'combat'
  },
  {
    id: 'ethereal-projection',
    level: 3,
    type: 'ability',
    name: 'Ethereal Projection',
    description: '(1/day) By meditating for at least 10 minutes, you can project an ethereal version of yourself up to 30 ft. away, passing through solid objects or barriers. You see through your projection\'s eyes, and it is visible to other creatures as a translucent version of yourself. It cannot interact physically with the environment but can move freely within the distance limit and lasts for up to 10 minutes.',
    ability: {
      id: 'ethereal-projection',
      name: 'Ethereal Projection',
      description: 'Project an ethereal version of yourself up to 30 ft. away that can pass through solid objects.',
      type: 'action',
      frequency: 'per_safe_rest',
      maxUses: { type: 'fixed', value: 1 }
    }
  },
  // Level 4
  {
    id: 'unyielding-resolve',
    level: 4,
    type: 'passive_feature',
    name: 'Unyielding Resolve',
    description: 'Ignore the first Wound you would suffer each encounter (when Wounded abilities, such as Kinetic Momentum, still trigger).',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-1',
    level: 4,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or STR.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'martial-master-1',
    level: 4,
    type: 'pick_feature_from_pool',
    name: 'Martial Master',
    description: 'Choose a Martial Arts ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  // Level 5
  {
    id: 'reverberating-strikes',
    level: 5,
    type: 'passive_feature',
    name: 'Reverberating Strikes',
    description: 'You learn to focus your energy and transfer it as an additional concussive force into your foes. Add LVL bludgeoning damage to all of your melee attacks.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  // Level 6
  {
    id: 'martial-master-2',
    level: 6,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (2)',
    description: 'Choose a 2nd Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  {
    id: 'infuse-strength',
    level: 6,
    type: 'ability',
    name: 'Infuse Strength',
    description: 'Action: Make an unarmed strike against an ally and infuse them with a portion of your own strength instead of harming them. Expend any number of Hit Dice and roll them as you would heal yourself during a Field Rest (roll them and add your STR to each).',
    ability: {
      id: 'infuse-strength',
      name: 'Infuse Strength',
      description: 'Strike an ally to heal them by expending Hit Dice and adding STR to each.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  // Level 7
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Zephyr subclass feature.',
    category: 'combat'
  },
  // Level 8
  {
    id: 'martial-master-3',
    level: 8,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (3)',
    description: 'Choose a 3rd Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  {
    id: 'key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or STR.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  // Level 9
  {
    id: 'swift-feet-2',
    level: 9,
    type: 'passive_feature',
    name: 'Swift Feet (2)',
    description: 'Gain an additional +2 speed as long as you are unarmored.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  // Level 10
  {
    id: 'martial-master-4',
    level: 10,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (4)',
    description: 'Choose a 4th Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  {
    id: 'unyielding-resolve-2',
    level: 10,
    type: 'passive_feature',
    name: 'Unyielding Resolve (2)',
    description: 'Ignore the first 2 Wounds you would suffer each encounter.',
    category: 'combat'
  },
  // Level 11
  {
    id: 'subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Zephyr subclass feature.',
    category: 'combat'
  },
  // Level 12
  {
    id: 'martial-master-5',
    level: 12,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (5)',
    description: 'Choose a 5th Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  {
    id: 'key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or STR.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  // Level 13
  {
    id: 'iron-defense-2',
    level: 13,
    type: 'passive_feature',
    name: 'Iron Defense (2)',
    description: 'Your armor is doubled while unarmored.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  // Level 14
  {
    id: 'martial-master-6',
    level: 14,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (6)',
    description: 'Choose a 6th Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  // Level 15
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Zephyr subclass feature.',
    category: 'combat'
  },
  // Level 16
  {
    id: 'martial-master-7',
    level: 16,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (7)',
    description: 'Choose a 7th Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
  },
  {
    id: 'key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or STR.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  // Level 17
  {
    id: 'unyielding-resolve-3',
    level: 17,
    type: 'passive_feature',
    name: 'Unyielding Resolve (3)',
    description: 'Ignore the first 3 Wounds you would suffer each encounter. You have advantage on STR saves while Dying.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 INT or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  // Level 18
  {
    id: 'martial-master-8',
    level: 18,
    type: 'pick_feature_from_pool',
    name: 'Martial Master (8)',
    description: 'Choose an 8th Martial Arts Ability.',
    poolId: 'martial-arts-pool',
    choicesAllowed: 1
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
    id: 'windborne',
    level: 20,
    type: 'passive_feature',
    name: 'Windborne',
    description: '+1 to any 2 of your stats. +1 additional burst of speed when you roll Initiative. Permanently gain 1 action (while Dying, you have a max of 2 actions).',
    category: 'combat'
  }
];

// Focus ability that appears at multiple levels
const focusAbility: ClassFeature = {
  id: 'focus',
  level: 1,
  type: 'passive_feature',
  name: 'Focus',
  description: 'Whenever you spend time meditating alone in a windy place during a Safe Rest, you may choose different Zephyr options available to you.',
  category: 'utility'
};

export const zephyrClass: ClassDefinition = {
  id: 'zephyr',
  name: 'Zephyr',
  description: 'A swift martial artist who combines unarmed combat with incredible speed and agility. Zephyrs master the art of movement and strikes, becoming untouchable whirlwinds in battle.',
  hitDieSize: 8,
  keyAttributes: ['dexterity', 'strength'],
  startingHP: 13,
  armorProficiencies: [
    { type: 'freeform', name: 'None' }
  ],
  weaponProficiencies: [
    { type: 'freeform', name: 'Melee Weapons' }
  ],
  saveAdvantages: {
    dexterity: 'advantage',
    intelligence: 'disadvantage'
  },
  startingEquipment: [
    'staff',
    'traveling-robes',
    'sandals'
  ],
  features: [
    ...zephyrFeatures,
    focusAbility
  ],
  featurePools: [
    {
      id: 'martial-arts-pool',
      name: 'Martial Arts Abilities',
      description: 'Special martial arts techniques that Zephyrs can master.',
      features: martialArtsAbilities
    }
  ]
};