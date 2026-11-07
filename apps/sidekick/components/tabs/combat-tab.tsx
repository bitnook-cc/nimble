"use client";

import { ActionsSection } from "../sections/actions-section";
import { CombatSummary } from "../sections/combat-summary";
import { SavingThrowsSection } from "../sections/saving-throws-section";

export function CombatTab() {
  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <div className="min-w-0">
        <CombatSummary />
      </div>
      <div className="min-w-0 space-y-5">
        <ActionsSection />
        <SavingThrowsSection />
      </div>
    </div>
  );
}
