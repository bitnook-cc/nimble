import { AncestryDefinition } from '../../types/ancestry';

export const halfGiant: AncestryDefinition = {
  id: 'half-giant',
  name: 'Half-Giant',
  description: 'Towering beings whose strength is as immovable as the mountains they call home. Their sheer size and resilience make them fearsome opponents, capable of surviving even devastating blows.',
  size: 'large',
  rarity: 'exotic',
  features: [
    {
      type: 'passive_feature',
      name: 'Strength of Stone',
      description: 'Force an enemy to reroll a crit against you, 1/encounter. +2 Might. You know Dwarvish if your INT is not negative.',
      statBonus: {
        skillBonuses: {
          'might': { type: 'fixed', value: 2 }
        }
      }
    }
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: ['stone', 'boulder', 'granite', 'mountain', 'cliff', 'peak', 'rock', 'iron', 'steel', 'titan', 'mighty', 'strong'],
        middle: ['heart', 'fist', 'arm', 'back', 'chest', 'jaw'],
        suffixes: ['heart', 'fist', 'arm', 'back', 'chest', 'jaw', 'born', 'son', 'crusher', 'breaker']
      },
      patterns: ['P', 'PS', 'PM'],
      constraints: {
        minLength: 4,
        maxLength: 16,
        syllableCount: { min: 1, max: 2 }
      }
    },
    female: {
      syllables: {
        prefixes: ['stone', 'mountain', 'cliff', 'peak', 'iron', 'mighty', 'strong', 'noble', 'great', 'vast', 'tall'],
        middle: ['heart', 'soul', 'spirit', 'voice', 'song'],
        suffixes: ['heart', 'soul', 'spirit', 'voice', 'song', 'born', 'daughter', 'maiden', 'lady']
      },
      patterns: ['P', 'PS', 'PM'],
      constraints: {
        minLength: 4,
        maxLength: 16,
        syllableCount: { min: 1, max: 2 }
      }
    }
  }
};