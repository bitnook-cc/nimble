"use client";

import { Compass, FileText, Package, ScrollText, Sparkles, Sword, User } from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { TabType } from "@/lib/services/ui-state-service";

import { LicenseDisclaimer } from "./license-disclaimer";
import { Button } from "./ui/button";

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabDefinition {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabDefinition[] = [
  { id: "combat", label: "Combat", icon: Sword },
  { id: "spells", label: "Spells", icon: Sparkles },
  { id: "skills", label: "Explore", icon: Compass },
  { id: "character", label: "Character", icon: User },
  { id: "equipment", label: "Equipment", icon: Package },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "log", label: "Log", icon: ScrollText },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const { character } = useCharacterService();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeButtonRef = useRef<HTMLButtonElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  // Filter tabs based on character capabilities
  const visibleTabs = tabs.filter((tab) => {
    // Hide spells tab if character has no spell schools unlocked
    if (tab.id === "spells") {
      if (!character) return false;
      // Show spells tab if character has any spell abilities (even tier 0)
      const characterService = getCharacterService();
      const abilities = characterService.getAbilities();
      const hasSpells = abilities.some((ability) => ability.type === "spell");
      return hasSpells;
    }
    return true;
  });

  // Check if scrolling is needed on mount and when tabs change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const checkScroll = () => {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      };
      checkScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }
  }, [visibleTabs.length]);

  // Auto-scroll to active tab button when it changes
  useEffect(() => {
    if (activeButtonRef.current && scrollContainerRef.current && needsScroll) {
      const button = activeButtonRef.current;
      const container = scrollContainerRef.current;

      // Get the button's position relative to its container
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerClientWidth = container.clientWidth;

      // Calculate scroll position to center the button in the viewport
      const targetScrollLeft = buttonLeft - containerClientWidth / 2 + buttonWidth / 2;

      // Clamp to valid scroll range
      const maxScroll = container.scrollWidth - containerClientWidth;
      const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

      container.scrollTo({
        left: clampedScrollLeft,
        behavior: "smooth",
      });
    }
  }, [activeTab, needsScroll]);

  return (
    <>
      {/* Sticky navigation bar - full width */}
      <div
        className="sticky bottom-0 left-0 right-0 w-full bg-background border-t z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Centered container matching top bar width - scrollable tabs */}
        <div className="container mx-auto px-4">
          <div
            ref={scrollContainerRef}
            className={`flex items-center h-16 gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide ${
              needsScroll ? "justify-start" : "justify-center"
            }`}
          >
            {visibleTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  ref={isActive ? activeButtonRef : null}
                  variant="ghost"
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center gap-1 h-12 px-3 min-w-[60px] shrink-0 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="text-xs font-medium leading-tight whitespace-nowrap">
                    {tab.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* License disclaimer - appears below sticky nav when scrolled to bottom */}
      <LicenseDisclaimer />
    </>
  );
}
