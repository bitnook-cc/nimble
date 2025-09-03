"use client";

import { CharacterStats } from "./character-stats";
import { HealthManagement } from "./health-management";
import { CombatSection } from "./combat-section";
import { ResourceSection } from "../sections/resource-section";
import { PoolSelectionsSection } from "../sections/pool-selections-section";
import { SubclassSelectionsSection } from "../sections/subclass-selections-section";

/**
 * BasicMode component renders the essential character sheet features.
 * This is the simplified interface that shows only the core functionality:
 * - Health Management (HP, Hit Dice, Wounds)
 * - Resources (Mana, Fury, Focus, etc.)
 * - Combat Section (Initiative, Action Tracker)
 * - Character Stats (Attributes, Skills)
 * 
 * All components are self-contained and get their data from context.
 */
export function BasicMode() {

  return (
    <>
      {/* Subclass Selections - Important actions that need player attention */}
      <SubclassSelectionsSection />

      {/* Pool Selections - Important actions that need player attention */}
      <PoolSelectionsSection />

      {/* Health Management - HP, Hit Dice, Wounds */}
      <HealthManagement />

      {/* Resources - Mana, Fury, Focus, etc. */}
      <ResourceSection />

      {/* Combat Section - Initiative, Action Tracker */}
      <CombatSection />

      {/* Character Stats - Attributes, Skills */}
      <CharacterStats />
    </>
  );
}