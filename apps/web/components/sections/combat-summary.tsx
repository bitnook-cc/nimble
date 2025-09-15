"use client";

import {
  Bandage,
  Circle,
  Dice6,
  Droplets,
  Heart,
  HeartPlus,
  HelpCircle,
  Minus,
  Plus,
  RotateCcw,
  ShieldPlus,
  Skull,
  Sparkles,
  Square,
} from "lucide-react";

import { DicePoolCards } from "./dice-pool-cards";

import { useEffect, useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { calculateFlexibleValue as getFlexibleValue } from "@/lib/types/flexible-value";
import { getResourceColor } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Health Bar Subcomponent
function HealthBar() {
  const { character } = useCharacterService();

  // All hooks called first, then safety check
  if (!character) return null;

  const { current, max, temporary } = character.hitPoints;
  const healthPercentage = (current / max) * 100;

  const getHealthBarColor = () => {
    if (healthPercentage <= 25) return "bg-red-500";
    if (healthPercentage <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const totalEffectiveHP = max + temporary;
  const currentHpPercentage = totalEffectiveHP > 0 ? (current / totalEffectiveHP) * 100 : 0;
  const tempHpPercentage = totalEffectiveHP > 0 ? (temporary / totalEffectiveHP) * 100 : 0;

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {current}/{max} HP
          {temporary > 0 && <span className="text-blue-600 ml-1">(+{temporary})</span>}
        </span>
        <span className="text-xs text-muted-foreground">{Math.round(healthPercentage)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
        {/* Current HP bar */}
        <div
          className={`h-3 transition-all duration-300 ${getHealthBarColor()} absolute left-0 top-0 ${
            temporary > 0 ? "rounded-l-full" : "rounded-full"
          }`}
          style={{ width: `${currentHpPercentage}%` }}
        />
        {/* Temporary HP bar */}
        {temporary > 0 && (
          <div
            className="h-3 bg-blue-500 transition-all duration-300 absolute top-0 rounded-r-full"
            style={{
              left: `${currentHpPercentage}%`,
              width: `${tempHpPercentage}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}

// Hook to track viewport width
function useViewportWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function updateWidth() {
      setWidth(window.innerWidth);
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return width;
}

// Wounds Display Subcomponent
function WoundsDisplay() {
  const { character, updateWounds } = useCharacterService();
  const [hoveredWound, setHoveredWound] = useState<number | null>(null);
  const viewportWidth = useViewportWidth();

  // All hooks called first, then safety check
  if (!character) return null;

  const { wounds } = character;

  // Calculate if icons would exceed 70% of viewport width
  // Each icon is roughly 24px (w-5 h-5 = 20px + gap-1 = 4px between icons)
  const iconWidth = 24; // 20px icon + 4px gap
  const iconsWidth = wounds.max * iconWidth;
  const shouldUseIcons = iconsWidth <= viewportWidth * 0.6;

  const handleWoundClick = (woundIndex: number) => {
    const newWoundCount = woundIndex + 1;
    if (newWoundCount === wounds.current) {
      // Clicking on the current highest wound clears all wounds
      updateWounds(0, wounds.max);
    } else {
      // Set wounds to the clicked position
      updateWounds(newWoundCount, wounds.max);
    }
  };

  const adjustWounds = (delta: number) => {
    const newWounds = Math.max(0, Math.min(wounds.max, wounds.current + delta));
    updateWounds(newWounds, wounds.max);
  };

  if (!shouldUseIcons) {
    // Determine status icon based on wound percentage
    const getStatusIcon = () => {
      if (wounds.current >= wounds.max) {
        return <Skull className="w-4 h-4 text-red-600" />;
      }

      const criticalThreshold = Math.min(wounds.max * 0.8, wounds.max - 1);
      if (wounds.current > criticalThreshold) {
        return <Heart className="w-4 h-4 text-red-500" />;
      }

      if (wounds.current > wounds.max * 0.5) {
        return <Bandage className="w-4 h-4 text-orange-600" />;
      }

      return <Heart className="w-4 h-4 text-green-600" />;
    };

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustWounds(-1)}
          disabled={wounds.current <= 0}
          className="h-6 w-6 p-0 text-xs"
        >
          <Minus className="w-4 h-4" />
        </Button>
        {getStatusIcon()}
        <span className="text-sm font-medium text-muted-foreground min-w-[3ch] text-center">
          {wounds.current}/{wounds.max}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustWounds(1)}
          disabled={wounds.current >= wounds.max}
          className="h-6 w-6 p-0 text-xs"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const woundIcons = [];
  for (let i = 0; i < wounds.max; i++) {
    const isLastWound = i === wounds.max - 1;
    const currentWounds = hoveredWound !== null ? hoveredWound + 1 : wounds.current;
    const isWounded = i < currentWounds;
    const isHovered = hoveredWound === i;
    const IconComponent = isLastWound ? Skull : Bandage;

    woundIcons.push(
      <button
        key={i}
        onClick={() => handleWoundClick(i)}
        onMouseEnter={() => setHoveredWound(i)}
        onMouseLeave={() => setHoveredWound(null)}
        className={`transition-all duration-200 hover:scale-110 ${
          isHovered ? "drop-shadow-lg" : ""
        }`}
        title={`Click to ${i + 1 === wounds.current ? "clear all wounds" : `set wounds to ${i + 1}`}`}
      >
        <IconComponent
          className={`w-5 h-5 transition-colors duration-200 ${
            isWounded
              ? isHovered
                ? "text-red-400"
                : "text-red-500"
              : isHovered
                ? "text-red-300"
                : "text-muted-foreground/50"
          }`}
        />
      </button>,
    );
  }

  return <div className="flex items-center gap-1">{woundIcons}</div>;
}

// HP Action Panel Types
type ActionType = "damage" | "healing" | "tempHP";

// HP Action Dialog Subcomponent
function HPActionDialog({
  actionType,
  open,
  onOpenChange,
  onApply,
}: {
  actionType: ActionType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(1);

  const adjustAmount = (delta: number) => {
    setAmount((prev) => Math.max(1, prev + delta));
  };

  const handleApply = () => {
    onApply(amount);
    onOpenChange(false);
    setAmount(1); // Reset amount for next time
  };

  const getActionConfig = () => {
    switch (actionType) {
      case "damage":
        return {
          title: "Apply Damage",
          buttonClass: "bg-red-600 hover:bg-red-700 text-white",
          icon: <Droplets className="w-4 h-4" />,
        };
      case "healing":
        return {
          title: "Apply Healing",
          buttonClass: "bg-green-600 hover:bg-green-700 text-white",
          icon: <HeartPlus className="w-4 h-4" />,
        };
      case "tempHP":
        return {
          title: "Add Temporary HP",
          buttonClass: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: <ShieldPlus className="w-4 h-4" />,
        };
    }
  };

  const config = getActionConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription>
            View a detailed summary of your combat abilities, weapons, and defenses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(-5)}
              className="h-8 w-12 p-0 text-xs"
            >
              -5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(-1)}
              className="h-8 w-12 p-0 text-xs"
            >
              -1
            </Button>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className={`flex-1 px-3 py-2 border-2 rounded text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                actionType === "damage"
                  ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive/20"
                  : actionType === "healing"
                    ? "border-green-600 text-green-600 focus:border-green-700 focus:ring-green-200"
                    : "border-primary text-primary focus:border-primary focus:ring-primary/20"
              }`}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(1)}
              className="h-8 w-12 p-0 text-xs"
            >
              +1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(5)}
              className="h-8 w-12 p-0 text-xs"
            >
              +5
            </Button>
          </div>

          <Button onClick={handleApply} className={`w-full ${config.buttonClass}`} size="sm">
            {config.icon}
            <span className="ml-2">{config.title}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Actions Bar Subcomponent
function QuickActionsBar() {
  const { character, applyDamage, applyHealing, applyTemporaryHP } = useCharacterService();
  const [openDialog, setOpenDialog] = useState<ActionType | null>(null);

  // All hooks called first, then safety check
  if (!character) return null;

  const { current: currentHp, max: maxHp } = character.hitPoints;

  const handleApplyAction = (actionType: ActionType, amount: number) => {
    switch (actionType) {
      case "damage":
        applyDamage(amount);
        break;
      case "healing":
        applyHealing(amount);
        break;
      case "tempHP":
        applyTemporaryHP(amount);
        break;
    }
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog("damage")}
          disabled={currentHp <= 0}
          className="text-destructive border-destructive hover:bg-destructive/10 text-xs h-7"
        >
          <Droplets className="w-3 h-3 mr-1" />
          Damage
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog("healing")}
          disabled={currentHp >= maxHp}
          className="text-green-600 border-green-600 hover:bg-green-600/10 text-xs h-7"
        >
          <HeartPlus className="w-3 h-3 mr-1" />
          Healing
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog("tempHP")}
          className="text-primary border-primary hover:bg-primary/10 text-xs h-7"
        >
          <ShieldPlus className="w-3 h-3 mr-1" />
          Temp HP
        </Button>
      </div>

      {/* Action Dialogs */}
      {(["damage", "healing", "tempHP"] as ActionType[]).map((actionType) => (
        <HPActionDialog
          key={actionType}
          actionType={actionType}
          open={openDialog === actionType}
          onOpenChange={(open) => setOpenDialog(open ? actionType : null)}
          onApply={(amount) => handleApplyAction(actionType, amount)}
        />
      ))}
    </div>
  );
}

// Action Tracker Subcomponent
function ActionTracker() {
  const { character, updateActionTracker, endTurn: serviceEndTurn } = useCharacterService();

  // All hooks called first, then safety check
  if (!character || !character.inEncounter) return null;

  const { actionTracker } = character;

  const useAction = () => {
    if (actionTracker.current > 0) {
      updateActionTracker({
        ...actionTracker,
        current: actionTracker.current - 1,
      });
    }
  };

  const addBonusAction = () => {
    updateActionTracker({
      ...actionTracker,
      bonus: actionTracker.bonus + 1,
      current: actionTracker.current + 1,
    });
  };

  const endTurn = () => {
    serviceEndTurn();
  };
  const getActionDots = () => {
    const dots = [];
    const totalActions = actionTracker.base + actionTracker.bonus;

    for (let i = 0; i < totalActions; i++) {
      const isBonus = i >= actionTracker.base;
      const isAvailable = i < actionTracker.current;

      dots.push(
        <Button
          key={i}
          variant="ghost"
          size="sm"
          className={`w-8 h-8 p-0 rounded-full ${
            isAvailable
              ? isBonus
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
              : isBonus
                ? "bg-gray-200 hover:bg-gray-300 text-gray-500"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
          }`}
          onClick={isAvailable ? useAction : undefined}
          disabled={!isAvailable}
          title={`${isBonus ? "Bonus" : "Base"} Action ${isAvailable ? "(Click to use)" : "(Used)"}`}
        >
          <Circle className="w-4 h-4" fill="currentColor" />
        </Button>,
      );
    }
    return dots;
  };

  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Action Dots */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-2">Actions:</span>
            <div className="flex items-center gap-1">{getActionDots()}</div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={addBonusAction}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              title="Grant additional action"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button onClick={endTurn} variant="default" size="sm" className="text-xs h-7">
              <RotateCcw className="w-3 h-3 mr-1" />
              End Turn
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p>
                    <strong>Initiative Rules:</strong>
                  </p>
                  <p>&lt;10: 1 action • 10-20: 2 actions • &gt;20: 3 actions</p>
                  <p>
                    <span className="text-green-600">Green</span> = base actions,{" "}
                    <span className="text-blue-600">Blue</span> = bonus actions
                  </p>
                  <p>Click actions to use them</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Resource Tracker Subcomponent
function ResourceTracker() {
  const { character } = useCharacterService();
  const characterService = getCharacterService();

  // All hooks called first, then safety check
  if (!character) return null;

  const resources = characterService.getResources();
  if (resources.length === 0) return null;

  const createPieChart = (current: number, max: number, color: string) => {
    const percentage = max > 0 ? current / max : 0;
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - percentage);

    return (
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
          {/* Background circle */}
          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-muted" />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke={color}
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">{current}</span>
        </div>
      </div>
    );
  };

  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Resources</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {resources.map((resource) => {
            const maxValue = getFlexibleValue(resource.definition.maxValue);
            const percentage = maxValue > 0 ? (resource.current / maxValue) * 100 : 0;
            const color = getResourceColor(resource.definition.colorScheme, percentage);
            return (
              <div key={resource.definition.id} className="flex flex-col items-center">
                {createPieChart(resource.current, maxValue, color)}
                <div className="mt-1 text-center">
                  <div className="text-xs font-medium leading-tight">
                    {resource.definition.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {resource.current}/{maxValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Combat Status Bar Subcomponent
function CombatStatusBar() {
  const { character, endEncounter, startEncounter } = useCharacterService();
  const { rollInitiative } = useDiceActions();
  const { uiState } = useUIStateService();

  // All hooks called first, then safety check
  if (!character) return null;

  const { inEncounter, _initiative: initiative, _attributes: attributes } = character;
  const totalModifier = attributes.dexterity + initiative.modifier;

  const handleInitiativeRoll = async () => {
    const result = await rollInitiative(totalModifier, uiState.advantageLevel);
    await startEncounter(result.rollTotal);
  };
  const getHealthStatus = () => {
    // Check if character has max wounds (dead)
    if (character.wounds.current >= character.wounds.max) {
      return {
        text: "Dead",
        color: "text-red-600",
        icon: <Skull className="w-4 h-4 text-red-600" />,
      };
    }

    // Check if character is critical (>80% wounds OR one less than max, whichever is lower)
    const criticalThreshold = Math.min(character.wounds.max * 0.8, character.wounds.max - 1);
    if (character.wounds.current > criticalThreshold) {
      return {
        text: "Critical",
        color: "text-red-500",
        icon: <Heart className="w-4 h-4 text-red-500" />,
      };
    }

    // Check if character has more than 50% max wounds (injured)
    if (character.wounds.current > character.wounds.max * 0.5) {
      return {
        text: "Injured",
        color: "text-orange-600",
        icon: <Bandage className="w-4 h-4 text-orange-600" />,
      };
    }

    // Healthy
    return {
      text: "Healthy",
      color: "text-green-600",
      icon: null,
    };
  };

  const getCombinedStatus = () => {
    const healthStatus = getHealthStatus();

    // If dead, just show dead status
    if (healthStatus.text === "Dead") {
      return healthStatus;
    }

    // Combine health status with combat status
    const combatText = inEncounter ? "In Combat" : "Ready";
    const combatColor = inEncounter ? "text-red-600" : "text-green-600";

    return {
      text: `${healthStatus.text} - ${combatText}`,
      color: healthStatus.color, // Use health status color as primary
      icon: healthStatus.icon,
    };
  };

  const status = getCombinedStatus();

  return (
    <Card className="border-2 border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Combat Summary</span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${status.color}`}>
            {status.icon}
            <span>{status.text}</span>
          </div>
        </div>

        <HealthBar />

        {/* Integrated Quick Actions */}
        <QuickActionsBar />

        {/* Wounds and Initiative Layout */}
        <div className="grid grid-cols-2 gap-4 items-start">
          {/* Wounds Column */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground mb-1">Wounds</span>
            <div className="flex items-center h-8">
              <WoundsDisplay />
            </div>
          </div>

          {/* Initiative Column */}
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-muted-foreground mb-1">Initiative</span>
            <div className="flex items-center justify-end">
              {!inEncounter ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleInitiativeRoll}
                      className="h-8 px-2 text-xs"
                    >
                      <span className="mr-1">
                        {totalModifier > 0 ? "+" : ""}
                        {totalModifier}
                      </span>
                      <Dice6 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Roll Initiative: d20{totalModifier > 0 ? "+" + totalModifier : totalModifier}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button variant="destructive" size="sm" onClick={endEncounter} className="text-xs">
                  <Square className="w-3 h-3 mr-1" />
                  End Combat
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CombatSummary() {
  const { character } = useCharacterService();

  if (!character) return null;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <CombatStatusBar />

        <ResourceTracker />

        <DicePoolCards />

        <ActionTracker />
      </div>
    </TooltipProvider>
  );
}
