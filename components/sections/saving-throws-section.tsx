"use client";

import { ChevronDown, ChevronRight, Shield } from "lucide-react";

import { useCallback } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { AttributeName, SaveAdvantageType } from "@/lib/types/character";
import { combineAdvantages } from "@/lib/utils/advantage";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function SavingThrowsSection() {
  const { character, updateCharacter } = useCharacterService();
  const { uiState, updateCollapsibleState } = useUIStateService();
  const { rollSave } = useDiceActions();

  const isOpen = uiState.collapsibleSections.attributes; // Reuse attributes state for now
  const advantageLevel = uiState.advantageLevel;
  const onToggle = (isOpen: boolean) => updateCollapsibleState("attributes", isOpen);

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

  const handleSaveRoll = useCallback(
    (attributeName: AttributeName) => {
      if (!character) return;

      const attributeValue = character._attributes[attributeName];
      const saveAdvantage = character.saveAdvantages?.[attributeName] || "normal";
      const combinedAdvantage = combineAdvantages(advantageLevel, saveAdvantage);

      rollSave(attributeName, attributeValue, combinedAdvantage);
    },
    [character, rollSave, advantageLevel],
  );

  const formatModifier = (value: number): string => {
    return value >= 0 ? `+${value}` : `${value}`;
  };

  const getAdvantageColor = (advantage: SaveAdvantageType): string => {
    switch (advantage) {
      case "advantage":
        return "text-green-600";
      case "disadvantage":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getAdvantageSymbol = (advantage: SaveAdvantageType): string => {
    switch (advantage) {
      case "advantage":
        return "↑";
      case "disadvantage":
        return "↓";
      default:
        return "";
    }
  };

  if (!character) return null;

  const attributes: Array<{ name: AttributeName; label: string }> = [
    { name: "strength", label: "Str" },
    { name: "dexterity", label: "Dex" },
    { name: "intelligence", label: "Int" },
    { name: "will", label: "Will" },
  ];

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Saving Throws</CardTitle>
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {attributes.map(({ name, label }) => {
                  const value = character._attributes[name];
                  const saveAdvantage = character.saveAdvantages?.[name] || "normal";
                  const combinedAdvantage = combineAdvantages(advantageLevel, saveAdvantage);

                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-8">{label}</span>
                        <span className="text-sm font-mono">{formatModifier(value)}</span>
                        {saveAdvantage !== "normal" && (
                          <span className={`text-xs ${getAdvantageColor(saveAdvantage)}`}>
                            {getAdvantageSymbol(saveAdvantage)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveRoll(name)}
                              className="h-7 w-7 p-0"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {label} saving throw ({formatModifier(value)})
                            </p>
                            {combinedAdvantage !== 0 && (
                              <p className="text-xs">
                                {combinedAdvantage > 0 ? "With advantage" : "With disadvantage"}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </TooltipProvider>
  );
}
