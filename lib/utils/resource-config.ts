/**
 * Resource Configuration Utilities
 * Provides predefined color schemes and icon options for resources
 */

export interface ResourceColorScheme {
  id: string;
  name: string;
  description: string;
  colors: {
    full: string; // 100-76%
    high: string; // 75-51%
    medium: string; // 50-26%
    low: string; // 25-1%
    empty: string; // 0%
  };
}

export interface ResourceIconOption {
  id: string;
  name: string;
  icon: string;
  category: "magic" | "energy" | "physical" | "special";
}

export const RESOURCE_COLOR_SCHEMES: ResourceColorScheme[] = [
  {
    id: "blue-magic",
    name: "Mystic Blue",
    description: "Classic magical energy (mana, spell slots)",
    colors: {
      full: "#3b82f6", // blue-500
      high: "#60a5fa", // blue-400
      medium: "#93c5fd", // blue-300
      low: "#dbeafe", // blue-200
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "red-fury",
    name: "Burning Fury",
    description: "Rage, fury, combat energy",
    colors: {
      full: "#dc2626", // red-600
      high: "#ef4444", // red-500
      medium: "#f87171", // red-400
      low: "#fca5a5", // red-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "green-nature",
    name: "Natural Vigor",
    description: "Nature magic, healing, vitality",
    colors: {
      full: "#16a34a", // green-600
      high: "#22c55e", // green-500
      medium: "#4ade80", // green-400
      low: "#86efac", // green-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "purple-arcane",
    name: "Arcane Purple",
    description: "Arcane magic, psychic energy",
    colors: {
      full: "#9333ea", // purple-600
      high: "#a855f7", // purple-500
      medium: "#c084fc", // purple-400
      low: "#d8b4fe", // purple-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "orange-ki",
    name: "Burning Ki",
    description: "Ki, chi, inner energy",
    colors: {
      full: "#ea580c", // orange-600
      high: "#f97316", // orange-500
      medium: "#fb923c", // orange-400
      low: "#fdba74", // orange-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "yellow-divine",
    name: "Divine Light",
    description: "Divine magic, holy power",
    colors: {
      full: "#ca8a04", // yellow-600
      high: "#eab308", // yellow-500
      medium: "#facc15", // yellow-400
      low: "#fde047", // yellow-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "teal-focus",
    name: "Focused Mind",
    description: "Concentration, focus, mental energy",
    colors: {
      full: "#0d9488", // teal-600
      high: "#14b8a6", // teal-500
      medium: "#2dd4bf", // teal-400
      low: "#7dd3fc", // teal-300
      empty: "#f3f4f6", // gray-100
    },
  },
  {
    id: "gray-stamina",
    name: "Physical Stamina",
    description: "Stamina, endurance, physical resources",
    colors: {
      full: "#4b5563", // gray-600
      high: "#6b7280", // gray-500
      medium: "#9ca3af", // gray-400
      low: "#d1d5db", // gray-300
      empty: "#f3f4f6", // gray-100
    },
  },
];

export const RESOURCE_ICONS: ResourceIconOption[] = [
  // Magic category
  { id: "sparkles", name: "Sparkles", icon: "✨", category: "magic" },
  { id: "crystal", name: "Crystal", icon: "💎", category: "magic" },
  { id: "wand", name: "Magic Wand", icon: "🪄", category: "magic" },
  { id: "orb", name: "Crystal Ball", icon: "🔮", category: "magic" },
  { id: "star", name: "Star", icon: "⭐", category: "magic" },
  { id: "comet", name: "Comet", icon: "☄️", category: "magic" },

  // Energy category
  { id: "fire", name: "Fire", icon: "🔥", category: "energy" },
  { id: "lightning", name: "Lightning", icon: "⚡", category: "energy" },
  { id: "zap", name: "High Voltage", icon: "⚡", category: "energy" },
  { id: "battery", name: "Battery", icon: "🔋", category: "energy" },
  { id: "sun", name: "Sun", icon: "☀️", category: "energy" },
  { id: "flame", name: "Flame", icon: "🔥", category: "energy" },

  // Physical category
  { id: "muscle", name: "Flexed Biceps", icon: "💪", category: "physical" },
  { id: "heart", name: "Heart", icon: "❤️", category: "physical" },
  { id: "droplet", name: "Droplet", icon: "💧", category: "physical" },
  { id: "shield", name: "Shield", icon: "🛡️", category: "physical" },
  { id: "sword", name: "Crossed Swords", icon: "⚔️", category: "physical" },

  // Special category
  { id: "eye", name: "Eye", icon: "👁️", category: "special" },
  { id: "brain", name: "Brain", icon: "🧠", category: "special" },
  { id: "leaf", name: "Leaf", icon: "🍃", category: "special" },
  { id: "snowflake", name: "Snowflake", icon: "❄️", category: "special" },
  { id: "potion", name: "Potion", icon: "🧪", category: "special" },
  { id: "hourglass", name: "Hourglass", icon: "⏳", category: "special" },
];

export const getColorSchemeById = (id: string): ResourceColorScheme | undefined => {
  return RESOURCE_COLOR_SCHEMES.find((scheme) => scheme.id === id);
};

export const getIconById = (id: string): ResourceIconOption | undefined => {
  return RESOURCE_ICONS.find((icon) => icon.id === id);
};

export const getResourceColor = (colorSchemeId: string, percentage: number): string => {
  const scheme = getColorSchemeById(colorSchemeId);
  if (!scheme) return "#6b7280"; // Default gray

  if (percentage <= 0) return scheme.colors.empty;
  if (percentage <= 25) return scheme.colors.low;
  if (percentage <= 50) return scheme.colors.medium;
  if (percentage <= 75) return scheme.colors.high;
  return scheme.colors.full;
};

export const getDefaultColorSchemeForIcon = (iconId: string): string => {
  const icon = getIconById(iconId);
  if (!icon) return "blue-magic";

  switch (icon.category) {
    case "magic":
      return "blue-magic";
    case "energy":
      return "red-fury";
    case "physical":
      return "gray-stamina";
    case "special":
      return "purple-arcane";
    default:
      return "blue-magic";
  }
};
