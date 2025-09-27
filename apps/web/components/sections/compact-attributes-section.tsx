"use client";

import { Dice6, Shield } from "lucide-react";

import { useCallback } from "react";

import { useCharacterService } from "@/lib/hooks/use-character-service";
import { useDiceActions } from "@/lib/hooks/use-dice-actions";
import { useUIStateService } from "@/lib/hooks/use-ui-state-service";
import { AttributeName } from "@/lib/schemas/character";
import { combineAdvantages } from "@/lib/utils/advantage";

import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function CompactAttributesSection() {
  const { character, getAttributes } = useCharacterService();
  const { uiState } = useUIStateService();
  const { rollAttribute, rollSave } = useDiceActions();

  const advantageLevel = uiState.advantageLevel;

  const handleAttributeRoll = useCallback(
    (attributeName: AttributeName) => {
      if (!character) return;

      const computedAttributes = getAttributes();
      const attributeValue = computedAttributes[attributeName];

      rollAttribute(attributeName, attributeValue, advantageLevel);
    },
    [character, rollAttribute, advantageLevel, getAttributes],
  );

  const handleSaveRoll = useCallback(
    (attributeName: AttributeName) => {
      if (!character) return;

      const computedAttributes = getAttributes();
      const attributeValue = computedAttributes[attributeName];
      const saveAdvantage = character.saveAdvantages?.[attributeName] || "normal";
      const combinedAdvantage = combineAdvantages(advantageLevel, saveAdvantage);

      rollSave(attributeName, attributeValue, combinedAdvantage);
    },
    [character, rollSave, advantageLevel, getAttributes],
  );

  const formatModifier = (value: number): string => {
    return value >= 0 ? `+${value}` : `${value}`;
  };

  if (!character) return null;

  const computedAttributes = getAttributes();
  const attributes: Array<{ name: AttributeName; label: string }> = [
    { name: "strength", label: "Str" },
    { name: "dexterity", label: "Dex" },
    { name: "intelligence", label: "Int" },
    { name: "will", label: "Will" },
  ];

  return (
    <TooltipProvider>
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Attributes</h2>
        <div className="grid grid-cols-2 gap-2">
          {attributes.map(({ name, label }) => {
            const value = computedAttributes[name];
            const saveAdvantage = character.saveAdvantages?.[name] || "normal";
            const combinedAdvantage = combineAdvantages(advantageLevel, saveAdvantage);

            return (
              <div
                key={name}
                className="flex items-center justify-between p-2 rounded border bg-card"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-8">{label}</span>
                  <span className="text-sm font-mono">{formatModifier(value)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAttributeRoll(name)}
                        className="h-7 w-7 p-0"
                      >
                        <Dice6 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {label} check ({formatModifier(value)})
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
      </div>
    </TooltipProvider>
  );
}
