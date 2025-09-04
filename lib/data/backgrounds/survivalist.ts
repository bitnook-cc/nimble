import { BackgroundDefinition } from '../../types/background';

export const survivalist: BackgroundDefinition = {
  id: 'survivalist',
  name: 'Survivalist',
  description: 'You never run out of your own personal rations. Anything can be food if you try hard enough! Advantage against poison saves. +1 max Hit Die.',
  features: [
    {
      type: 'passive_feature',
      name: 'Personal Rations',
      description: 'You never run out of your own personal rations. Anything can be food if you try hard enough!'
    },
    {
      type: 'passive_feature',
      name: 'Poison Resistance',
      description: 'Advantage against poison saves.'
    },
    {
      type: 'passive_feature',
      name: 'Hardy Constitution',
      description: '+1 max Hit Die.',
      statBonus: {
        hitDiceBonus: { type: 'fixed', value: 1 }
      }
    }
  ]
};