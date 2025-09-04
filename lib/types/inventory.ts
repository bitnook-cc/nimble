import { AttributeName } from './character';
import { StatBonus } from './stat-bonus';
import { Currency } from './currency';

export type ItemType = 'weapon' | 'armor' | 'freeform' | 'consumable' | 'ammunition';

export interface BaseItem {
  id: string;
  name: string;
  size: number;
  type: ItemType;
  description?: string;
  cost?: Currency; // Optional cost in gold pieces
  statBonus?: StatBonus; // Optional stat bonuses provided by this item
}

export interface WeaponItem extends BaseItem {
  type: 'weapon';
  equipped?: boolean;
  attribute?: AttributeName;
  damage?: string;
  damageType?: 'Slashing' | 'Piercing' | 'Bludgeoning';
  vicious?: boolean;
  properties?: string[];
}

export interface ArmorItem extends BaseItem {
  type: 'armor';
  equipped?: boolean;
  armor?: number;
  maxDexBonus?: number; // Maximum dexterity bonus this armor allows
  isMainArmor?: boolean; // True for primary armor pieces (plate mail, chain mail, etc.), false for supplements (helmets, shields)
  properties?: string[];
}

export interface FreeformItem extends BaseItem {
  type: 'freeform';
}

export interface ConsumableItem extends BaseItem {
  type: 'consumable';
  count: number;
}

export interface AmmunitionItem extends BaseItem {
  type: 'ammunition';
  count: number;
}

export type Item = WeaponItem | ArmorItem | FreeformItem | ConsumableItem | AmmunitionItem;

export interface Inventory {
  maxSize: number;
  items: Item[];
  currency: Currency;
}

export interface CreateItemData {
  name: string;
  size: number;
  type: ItemType;
  equipped?: boolean;
  attribute?: AttributeName;
  damage?: string;
  damageType?: 'Slashing' | 'Piercing' | 'Bludgeoning';
  vicious?: boolean;
  armor?: number;
  maxDexBonus?: number;
  isMainArmor?: boolean;
  properties?: string[];
  description?: string;
  cost?: Currency;
  count?: number;
}