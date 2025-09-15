"use client";

import { AbilitySection } from "../sections/ability-section";
import { AttributesSection } from "../sections/attributes-section";
import { TraitSelectionsSection } from "../sections/trait-selections-section";
import { FeaturesSection } from "../sections/features-section";
import { HitDiceSection } from "../sections/hit-dice-section";
import { ResourceSection } from "../sections/resource-section";
import { DicePoolSection } from "../sections/dice-pool-section";

export function CharacterTab() {
  return (
    <div className="space-y-6">
      {/* Effect Selections - Important actions that need player attention */}
      <TraitSelectionsSection />
      <HitDiceSection />
      <AttributesSection />
      <ResourceSection />
      <DicePoolSection />
      <AbilitySection />
      <FeaturesSection />
    </div>
  );
}
