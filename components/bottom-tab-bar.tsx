"use client";

import { Package, ScrollText, Sparkles, Sword, Target, User } from "lucide-react";

import { useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { TabType } from "@/lib/services/ui-state-service";

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
  { id: "skills", label: "Skills", icon: Target },
  { id: "character", label: "Character", icon: User },
  { id: "equipment", label: "Equipment", icon: Package },
  { id: "log", label: "Log", icon: ScrollText },
];

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const { character } = useCharacterService();

  // Filter tabs based on character capabilities
  const visibleTabs = tabs.filter((tab) => {
    // Hide spells tab if character has no spell schools unlocked
    if (tab.id === "spells") {
      if (!character) return false;
      // Show spells tab if character has any spell abilities (even tier 0)
      const hasSpells = character.abilities.some((ability) => ability.type === "spell");
      return hasSpells;
    }
    return true;
  });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-background border-t z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="w-full px-2 sm:px-4">
        <div className="flex justify-around items-center h-16 max-w-(--breakpoint-sm) mx-auto">
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 h-12 px-1 sm:px-2 min-w-0 flex-1 max-w-20 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-xs font-medium leading-tight truncate">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
      {/* Disclaimer Footer */}
      <div className="border-t bg-muted/30 py-2 px-4 z-40">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            Nimble Navigator is an independent product published under the Nimble 3rd Party Creator
            License and is not affiliated with Nimble Co. Nimble © 2025 Nimble Co.
          </p>
        </div>
      </div>
    </div>
  );
}
