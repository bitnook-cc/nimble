// Import and re-export types from schemas
import type {
  ItemType,
} from "../schemas/inventory";

import type { Currency } from "../schemas/currency";
import type { AttributeName } from "../schemas/character";

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