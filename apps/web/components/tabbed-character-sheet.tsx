"use client";

import { useEffect } from "react";

import { APP_CONFIG } from "@/lib/config/app-config";
import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";

import { BottomTabBar } from "./bottom-tab-bar";
import { CharacterTab } from "./tabs/character-tab";
import { CombatTab } from "./tabs/combat-tab";
import { EquipmentTab } from "./tabs/equipment-tab";
import { LogTab } from "./tabs/log-tab";
import { SkillsTab } from "./tabs/skills-tab";
import { SpellsTab } from "./tabs/spells-tab";

export function TabbedCharacterSheet() {
  const { uiState, updateActiveTab } = useUIStateService();
  const { character } = useCharacterService();
  const activeTab = uiState.activeTab;

  // Check if spells tab should be accessible
  // Tier 0 access is allowed as long as the character has spell schools unlocked
  const characterService = getCharacterService();
  const hasSpellAccess =
    character &&
    character._spellTierAccess >= 0 &&
    characterService.getAbilities().some((ability) => ability.type === "spell");

  // Auto-switch away from spells tab if character loses spell access
  useEffect(() => {
    if (activeTab === "spells" && !hasSpellAccess) {
      updateActiveTab("combat"); // Default to combat tab
    }
  }, [activeTab, hasSpellAccess, updateActiveTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "combat":
        return <CombatTab />;
      case "skills":
        return <SkillsTab />;
      case "character":
        return <CharacterTab />;
      case "equipment":
        return <EquipmentTab />;
      case "spells":
        return <SpellsTab />;
      case "log":
        return <LogTab />;
      default:
        return <CombatTab />;
    }
  };

  return (
    <div className="relative">
      {/* Content area with bottom padding for tab bar and footer */}
      <div className="pb-32 sm:pb-36 min-h-[calc(100vh-8rem)]">{renderActiveTab()}</div>

      {/* Bottom tab navigation */}
      <BottomTabBar activeTab={activeTab} onTabChange={updateActiveTab} />
      {/* Disclaimer Footer */}
      <div className="fixed bottom-14 sm:bottom-16 left-0 right-0 border-t bg-muted/30 py-2 px-4 z-40">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            {APP_CONFIG.APP_NAME} is an independent product published under the Nimble 3rd Party Creator
            License and is not affiliated with Nimble Co. Nimble © 2025 Nimble Co.
          </p>
        </div>
      </div>
    </div>
  );
}
