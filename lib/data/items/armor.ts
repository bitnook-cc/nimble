import { RepositoryArmorItem } from '../../types/item-repository';

export const MUNDANE_ARMOR: RepositoryArmorItem[] = [
  // CLOTH ARMOR (Main Armor)
  {
    item: {
      id: 'adventurers-garb',
      name: "Adventurer's Garb",
      type: 'armor',
      size: 1,
      armor: 2, // 2+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 10 },
      properties: ['Cloth'],
      description: 'Sturdy traveling clothes suitable for adventure.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'minor-enchantment',
      name: 'Minor Enchantment',
      type: 'armor',
      size: 1,
      armor: 3, // 3+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 100 },
      properties: ['Cloth', 'Magic'],
      description: 'Clothing enhanced with minor protective enchantments.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'major-enchantment',
      name: 'Major Enchantment',
      type: 'armor',
      size: 1,
      armor: 4, // 4+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 1000 },
      properties: ['Cloth', 'Magic'],
      description: 'Clothing enhanced with powerful protective enchantments.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'epic-enchantment',
      name: 'Epic Enchantment',
      type: 'armor',
      size: 1,
      armor: 5, // 5+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 10000 },
      properties: ['Cloth', 'Magic'],
      description: 'Clothing enhanced with legendary protective enchantments.'
    },
    category: 'mundane'
  },

  // MAIL ARMOR (Main Armor)
  {
    item: {
      id: 'rusty-mail',
      name: 'Rusty Mail',
      type: 'armor',
      size: 4,
      armor: 6, // 6+DEX(max 2) from table
      maxDexBonus: 2,
      isMainArmor: true,
      cost: { gold: 15 },
      properties: ['Mail'],
      description: 'Old chain mail covered in rust, still functional but barely.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'chain-shirt',
      name: 'Chain Shirt (Req. 2 STR)',
      type: 'armor',
      size: 3,
      armor: 9, // 9+DEX(max 2) from table
      maxDexBonus: 2,
      isMainArmor: true,
      cost: { gold: 60 },
      properties: ['Mail', 'Req. 2 STR'],
      description: 'A shirt of interlocking metal rings that covers the torso.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'scale-mail',
      name: 'Scale Mail (Req. 3 STR)',
      type: 'armor',
      size: 4,
      armor: 12, // 12+DEX(max 2) from table
      maxDexBonus: 2,
      isMainArmor: true,
      cost: { gold: 700 },
      properties: ['Mail', 'Req. 3 STR'],
      description: 'Overlapping metal scales sewn onto a leather backing.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'dragonscale-armor',
      name: 'Dragonscale (Req. 4 STR)',
      type: 'armor',
      size: 4,
      armor: 15, // 15+DEX(max 2) from table
      maxDexBonus: 2,
      isMainArmor: true,
      cost: { gold: 3000 },
      properties: ['Mail', 'Req. 4 STR', 'Magic'],
      description: 'Armor crafted from the scales of an ancient dragon.'
    },
    category: 'mundane'
  },

  // LEATHER ARMOR (Main Armor)
  {
    item: {
      id: 'cheap-hides',
      name: 'Cheap Hides',
      type: 'armor',
      size: 2,
      armor: 3, // 3+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 5 },
      properties: ['Leather'],
      description: 'Poorly cured animal hides offering minimal protection.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'ox-hide',
      name: 'Ox Hide',
      type: 'armor',
      size: 2,
      armor: 4, // 4+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 45 },
      properties: ['Leather'],
      description: 'Tough hide from oxen, providing decent protection.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'hard-leather',
      name: 'Hard Leather (Req. 1 STR)',
      type: 'armor',
      size: 2,
      armor: 5, // 5+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 300 },
      properties: ['Leather', 'Req. 1 STR'],
      description: 'Hardened leather armor treated for maximum protection.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'wyrmhide',
      name: 'Wyrmhide (Req. 1 STR)',
      type: 'armor',
      size: 2,
      armor: 6, // 6+DEX from table
      maxDexBonus: 10,
      isMainArmor: true,
      cost: { gold: 2000 },
      properties: ['Leather', 'Req. 1 STR', 'Magic'],
      description: 'Armor crafted from the hide of a young dragon.'
    },
    category: 'mundane'
  },

  // PLATE ARMOR (Main Armor)
  {
    item: {
      id: 'rusty-plate',
      name: 'Rusty Plate (Req. 2 STR)',
      type: 'armor',
      size: 5,
      armor: 10,
      maxDexBonus: 0,
      isMainArmor: true,
      cost: { gold: 25 },
      properties: ['Plate', 'Req. 2 STR'],
      description: 'Old plate armor covered in rust, heavy but protective.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'half-plate',
      name: 'Half Plate (Req. 3 STR)',
      type: 'armor',
      size: 5,
      armor: 14,
      maxDexBonus: 0,
      isMainArmor: true,
      cost: { gold: 200 },
      properties: ['Plate', 'Req. 3 STR'],
      description: 'Partial plate armor covering vital areas.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'full-plate',
      name: 'Full Plate (Req. 4 STR)',
      type: 'armor',
      size: 6,
      armor: 18,
      maxDexBonus: 0,
      isMainArmor: true,
      cost: { gold: 2000 },
      properties: ['Plate', 'Req. 4 STR'],
      description: 'Complete suit of interlocking metal plates.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'mithril-plate',
      name: 'Mithril Plate (Req. 5 STR)',
      type: 'armor',
      size: 6,
      armor: 22,
      maxDexBonus: 0,
      isMainArmor: true,
      cost: { gold: 5000 },
      properties: ['Plate', 'Req. 5 STR', 'Magic'],
      description: 'Plate armor forged from the legendary metal mithril.'
    },
    category: 'mundane'
  },

  // SHIELDS (Not Main Armor)
  {
    item: {
      id: 'wooden-buckler',
      name: 'Wooden Buckler',
      type: 'armor',
      size: 1,
      armor: 2,
      maxDexBonus: 10,
      isMainArmor: false,
      cost: { gold: 5 },
      properties: ['Shield'],
      description: 'A small wooden shield offering basic protection.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'iron-shield',
      name: 'Iron Shield (Req. 2 STR)',
      type: 'armor',
      size: 2,
      armor: 4,
      maxDexBonus: 10,
      isMainArmor: false,
      cost: { gold: 80 },
      properties: ['Shield', 'Req. 2 STR'],
      description: 'A sturdy iron shield providing solid protection.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'tower-shield',
      name: 'Tower Shield (Req. 3 STR)',
      type: 'armor',
      size: 3,
      armor: 6,
      maxDexBonus: 10,
      isMainArmor: false,
      cost: { gold: 1500 },
      properties: ['Shield', 'Req. 3 STR'],
      description: 'A massive shield that covers most of the body.'
    },
    category: 'mundane'
  },
  {
    item: {
      id: 'dragon-shield',
      name: 'Dragon Shield (Req. 3 STR)',
      type: 'armor',
      size: 3,
      armor: 8,
      maxDexBonus: 10,
      isMainArmor: false,
      cost: { gold: 9000 },
      properties: ['Shield', 'Req. 3 STR', 'Magic'],
      description: 'A shield crafted from dragon scales and enchanted metal.'
    },
    category: 'mundane'
  }
];

export const MAGICAL_ARMOR: RepositoryArmorItem[] = [
  // The magical armors are now integrated into the main MUNDANE_ARMOR list
  // with appropriate cost and magic properties
];