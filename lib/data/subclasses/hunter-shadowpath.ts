import { SubclassDefinition } from '../../types/class';

export const hunterShadowpath: SubclassDefinition = {
  id: 'hunter-shadowpath',
  name: 'Keeper of the Shadowpath',
  parentClassId: 'hunter',
  description: 'A hunter who blends stealth and cunning to stalk prey from the shadows.',
  features: [
    {
      id: 'ambusher',
      level: 3,
      type: 'passive_feature',
      name: 'Ambusher',
      description: 'When you roll Initiative, you may use Hunter\'s Mark for free. Gain advantage on the first attack you make each encounter.',
      category: 'combat'
    },
    {
      id: 'skilled-tracker',
      level: 3,
      type: 'passive_feature',
      name: 'Skilled Tracker',
      description: 'You have advantage on skill checks to track creatures.',
      category: 'exploration'
    },
    {
      id: 'skilled-navigator',
      level: 3,
      type: 'passive_feature',
      name: 'Skilled Navigator',
      description: 'You cannot become lost by nonmagical means.',
      category: 'exploration'
    },
    {
      id: 'primal-predator',
      level: 7,
      type: 'ability',
      name: 'Primal Predator',
      description: 'Your weapon attacks ignore cover and armor this turn.',
      ability: {
        id: 'primal-predator',
        name: 'Primal Predator',
        description: 'Your weapon attacks ignore cover and armor this turn.',
        type: 'action',
        frequency: 'per_encounter',
        maxUses: { type: 'fixed', value: 1 }
      }
    },
    {
      id: 'pack-hunter',
      level: 11,
      type: 'passive_feature',
      name: 'Pack Hunter',
      description: 'Whenever you mark a creature, you may also mark another creature within 6 spaces of them for free.',
      category: 'combat'
    },
    {
      id: 'apex-predator',
      level: 15,
      type: 'ability',
      name: 'Apex Predator',
      description: 'You may use your Primal Predator ability twice each encounter. Gain 1 Thrill of the Hunt charge when you roll Initiative.',
      ability: {
        id: 'primal-predator',
        name: 'Primal Predator',
        description: 'Your weapon attacks ignore cover and armor this turn.',
        type: 'action',
        frequency: 'per_encounter',
        maxUses: { type: 'fixed', value: 2 }
      }
    }
  ]
};