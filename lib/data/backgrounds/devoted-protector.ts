import { BackgroundDefinition } from '../../types/background';

export const devotedProtector: BackgroundDefinition = {
  id: 'devoted-protector',
  name: 'Devoted Protector',
  description: 'Choose 1 ally in your party. You can survive +3 max Wounds as long as they are nearby. Whenever they take a Wound, you do too.',
  features: [
    {
      id: 'devoted-protector-protective-bond',
      name: 'Protective Bond',
      description: 'You can survive +3 max Wounds as long as your chosen ally is nearby. Whenever they take a Wound, you do too.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};