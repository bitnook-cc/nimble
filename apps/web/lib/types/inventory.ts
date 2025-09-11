// Import and re-export types from schemas
import type { AttributeName } from "../schemas/character";
import type { Currency } from "../schemas/currency";
import type { ItemType } from "../schemas/inventory";

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
