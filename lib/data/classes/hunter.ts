import { ClassDefinition, ClassFeature } from '../../types/class';

const hunterFeatures: ClassFeature[] = [
  {
    id: 'hunters-mark',
    level: 1,
    name: "Hunter's Mark",
    description: 'Mark a creature as your quarry for 1 day. It can\'t be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage.',
    effects: [
      {
        id: 'hunters-mark-0',
        type: 'ability',
        ability: {
          id: 'hunters-mark',
          name: "Hunter's Mark",
          description: 'Mark a creature you can see as your quarry for 1 day (or until you mark another creature). It can\'t be hidden from you, and your attacks against it gain your choice of advantage OR +1 LVL damage (choose before each attack).',
          type: 'action',
          frequency: 'at_will',
          actionCost: 1
        }
      }
    ]
  },
  {
    id: 'forager',
    level: 1,
    name: 'Forager',
    description: 'Gain advantage on skill checks to find food and water in the wild.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'thrill-of-the-hunt-resource',
    level: 2,
    name: 'Thrill of the Hunt Charges',
    description: 'Charges used to fuel Thrill of the Hunt abilities. Gain charges when your quarry dies or when you hit your quarry in melee/crit at range.',
    effects: [
      {
        id: 'thrill-of-the-hunt-resource-0',
        type: 'resource',
        resourceDefinition: {
          id: 'thrill-of-the-hunt-charges',
          name: 'Thrill of the Hunt',
          description: 'Charges used to fuel Hunter abilities',
          colorScheme: 'green-nature',
          icon: 'zap',
          resetCondition: 'encounter_end',
          resetType: 'to_zero',
          minValue: { type: 'fixed', value: 0 },
          maxValue: { type: 'fixed', value: 10 }
        }
      }
    ]
  },
  {
    id: 'thrill-of-the-hunt-1',
    level: 2,
    name: 'Thrill of the Hunt',
    description: 'Choose 2 Thrill of the Hunt (ToH) abilities. Gain a charge to use these abilities during that encounter whenever:\n• Your quarry dies.\n• You hit your quarry in melee or crit your quarry at range.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'roll-and-strike',
    level: 2,
    name: 'Roll & Strike',
    description: 'If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.',
    effects: [
      {
        id: 'roll-and-strike-0',
        type: 'ability',
        ability: {
          id: 'roll-and-strike',
          name: 'Roll & Strike',
          description: 'If you have no Thrill of the Hunt charges, move up to your speed toward your quarry. If you end adjacent to them, make a melee attack against them for free.',
          type: 'action',
          frequency: 'at_will',
          actionCost: 1
        }
      }
    ]
  },
  {
    id: 'remember-the-wild',
    level: 2,
    name: 'Remember the Wild',
    description: 'Whenever you spend a day in the wilderness during a Safe Rest, you may choose different Hunter options available to you.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'subclass',
    level: 3,
    name: 'Hunter Subclass',
    description: 'Choose a Hunter subclass.',
    effects: [
      {
        id: 'subclass-0',
        type: 'subclass_choice'
      }
    ]
  },
  {
    id: 'trackers-intuition',
    level: 3,
    name: "Tracker's Intuition",
    description: 'You can discern the events of a past encounter by studying tracks and other subtle environmental clues, accurately determining the kind and amount of creatures, their direction, key actions, and passage of time.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  {
    id: 'thrill-of-the-hunt-2',
    level: 4,
    name: 'Thrill of the Hunt (2)',
    description: 'Choose a 3rd Thrill of the Hunt ability.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'key-stat-increase-1',
    level: 4,
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    effects: [
      {
        id: 'key-stat-increase-1-0',
        type: 'attribute_boost',
        allowedAttributes: ['dexterity', 'will'],
        amount: 1
      }
    ]
  },
  {
    id: 'explorer-of-the-wilds',
    level: 4,
    name: 'Explorer of the Wilds',
    description: '+2 speed, gain a climbing speed.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'hunters-resolve',
    level: 5,
    name: "Hunter's Resolve",
    description: 'Whenever you have no Thrill of the Hunt charges, gain Hunter\'s Resolve until the end of your turn: treat all creatures as your quarry for the purposes of movement and melee attacks.',
    effects: [] // Passive feature - no mechanical effects to process
  },
  {
    id: 'final-takedown',
    level: 5,
    name: 'Final Takedown',
    description: 'Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter\'s Mark. If they survive, they crit you back.',
    effects: [
      {
        id: 'final-takedown-0',
        type: 'ability',
        ability: {
          id: 'final-takedown',
          name: 'Final Takedown',
          description: 'Spend 1 Thrill of the Hunt charge to make a melee attack against your Bloodied quarry. Turn it into a crit and double the damage of your Hunter\'s Mark. If they survive, they crit you back.',
          type: 'action',
          frequency: 'at_will',
          actionCost: 1
        }
      }
    ]
  },
  {
    id: 'secondary-stat-increase-1',
    level: 5,
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    effects: [
      {
        id: 'secondary-stat-increase-1-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['strength', 'dexterity'],
        amount: 1
      }
    ]
  },
  {
    id: 'versatile-bowmaster',
    level: 6,
    name: 'Versatile Bowmaster',
    description: 'Whenever you attack with a Longbow, you may roll 2d4 instead of 1d8; or with a Crossbow, 2d8 instead of 4d4.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'thrill-of-the-hunt-3',
    level: 6,
    name: 'Thrill of the Hunt (3)',
    description: 'Choose a 4th Thrill of the Hunt ability.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'subclass-feature-7',
    level: 7,
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'thrill-of-the-hunt-4',
    level: 8,
    name: 'Thrill of the Hunt (4)',
    description: 'Choose a 5th Thrill of the Hunt ability.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'key-stat-increase-2',
    level: 8,
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    effects: [
      {
        id: 'key-stat-increase-2-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['intelligence', 'will'],
        amount: 1
      }
    ]
  },
  {
    id: 'no-escape',
    level: 9,
    name: 'No Escape',
    description: 'Whenever you see one or more allies make an opportunity attack, you may also make a ranged opportunity attack against the same target.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'secondary-stat-increase-2',
    level: 9,
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    effects: [
      {
        id: 'secondary-stat-increase-2-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['strength', 'dexterity'],
        amount: 1
      }
    ]
  },
  {
    id: 'veteran-stalker',
    level: 10,
    name: 'Veteran Stalker',
    description: 'Gain a Thrill of the Hunt charge whenever you are first Bloodied in an encounter and for every Wound you gain.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'keen-eye-steady-hand',
    level: 10,
    name: 'Keen Eye, Steady Hand',
    description: 'Add WIL to your ranged weapon damage.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'subclass-feature-11',
    level: 11,
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'thrill-of-the-hunt-5',
    level: 12,
    name: 'Thrill of the Hunt (5)',
    description: 'Choose a 6th Thrill of the Hunt ability.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'key-stat-increase-3',
    level: 12,
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    effects: [
      {
        id: 'key-stat-increase-3-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['intelligence', 'will'],
        amount: 1
      }
    ]
  },
  {
    id: 'keen-sight',
    level: 13,
    name: 'Keen Sight',
    description: 'Advantage on Perception checks.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'secondary-stat-increase-3',
    level: 13,
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    effects: [
      {
        id: 'secondary-stat-increase-3-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['strength', 'dexterity'],
        amount: 1
      }
    ]
  },
  {
    id: 'thrill-of-the-hunt-6',
    level: 14,
    name: 'Thrill of the Hunt (6)',
    description: 'Choose a 7th Thrill of the Hunt ability.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'subclass-feature-15',
    level: 15,
    name: 'Subclass Feature',
    description: 'Gain your Hunter subclass feature.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'key-stat-increase-4',
    level: 16,
    name: 'Key Stat Increase',
    description: '+1 DEX or WIL.',
    effects: [
      {
        id: 'key-stat-increase-4-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['intelligence', 'will'],
        amount: 1
      }
    ]
  },
  {
    id: 'peerless-hunter',
    level: 17,
    name: 'Peerless Hunter',
    description: 'You can Defend against your quarry for free.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'secondary-stat-increase-4',
    level: 17,
    name: 'Secondary Stat Increase',
    description: '+1 STR or INT.',
    effects: [
      {
        id: 'secondary-stat-increase-4-0',
        
        type: 'attribute_boost',
        allowedAttributes: ['strength', 'dexterity'],
        amount: 1
      }
    ]
  },
  {
    id: 'wild-endurance',
    level: 18,
    name: 'Wild Endurance',
    description: 'Gain 1 Thrill of the Hunt charge at the start of your turns.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'epic-boon',
    level: 19,
    name: 'Epic Boon',
    description: 'Choose an Epic Boon.',
    effects: [] // Passive feature - no mechanical effects to process
    },
  {
    id: 'nemesis',
    level: 20,
    name: 'Nemesis',
    description: '+1 to any 2 of your stats. Your Hunter\'s Mark can target any number of creatures simultaneously.',
    effects: [] // Passive feature - no mechanical effects to process
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