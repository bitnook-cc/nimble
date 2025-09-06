import { gameConfig } from "../config/game-config";
import { ArmorItem, Item, WeaponItem } from "../types/inventory";

export function getEquippedWeapons(items: Item[]): WeaponItem[] {
  return items.filter(
    (item): item is WeaponItem => item.type === "weapon" && item.equipped === true,
  );
}

export function getEquippedArmor(items: Item[]): ArmorItem[] {
  return items.filter((item): item is ArmorItem => item.type === "armor" && item.equipped === true);
}

export function getEquippedMainArmor(items: Item[]): ArmorItem | null {
  const mainArmor = items.find(
    (item): item is ArmorItem =>
      item.type === "armor" && item.equipped === true && item.isMainArmor === true,
  );
  return mainArmor || null;
}

export function getEquippedSupplementaryArmor(items: Item[]): ArmorItem[] {
  return items.filter(
    (item): item is ArmorItem =>
      item.type === "armor" && item.equipped === true && item.isMainArmor !== true,
  );
}

export function getEquippedWeaponSize(items: Item[]): number {
  const equippedWeapons = getEquippedWeapons(items);
  return equippedWeapons.reduce((total, weapon) => total + weapon.size, 0);
}

export function canEquipWeapon(items: Item[], weaponToEquip: WeaponItem): boolean {
  if (weaponToEquip.equipped) {
    return true; // Already equipped
  }

  const currentEquippedSize = getEquippedWeaponSize(items);
  const totalSizeAfterEquip = currentEquippedSize + weaponToEquip.size;

  return totalSizeAfterEquip <= gameConfig.equipment.maxWeaponSize;
}

export function canUnequipWeapon(weaponToUnequip: WeaponItem): boolean {
  return weaponToUnequip.equipped === true;
}

export function canEquipArmor(items: Item[], armorToEquip: ArmorItem): boolean {
  if (armorToEquip.equipped) {
    return true; // Already equipped
  }

  // If this is main armor, check if another main armor is equipped
  if (armorToEquip.isMainArmor) {
    const currentMainArmor = getEquippedMainArmor(items);
    return currentMainArmor === null || currentMainArmor.id === armorToEquip.id;
  }

  // Supplementary armor can always be equipped
  return true;
}

export function canUnequipArmor(armorToUnequip: ArmorItem): boolean {
  return armorToUnequip.equipped === true;
}

export function equipMainArmorWithReplacement(items: Item[], armorToEquip: ArmorItem): Item[] {
  // If equipping main armor, first unequip any existing main armor
  if (armorToEquip.isMainArmor) {
    const currentMainArmor = getEquippedMainArmor(items);
    if (currentMainArmor && currentMainArmor.id !== armorToEquip.id) {
      // Unequip the current main armor
      items = items.map((item) =>
        item.id === currentMainArmor.id ? { ...item, equipped: false } : item,
      );
    }
  }

  // Equip the new armor
  return items.map((item) => (item.id === armorToEquip.id ? { ...item, equipped: true } : item));
}

export function getEquipmentValidationMessage(items: Item[], itemToEquip: Item): string | null {
  if (itemToEquip.type === "weapon") {
    const weapon = itemToEquip as WeaponItem;
    if (!canEquipWeapon(items, weapon)) {
      const currentSize = getEquippedWeaponSize(items);
      const maxSize = gameConfig.equipment.maxWeaponSize;
      return `Cannot equip weapon: total weapon size would be ${currentSize + weapon.size}, maximum allowed is ${maxSize}`;
    }
  } else if (itemToEquip.type === "armor") {
    const armor = itemToEquip as ArmorItem;
    if (!canEquipArmor(items, armor)) {
      return `Cannot equip armor: only one main armor piece can be equipped at a time`;
    }

    // Check if equipping main armor will replace existing main armor
    if (armor.isMainArmor && !armor.equipped) {
      const currentMainArmor = getEquippedMainArmor(items);
      if (currentMainArmor) {
        return `Equipping this main armor will unequip ${currentMainArmor.name}`;
      }
    }
  }

  return null; // No validation errors
}
