import { AncestryDefinition } from '../../types/ancestry';

export const turtlefolk: AncestryDefinition = {
  id: 'turtlefolk',
  name: 'Turtlefolk',
  description: 'Turtlefolk take their time in everything they do; they are patient, sturdy, and slow to anger. They rely on their thick shells for protection, making them difficult to harm, but their cautious movements come at the cost of speed.',
  size: 'small',
  rarity: 'exotic',
  features: [
    {
      id: 'turtlefolk-slow-and-steady',
      name: 'Slow & Steady',
      description: '+4 Armor, -2 speed.',
      effects: [
        {
          id: 'turtlefolk-slow-and-steady-0',
          type: 'stat_bonus',
          statBonus: {
            armorBonus: { type: 'fixed', value: 4 },
            speedBonus: { type: 'fixed', value: -2 }
          }
        }
      ]
    }
  ],
  nameConfig: {
    unisex: {
      syllables: {
        prefixes: ['shell', 'slow', 'steady', 'patient', 'wise', 'ancient', 'old', 'calm', 'peace', 'quiet', 'still', 'deep'],
        middle: ['shell', 'back', 'pace', 'step', 'move', 'flow'],
        suffixes: ['shell', 'back', 'pace', 'stepper', 'mover', 'walker', 'folk', 'kin', 'born', 'made']
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