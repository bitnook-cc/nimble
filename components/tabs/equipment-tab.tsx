"use client";

import { ArmorSection } from "../sections/armor-section";
import { InventorySection } from "../sections/inventory-section";
import { CurrencySection } from "../sections/currency-section";

export function EquipmentTab() {
  return (
    <div className="space-y-6">
      <CurrencySection />
      <ArmorSection />
      <InventorySection />
    </div>
  );
}