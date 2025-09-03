import { ClassDefinition, ClassFeature } from '../../types/class';

const hunterFeatures: ClassFeature[] = [
  {
    id: 'hunters-mark',
    level: 1,
    type: 'ability',
    name: "Hunter's Mark",
    description: 'Mark a creature as your quarry for 1 day. It can\'t be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage.',
    ability: {
      id: 'hunters-mark',
      name: "Hunter's Mark",
      description: 'Mark a creature you can see as your quarry for 1 day (or until you mark another creature). It can\'t be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage (choose before each attack).',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'forager',
    level: 1,
    type: 'passive_feature',
    name: 'Forager',
    description: 'Gain advantage on skill checks to find food and water in the wild.',
    category: 'exploration'
  },
  {
    id: 'thrill-of-the-hunt-resource',
    level: 2,
    type: 'resource',
    name: 'Thrill of the Hunt Charges',
    description: 'Charges used to fuel Thrill of the Hunt abilities. Gain charges when your quarry dies or when you hit your quarry in melee/crit at range.',
    resourceDefinition: {
      id: 'thrill-of-the-hunt-charges',
      name: 'Thrill of the Hunt',
      description: 'Charges used to fuel Hunter abilities',
      colorScheme: 'green-nature',
      icon: 'zap',
      resetCondition: 'encounter_end',
      resetType: 'to_zero',
      minValue: 0,
      maxValue: 10
    },
    startingAmount: 0
  },
  {
    id: 'thrill-of-the-hunt-1',
    level: 2,
    type: 'passive_feature',
    name: 'Thrill of the Hunt',
    description: 'Choose 2 Thrill of the Hunt (ToH) abilities. Gain a charge to use these abilities during that encounter whenever:\n• Your quarry dies.\n• You hit your quarry in melee or crit your quarry at range.',
    category: 'combat'
  },
  {
    id: 'roll-and-strike',
    level: 2,
    type: 'ability',
    name: 'Roll & Strike',
    description: 'If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.',
    ability: {
      id: 'roll-and-strike',
      name: 'Roll & Strike',
      description: 'If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'remember-the-wild',
    level: 2,
    type: 'passive_feature',
    name: 'Remember the Wild',
    description: 'Whenever you spend a day in the wilderness during a Safe Rest, you may choose different Hunter options available to you.',
    category: 'utility'
  },
  {
    id: 'subclass',
    level: 3,
    type: 'subclass_choice',
    name: 'Hunter Subclass',
    description: 'Choose a Hunter subclass.'
  },
  {
    id: 'trackers-intuition',
    level: 3,
    type: 'passive_feature',
    name: "Tracker's Intuition",
    description: 'You can discern the events of a past encounter by studying tracks and other subtle environmental clues, accurately determining the kind and amount of creatures, their direction, key actions, and passage of time.',
    category: 'exploration'
  },
  {
    id: 'thrill-of-the-hunt-2',
    level: 4,
    type: 'passive_feature',
    name: 'Thrill of the Hunt (2)',
    description: 'Choose a 3rd Thrill of the Hunt ability.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-1',
    level: 4,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'explorer-of-the-wilds',
    level: 4,
    type: 'passive_feature',
    name: 'Explorer of the Wilds',
    description: '+2 speed, gain a climbing speed.',
    category: 'exploration'
  },
  {
    id: 'hunters-resolve',
    level: 5,
    type: 'passive_feature',
    name: "Hunter's Resolve",
    description: 'Whenever you have no Thrill of the Hunt charges, gain Hunter\'s Resolve until the end of your turn: treat all creatures as your quarry for the purposes of movement and melee attacks.',
    category: 'combat'
  },
  {
    id: 'final-takedown',
    level: 5,
    type: 'ability',
    name: 'Final Takedown',
    description: 'Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter\'s Mark. If they survive, they crit you back.',
    ability: {
      id: 'final-takedown',
      name: 'Final Takedown',
      description: 'Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter\'s Mark. If they survive, they crit you back.',
      type: 'action',
      frequency: 'at_will',
      actionCost: 1
    }
  },
  {
    id: 'secondary-stat-increase-1',
    level: 5,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'versatile-bowmaster',
    level: 6,
    type: 'passive_feature',
    name: 'Versatile Bowmaster',
    description: 'Whenever you attack with a Longbow, you may roll 2d4 instead of 1d8; or with a Crossbow, 2d8 instead of 4d4.',
    category: 'combat'
  },
  {
    id: 'thrill-of-the-hunt-3',
    level: 6,
    type: 'passive_feature',
    name: 'Thrill of the Hunt (3)',
    description: 'Choose a 4th Thrill of the Hunt ability.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-7',
    level: 7,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    category: 'combat'
  },
  {
    id: 'thrill-of-the-hunt-4',
    level: 8,
    type: 'passive_feature',
    name: 'Thrill of the Hunt (4)',
    description: 'Choose a 5th Thrill of the Hunt ability.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-2',
    level: 8,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    statBoosts: [{ attribute: 'dexterity', amount: 1 }]
  },
  {
    id: 'no-escape',
    level: 9,
    type: 'passive_feature',
    name: 'No Escape',
    description: 'Whenever you see one or more allies make an opportunity attack, you may also make a ranged opportunity attack against the same target.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'strength', amount: 1 }]
  },
  {
    id: 'veteran-stalker',
    level: 10,
    type: 'passive_feature',
    name: 'Veteran Stalker',
    description: 'Gain a Thrill of the Hunt charge whenever you are first Bloodied in an encounter and for every Wound you gain.',
    category: 'combat'
  },
  {
    id: 'keen-eye-steady-hand',
    level: 10,
    type: 'passive_feature',
    name: 'Keen Eye, Steady Hand',
    description: 'Add WIL to your ranged weapon damage.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-11',
    level: 11,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    category: 'combat'
  },
  {
    id: 'thrill-of-the-hunt-5',
    level: 12,
    type: 'passive_feature',
    name: 'Thrill of the Hunt (5)',
    description: 'Choose a 6th Thrill of the Hunt ability.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-3',
    level: 12,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'keen-sight',
    level: 13,
    type: 'passive_feature',
    name: 'Keen Sight',
    description: 'Advantage on Perception checks.',
    category: 'exploration'
  },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'thrill-of-the-hunt-6',
    level: 14,
    type: 'passive_feature',
    name: 'Thrill of the Hunt (6)',
    description: 'Choose a 7th Thrill of the Hunt ability.',
    category: 'combat'
  },
  {
    id: 'subclass-feature-15',
    level: 15,
    type: 'passive_feature',
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    category: 'combat'
  },
  {
    id: 'key-stat-increase-4',
    level: 16,
    type: 'stat_boost',
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    statBoosts: [{ attribute: 'will', amount: 1 }]
  },
  {
    id: 'peerless-hunter',
    level: 17,
    type: 'passive_feature',
    name: 'Peerless Hunter',
    description: 'You can Defend against your quarry for free.',
    category: 'combat'
  },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    type: 'stat_boost',
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    statBoosts: [{ attribute: 'intelligence', amount: 1 }]
  },
  {
    id: 'wild-endurance',
    level: 18,
    type: 'passive_feature',
    name: 'Wild Endurance',
    description: 'Gain 1 Thrill of the Hunt charge at the start of your turns.',
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
    id: 'nemesis',
    level: 20,
    type: 'passive_feature',
    name: 'Nemesis',
    description: '+1 to any 2 of your stats. Your Hunter\'s Mark can target any number of creatures simultaneously.',
    category: 'combat'
  }
];

export const hunter: ClassDefinition = {
  id: 'hunter',
  name: 'Hunter',
  description: 'A master tracker and wilderness survivor who forms a bond with nature and excels at ranged combat.',
  hitDieSize: 8,
  keyAttributes: ['dexterity', 'will'],
  startingHP: 13,
  armorProficiencies: [{ type: 'leather' }],
  weaponProficiencies: [{ type: 'dexterity_weapons' }],
  saveAdvantages: {},
  startingEquipment: ['shortbow', 'cheap-hides', 'dagger', 'hunting-trap'],
  features: hunterFeatures
};

export const hunterClass = hunter;