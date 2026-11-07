"use client";

import {
  Compass,
  Ellipsis,
  FileText,
  Package,
  ScrollText,
  Sparkles,
  Sword,
  User,
} from "lucide-react";

import { TabType } from "@/lib/services/ui-state-service";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface BottomTabBarProps {
  visible: TabType[];
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

export function BottomTabBar({ visible, activeTab, onTabChange }: BottomTabBarProps) {
  const destinations = tabs.filter((tab) => visible.includes(tab.id));
  const secondary = destinations.filter((tab) => ["character", "notes", "log"].includes(tab.id));
  const activeSecondary = secondary.find((tab) => tab.id === activeTab);
  const buttonClass = (active: boolean) =>
    `min-w-0 flex-1 sm:flex-none flex-col gap-1 h-12 px-1 sm:px-3 text-xs ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`;

  return (
    <nav
      aria-label="Character sheet"
      className="shrink-0 border-t bg-background"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container mx-auto flex h-16 items-center justify-center gap-1 px-2">
        {destinations.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            aria-current={activeTab === tab.id ? "page" : undefined}
            onClick={() => onTabChange(tab.id)}
            className={
              buttonClass(activeTab === tab.id) +
              (secondary.includes(tab) ? " hidden sm:inline-flex" : "")
            }
          >
            <tab.icon className="size-4" />
            <span>{tab.label}</span>
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              aria-current={activeSecondary ? "page" : undefined}
              aria-label={
                activeSecondary
                  ? `More sections, current: ${activeSecondary.label}`
                  : "More sections"
              }
              className={buttonClass(!!activeSecondary) + " sm:hidden"}
            >
              <Ellipsis className="size-4" />
              <span>{activeSecondary?.label ?? "More"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" aria-label="More sections">
            {secondary.map((tab) => (
              <DropdownMenuItem
                key={tab.id}
                aria-current={tab.id === activeTab ? "page" : undefined}
                className="min-h-11"
                onSelect={() => onTabChange(tab.id)}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
