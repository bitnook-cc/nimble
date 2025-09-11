import {
  AmmunitionItem,
  ArmorItem,
  ConsumableItem,
  FreeformItem,
  Item,
  ItemType,
  WeaponItem,
} from "@/lib/schemas/inventory";

// Repository item wrapper that uses the existing item structure
export interface RepositoryItem {
  item: Omit<Item, "equipped">; // Repository items aren't equipped initially
  category: "mundane" | "magical";
  rarity?: "common" | "uncommon" | "rare" | "very-rare" | "legendary";
}

// Specific repository item types
export interface RepositoryWeaponItem extends RepositoryItem {
  item: Omit<WeaponItem, "equipped">;
}

export interface RepositoryArmorItem extends RepositoryItem {
  item: Omit<ArmorItem, "equipped">;
}

export interface RepositoryFreeformItem extends RepositoryItem {
  item: FreeformItem;
}

export interface RepositoryConsumableItem extends RepositoryItem {
  item: ConsumableItem;
}

export interface RepositoryAmmunitionItem extends RepositoryItem {
  item: AmmunitionItem;
}

// Item repository structure
export interface ItemRepository {
  weapons: RepositoryWeaponItem[];
  armor: RepositoryArmorItem[];
  freeform: RepositoryFreeformItem[];
  consumables: RepositoryConsumableItem[];
  ammunition: RepositoryAmmunitionItem[];
}

// Custom item content type for uploads
export interface CustomItemContent {
  items: RepositoryItem[];
}

// Filter options for item browsing
export interface ItemFilter {
  type?: ItemType;
  category?: "mundane" | "magical";
  rarity?: "common" | "uncommon" | "rare" | "very-rare" | "legendary";
  name?: string;
}
