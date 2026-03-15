/**
 * Shared types for custom content management
 */

// Enum for custom content types that can be imported
export enum CustomContentType {
  CLASS = "class",
  SUBCLASS = "subclass",
  SPELL_SCHOOL = "spell-school",
  ANCESTRY = "ancestry",
  BACKGROUND = "background",
  ACTION = "action",
  SPELL = "spell",
  ITEM = "item",
}

// Display metadata for each content type
export interface ContentTypeMetadata {
  title: string;
  description: string;
  icon: string;
}

// Content type metadata mapping
export const CONTENT_TYPE_METADATA: Record<CustomContentType, ContentTypeMetadata> = {
  [CustomContentType.CLASS]: {
    title: "Classes",
    description: "Character classes with features and progression",
    icon: "Shield",
  },
  [CustomContentType.SUBCLASS]: {
    title: "Subclasses",
    description: "Specialized paths for character classes",
    icon: "Zap",
  },
  [CustomContentType.SPELL_SCHOOL]: {
    title: "Spell Schools",
    description: "Schools of magic with themed spells",
    icon: "Sparkles",
  },
  [CustomContentType.ANCESTRY]: {
    title: "Ancestries",
    description: "Character ancestries with traits and features",
    icon: "Users",
  },
  [CustomContentType.BACKGROUND]: {
    title: "Backgrounds",
    description: "Character backgrounds with passive features",
    icon: "BookOpen",
  },
  [CustomContentType.ACTION]: {
    title: "Abilities",
    description: "Non-spell abilities with resource costs",
    icon: "FileText",
  },
  [CustomContentType.SPELL]: {
    title: "Spells",
    description: "Magical spells with tiers and schools",
    icon: "Wand2",
  },
  [CustomContentType.ITEM]: {
    title: "Items",
    description: "Weapons, armor, consumables, and equipment",
    icon: "Package",
  },
};

// Helper functions
export function getContentTypeMetadata(type: CustomContentType): ContentTypeMetadata {
  return CONTENT_TYPE_METADATA[type];
}

export function getAllContentTypes(): CustomContentType[] {
  return Object.values(CustomContentType);
}
