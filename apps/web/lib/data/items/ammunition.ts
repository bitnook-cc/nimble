import { RepositoryAmmunitionItem } from "../../types/item-repository";

export const MUNDANE_AMMUNITION: RepositoryAmmunitionItem[] = [
  {
    item: {
      id: "arrows",
      name: "Arrows",
      type: "ammunition",
      size: 1,
      count: 20,
      description: "Standard wooden arrows with steel tips, suitable for most bows.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "crossbow-bolts",
      name: "Crossbow Bolts",
      type: "ammunition",
      size: 1,
      count: 20,
      description: "Heavy bolts designed for crossbows, with broad steel heads.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "sling-bullets",
      name: "Sling Bullets",
      type: "ammunition",
      size: 1,
      count: 30,
      description: "Smooth lead bullets crafted for slings.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "blowgun-needles",
      name: "Blowgun Needles",
      type: "ammunition",
      size: 1,
      count: 50,
      description: "Thin needles for blowguns, often coated with poison.",
    },
    category: "mundane",
  },
];

export const MAGICAL_AMMUNITION: RepositoryAmmunitionItem[] = [
  {
    item: {
      id: "silver-arrows",
      name: "Silver Arrows",
      type: "ammunition",
      size: 1,
      count: 10,
      description: "Arrows tipped with pure silver, effective against lycanthropes and undead.",
    },
    category: "magical",
    rarity: "uncommon",
  },
  {
    item: {
      id: "flame-arrows",
      name: "Arrows of Flame",
      type: "ammunition",
      size: 1,
      count: 5,
      description: "Arrows that burst into flame upon impact, dealing additional fire damage.",
    },
    category: "magical",
    rarity: "rare",
  },
  {
    item: {
      id: "seeking-bolts",
      name: "Seeking Crossbow Bolts",
      type: "ammunition",
      size: 1,
      count: 3,
      description: "Enchanted bolts that adjust their flight path to hit their intended target.",
    },
    category: "magical",
    rarity: "very-rare",
  },
  {
    item: {
      id: "dragonslayer-arrow",
      name: "Dragonslayer Arrow",
      type: "ammunition",
      size: 1,
      count: 1,
      description:
        "A legendary arrow forged to pierce dragon scales and deal massive damage to draconic creatures.",
    },
    category: "magical",
    rarity: "legendary",
  },
];
