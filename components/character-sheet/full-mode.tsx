"use client";

import { BasicMode } from "./basic-mode";
import { ArmorSection } from "../sections/armor-section";
import { ActionsSection } from "../sections/actions-section";
import { AbilitySection } from "../sections/ability-section";
import { InventorySection } from "../sections/inventory-section";

/**
 * FullMode component renders the complete character sheet with all features.
 * This includes everything from BasicMode plus advanced features:
 * - BasicMode components (Health, Combat, Stats)
 * - Armor Section (equipment and armor calculations)
 * - Actions Section (equipped weapons and abilities)
 * - Ability Section (character abilities and usage tracking)
 * - Inventory Section (equipment management)
 * 
 * All components are self-contained and get their data from context.
 */
export function FullMode() {

  return (
    <>
      {/* All Basic Mode Features */}
      <BasicMode />

      {/* Full Mode Only Features */}
      {/* Armor Section - Equipment and armor calculations */}
      <ArmorSection />

      {/* Actions Section - Equipped weapons and abilities */}
      <ActionsSection />

      {/* Ability Section - Character abilities and usage tracking */}
      <AbilitySection />

      {/* Inventory Section - Equipment management */}
      <InventorySection />
    </>
  );
}