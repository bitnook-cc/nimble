import { CharacterFeature } from "./character";
import { FeatureEffect } from "./feature-effects";

// Import and re-export types from schemas
import type {
  ItemType,
  BaseItem,
  Item,
  WeaponItem,
  ArmorItem,
  FreeformItem,
  ConsumableItem,
  AmmunitionItem,
  Inventory,
  AttributeName,
} from "../schemas/character";
import type { Currency } from "../schemas/currency";

export type {
  ItemType,
  BaseItem,
  Item,
  WeaponItem,
  ArmorItem,
  FreeformItem,
  ConsumableItem,
  AmmunitionItem,
  Inventory,
};

// Keep EquippableItem as a local interface since it's not in schemas
export interface EquippableItem extends BaseItem {
  equipped?: boolean;
  features?: CharacterFeature[];
}

export interface CreateItemData {
  name: string;
  size: number;
  type: ItemType;
  equipped?: boolean;
  attribute?: AttributeName;
  damage?: string;
  damageType?: "Slashing" | "Piercing" | "Bludgeoning";
  vicious?: boolean;
  armor?: number;
  maxDexBonus?: number;
  isMainArmor?: boolean;
  properties?: string[];
  description?: string;
  cost?: Currency;
  count?: number;
}
