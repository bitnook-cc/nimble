import {
  // Energy & Power Icons
  Battery,
  BookOpen,
  // Mental & Special Icons
  Brain,
  CircleDot,
  Cloud,
  CloudRain,
  Droplet,
  Dumbbell,
  Eye,
  // Element & Magic Icons
  Flame,
  FlaskConical,
  Gem,
  Heart,
  Hourglass,
  Leaf,
  type LucideIcon,
  Moon,
  Music,
  ScrollText,
  // Physical & Combat Icons
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Wand2,
  Wind,
  Zap,
} from "lucide-react";

// ============================================================================
// Unified Icon System for Spell Schools and Resources
// ============================================================================

/**
 * Icon categories for organization
 */
export const ICON_CATEGORIES = {
  element: "Element & Nature",
  energy: "Energy & Magic",
  physical: "Physical & Combat",
  mental: "Mental & Special",
} as const;

export type IconCategory = keyof typeof ICON_CATEGORIES;

/**
 * Icon definition with metadata
 */
export interface IconDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  category: IconCategory;
}

/**
 * All available icons with their metadata
 */
export const AVAILABLE_ICONS: IconDefinition[] = [
  // Element & Nature
  { id: "flame", name: "Flame", icon: Flame, category: "element" },
  { id: "snowflake", name: "Snowflake", icon: Snowflake, category: "element" },
  { id: "zap", name: "Lightning", icon: Zap, category: "element" },
  { id: "wind", name: "Wind", icon: Wind, category: "element" },
  { id: "sun", name: "Sun", icon: Sun, category: "element" },
  { id: "moon", name: "Moon", icon: Moon, category: "element" },
  { id: "cloud", name: "Cloud", icon: Cloud, category: "element" },
  { id: "cloud-rain", name: "Rain", icon: CloudRain, category: "element" },
  { id: "leaf", name: "Leaf", icon: Leaf, category: "element" },

  // Energy & Magic
  { id: "sparkles", name: "Sparkles", icon: Sparkles, category: "energy" },
  { id: "star", name: "Star", icon: Star, category: "energy" },
  { id: "gem", name: "Gem", icon: Gem, category: "energy" },
  { id: "wand", name: "Wand", icon: Wand2, category: "energy" },
  { id: "circle-dot", name: "Orb", icon: CircleDot, category: "energy" },
  { id: "battery", name: "Battery", icon: Battery, category: "energy" },

  // Physical & Combat
  { id: "shield", name: "Shield", icon: Shield, category: "physical" },
  { id: "swords", name: "Swords", icon: Swords, category: "physical" },
  { id: "heart", name: "Heart", icon: Heart, category: "physical" },
  { id: "droplet", name: "Droplet", icon: Droplet, category: "physical" },
  { id: "dumbbell", name: "Strength", icon: Dumbbell, category: "physical" },
  { id: "target", name: "Target", icon: Target, category: "physical" },

  // Mental & Special
  { id: "brain", name: "Brain", icon: Brain, category: "mental" },
  { id: "eye", name: "Eye", icon: Eye, category: "mental" },
  { id: "skull", name: "Skull", icon: Skull, category: "mental" },
  { id: "flask", name: "Potion", icon: FlaskConical, category: "mental" },
  { id: "hourglass", name: "Time", icon: Hourglass, category: "mental" },
  { id: "book", name: "Book", icon: BookOpen, category: "mental" },
  { id: "scroll", name: "Scroll", icon: ScrollText, category: "mental" },
  { id: "music", name: "Music", icon: Music, category: "mental" },
];

/**
 * All available icon IDs as a const array for type safety
 */
export const ICON_IDS = AVAILABLE_ICONS.map((icon) => icon.id) as readonly string[];
export type IconId = (typeof ICON_IDS)[number];

/**
 * Icon ID to LucideIcon map for quick lookup
 */
const iconMap: Record<string, LucideIcon> = AVAILABLE_ICONS.reduce(
  (acc, iconDef) => {
    acc[iconDef.id] = iconDef.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>,
);

/**
 * Get an icon by its ID
 * @param iconId - The ID of the icon
 * @returns The corresponding Lucide icon component, or Sparkles as default
 */
export function getIconById(iconId: IconId): LucideIcon {
  return iconMap[iconId];
}

/**
 * Get icon definition by ID
 * @param iconId - The ID of the icon
 * @returns The full icon definition, or undefined if not found
 */
export function getIconDefinition(iconId: IconId): IconDefinition | undefined {
  return AVAILABLE_ICONS.find((icon) => icon.id === iconId);
}

/**
 * Get all icons in a specific category
 * @param category - The category to filter by
 * @returns Array of icon definitions in that category
 */
export function getIconsByCategory(category: IconCategory): IconDefinition[] {
  return AVAILABLE_ICONS.filter((icon) => icon.category === category);
}

/**
 * Type guard to check if a string is a valid icon ID
 */
export function isValidIconId(iconId: string): iconId is IconId {
  return iconMap.hasOwnProperty(iconId);
}

/**
 * Get a default color scheme based on icon category
 * @param iconId - The ID of the icon
 * @returns Suggested color scheme ID for resources
 */
export function getDefaultColorSchemeForIcon(iconId: IconId): string {
  const iconDef = getIconDefinition(iconId);
  if (!iconDef) return "blue-magic";

  switch (iconDef.category) {
    case "element":
      return "green-nature";
    case "energy":
      return "blue-magic";
    case "physical":
      return "red-fury";
    case "mental":
      return "purple-arcane";
    default:
      return "blue-magic";
  }
}
