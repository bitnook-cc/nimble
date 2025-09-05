import { BackgroundDefinition } from '../../types/background';

export const tasteForTheFinerThings: BackgroundDefinition = {
  id: 'taste-for-the-finer-things',
  name: 'Taste for the Finer Things',
  description: 'You always have up-to-date knowledge of the customs and dress of the upper classes and may even know many of their secrets. Advantage on Influence checks with the upper class.',
  features: [
    {
      id: 'taste-for-the-finer-things-high-society-knowledge',
      name: 'High Society Knowledge',
      description: 'You always have up-to-date knowledge of the customs and dress of the upper classes and may even know many of their secrets.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'taste-for-the-finer-things-upper-class-influence',
      name: 'Upper Class Influence',
      description: 'Advantage on Influence checks with the upper class.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};