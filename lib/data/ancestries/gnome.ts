import { AncestryDefinition } from '../../types/ancestry';
import { NameConfig } from '../../utils/name-generator';

const gnomeNames: NameConfig = {
  male: {
    syllables: {
      prefixes: ['bim', 'dim', 'fim', 'gim', 'kim', 'nim', 'pim', 'tim', 'wim', 'zim', 'bol', 'dol', 'fol'],
      middle: ['ble', 'dle', 'gle', 'ple', 'tle', 'bo', 'do', 'fo', 'go', 'no', 'po'],
      suffixes: ['wick', 'dle', 'nock', 'bock', 'lock', 'sock', 'rick', 'nick', 'tick', 'zick']
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
      prefixes: ['bim', 'dim', 'fim', 'gil', 'kim', 'lil', 'nim', 'pim', 'til', 'wil', 'zil'],
      middle: ['bel', 'del', 'fel', 'gel', 'mel', 'nel', 'pel', 'tel'],
      suffixes: ['la', 'na', 'da', 'ta', 'bella', 'nella', 'della', 'tella', 'wick', 'nick']
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
      prefixes: ['copper', 'silver', 'gold', 'iron', 'steel', 'brass', 'tin', 'gear', 'spring', 'clock'],
      middle: ['whistle', 'widget', 'gadget', 'sprocket', 'cog', 'wheel'],
      suffixes: ['bottom', 'top', 'worth', 'shine', 'spark', 'twist', 'turn', 'spin', 'click', 'tick']
    },
    patterns: ['PS', 'PM'],
    constraints: {
      minLength: 4,
      maxLength: 16,
      syllableCount: { min: 1, max: 2 }
    }
  }
};

export const gnome: AncestryDefinition = {
  id: 'gnome',
  name: 'Gnome',
  description: 'Eccentric, curious, and perpetually optimistic, gnomes are cheerful—especially when compared to their typically grumpier and larger kin, the dwarves. Known for their tinkering, spreading cheer, and playful antics, gnomes pursue their passions with a scatterbrained enthusiasm.',
  size: 'small',
  rarity: 'common',
  features: [
    {
      id: 'gnome-optimistic',
      name: 'Optimistic',
      description: 'Allow an ally within Reach 6 to reroll any single die, resets when healed to your max HP. -1 Speed. You know Dwarvish if your INT is not negative (but you call it Gnomish, of course).',
      effects: [
        {
          id: 'gnome-optimistic-0',
          type: 'stat_bonus',
          statBonus: {
            speedBonus: { type: 'fixed', value: -1 }
          }
        }
      ]
    }
  ],
  nameConfig: gnomeNames
};