import {
  AmmunitionItem,
  ArmorItem,
  ConsumableItem,
  FreeformItem,
  Item,
  ItemCategory,
  ItemRarity,
  ItemType,
  WeaponItem,
} from "@/lib/schemas/inventory";

// Repository item combines item with category and rarity
export type RepositoryItem = Item & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

// Specific repository item types
export type RepositoryWeaponItem = WeaponItem & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

export type RepositoryArmorItem = ArmorItem & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

export type RepositoryFreeformItem = FreeformItem & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

export type RepositoryConsumableItem = ConsumableItem & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

export type RepositoryAmmunitionItem = AmmunitionItem & {
  category: ItemCategory;
  rarity?: ItemRarity;
};

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
  category?: ItemCategory;
  rarity?: ItemRarity;
  name?: string;
}
