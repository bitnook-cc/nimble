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
  Swords,
} from "lucide-react";

import React, { useEffect, useState } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { getCharacterService } from "@/lib/services/service-factory";
import { calculateFlexibleValue as getFlexibleValue } from "@/lib/types/flexible-value";
import { getResourceColor } from "@/lib/utils/resource-config";

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { DicePoolCards } from "./dice-pool-cards";
import { GeneralActionsRow } from "./general-actions-row";

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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
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
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(-5)}
              className="h-8 flex-1 p-0 text-xs"
            >
              -5
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(-1)}
              className="h-8 flex-1 p-0 text-xs"
            >
              -1
            </Button>

            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-16 sm:flex-1 px-2 sm:px-3 py-2 border-2 rounded text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 ${
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
              className="h-8 flex-1 p-0 text-xs"
            >
              +1
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustAmount(5)}
              className="h-8 flex-1 p-0 text-xs"
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
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // All hooks called first, then safety check
  if (!character || !character.inEncounter) return null;

  const { actionTracker } = character;
  const totalActions = actionTracker.base + actionTracker.bonus;

  const restoreAction = (targetIndex: number) => {
    // Set current actions to targetIndex + 1 (restore all actions up to and including this one)
    updateActionTracker({
      ...actionTracker,
      current: targetIndex + 1,
    });
  };

  const consumeActionsTo = (targetIndex: number) => {
    // Set current actions to targetIndex (use all actions after and including this one)
    updateActionTracker({
      ...actionTracker,
      current: targetIndex,
    });
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

  const getActionHexagons = () => {
    const hexagons = [];
    for (let i = 0; i < totalActions; i++) {
      const isBonus = i >= actionTracker.base;
      const isAvailable = i < actionTracker.current;
      const isHovered = hoveredIndex !== null;

      // Determine if this action would be available after the hovered action is clicked
      let wouldBeAvailable = isAvailable;
      if (hoveredIndex !== null) {
        const hoveredIsAvailable = hoveredIndex < actionTracker.current;
        if (hoveredIsAvailable) {
          // Clicking an available action uses it and all after it
          wouldBeAvailable = i < hoveredIndex;
        } else {
          // Clicking an unavailable action restores it and all before it
          wouldBeAvailable = i <= hoveredIndex;
        }
      }

      const isThisHovered = hoveredIndex === i;
      const showPreview = isHovered && wouldBeAvailable !== isAvailable;

      hexagons.push(
        <button
          key={i}
          onClick={() => (isAvailable ? consumeActionsTo(i) : restoreAction(i))}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={`relative w-8 h-8 flex items-center justify-center transition-all duration-100 ${
            isThisHovered ? "scale-110" : ""
          }`}
          title={
            isAvailable
              ? `Click to use ${isBonus ? "bonus " : ""}action`
              : `Click to restore ${isBonus ? "bonus " : ""}action`
          }
        >
          {/* Circle */}
          <div
            className={`absolute inset-0 rounded-full border-2 transition-all duration-100 ${
              isAvailable
                ? isBonus
                  ? "bg-blue-500 border-blue-600"
                  : "bg-green-500 border-green-600"
                : isBonus
                  ? "bg-gray-200 border-blue-300"
                  : "bg-gray-200 border-gray-400"
            } ${showPreview ? (wouldBeAvailable ? "opacity-60" : "opacity-40") : ""} ${
              isThisHovered ? (isAvailable ? "shadow-md" : "shadow-lg") : ""
            }`}
          />
          {/* Icon */}
          <Swords
            className={`relative z-10 w-4 h-4 transition-all duration-100 ${
              isAvailable ? "text-white" : isBonus ? "text-blue-400" : "text-gray-400"
            } ${isThisHovered ? "scale-110" : ""} ${showPreview ? "opacity-60" : ""}`}
          />
        </button>,
      );
    }
    return hexagons;
  };

  return (
    <Card className="border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Action Circles */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground mr-2">Actions:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {getActionHexagons()}
              {/* Add Action Button */}
              <button
                onClick={addBonusAction}
                className="relative w-8 h-8 flex items-center justify-center transition-all duration-100 hover:scale-110"
                title="Grant additional action"
              >
                {/* Grey outlined circle */}
                <div className="absolute inset-0 rounded-full border-2 border-gray-400 bg-transparent transition-all duration-100 hover:border-gray-500 hover:shadow-md" />
                {/* Plus icon */}
                <Plus className="relative z-10 w-4 h-4 text-gray-500 transition-all duration-100 hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <Button onClick={endTurn} variant="default" size="sm" className="text-xs">
              <RotateCcw className="w-3 h-3" />
              End Turn
            </Button>
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
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            className="text-muted"
          />
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

        <div className="flex flex-wrap gap-3 justify-center">
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
  const { character, endEncounter, startEncounter, getInitiative } = useCharacterService();
  const { rollInitiative } = useDiceActions();
  const { uiState } = useUIStateService();

  // All hooks called first, then safety check
  if (!character) return null;

  const { inEncounter, _attributes: attributes } = character;
  const initiative = getInitiative();
  const totalModifier = attributes.dexterity + initiative.modifier;
  const totalAdvantageLevel = uiState.advantageLevel + initiative.advantage;

  const handleInitiativeRoll = async () => {
    const result = await rollInitiative(totalModifier, totalAdvantageLevel);
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
                      aria-label="Roll Initiative"
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
                  <Square className="w-3 h-3" />
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

        <GeneralActionsRow />
      </div>
    </TooltipProvider>
  );
}
