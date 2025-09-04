import { BackgroundDefinition } from '../../types/background';

export const backOutOfRetirement: BackgroundDefinition = {
  id: 'back-out-of-retirement',
  name: 'Back Out of Retirement',
  description: 'You\'ve forgotten more than most adventurers these days know! Talk with your GM, what made you come out of retirement?',
  features: [
    {
      type: 'passive_feature',
      name: 'I Remember How to Do This',
      description: 'You may gain 1 Wound to use an ability or cast a spell as if you were 1 level higher.'
    },
    {
      type: 'passive_feature',
      name: 'These Old Bones',
      description: 'Your age has long since started to show. -1 max Wounds.',
      statBonus: {
        maxWoundsBonus: { type: 'fixed', value: -1 }
      }
    }
  ]
};