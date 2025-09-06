import { RepositoryConsumableItem } from "../../types/item-repository";

export const MUNDANE_CONSUMABLES: RepositoryConsumableItem[] = [
  {
    item: {
      id: "healing-potion",
      name: "Healing Potion",
      type: "consumable",
      size: 1,
      count: 1,
      description: "A red liquid that restores 2d4+2 hit points when consumed.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "antidote",
      name: "Antidote",
      type: "consumable",
      size: 1,
      count: 1,
      description: "A bitter green potion that neutralizes poison in the body.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "rations",
      name: "Trail Rations",
      type: "consumable",
      size: 1,
      count: 3,
      description: "Dried meat, fruits, and hardtack bread. Enough food for one day.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "water-flask",
      name: "Water Flask",
      type: "consumable",
      size: 1,
      count: 1,
      description: "A leather flask containing fresh water for one day.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "torch",
      name: "Torch",
      type: "consumable",
      size: 1,
      count: 5,
      description: "A wooden stick wrapped in oil-soaked cloth, burns for 1 hour.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "oil-flask",
      name: "Oil Flask",
      type: "consumable",
      size: 1,
      count: 1,
      description: "A ceramic flask of oil that can be thrown and ignited.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "rope",
      name: "Hemp Rope (50 ft)",
      type: "consumable",
      size: 2,
      count: 1,
      description: "Strong braided rope suitable for climbing and binding.",
    },
    category: "mundane",
  },
  {
    item: {
      id: "rations-meat",
      name: "Preserved Meat",
      type: "consumable",
      size: 1,
      count: 5,
      description: "Salted and dried meat that keeps for weeks without spoiling.",
    },
    category: "mundane",
  },
];

export const MAGICAL_CONSUMABLES: RepositoryConsumableItem[] = [
  {
    item: {
      id: "greater-healing-potion",
      name: "Greater Healing Potion",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A brilliant red elixir that restores 4d4+4 hit points and glows with inner light.",
    },
    category: "magical",
    rarity: "uncommon",
  },
  {
    item: {
      id: "potion-of-strength",
      name: "Potion of Giant Strength",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A cloudy blue potion that grants the strength of a giant for 1 hour (+4 Strength).",
    },
    category: "magical",
    rarity: "rare",
  },
  {
    item: {
      id: "potion-of-invisibility",
      name: "Potion of Invisibility",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A shimmering, nearly transparent liquid that renders the drinker invisible for 1 hour.",
    },
    category: "magical",
    rarity: "very-rare",
  },
  {
    item: {
      id: "elixir-of-life",
      name: "Elixir of Life",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A golden liquid that instantly restores the drinker to full health and removes all conditions.",
    },
    category: "magical",
    rarity: "legendary",
  },
  {
    item: {
      id: "scroll-of-fireball",
      name: "Scroll of Fireball",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A parchment inscribed with arcane symbols that unleashes a devastating fireball when read.",
    },
    category: "magical",
    rarity: "uncommon",
  },
  {
    item: {
      id: "phoenix-feather",
      name: "Phoenix Feather",
      type: "consumable",
      size: 1,
      count: 1,
      description:
        "A brilliant feather that brings the deceased back to life when placed upon their heart.",
    },
    category: "magical",
    rarity: "legendary",
  },
];
