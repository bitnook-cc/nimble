import { BackgroundDefinition } from '../../types/background';

export const wildOne: BackgroundDefinition = {
  id: 'wild-one',
  name: 'Wild One',
  description: 'Whether it is the sticks or flowers in your hair, your smell, or the way you carry yourself, wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft. While Field Resting, roll your Hit Dice with advantage while in the wild.',
  features: [
    {
      type: 'passive_feature',
      name: 'One with Nature',
      description: 'Wild creatures are less frightened of you and more willing to aid you. +1 Naturecraft.',
      statBonus: {
        skillBonuses: {
          'naturecraft': { type: 'fixed', value: 1 }
        }
      }
    },
    {
      type: 'passive_feature',
      name: 'Wild Rest',
      description: 'While Field Resting, roll your Hit Dice with advantage while in the wild.'
    }
  ]
};