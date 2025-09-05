import { AncestryDefinition } from '../../types/ancestry';

export const goblin: AncestryDefinition = {
  id: 'goblin',
  name: 'Goblin',
  description: "Green, cunning, and perpetually vilified, Goblins thrive on the edge of chaos. For a Goblin, vanishing into the shadows is not just a skill—it's an identity. After all, what kind of Goblin would you be if you couldn't slip away unnoticed?",
  size: 'small',
  rarity: 'exotic',
  features: [
    {
      id: 'goblin-skedaddle',
      name: 'Skedaddle',
      description: "Can move 2 spaces for free after you become the target of an attack or negative effect (after damage, ignoring difficult terrain). You know Goblin if your INT is not negative.",
      effects: [] // Passive feature - no mechanical effects to process
    }
  ],
  nameConfig: {
    male: {
      syllables: {
        prefixes: ['grib', 'grok', 'grub', 'snib', 'snag', 'skab', 'brak', 'krag', 'guzz', 'nork', 'zog', 'grig', 'snak', 'krub'],
        middle: ['ack', 'ek', 'ik', 'ok', 'ug', 'ag', 'ig', 'og'],
        suffixes: ['bash', 'gub', 'nark', 'grok', 'snit', 'mek', 'tok', 'kek', 'nog', 'gig']
      },
      patterns: ['P', 'PM', 'PS'],
      constraints: {
        minLength: 3,
        maxLength: 10,
        syllableCount: { min: 1, max: 2 }
      }
    },
    female: {
      syllables: {
        prefixes: ['grizz', 'sniz', 'krib', 'skib', 'nib', 'grib', 'friz', 'trib', 'blib', 'glib'],
        middle: ['a', 'e', 'i', 'ak', 'ek', 'ik'],
        suffixes: ['a', 'ka', 'na', 'za', 'la', 'ra', 'ta', 'ba']
      },
      patterns: ['P', 'PM', 'PS'],
      constraints: {
        minLength: 3,
        maxLength: 10,
        syllableCount: { min: 1, max: 2 }
      }
    },
    surnames: {
      syllables: {
        prefixes: ['mud', 'rat', 'sharp', 'quick', 'sly', 'shadow', 'sneak', 'skull', 'bone', 'rock', 'cave', 'dark'],
        middle: ['tooth', 'claw', 'fang', 'eye', 'ear'],
        suffixes: ['tooth', 'claw', 'fang', 'eye', 'ear', 'foot', 'hand', 'nose', 'back', 'belly']
      },
      patterns: ['P', 'PS', 'PM'],
      constraints: {
        minLength: 3,
        maxLength: 14,
        syllableCount: { min: 1, max: 2 }
      }
    }
  }
};