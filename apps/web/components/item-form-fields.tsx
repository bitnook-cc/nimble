"use client";

import { AttributeName } from "@/lib/schemas/character";
import { ItemType } from "@/lib/schemas/inventory";
import { CreateItemData } from "@/lib/types/inventory";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ItemFormFieldsProps {
  item: CreateItemData;
  onItemChange: (item: CreateItemData) => void;
  idPrefix?: string;
}

export function ItemFormFields({ item, onItemChange, idPrefix = "" }: ItemFormFieldsProps) {
  const getId = (field: string) => (idPrefix ? `${idPrefix}-${field}` : field);

  return (
    <>
      <div>
        <Label htmlFor={getId("item-name")}>Name</Label>
        <Input
          id={getId("item-name")}
          value={item.name}
          onChange={(e) => onItemChange({ ...item, name: e.target.value })}
          placeholder="Item name"
        />
      </div>

      {/* Shared description field for all item types */}
      <div>
        <Label htmlFor={getId("item-description")}>Description</Label>
        <Input
          id={getId("item-description")}
          value={item.description || ""}
          onChange={(e) => onItemChange({ ...item, description: e.target.value })}
          placeholder="Item description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={getId("item-size")}>Size</Label>
          <Input
            id={getId("item-size")}
            type="number"
            min="0"
            value={item.size}
            onChange={(e) => onItemChange({ ...item, size: parseInt(e.target.value) || 0 })}
            placeholder="Size"
          />
        </div>
        <div>
          <Label htmlFor={getId("item-type")}>Type</Label>
          <Select
            value={item.type}
            onValueChange={(value) => onItemChange({ ...item, type: value as ItemType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="freeform">Freeform</SelectItem>
              <SelectItem value="weapon">Weapon</SelectItem>
              <SelectItem value="armor">Armor</SelectItem>
              <SelectItem value="consumable">Consumable</SelectItem>
              <SelectItem value="ammunition">Ammunition</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {item.type === "weapon" && (
        <>
          <div>
            <Label htmlFor={getId("weapon-attribute")}>Attribute</Label>
            <Select
              value={item.attribute || ""}
              onValueChange={(value) =>
                onItemChange({ ...item, attribute: value as AttributeName })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="dexterity">Dexterity</SelectItem>
                <SelectItem value="intelligence">Intelligence</SelectItem>
                <SelectItem value="will">Will</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={getId("weapon-damage")}>Damage</Label>
            <Input
              id={getId("weapon-damage")}
              value={item.damage || ""}
              onChange={(e) => onItemChange({ ...item, damage: e.target.value })}
              placeholder="e.g., 1d8"
            />
          </div>
        </>
      )}

      {item.type === "armor" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={getId("armor-value")}>Armor</Label>
              <Input
                id={getId("armor-value")}
                type="number"
                value={item.armor || ""}
                onChange={(e) =>
                  onItemChange({ ...item, armor: parseInt(e.target.value) || undefined })
                }
                placeholder="Armor value"
              />
            </div>
            <div>
              <Label htmlFor={getId("max-dex-bonus")}>Max Dex Bonus</Label>
              <Input
                id={getId("max-dex-bonus")}
                type="number"
                value={item.maxDexBonus ?? ""}
                onChange={(e) =>
                  onItemChange({
                    ...item,
                    maxDexBonus: e.target.value === "" ? undefined : parseInt(e.target.value) || 0,
                  })
                }
                placeholder="No limit"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id={getId("is-main-armor")}
              type="checkbox"
              checked={item.isMainArmor || false}
              onChange={(e) => onItemChange({ ...item, isMainArmor: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor={getId("is-main-armor")} className="text-sm">
              Main Armor (suits of armor, not helmets or shields)
            </Label>
          </div>
        </>
      )}

      {(item.type === "consumable" || item.type === "ammunition") && (
        <>
          <div>
            <Label htmlFor={getId("item-count")}>Count</Label>
            <Input
              id={getId("item-count")}
              type="number"
              min="1"
              value={item.count || 1}
              onChange={(e) => onItemChange({ ...item, count: parseInt(e.target.value) || 1 })}
              placeholder="1"
            />
          </div>
        </>
      )}
    </>
  );
}
