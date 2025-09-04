import { AncestryDefinition } from '../../types/ancestry';

export const planarbeing: AncestryDefinition = {
  id: 'planarbeing',
  name: 'Planarbeing',
  description: 'You are not from this plane of existence—your soul is not as strongly tethered to it as others. But with this vulnerability comes power, the ability to temporarily shift from one plane to another in times of dire need.',
  size: 'medium',
  rarity: 'exotic',
  features: [
    {
      type: 'passive_feature',
      name: 'Planeshift',
      description: 'Whenever you Defend, you can gain 1 Wound to temporarily phase out of the material plane and ignore the damage. -2 max Wounds.',
      statBonus: {
        maxWoundsBonus: { type: 'fixed', value: -2 }
      }
    }
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: ['void', 'plane', 'ether', 'phase', 'shift', 'drift', 'wander', 'flow', 'between', 'beyond', 'far', 'distant'],
        middle: ['walk', 'step', 'drift', 'flow', 'shift', 'phase', 'move'],
        suffixes: ['walker', 'stepper', 'drifter', 'shifter', 'phaser', 'wanderer', 'born', 'touched', 'made']
      },
      patterns: ['P', 'PS', 'PM'],
      constraints: {
        minLength: 4,
        maxLength: 14,
        syllableCount: { min: 1, max: 2 }
      }
    }
  }
};