import { AncestryDefinition } from '../../types/ancestry';

export const dragonborn: AncestryDefinition = {
  id: 'dragonborn',
  name: 'Dragonborn',
  description: 'The soul of a dragon burns within you, the scales of your body are like forged steel. You are a kin and your heritage the coals that stoke your flames. Call upon your wrath, to speak in the tongue of your ancestors and imbue unbridled fury into your attacks.',
  size: 'medium',
  rarity: 'exotic',
  features: [
    {
      type: 'passive_feature',
      name: 'Draconic Heritage',
      description: '+1 Armor. When you attack: deal an additional LVL+KEY damage (ignoring armor) divided as you choose among any of your targets; recharges whenever you Safe Rest or gain a Wound. You know Draconic if your INT is not negative.',
      statBonus: {
        armorBonus: { type: 'fixed', value: 1 }
      }
    }
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: ['vor', 'gar', 'thor', 'drak', 'bala', 'kriv', 'thar', 'shen', 'rhos', 'akra', 'naal', 'qyth', 'vyr', 'ghesh'],
        middle: ['an', 'ar', 'ash', 'en', 'eth', 'im', 'in', 'or', 'oth', 'ull'],
        suffixes: ['ash', 'rax', 'ghan', 'naar', 'thor', 'vok', 'soth', 'krex', 'morn', 'keth']
      },
      patterns: ['P', 'PM', 'PS', 'PMS'],
      constraints: {
        minLength: 4,
        maxLength: 14,
        syllableCount: { min: 1, max: 3 }
      }
    },
    female: {
      syllables: {
        prefixes: ['akra', 'biri', 'dari', 'enna', 'farideh', 'harann', 'kava', 'korinn', 'mishann', 'nala', 'perra', 'raiann', 'sora', 'surina', 'thava'],
        middle: ['a', 'e', 'i', 'an', 'ar', 'en', 'eth', 'in', 'oth'],
        suffixes: ['a', 'ah', 'enna', 'ideh', 'ann', 'ava', 'inn', 'ish', 'ala', 'erra', 'ora', 'ina', 'ava']
      },
      patterns: ['P', 'PM', 'PS', 'PMS'],
      constraints: {
        minLength: 4,
        maxLength: 14,
        syllableCount: { min: 1, max: 3 }
      }
    },
    surnames: {
      syllables: {
        prefixes: ['clan', 'house', 'blood', 'fire', 'steel', 'gold', 'silver', 'bronze', 'iron', 'shadow', 'flame', 'storm'],
        middle: ['scale', 'claw', 'fang', 'wing', 'breath', 'heart', 'soul'],
        suffixes: ['born', 'breath', 'claw', 'fang', 'scale', 'wing', 'heart', 'soul', 'fire', 'storm', 'steel', 'stone']
      },
      patterns: ['PS', 'PM'],
      constraints: {
        minLength: 4,
        maxLength: 16,
        syllableCount: { min: 1, max: 2 }
      }
    }
  }
};