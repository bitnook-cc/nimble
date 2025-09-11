"use client";

import { ActionsSection } from "../sections/actions-section";
import { CombatSummary } from "../sections/combat-summary";
import { SavingThrowsSection } from "../sections/saving-throws-section";

export function CombatTab() {
  return (
    <div className="space-y-6">
      <CombatSummary />
      <SavingThrowsSection />
      <ActionsSection />
    </div>
  );
}
