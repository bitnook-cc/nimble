import { BackgroundDefinition } from '../../types/background';

export const fearless: BackgroundDefinition = {
  id: 'fearless',
  name: 'Fearless',
  description: 'You are immune to the Frightened condition. +1 Initiative. -1 Armor.',
  features: [
    {
      type: 'passive_feature',
      name: 'Fear Immunity',
      description: 'You are immune to the Frightened condition.'
    },
    {
      type: 'passive_feature',
      name: 'Quick Reflexes',
      description: '+1 Initiative.',
      statBonus: {
        initiativeBonus: { type: 'fixed', value: 1 }
      }
    },
    {
      type: 'passive_feature',
      name: 'Reckless',
      description: '-1 Armor.',
      statBonus: {
        armorBonus: { type: 'fixed', value: -1 }
      }
    }
  ]
};