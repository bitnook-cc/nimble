import { AncestryDefinition } from '../../types/ancestry';
import { NameConfig } from '../../utils/name-generator';

const dwarfNames: NameConfig = {
  male: {
    syllables: {
      prefixes: ['bor', 'dain', 'dur', 'fal', 'gim', 'gro', 'kil', 'nor', 'ori', 'tho', 'ulf', 'bal'],
      middle: ['an', 'ar', 'in', 'or', 'un', 'am', 'im', 'om', 'ek', 'ok', 'uk'],
      suffixes: ['in', 'on', 'un', 'li', 'ri', 'din', 'dor', 'dur', 'grim', 'helm']
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
      prefixes: ['bal', 'dar', 'dor', 'fal', 'hil', 'kira', 'nala', 'rial', 'tova', 'vera'],
      middle: ['a', 'e', 'i', 'an', 'en', 'in', 'ar', 'er', 'or'],
      suffixes: ['a', 'i', 'ana', 'ina', 'wen', 'dis', 'la', 'ra', 'wa']
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
      prefixes: ['iron', 'stone', 'gold', 'steel', 'hammer', 'forge', 'mountain', 'deep', 'rock', 'coal'],
      middle: ['beard', 'fist', 'hammer', 'pick', 'shield', 'axe'],
      suffixes: ['beard', 'fist', 'hammer', 'pick', 'shield', 'axe', 'born', 'song', 'heart', 'forge']
    },
    patterns: ['P', 'PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 18,
      syllableCount: { min: 1, max: 2 }
    }
  }
};

export const dwarf: AncestryDefinition = {
  id: 'dwarf',
  name: 'Dwarf',
  description: 'Dwarf, in the old language, means "stone." You are resilient, solid, stout. Even when driven to exhaustion, you will not falter. Forgoing speed, you are gifted with physical vitality and a belly that can handle the finest (and worst) consumables this world has to offer.',
  size: 'medium',
  rarity: 'common',
  features: [
    {
      type: 'passive_feature',
      name: 'Stout',
      description: '+2 max Hit Dice, +1 max Wounds, -1 Speed. You know Dwarvish if your INT is not negative.',
      statBonus: {
        hitDiceBonus: { type: 'fixed', value: 2 },
        maxWoundsBonus: { type: 'fixed', value: 1 },
        speedBonus: { type: 'fixed', value: -1 }
      }
    }
  ],
  nameConfig: dwarfNames
};