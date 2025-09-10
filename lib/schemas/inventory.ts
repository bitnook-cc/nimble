import { z } from "zod";

import { currencySchema } from "./currency";
import { CharacterFeatureSchema } from "./features";

// Attribute names for weapon scaling
const attributeNameSchema = z.enum(["strength", "dexterity", "intelligence", "will"]);

// Base item schema shared by all item types
const baseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  size: z.int().min(0),
  description: z.string().optional(),
  cost: currencySchema.optional(),
});

// Item schema with all item types
export const itemSchema = z.discriminatedUnion("type", [
  baseItemSchema.extend({
    type: z.literal("weapon"),
    equipped: z.boolean().optional(),
    attribute: attributeNameSchema.optional(),
    damage: z.string().min(1), // Required damage formula
    damageType: z.enum(["Slashing", "Piercing", "Bludgeoning"]).optional(),
    vicious: z.boolean().optional(),
    properties: z.array(z.string()).optional(),
    feature: CharacterFeatureSchema.optional(),
  }),
  baseItemSchema.extend({
    type: z.literal("armor"),
    equipped: z.boolean().optional(),
    armor: z.int().optional(),
    maxDexBonus: z.int().optional(),
    isMainArmor: z.boolean().optional(),
    properties: z.array(z.string()).optional(),
    feature: CharacterFeatureSchema.optional(),
  }),
  baseItemSchema.extend({
    type: z.literal("freeform"),
  }),
  baseItemSchema.extend({
    type: z.literal("consumable"),
    count: z.int().min(1),
  }),
  baseItemSchema.extend({
    type: z.literal("ammunition"),
    count: z.int().min(1),
  }),
]);

// Inventory schema
export const inventorySchema = z.object({
  maxSize: z.int().min(0),
  items: z.array(itemSchema),
  currency: currencySchema,
});

// Export inferred types
export type ItemType = "weapon" | "armor" | "freeform" | "consumable" | "ammunition";
export type BaseItem = z.infer<typeof baseItemSchema>;
export type Item = z.infer<typeof itemSchema>;
export type WeaponItem = Extract<Item, { type: "weapon" }>;
export type ArmorItem = Extract<Item, { type: "armor" }>;
export type FreeformItem = Extract<Item, { type: "freeform" }>;
export type ConsumableItem = Extract<Item, { type: "consumable" }>;
export type AmmunitionItem = Extract<Item, { type: "ammunition" }>;
export type Inventory = z.infer<typeof inventorySchema>;

// Additional type for equippable items
export type EquippableItem = WeaponItem | ArmorItem;
