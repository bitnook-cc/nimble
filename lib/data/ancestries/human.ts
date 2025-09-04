import { AncestryDefinition } from '../../types/ancestry';
import { NameConfig } from '../../utils/name-generator';

const humanNames: NameConfig = {
  male: {
    syllables: {
      prefixes: ['al', 'ar', 'bran', 'cor', 'dar', 'ed', 'gar', 'har', 'jon', 'mar', 'ric', 'rob', 'tha', 'wil'],
      middle: ['an', 'en', 'in', 'on', 'ar', 'er', 'or', 'ic', 'rick', 'bert', 'win', 'fred'],
      suffixes: ['ard', 'bert', 'mund', 'win', 'fred', 'ric', 'ton', 'son', 'den', 'ley']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  female: {
    syllables: {
      prefixes: ['al', 'an', 'bel', 'cat', 'el', 'ev', 'gwen', 'isa', 'mar', 'ros', 'sar', 'syl', 'vic'],
      middle: ['a', 'e', 'i', 'an', 'en', 'in', 'ara', 'ela', 'ina', 'lyn', 'eth'],
      suffixes: ['a', 'e', 'ine', 'ara', 'ella', 'lyn', 'beth', 'wen', 'dra', 'lia']
    },
    patterns: ['PM', 'PS', 'PMS'],
    constraints: {
      minLength: 3,
      maxLength: 12,
      syllableCount: { min: 2, max: 3 }
    }
  },
  surnames: {
    syllables: {
      prefixes: ['ash', 'black', 'bright', 'gold', 'green', 'grey', 'iron', 'red', 'stone', 'white', 'wolf'],
      middle: ['brook', 'field', 'ford', 'hill', 'wood', 'water', 'smith', 'wright'],
      suffixes: ['born', 'ford', 'ton', 'wood', 'field', 'stone', 'brook', 'hill', 'ridge', 'vale']
    },
    patterns: ['P', 'PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 15,
      syllableCount: { min: 1, max: 2 }
    }
  }
};

export const human: AncestryDefinition = {
  id: 'human',
  name: 'Human',
  description: 'Found in every terrain and environment, their curiosity and ambition drive them to explore every corner of the world, making them a ubiquitous and versatile race.',
  size: 'medium',
  rarity: 'common',
  features: [
    {
      type: 'passive_feature',
      name: 'Tenacious',
      description: '+1 to all skills and Initiative.'
    }
  ],
  nameConfig: humanNames
};