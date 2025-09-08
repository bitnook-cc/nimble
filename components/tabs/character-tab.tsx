"use client";

import { AbilitySection } from "../sections/ability-section";
import { AttributesSection } from "../sections/attributes-section";
import { FeaturesSection } from "../sections/features-section";
import { EffectSelectionsSection } from "../sections/effect-selections-section";
import { HitDiceSection } from "../sections/hit-dice-section";
import { ResourceSection } from "../sections/resource-section";

export function CharacterTab() {
  return (
    <div className="space-y-6">
      {/* Effect Selections - Important actions that need player attention */}
      <EffectSelectionsSection />
      <HitDiceSection />
      <AttributesSection />
      <ResourceSection />
      <AbilitySection />
      <FeaturesSection />
    </div>
  );
}
