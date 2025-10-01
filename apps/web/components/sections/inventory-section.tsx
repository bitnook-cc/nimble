"use client";

import { useCharacterService } from "@/lib/hooks/use-character-service";

import { Inventory } from "../inventory";

export function InventorySection() {
  // Get everything we need from service hooks
  const { character } = useCharacterService();

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;

  const inventory = character.inventory;
  const characterDexterity = character._attributes.dexterity;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Inventory</h2>
      <Inventory inventory={inventory} characterDexterity={characterDexterity} />
    </div>
  );
}
