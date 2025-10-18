"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useSwipeNavigation } from "@/lib/hooks/use-swipe-navigation";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { TabType } from "@/lib/services/ui-state-service";

import { BottomTabBar } from "./bottom-tab-bar";
import { CharacterHeader } from "./character-header";
import { CharacterTab } from "./tabs/character-tab";
import { CombatTab } from "./tabs/combat-tab";
import { EquipmentTab } from "./tabs/equipment-tab";
import { LogTab } from "./tabs/log-tab";
import { NotesTab } from "./tabs/notes-tab";
import { SkillsTab } from "./tabs/skills-tab";
import { SpellsTab } from "./tabs/spells-tab";

interface TabbedCharacterSheetProps {
  onNameChange: (name: string) => void;
  onOpenConfig: () => void;
}

export function TabbedCharacterSheet({ onNameChange, onOpenConfig }: TabbedCharacterSheetProps) {
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

  // Build tab order dynamically based on spell access
  const tabOrder = useMemo<TabType[]>(() => {
    const tabs: TabType[] = ["combat", "skills", "character", "equipment", "notes"];
    if (hasSpellAccess) {
      tabs.splice(1, 0, "spells"); // Insert spells after combat
    }
    tabs.push("log");
    return tabs;
  }, [hasSpellAccess]);

  // Get current tab index
  const currentTabIndex = tabOrder.indexOf(activeTab);

  // Track if transition was triggered by swipe (vs button click)
  const [isSwipeTransition, setIsSwipeTransition] = useState(false);

  // Swipe navigation handlers
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setIsSwipeTransition(true);
      updateActiveTab(tabOrder[currentIndex + 1]);
    }
  }, [activeTab, tabOrder, updateActiveTab]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      setIsSwipeTransition(true);
      updateActiveTab(tabOrder[currentIndex - 1]);
    }
  }, [activeTab, tabOrder, updateActiveTab]);

  // Initialize swipe navigation
  const { isSwiping, swipeOffset } = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    minSwipeDistance: 50,
    preventScroll: true,
  });

  // Reset swipe transition flag after animation completes
  useEffect(() => {
    if (isSwipeTransition) {
      const timer = setTimeout(() => setIsSwipeTransition(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isSwipeTransition]);

  // Auto-switch away from spells tab if character loses spell access
  useEffect(() => {
    if (activeTab === "spells" && !hasSpellAccess) {
      updateActiveTab("combat"); // Default to combat tab
    }
  }, [activeTab, hasSpellAccess, updateActiveTab]);

  const renderTab = (tab: TabType) => {
    switch (tab) {
      case "combat":
        return <CombatTab />;
      case "skills":
        return <SkillsTab />;
      case "character":
        return <CharacterTab />;
      case "equipment":
        return <EquipmentTab />;
      case "notes":
        return <NotesTab />;
      case "spells":
        return <SpellsTab />;
      case "log":
        return <LogTab />;
      default:
        return <CombatTab />;
    }
  };

  // Calculate carousel transform based on active tab index
  const getCarouselTransform = () => {
    // Base position: shift left by (currentTabIndex * 100%)
    const baseOffset = -currentTabIndex * 100;

    if (isSwiping) {
      // During swipe, add the swipe offset as percentage of screen width
      const swipeOffsetPercent = (swipeOffset / window.innerWidth) * 100;
      return `translateX(${baseOffset + swipeOffsetPercent}%)`;
    }

    // Normal state: just show the active tab
    return `translateX(${baseOffset}%)`;
  };

  return (
    <>
      {/* Content area with container */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 px-4 space-y-6 min-h-[calc(100dvh-3.5rem-4rem)]">
          <CharacterHeader onNameChange={onNameChange} onOpenConfig={onOpenConfig} />

          {/* Carousel container with overflow hidden */}
          <div className="relative overflow-hidden -mx-4">
            <div
              className="flex items-start"
              style={{
                transform: getCarouselTransform(),
                // Fast animation for all transitions (200ms feels instant but smooth)
                transition: isSwiping ? "none" : "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Render all tabs in order - carousel will translate to show active one */}
              {tabOrder.map((tab, index) => {
                // Only show active tab, or adjacent tabs during swipe/transition
                const isActive = index === currentTabIndex;
                const isAdjacent = Math.abs(index - currentTabIndex) === 1;
                const shouldRender = isActive || (isAdjacent && (isSwiping || isSwipeTransition));

                return (
                  <div key={tab} className="w-full flex-shrink-0 px-4">
                    {shouldRender ? renderTab(tab) : <div />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom tab navigation with disclaimer - tab bar sticky, disclaimer scrolls */}
        <BottomTabBar activeTab={activeTab} onTabChange={updateActiveTab} />
      </div>
    </>
  );
}
