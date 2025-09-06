"use client";

import { AbilitySection } from "../sections/ability-section";
import { AttributesSection } from "../sections/attributes-section";
import { ClassFeaturesSection } from "../sections/class-features-section";
import { HitDiceSection } from "../sections/hit-dice-section";
import { PoolSelectionsSection } from "../sections/pool-selections-section";
import { ResourceSection } from "../sections/resource-section";
import { SubclassSelectionsSection } from "../sections/subclass-selections-section";

export function CharacterTab() {
  return (
    <div className="space-y-6">
      {/* Subclass Selections - Important actions that need player attention */}
      <SubclassSelectionsSection />
      {/* Pool Selections - Important actions that need player attention */}
      <PoolSelectionsSection />
      <HitDiceSection />
      <AttributesSection />
      <ResourceSection />
      <AbilitySection />
      <ClassFeaturesSection />
    </div>
  );
}
