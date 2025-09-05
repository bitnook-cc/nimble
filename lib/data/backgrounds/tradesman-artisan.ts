import { BackgroundDefinition } from '../../types/background';

export const tradesmanArtisan: BackgroundDefinition = {
  id: 'tradesman-artisan',
  name: 'Tradesman/Artisan',
  description: 'Choose a profession (Baker/Cook, Smith, Stonemason, Weaver, Leatherworker, etc.). Checks you make related to that profession are made with advantage. You also retain special knowledge related to your profession.',
  features: [
    {
      id: 'tradesman-artisan-professional-expertise',
      name: 'Professional Expertise',
      description: 'Choose a profession (Baker/Cook, Smith, Stonemason, Weaver, Leatherworker, etc.). Checks you make related to that profession are made with advantage.',
      effects: [] // Passive feature - no mechanical effects to process
    },
    {
      id: 'tradesman-artisan-professional-knowledge',
      name: 'Professional Knowledge',
      description: 'You retain special knowledge related to your profession.',
      effects: [] // Passive feature - no mechanical effects to process
    }
  ]
};