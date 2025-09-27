"use client";

import { ChevronDown, ChevronRight, ChevronUp, Dice6, Minus, Shield } from "lucide-react";

import { useCallback } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { AttributeName, SaveAdvantageType } from "@/lib/schemas/character";
import { ContentRepositoryService } from "@/lib/services/content-repository-service";
import { combineAdvantages } from "@/lib/utils/advantage";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function AttributesSection() {
  // Direct singleton access with automatic re-rendering - no context needed!
  const { character, updateCharacter, getAttributes } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const { rollAttribute, rollSave } = useDiceActions();

  const isOpen = uiState.collapsibleSections.attributes;
  const advantageLevel = uiState.advantageLevel;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("attributes", isOpen);

  // Get key attributes for the character's class
  const contentRepository = ContentRepositoryService.getInstance();
  const characterClass = character ? contentRepository.getClassDefinition(character.classId) : null;
  const keyAttributes = characterClass?.keyAttributes || [];

  const onAttributeChange = useCallback(
    async (attributeName: AttributeName, value: string) => {
      if (!character) return;

      const numValue = parseInt(value) || 0;
      if (numValue >= -2 && numValue <= 10) {
        const updated = {
          ...character,
          _attributes: {
            ...character._attributes,
            [attributeName]: numValue,
          },
        };
        await updateCharacter(updated);
      }
    },
    [character, updateCharacter],
  );

  const onSaveAdvantageChange = useCallback(
    async (attributeName: AttributeName, advantageType: SaveAdvantageType) => {
      if (!character) return;

      const updated = {
        ...character,
        saveAdvantages: {
          ...character.saveAdvantages,
          [attributeName]: advantageType,
        },
      };
      await updateCharacter(updated);
    },
    [character, updateCharacter],
  );

  const cycleSaveAdvantage = useCallback(
    (attributeName: AttributeName) => {
      if (!character) return;

      const current = character.saveAdvantages?.[attributeName] || "normal";
      let next: SaveAdvantageType;

      switch (current) {
        case "normal":
          next = "advantage";
          break;
        case "advantage":
          next = "disadvantage";
          break;
        case "disadvantage":
          next = "normal";
          break;
        default:
          next = "normal";
      }

      onSaveAdvantageChange(attributeName, next);
    },
    [character, onSaveAdvantageChange],
  );

  const getSaveAdvantageIcon = (advantageType: SaveAdvantageType) => {
    switch (advantageType) {
      case "advantage":
        return <ChevronUp className="w-3 h-3 text-green-600" />;
      case "disadvantage":
        return <ChevronDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getSaveAdvantageTooltip = (advantageType: SaveAdvantageType, attributeName: string) => {
    switch (advantageType) {
      case "advantage":
        return `Advantage on ${attributeName} saves`;
      case "disadvantage":
        return `Disadvantage on ${attributeName} saves`;
      default:
        return `Normal ${attributeName} saves`;
    }
  };

  // Helper function to render a single attribute
  const renderAttribute = (attributeName: AttributeName, displayName: string) => {
    if (!character) return null;

    const isKeyAttribute = keyAttributes.includes(attributeName);
    // Use computed attributes for display, but base attributes for editing
    const computedAttributes = getAttributes();
    const baseValue = character._attributes[attributeName];
    const computedValue = computedAttributes[attributeName];
    const saveAdvantage = character.saveAdvantages?.[attributeName] || "normal";
    const hasBonus = baseValue !== computedValue;
    const bonus = computedValue - baseValue;

    return (
      <Card
        key={attributeName}
        className={`${isKeyAttribute ? "ring-2 ring-primary" : ""} relative`}
      >
        <CardHeader className="pb-1 pt-3 px-3 relative">
          <CardTitle
            className={`text-sm text-center ${isKeyAttribute ? "font-bold underline" : ""}`}
          >
            {displayName}
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cycleSaveAdvantage(attributeName)}
                className="absolute top-1 right-1 h-5 w-5 p-0 hover:bg-transparent"
              >
                {getSaveAdvantageIcon(saveAdvantage)}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getSaveAdvantageTooltip(saveAdvantage, displayName)}</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="space-y-2 flex flex-col items-center pt-0 pb-3 px-3">
          {/* Value display and input */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="-2"
              max="10"
              value={baseValue}
              onChange={(e) => onAttributeChange(attributeName, e.target.value)}
              className="w-12 h-7 text-center text-sm font-mono border-2 px-1"
            />
            {hasBonus && (
              <>
                <span className="text-sm">+</span>
                <span className="text-sm font-mono text-blue-600">{bonus}</span>
                <span className="text-sm">=</span>
                <span className="text-sm font-mono font-bold">{computedValue}</span>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollAttribute(attributeName, computedValue, advantageLevel)}
                  className="h-8 w-8 p-1"
                >
                  <Dice6 className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Roll {displayName} ({computedValue})
                </p>
                {advantageLevel !== 0 && (
                  <p className="text-xs">
                    {advantageLevel > 0 ? "With advantage" : "With disadvantage"}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    rollSave(
                      attributeName,
                      computedValue,
                      combineAdvantages(advantageLevel, saveAdvantage),
                    )
                  }
                  className="h-8 w-8 p-1"
                >
                  <Shield className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Save {displayName} ({computedValue})
                </p>
                {combineAdvantages(advantageLevel, saveAdvantage) !== 0 && (
                  <p className="text-xs">
                    {combineAdvantages(advantageLevel, saveAdvantage) > 0
                      ? "With advantage"
                      : "With disadvantage"}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Early return if no character (shouldn't happen in normal usage)
  if (!character) return null;
  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-4 h-auto">
            <h2 className="text-xl font-semibold">Attributes</h2>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
            {renderAttribute("strength", "Strength")}
            {renderAttribute("dexterity", "Dexterity")}
            {renderAttribute("intelligence", "Intelligence")}
            {renderAttribute("will", "Will")}
          </div>
          {keyAttributes.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Key attributes for {characterClass?.name}:{" "}
              <span className="font-semibold underline">{keyAttributes.join(", ")}</span>
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}
